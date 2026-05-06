import app from './app';
import { env } from './config/env';
import { checkExpirations } from './modules/notifications/notifications.service';

console.log(`🚀 Server is running on port ${env.PORT}`);

// Start the background poll expiration sweep
checkExpirations().catch((err) => console.error('⚠️ Failed initial background check:', err.message));
setInterval(() => {
  checkExpirations().catch((err) => console.error('⚠️ Failed background sweep:', err.message));
}, 30 * 60 * 1000); // Run every 30 minutes

export default {
  port: env.PORT || 3000,
  fetch: app.fetch,
};
