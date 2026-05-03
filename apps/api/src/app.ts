import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { errorHandler } from './middleware/errorHandler.middleware';

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
app.use('*', cors());
app.onError(errorHandler);

// API v1 Routes
const v1 = new Hono();

v1.route('/auth', authRouter);
v1.route('/users', usersRouter);
v1.route('/polls', pollsRouter);
v1.route('/polls', votesRouter); // Mounts /polls/:id/vote
v1.route('/community', communityRouter);
v1.route('/analytics', analyticsRouter);
v1.route('/notifications', notificationsRouter); // Or mount under /users/me/notifications

// Mount v1
app.route('/v1', v1);

export default app;
