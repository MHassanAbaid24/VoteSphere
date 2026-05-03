import { Hono } from 'hono';

export const authRouter = new Hono();

authRouter.post('/register', (c) => c.json({ success: true, data: null }));
authRouter.post('/login', (c) => c.json({ success: true, data: null }));
authRouter.post('/logout', (c) => c.json({ success: true, data: null }));
authRouter.post('/refresh', (c) => c.json({ success: true, data: null }));

authRouter.get('/verify-email', (c) => c.json({ success: true, data: null }));
authRouter.post('/resend-verification', (c) => c.json({ success: true, data: null }));

authRouter.post('/forgot-password', (c) => c.json({ success: true, data: null }));
authRouter.post('/reset-password', (c) => c.json({ success: true, data: null }));

authRouter.get('/google', (c) => c.json({ success: true, data: null }));
authRouter.get('/google/callback', (c) => c.json({ success: true, data: null }));

authRouter.get('/github', (c) => c.json({ success: true, data: null }));
authRouter.get('/github/callback', (c) => c.json({ success: true, data: null }));

authRouter.get('/me', (c) => c.json({ success: true, data: null }));
