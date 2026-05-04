import { Hono } from 'hono';
import { RegisterSchema, LoginSchema, VerifyEmailSchema, ResendVerificationSchema } from './auth.schema';
import { validateBody } from '../../middleware/validation.middleware';
import { register, login, refresh, logout, me, verify, resend, googleLogin, googleCallback, githubLogin, githubCallback } from './auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

export const authRouter = new Hono();

// POST /register
authRouter.post('/register', validateBody(RegisterSchema), register);

// POST /login
authRouter.post('/login', validateBody(LoginSchema), login);

// POST /refresh
authRouter.post('/refresh', refresh);

// POST /logout
authRouter.post('/logout', logout);

// GET /me (Protected)
authRouter.get('/me', authMiddleware, me);

// POST /verify-email
authRouter.post('/verify-email', validateBody(VerifyEmailSchema), verify);

// POST /resend-verification
authRouter.post('/resend-verification', validateBody(ResendVerificationSchema), resend);

// OAuth Endpoints
authRouter.get('/google', googleLogin);
authRouter.get('/google/callback', googleCallback);
authRouter.get('/github', githubLogin);
authRouter.get('/github/callback', githubCallback);
