import { Hono } from 'hono';
import { authMiddleware } from '../../middleware/auth.middleware';
import { prisma } from '../../config/database';

export const usersRouter = new Hono();

usersRouter.get('/:id', (c) => c.json({ success: true, data: null }));

usersRouter.patch('/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user' as any);
    if (!user) {
      return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, 401);
    }

    const body = await c.req.json();
    const updatedData: any = {};

    if (typeof body.isPremium === 'boolean') {
      updatedData.isPremium = body.isPremium;
      updatedData.role = body.isPremium ? 'PREMIUM' : 'USER';
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updatedData,
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        role: true,
        isPremium: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    return c.json({ success: true, data: { user: updatedUser } });
  } catch (err: any) {
    return c.json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } }, 400);
  }
});

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

usersRouter.get('/me/preferences', authMiddleware, async (c) => {
  try {
    const user = c.get('user' as any);
    if (!user) {
      return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, 401);
    }

    let prefs = await prisma.userPreferences.findUnique({
      where: { userId: user.id },
    });

    if (!prefs) {
      prefs = await prisma.userPreferences.create({
        data: {
          userId: user.id,
          categories: [],
        },
      });
    }

    return c.json({ success: true, data: prefs });
  } catch (err: any) {
    return c.json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } }, 400);
  }
});

usersRouter.put('/me/preferences', authMiddleware, async (c) => {
  try {
    const user = c.get('user' as any);
    if (!user) {
      return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, 401);
    }

    const body = await c.req.json();
    const categories = Array.isArray(body.categories) ? body.categories : [];

    const prefs = await prisma.userPreferences.upsert({
      where: { userId: user.id },
      update: { categories },
      create: { userId: user.id, categories },
    });

    return c.json({ success: true, data: prefs });
  } catch (err: any) {
    return c.json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } }, 400);
  }
});

usersRouter.get('/me/notifications', (c) => c.json({ success: true, data: null }));
usersRouter.patch('/me/notifications/read-all', (c) => c.json({ success: true, data: null }));
usersRouter.patch('/me/notifications/:id', (c) => c.json({ success: true, data: null }));
