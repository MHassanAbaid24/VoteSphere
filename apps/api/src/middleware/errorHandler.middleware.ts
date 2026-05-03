import { ErrorHandler } from 'hono';
import { ZodError } from 'zod';
import type { ApiErrorResponse } from '@votesphere/types';

export const errorHandler: ErrorHandler = (err, c) => {
  console.error('[Error]:', err);

  let statusCode = 500;
  let response: ApiErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred.',
    },
  };

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    statusCode = 400;
    response = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data.',
        details: err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    };
  } else if (err.name === 'PrismaClientKnownRequestError') {
    // Basic Prisma Error Handling
    statusCode = 400;
    response = {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'A database error occurred.',
        // Optionally map specific Prisma codes to specific messages
      },
    };
  } else if (err instanceof SyntaxError) {
    statusCode = 400;
    response = {
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Malformed request data.',
      },
    };
  }

  // You can extend this with custom AppError classes that have `.statusCode` and `.code` properties.

  return c.json(response, statusCode as any);
};
