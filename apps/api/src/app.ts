import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { errorHandler } from './middleware/errorHandler.middleware';
import { globalLimiter } from './middleware/rateLimit.middleware';
import { env } from './config/env';

// Routers
import { authRouter } from './modules/auth/auth.router';
import { usersRouter } from './modules/users/users.router';
import { pollsRouter } from './modules/polls/polls.router';
import { votesRouter } from './modules/votes/votes.router';
import { communityRouter } from './modules/community/community.router';
import { analyticsRouter } from './modules/analytics/analytics.router';
import { notificationsRouter } from './modules/notifications/notifications.router';

export const app = new Hono();

// Global Middleware
app.use('*', secureHeaders());
app.use(
  '*',
  cors({
    origin: env.ALLOWED_ORIGINS.split(','),
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiter globally applied
app.use('*', globalLimiter);

app.onError(errorHandler);

// API v1 Routes
const v1 = new Hono();

v1.route('/auth', authRouter);
v1.route('/users', usersRouter);
v1.route('/polls', pollsRouter);
v1.route('/polls', votesRouter); // Mounts /polls/:id/vote
v1.route('/community', communityRouter);
v1.route('/analytics', analyticsRouter);
v1.route('/notifications', notificationsRouter);

// Mount v1
app.route('/v1', v1);

export default app;
