import app from './app';
import { env } from './config/env';
import { checkExpirations } from './modules/notifications/notifications.service';
import { processPendingModerations } from './modules/polls/polls.moderation.service';

console.log(`🚀 Server is running on port ${env.PORT}`);

// Start the background poll expiration sweep
checkExpirations().catch((err) => console.error('⚠️ Failed initial background check:', err.message));
setInterval(() => {
  checkExpirations().catch((err) => console.error('⚠️ Failed background sweep:', err.message));
}, 30 * 60 * 1000); // Run every 30 minutes

// Start the background AI moderation sweep every 5 minutes
processPendingModerations().catch((err) => console.error('⚠️ Failed initial moderation sweep:', err.message));
setInterval(() => {
  processPendingModerations().catch((err) => console.error('⚠️ Failed periodic moderation sweep:', err.message));
}, 5 * 60 * 1000); // Run every 5 minutes

export default {
  port: env.PORT || 3000,
  fetch: app.fetch,
};
