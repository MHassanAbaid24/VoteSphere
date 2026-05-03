import { Hono } from 'hono';

export const votesRouter = new Hono();

// Mounted at /v1/polls
votesRouter.post('/:id/vote', (c) => c.json({ success: true, data: null }));
votesRouter.get('/:id/vote/status', (c) => c.json({ success: true, data: null }));
