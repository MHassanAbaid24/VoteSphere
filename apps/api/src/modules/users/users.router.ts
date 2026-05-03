import { Hono } from 'hono';

export const usersRouter = new Hono();

usersRouter.get('/:id', (c) => c.json({ success: true, data: null }));

usersRouter.patch('/me', (c) => c.json({ success: true, data: null }));
usersRouter.delete('/me', (c) => c.json({ success: true, data: null }));

usersRouter.get('/me/preferences', (c) => c.json({ success: true, data: null }));
usersRouter.put('/me/preferences', (c) => c.json({ success: true, data: null }));

usersRouter.get('/me/notifications', (c) => c.json({ success: true, data: null }));
usersRouter.patch('/me/notifications/read-all', (c) => c.json({ success: true, data: null }));
usersRouter.patch('/me/notifications/:id', (c) => c.json({ success: true, data: null }));
