import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import { env } from '../config/env';

export interface TokenPayload {
  sub: string; // user ID
  email: string;
  role: string;
  isPremium: boolean;
}

/**
 * Middleware to protect routes and parse JWT access token
 */
export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or malformed Authorization header.',
        },
      },
      401
    );
  }

  const token = authHeader.substring(7);

  try {
    const payload = await verify(token, env.JWT_SECRET, 'HS256');
    
    // Inject user info into the Hono context
    c.set('jwtPayload', payload);
    c.set('user', {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      isPremium: payload.isPremium,
    });

    await next();
  } catch (err) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired access token.',
        },
      },
      401
    );
  }
};
