import { Hono } from 'hono';
import { authMiddleware } from '../../middleware/auth.middleware';
import { prisma } from '../../config/database';

export const usersRouter = new Hono();

usersRouter.get('/:id', (c) => c.json({ success: true, data: null }));

usersRouter.patch('/me', (c) => c.json({ success: true, data: null }));

/**
 * DELETE /v1/users/me
 * Permanently deletes the authenticated user's account and all associated data.
 */
usersRouter.delete('/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user' as any);
    if (!user) {
      return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, 401);
    }

    // Cascade delete the user — Prisma cascades handle related records (polls, votes, tokens etc.)
    await prisma.user.delete({ where: { id: user.id } });

    return c.json({ success: true, data: { message: 'Account deleted successfully.' } });
  } catch (err: any) {
    return c.json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } }, 400);
  }
});

usersRouter.get('/me/preferences', (c) => c.json({ success: true, data: null }));
usersRouter.put('/me/preferences', (c) => c.json({ success: true, data: null }));

usersRouter.get('/me/notifications', (c) => c.json({ success: true, data: null }));
usersRouter.patch('/me/notifications/read-all', (c) => c.json({ success: true, data: null }));
usersRouter.patch('/me/notifications/:id', (c) => c.json({ success: true, data: null }));
