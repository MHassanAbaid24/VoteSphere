import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { env } from '../../config/env';
import * as communityService from './community.service';

export const communityRouter = new Hono();

communityRouter.get('/feed', async (c) => {
  try {
    const page = c.req.query('page');
    const limit = c.req.query('limit');

    const authHeader = c.req.header('Authorization');
    let userId: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const payload = (await verify(token, env.JWT_SECRET, 'HS256')) as any;
        userId = payload.sub;
      } catch (err) {}
    }

    const result = await communityService.getFeed({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      userId,
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

communityRouter.get('/trending', async (c) => {
  try {
    const limit = c.req.query('limit');
    const polls = await communityService.getTrending(limit ? parseInt(limit) : 10);

    return c.json({
      success: true,
      data: polls,
    });
  } catch (err: any) {
    return c.json(
      { success: false, error: { code: 'BAD_REQUEST', message: err.message } },
      400
    );
  }
});

communityRouter.get('/categories', (c) => {
  try {
    const categories = communityService.getCategories();
    return c.json({
      success: true,
      data: categories,
    });
  } catch (err: any) {
    return c.json(
      { success: false, error: { code: 'BAD_REQUEST', message: err.message } },
      400
    );
  }
});

communityRouter.get('/search', async (c) => {
  try {
    const q = c.req.query('q');
    const category = c.req.query('category');
    const page = c.req.query('page');
    const limit = c.req.query('limit');

    const result = await communityService.search({
      q,
      category,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
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
