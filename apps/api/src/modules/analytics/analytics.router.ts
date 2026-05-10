import { Hono } from 'hono';
import { prisma } from '../../config/database';
import { authMiddleware } from '../../middleware/auth.middleware';
import * as analyticsService from './analytics.service';

export const analyticsRouter = new Hono();

analyticsRouter.get('/global', async (c) => {
  try {
    const [totalPolls, totalVotes, activePolls] = await Promise.all([
      prisma.poll.count({ where: { deletedAt: null } }),
      prisma.poll.aggregate({
        _sum: { totalVotes: true },
        where: { deletedAt: null },
      }),
      prisma.poll.count({ where: { status: 'ACTIVE', deletedAt: null } }),
    ]);

    return c.json({
      success: true,
      data: {
        totalPolls,
        totalVotes: totalVotes._sum.totalVotes ?? 0,
        activePolls,
      },
    });
  } catch (err: any) {
    return c.json(
      {
        success: false,
        error: { code: 'BAD_REQUEST', message: err.message },
      },
      400
    );
  }
});

// Premium demographic analytics for a poll
analyticsRouter.get('/polls/:id/demographics', authMiddleware, async (c) => {
  try {
    const user = c.get('user' as any);
    if (!user) {
      return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, 401);
    }

    if (!user.isPremium) {
      return c.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Premium subscription required.' } },
        403
      );
    }

    const pollId = c.req.param('id') || '';
    
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      select: { creatorId: true },
    });

    if (!poll) {
      return c.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Poll not found.' } },
        404
      );
    }

    if (poll.creatorId !== user.id) {
      return c.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only the poll owner can access demographic insights.' } },
        403
      );
    }

    const result = await analyticsService.getDemographics(pollId);

    return c.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    return c.json(
      { success: false, error: { code: 'BAD_REQUEST', message: err.message } },
      400
    );
  }
});
