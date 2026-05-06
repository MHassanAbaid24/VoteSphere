import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { prisma } from '../../config/database';
import { authMiddleware } from '../../middleware/auth.middleware';
import { CreatePollSchema, UpdatePollSchema } from './polls.schema';
import * as pollsService from './polls.service';
import { ZodIssue } from 'zod';
import { uploadToS3 } from '../../lib/s3';
import { getRedisSubClient, isRedisHealthy } from '../../lib/cache';

export const pollsRouter = new Hono();

// GET /v1/polls/featured
pollsRouter.get('/featured', async (c) => {
  try {
    const poll = await pollsService.getFeaturedPoll();
    return c.json({
      success: true,
      data: poll,
    });
  } catch (err: any) {
    return c.json(
      { success: false, error: { code: 'BAD_REQUEST', message: err.message } },
      400
    );
  }
});

// GET /v1/polls
pollsRouter.get('/', async (c) => {
  try {
    const page = c.req.query('page');
    const limit = c.req.query('limit');
    const category = c.req.query('category');
    const status = c.req.query('status')?.toUpperCase();
    const visibility = c.req.query('visibility')?.toUpperCase();

    const result = await pollsService.getPolls({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      category,
      status,
      visibility,
    });

    return c.json({
      success: true,
      data: result.polls,
      pagination: result.pagination,
    });
  } catch (err: any) {
    return c.json(
      { success: false, error: { code: 'BAD_REQUEST', message: err.message } },
      400
    );
  }
});

// GET /v1/polls/me
pollsRouter.get('/me', authMiddleware, async (c) => {
  try {
    const userPayload = c.get('user' as never) as { id: string } | undefined;
    if (!userPayload) throw new Error('Not authenticated');

    const page = c.req.query('page');
    const limit = c.req.query('limit');
    const status = c.req.query('status')?.toUpperCase();

    const result = await pollsService.getMyPolls(userPayload.id, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      status: status || undefined,
    });

    return c.json({
      success: true,
      data: result.polls,
      pagination: result.pagination,
    });
  } catch (err: any) {
    return c.json(
      { success: false, error: { code: 'BAD_REQUEST', message: err.message } },
      400
    );
  }
});

// GET /v1/polls/:id
pollsRouter.get('/:id', async (c) => {
  try {
    const pollId = c.req.param('id');

    // Increment views counter atomically on fetch
    await prisma.poll.update({
      where: { id: pollId },
      data: { views: { increment: 1 } },
    }).catch(() => {});

    const poll = await pollsService.getPollById(pollId as string);
    return c.json({
      success: true,
      data: poll,
    });
  } catch (err: any) {
    return c.json(
      { success: false, error: { code: 'NOT_FOUND', message: err.message } },
      404
    );
  }
});

// POST /v1/polls
pollsRouter.post('/', authMiddleware, async (c) => {
  try {
    const userPayload = c.get('user' as never) as { id: string } | undefined;
    if (!userPayload) throw new Error('Not authenticated');

    const body = await c.req.json();
    const parsed = CreatePollSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: parsed.error.issues.map((i: ZodIssue) => ({ field: i.path.join('.'), message: i.message })),
          },
        },
        400
      );
    }

    const poll = await pollsService.createPoll(userPayload.id, parsed.data);

    return c.json({
      success: true,
      data: poll,
    }, 201);
  } catch (err: any) {
    return c.json(
      { success: false, error: { code: 'BAD_REQUEST', message: err.message } },
      400
    );
  }
});

// PATCH /v1/polls/:id
pollsRouter.patch('/:id', authMiddleware, async (c) => {
  try {
    const userPayload = c.get('user' as never) as { id: string } | undefined;
    if (!userPayload) throw new Error('Not authenticated');

    const body = await c.req.json();
    const parsed = UpdatePollSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: parsed.error.issues.map((i: ZodIssue) => ({ field: i.path.join('.'), message: i.message })),
          },
        },
        400
      );
    }

    const pollId = c.req.param('id');
    const poll = await pollsService.updatePoll(pollId as string, userPayload.id, parsed.data);

    return c.json({
      success: true,
      data: poll,
    });
  } catch (err: any) {
    return c.json(
      { success: false, error: { code: 'BAD_REQUEST', message: err.message } },
      400
    );
  }
});

// DELETE /v1/polls/:id
pollsRouter.delete('/:id', authMiddleware, async (c) => {
  try {
    const userPayload = c.get('user' as never) as { id: string } | undefined;
    if (!userPayload) throw new Error('Not authenticated');

    const pollId = c.req.param('id');
    await pollsService.deletePoll(pollId as string, userPayload.id);

    return c.json({
      success: true,
      data: { message: 'Poll deleted successfully' },
    });
  } catch (err: any) {
    return c.json(
      { success: false, error: { code: 'BAD_REQUEST', message: err.message } },
      400
    );
  }
});

