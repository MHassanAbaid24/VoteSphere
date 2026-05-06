import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { authMiddleware } from '../../middleware/auth.middleware';
import { GetNotificationsSchema } from './notifications.schema';
import * as notificationsService from './notifications.service';
import { getRedisSubClient, isRedisHealthy } from '../../lib/cache';

export const notificationsRouter = new Hono();

// Apply authMiddleware to all routes inside notificationsRouter
notificationsRouter.use('*', authMiddleware);

// GET /v1/notifications - List user's notifications (paginated)
notificationsRouter.get('/', async (c) => {
  try {
    const user = c.get('user' as never) as { id: string } | undefined;
    if (!user) throw new Error('Not authenticated');

    const query = {
      page: c.req.query('page'),
      limit: c.req.query('limit'),
      unreadOnly: c.req.query('unreadOnly'),
    };

    const parsed = GetNotificationsSchema.safeParse(query);
    const filters = parsed.success ? parsed.data : { page: 1, limit: 20, unreadOnly: false };

    const result = await notificationsService.getNotifications(user.id, filters);

    return c.json({
      success: true,
      data: result.notifications,
      pagination: result.pagination,
    });
  } catch (err: any) {
    return c.json(
      { success: false, error: { code: 'BAD_REQUEST', message: err.message } },
      400
    );
  }
});

// GET /v1/notifications/count - Unread count
notificationsRouter.get('/count', async (c) => {
  try {
    const user = c.get('user' as never) as { id: string } | undefined;
    if (!user) throw new Error('Not authenticated');

    const result = await notificationsService.getUnreadCount(user.id);

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

// PATCH /v1/notifications/read-all - Mark all as read
notificationsRouter.patch('/read-all', async (c) => {
  try {
    const user = c.get('user' as never) as { id: string } | undefined;
    if (!user) throw new Error('Not authenticated');

    await notificationsService.markAllRead(user.id);

    return c.json({
      success: true,
      data: { message: 'All notifications marked as read' },
    });
  } catch (err: any) {
    return c.json(
      { success: false, error: { code: 'BAD_REQUEST', message: err.message } },
      400
    );
  }
});

// PATCH /v1/notifications/:id - Mark single as read
notificationsRouter.patch('/:id', async (c) => {
  try {
    const user = c.get('user' as never) as { id: string } | undefined;
    if (!user) throw new Error('Not authenticated');

    const notifId = c.req.param('id');
    const notification = await notificationsService.markRead(user.id, notifId);

    return c.json({
      success: true,
      data: notification,
    });
  } catch (err: any) {
    return c.json(
      { success: false, error: { code: 'BAD_REQUEST', message: err.message } },
      400
    );
  }
});

// GET /v1/notifications/stream - Real-Time Real-time Server-Sent Events notifications
notificationsRouter.get('/stream', async (c) => {
  const user = c.get('user' as never) as { id: string } | undefined;
  if (!user) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, 401);
  }

  const userId = user.id;
  const channel = `user:${userId}:notifications`;

  return streamSSE(c, async (stream) => {
    let active = true;
    let usePollingFallback = true;

    // Send initial welcome/connected packet
    await stream.writeSSE({
      data: JSON.stringify({ status: 'connected' }),
      event: 'welcome',
      id: String(Date.now()),
    });

    // Cleanup logic on abort
    stream.onAbort(() => {
      active = false;
    });

    const redisSub = getRedisSubClient();

    if (redisSub && isRedisHealthy()) {
      usePollingFallback = false;

      const onMessage = async (chan: string, message: string) => {
        if (!active) return;
        if (chan === channel) {
          await stream.writeSSE({
            data: message,
            event: 'notification',
            id: String(Date.now()),
          });
        }
      };

      try {
        await redisSub.subscribe(channel);
        redisSub.on('message', onMessage);

        // Keep connection open with 15-second heartbeats
        while (active) {
          await stream.sleep(15000);
          if (active) {
            await stream.writeSSE({
              data: '',
              event: 'ping',
            });
          }
        }

        // Cleanup subscription
        redisSub.off('message', onMessage);
        await redisSub.unsubscribe(channel).catch(() => {});
      } catch (err: any) {
        console.warn(`⚠️ SSE notification subscription failed for user ${userId}, falling back:`, err.message);
        usePollingFallback = true;
      }
    }

    // Fallback polling loop (poll unread counts every 15s if Redis is offline)
    if (usePollingFallback) {
      let lastCount = -1;
      while (active) {
        try {
          const { count } = await notificationsService.getUnreadCount(userId);
          if (count !== lastCount && lastCount !== -1) {
            await stream.writeSSE({
              data: JSON.stringify({ count, message: 'You have new unread notifications' }),
              event: 'update',
              id: String(Date.now()),
            });
          }
          lastCount = count;
        } catch (err: any) {
          // Silent catch to prevent crash
        }

        await stream.sleep(15000);
      }
    }
  });
});
