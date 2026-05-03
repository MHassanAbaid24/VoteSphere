import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { prisma } from '../../config/database';
import { authMiddleware } from '../../middleware/auth.middleware';
import { CreatePollSchema, UpdatePollSchema } from './polls.schema';
import * as pollsService from './polls.service';
import { ZodIssue } from 'zod';

export const pollsRouter = new Hono();

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

    const result = await pollsService.getPolls({
      status: undefined,
      visibility: undefined,
    });

    const myPolls = result.polls.filter((p: any) => p.creatorId === userPayload.id);

    return c.json({
      success: true,
      data: myPolls,
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

// Real-Time Results Stream (Server-Sent Events)
pollsRouter.get('/:id/stream', async (c) => {
  const id = c.req.param('id');
  return streamSSE(c, async (stream) => {
    let active = true;
    stream.onAbort(() => {
      active = false;
    });

    while (active) {
      const poll = await prisma.poll.findFirst({
        where: { id },
        include: {
          questions: {
            include: {
              options: true,
            },
          },
        },
      });

      if (!poll) {
        await stream.writeSSE({
          data: JSON.stringify({ error: 'Poll not found' }),
          event: 'error',
        });
        break;
      }

      await stream.writeSSE({
        data: JSON.stringify(poll),
        event: 'message',
        id: String(Date.now()),
      });

      await stream.sleep(3000);
    }
  });
});
