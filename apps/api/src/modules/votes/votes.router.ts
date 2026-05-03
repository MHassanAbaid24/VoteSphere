import { Hono } from 'hono';
import { authMiddleware } from '../../middleware/auth.middleware';
import * as votesService from './votes.service';
import { CastVoteSchema } from './votes.schema';

export const votesRouter = new Hono();

votesRouter.post('/:id/vote', authMiddleware, async (c) => {
  try {
    const user = c.get('user' as any);
    if (!user) {
      return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, 401);
    }

    const pollId = c.req.param('id');
    const body = await c.req.json();
    const parsed = CastVoteSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: parsed.error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
        }
      }, 400);
    }

    const result = await votesService.castVote(pollId as string, user.id, parsed.data.answers);
    return c.json({ success: true, data: result });
  } catch (err: any) {
    let status = 400;
    let code = 'BAD_REQUEST';

    if (err.message === 'POLL_NOT_FOUND') {
      status = 404;
      code = 'POLL_NOT_FOUND';
    } else if (err.message === 'POLL_CLOSED') {
      status = 403;
      code = 'POLL_CLOSED';
    } else if (err.message === 'CREATOR_CANNOT_VOTE') {
      status = 403;
      code = 'CREATOR_CANNOT_VOTE';
    } else if (err.message === 'ALREADY_VOTED') {
      status = 409;
      code = 'ALREADY_VOTED';
    } else if (err.message === 'INVALID_QUESTION') {
      status = 400;
      code = 'INVALID_QUESTION';
    } else if (err.message === 'INVALID_OPTION') {
      status = 400;
      code = 'INVALID_OPTION';
    }

    return c.json({
      success: false,
      error: { code, message: err.message }
    }, status as any);
  }
});

votesRouter.get('/:id/vote/status', authMiddleware, async (c) => {
  try {
    const user = c.get('user' as any);
    if (!user) {
      return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, 401);
    }

    const pollId = c.req.param('id');
    const status = await votesService.getVoteStatus(pollId as string, user.id);

    return c.json({ success: true, data: status });
  } catch (err: any) {
    return c.json({
      success: false,
      error: { code: 'BAD_REQUEST', message: err.message }
    }, 400);
  }
});
