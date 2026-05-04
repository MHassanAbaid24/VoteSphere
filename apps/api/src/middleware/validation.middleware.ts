import { Context, Next } from 'hono';
import { ZodSchema } from 'zod';

/**
 * Validates request body against a Zod schema.
 * Any parsing failure will throw a ZodError which is caught by global errorHandler.
 */
export const validateBody = (schema: ZodSchema) => {
  return async (c: Context, next: Next) => {
    const body = await c.req.json();
    const parsed = schema.parse(body);
    c.set('validBody' as any, parsed);
    await next();
  };
};
