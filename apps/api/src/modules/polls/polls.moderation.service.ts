import { prisma } from '../../config/database';
import { checkPollSafety } from '../../services/ai.service';
import { createNotification } from '../notifications/notifications.service';
import { invalidateCache } from '../../lib/cache';

/**
 * Calculates the exponential backoff interval in minutes, clamping at 60 minutes.
 * Generates:
 * Retry 1: 5 * 4^1 = 20 minutes
 * Retry 2: 5 * 4^2 = 80 -> 60 minutes
 */
export const calculateBackoffMinutes = (retryCount: number): number => {
  if (retryCount <= 0) return 5;
  const delay = 5 * Math.pow(4, retryCount);
  return Math.min(delay, 60);
};

/**
 * Main background loop processor that retrieves PENDING poll moderations due for retry.
 * Analyzes with AI and determines next actions (APPROVAL, REJECTION, RETRY, ESCALATION).
 */
export const processPendingModerations = async () => {
  console.info('🔍 [Moderation Background] Checking for pending moderations...');
  const now = new Date();

  try {
    // Retrieve up to 20 pending items whose retry window has passed
    const pendingJobs = await prisma.pollModeration.findMany({
      where: {
        status: 'PENDING',
        OR: [
          { nextRetryAt: { lte: now } },
          { nextRetryAt: null },
        ],
      },
      include: {
        poll: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
      },
      take: 20,
      orderBy: { nextRetryAt: 'asc' },
    });

    if (pendingJobs.length === 0) {
      return;
    }

    console.info(`🚀 [Moderation Background] Found ${pendingJobs.length} job(s) to process.`);

    for (const job of pendingJobs) {
      try {
        // 1. Hard stop condition: Escalate after 20 days cumulative
        const TWENTY_DAYS_MS = 20 * 24 * 60 * 60 * 1000;
        const jobAgeMs = now.getTime() - job.createdAt.getTime();

        if (jobAgeMs > TWENTY_DAYS_MS) {
          console.warn(`⚠️ [Moderation Background] Poll ${job.pollId} exceeded 20 days. Escalating to MANUAL_REVIEW.`);
          await prisma.pollModeration.update({
            where: { id: job.id },
            data: { status: 'MANUAL_REVIEW', nextRetryAt: null },
          });
          continue;
        }

        if (!job.poll) {
          // Orphaned record or deleted parent poll
          await prisma.pollModeration.delete({ where: { id: job.id } });
          continue;
        }

        // 2. Execute AI Check
        const questionsFormatted = job.poll.questions.map((q) => ({
          text: q.text,
          options: q.options.map((o) => ({ text: o.text })),
        }));

        const result = await checkPollSafety(
          job.poll.title,
          job.poll.description || '',
          questionsFormatted
        );

        if (result.allowed) {
          // 3a. APPROVED Flow
          await prisma.pollModeration.update({
            where: { id: job.id },
            data: {
              status: 'APPROVED',
              nextRetryAt: null,
              rejectionReason: null,
            },
          });
          console.info(`✅ [Moderation Background] Poll ${job.pollId} approved asynchronously.`);
        } else {
          // 3b. REJECTED Flow
          await prisma.$transaction([
            // Update moderation status
            prisma.pollModeration.update({
              where: { id: job.id },
              data: {
                status: 'REJECTED',
                rejectionReason: result.reason || 'Content policy violation',
                nextRetryAt: null,
              },
            }),
            // Archive poll immediately
            prisma.poll.update({
              where: { id: job.pollId },
              data: { status: 'ARCHIVED' },
            }),
          ]);

          // Send Notification
          await createNotification(
            job.poll.creatorId,
            'POLL_REJECTED',
            'Poll Content Removed',
            `Your poll "${job.poll.title}" was removed due to content guidelines: ${result.reason || 'Violation detected.'}`,
            undefined,
            job.pollId
          );

          // Invalidate Cache
          await invalidateCache(`poll:${job.pollId}`);
          await invalidateCache('poll:featured');
          await invalidateCache('polls:trending:5');
          await invalidateCache('polls:trending:10');

          console.warn(`🚫 [Moderation Background] Poll ${job.pollId} rejected & archived. Sent user notification.`);
        }
      } catch (err) {
        // 4. Sustained API Failure Flow: Exponential backoff
        console.error(`❌ [Moderation Background] Error processing job ${job.id} (Poll ${job.pollId}):`, err);

        const nextRetryCount = job.retryCount + 1;
        const nextDelayMins = calculateBackoffMinutes(nextRetryCount);
        const nextTime = new Date(Date.now() + nextDelayMins * 60 * 1000);

        await prisma.pollModeration.update({
          where: { id: job.id },
          data: {
            retryCount: { increment: 1 },
            nextRetryAt: nextTime,
          },
        });

        console.info(`🔄 [Moderation Background] Rescheduled Poll ${job.pollId} for retry #${nextRetryCount} at ${nextTime.toISOString()}`);
      }
    }
  } catch (err: any) {
    console.error('🚨 [Moderation Background] Fatal outer error in sweep:', err.message);
  }
};
