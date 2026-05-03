import { Hono } from 'hono';

export const analyticsRouter = new Hono();

analyticsRouter.get('/global', (c) => c.json({ success: true, data: null }));

// Also premium demographic analytics for a poll
analyticsRouter.get('/polls/:id/demographics', (c) => c.json({ success: true, data: null }));
