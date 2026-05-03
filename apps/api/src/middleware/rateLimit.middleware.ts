import { Context, Next } from 'hono';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
}

interface ClientInfo {
  count: number;
  resetTime: number;
}

const clients = new Map<string, ClientInfo>();

/**
 * Basic in-memory rate-limiting middleware.
 */
export const rateLimiter = (config: RateLimitConfig) => {
  return async (c: Context, next: Next) => {
    // Determine the IP address of the client
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown-ip';
    
    // Fallback key if IP is missing or unidentifiable
    const key = `${ip}`;

    const now = Date.now();
    let client = clients.get(key);

    if (!client || now > client.resetTime) {
      client = {
        count: 0,
        resetTime: now + config.windowMs,
      };
      clients.set(key, client);
    }

    client.count++;

    if (client.count > config.max) {
      return c.json(
        {
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: config.message || 'Too many requests. Please try again later.',
          },
        },
        429
      );
    }

    // Pass rate limit info headers
    c.header('X-RateLimit-Limit', config.max.toString());
    c.header('X-RateLimit-Remaining', Math.max(0, config.max - client.count).toString());
    c.header('X-RateLimit-Reset', Math.ceil(client.resetTime / 1000).toString());

    await next();
  };
};

// Global limiter: 100 requests per 15 minutes per IP
export const globalLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests. Please slow down.',
});

// Sensitive Auth endpoints: 15 requests per 15 minutes per IP
export const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
});
