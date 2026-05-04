import { Hono } from 'hono';
import * as contentService from './content.service';

export const contentRouter = new Hono();

contentRouter.get('/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const page = await contentService.getContentPageBySlug(slug);
    if (!page) {
      return c.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Content page not found' } },
        404
      );
    }
    return c.json({
      success: true,
      data: page,
    });
  } catch (err: any) {
    return c.json(
      { success: false, error: { code: 'BAD_REQUEST', message: err.message } },
      400
    );
  }
});
