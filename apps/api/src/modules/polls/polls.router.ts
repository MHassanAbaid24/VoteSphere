import { Hono } from 'hono';

export const pollsRouter = new Hono();

pollsRouter.get('/', (c) => c.json({ success: true, data: [] }));
pollsRouter.post('/', (c) => c.json({ success: true, data: null }));

pollsRouter.get('/me', (c) => c.json({ success: true, data: [] }));

pollsRouter.get('/:id', (c) => c.json({ success: true, data: null }));
pollsRouter.patch('/:id', (c) => c.json({ success: true, data: null }));
pollsRouter.delete('/:id', (c) => c.json({ success: true, data: null }));

pollsRouter.post('/:id/publish', (c) => c.json({ success: true, data: null }));
pollsRouter.post('/:id/close', (c) => c.json({ success: true, data: null }));

pollsRouter.get('/:id/results', (c) => c.json({ success: true, data: null }));
pollsRouter.get('/:id/analytics', (c) => c.json({ success: true, data: null }));

pollsRouter.post('/:id/cover', (c) => c.json({ success: true, data: null }));
