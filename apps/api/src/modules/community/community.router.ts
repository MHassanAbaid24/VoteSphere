import { Hono } from 'hono';

export const communityRouter = new Hono();

communityRouter.get('/feed', (c) => c.json({ success: true, data: [] }));
communityRouter.get('/trending', (c) => c.json({ success: true, data: [] }));
communityRouter.get('/categories', (c) => c.json({ success: true, data: [] }));
communityRouter.get('/search', (c) => c.json({ success: true, data: [] }));
