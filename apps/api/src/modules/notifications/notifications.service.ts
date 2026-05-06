import { prisma } from '../../config/database';
import { publishToRedis, invalidateCache } from '../../lib/cache';
import { NotificationType } from '@prisma/client';

export interface GetNotificationsFilters {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

/**
 * Create a new notification in the database and broadcast it in real-time via Redis Pub/Sub
 */
export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string,
  pollId?: string
) => {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      link,
      pollId,
    },
  });

  // Broadcast to active SSE listeners using Redis Pub/Sub
  const channel = `user:${userId}:notifications`;
  await publishToRedis(channel, JSON.stringify(notification));

  return notification;
};

/**
 * Fetch a paginated list of notifications for a specific user
 */
export const getNotifications = async (userId: string, filters: GetNotificationsFilters) => {
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const skip = (page - 1) * limit;

  const where: any = {
    userId,
  };

  if (filters.unreadOnly) {
    where.isRead = false;
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        poll: {
          select: {
            title: true,
            coverImage: true,
          },
        },
      },
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Mark a single notification as read
 */
export const markRead = async (userId: string, id: string) => {
  const notification = await prisma.notification.findFirst({
    where: { id, userId },
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
};

/**
 * Mark all notifications for a specific user as read
 */
export const markAllRead = async (userId: string) => {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
};

/**
 * Get the count of unread notifications for a user
 */
export const getUnreadCount = async (userId: string) => {
  const count = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  return { count };
};

/**
 * Background scanner to sweep for expiring and expired polls, notifying creators and closing expired polls.
 */
export const checkExpirations = async () => {
  console.info('🕒 [Background Scanner] Running poll expiration check...');
  const now = new Date();
  const dayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  try {
    // 1. Sweeping for Expiring Polls (expires in next 24 hours, active, not yet notified)
    const expiringPolls = await prisma.poll.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
        expiresAt: {
          gt: now,
          lte: dayFromNow,
        },
      },
    });

    for (const poll of expiringPolls) {
      // Check if a POLL_EXPIRING notification already exists for this poll and user
      const existingNotif = await prisma.notification.findFirst({
        where: {
          userId: poll.creatorId,
          pollId: poll.id,
          type: 'POLL_EXPIRING',
        },
      });

      if (!existingNotif) {
        await createNotification(
          poll.creatorId,
          'POLL_EXPIRING',
          'Poll expiring soon',
          `Your poll "${poll.title}" expires in less than 24 hours.`,
          `/poll/${poll.id}/results`,
          poll.id
        );
        console.info(`🔔 [Background Scanner] Dispatched POLL_EXPIRING for poll: ${poll.id}`);
      }
    }

    // 2. Sweeping for Expired Polls (expiresAt <= now, still ACTIVE)
    const expiredPolls = await prisma.poll.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
        expiresAt: {
          lte: now,
        },
      },
    });

    for (const poll of expiredPolls) {
      // Transition status to CLOSED
      await prisma.poll.update({
        where: { id: poll.id },
        data: { status: 'CLOSED' },
      });

      // Dispatch POLL_EXPIRED notification
      await createNotification(
        poll.creatorId,
        'POLL_EXPIRED',
        'Poll expired',
        `Your poll "${poll.title}" has officially expired and is now closed.`,
        `/poll/${poll.id}/results`,
        poll.id
      );

      // Invalidate caches to update results view immediately
      await invalidateCache(`poll:${poll.id}`);
      await invalidateCache('poll:featured');
      await invalidateCache('polls:trending:5');
      await invalidateCache('polls:trending:10');

      console.info(`🔔 [Background Scanner] Closed & Dispatched POLL_EXPIRED for poll: ${poll.id}`);
    }
  } catch (err: any) {
    console.error('❌ [Background Scanner] Error during poll expiration check:', err.message);
  }
};
