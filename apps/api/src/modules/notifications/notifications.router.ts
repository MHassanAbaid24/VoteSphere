import { Hono } from 'hono';

export const notificationsRouter = new Hono();

// Alternatively, these could be mounted under usersRouter.
// Adding them here for logical separation as well.
notificationsRouter.get('/', (c) => c.json({ success: true, data: [] }));
notificationsRouter.patch('/read-all', (c) => c.json({ success: true, data: null }));
notificationsRouter.patch('/:id', (c) => c.json({ success: true, data: null }));
