import { Hono } from 'hono';
import { prisma } from '../../config/database';

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

// Also premium demographic analytics for a poll
analyticsRouter.get('/polls/:id/demographics', (c) => c.json({ success: true, data: null }));