// POST /v1/polls/:id/publish
pollsRouter.post('/:id/publish', authMiddleware, async (c) => {
  try {
    const userPayload = c.get('user' as never) as { id: string } | undefined;
    if (!userPayload) throw new Error('Not authenticated');

    const pollId = c.req.param('id');
    const poll = await pollsService.publishPoll(pollId as string, userPayload.id);

    return c.json({
      success: true,
      data: poll,
    });
  } catch (err: any) {
    return c.json(
      { success: false, error: { code: 'BAD_REQUEST', message: err.message } },
      400
    );
  }
});

// POST /v1/polls/:id/close
pollsRouter.post('/:id/close', authMiddleware, async (c) => {
  try {
    const userPayload = c.get('user' as never) as { id: string } | undefined;
    if (!userPayload) throw new Error('Not authenticated');

    const pollId = c.req.param('id');
    const poll = await pollsService.closePoll(pollId as string, userPayload.id);

    return c.json({
      success: true,
      data: poll,
    });
  } catch (err: any) {
    return c.json(
      { success: false, error: { code: 'BAD_REQUEST', message: err.message } },
      400
    );
  }
});

// POST /v1/polls/:id/cover
pollsRouter.post('/:id/cover', authMiddleware, async (c) => {
  try {
    const user = c.get('user' as never) as { id: string } | undefined;
    if (!user) {
      return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, 401);
    }
    const pollId = c.req.param('id');
    const poll = await prisma.poll.findUnique({ where: { id: pollId } });
    if (!poll) {
      return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Poll not found' } }, 404);
    }
    if (poll.creatorId !== user.id) {
      return c.json({ success: false, error: { code: 'FORBIDDEN', message: 'You do not own this poll' } }, 403);
    }

    const body = await c.req.parseBody();
    const file = body['cover'];
    if (!file || !(file instanceof File)) {
      return c.json({ success: false, error: { code: 'BAD_REQUEST', message: 'No file uploaded or invalid file' } }, 400);
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return c.json({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' } }, 400);
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop() || 'png';
    const key = `covers/${pollId}/${crypto.randomUUID()}.${ext}`;

    const url = await uploadToS3(key, buffer, file.type);

    // Update the poll with new coverImage url
    const updatedPoll = await prisma.poll.update({
      where: { id: pollId },
      data: { coverImage: url },
    });

    return c.json({
      success: true,
      data: updatedPoll,
    });
  } catch (err: any) {
    return c.json(
      { success: false, error: { code: 'BAD_REQUEST', message: err.message } },
      400
    );
  }
});

// Real-Time Results Stream (Server-Sent Events with Pub/Sub & Polling Hybrid)
pollsRouter.get('/:id/stream', async (c) => {
  const id = c.req.param('id');
  const channel = `poll:${id}`;

  return streamSSE(c, async (stream) => {
    let active = true;
    let usePolling = true;

    // Helper to send latest data to the stream
    const sendLatestData = async () => {
      try {
        const poll = await pollsService.getPollById(id);
        await stream.writeSSE({
          data: JSON.stringify(poll),
          event: 'message',
          id: String(Date.now()),
        });
      } catch (err: any) {
        await stream.writeSSE({
          data: JSON.stringify({ error: err.message || 'Poll not found' }),
          event: 'error',
        });
        active = false;
      }
    };

    // Immediately push initial data to client
    await sendLatestData();

    // Setup cleanup logic on abort
    stream.onAbort(() => {
      active = false;
    });

    const redisSub = getRedisSubClient();

    if (redisSub && isRedisHealthy()) {
      usePolling = false;

      const onMessage = async (chan: string, message: string) => {
        if (!active) return;
        if (chan === channel && message === 'updated') {
          await sendLatestData();
        }
      };

      try {
        await redisSub.subscribe(channel);
        redisSub.on('message', onMessage);

        // Keep SSE connection alive via 15-second heartbeats
        while (active) {
          await stream.sleep(15000);
          if (active) {
            await stream.writeSSE({
              data: '',
              event: 'ping',
            });
          }
        }

        // Cleanup listener and unsubscribe
        redisSub.off('message', onMessage);
        await redisSub.unsubscribe(channel).catch(() => {});
      } catch (err: any) {
        console.warn(`⚠️ SSE PubSub subscription failed for poll ${id}, falling back to polling:`, err.message);
        usePolling = true;
      }
    }

    // Polling fallback loop (if Redis is unconfigured or offline)
    if (usePolling) {
      while (active) {
        await stream.sleep(3000);
        if (!active) break;
        await sendLatestData();
      }
    }
  });
});
