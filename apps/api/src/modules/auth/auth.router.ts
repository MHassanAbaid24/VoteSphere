import { Hono } from 'hono';
import { setCookie, getCookie } from 'hono/cookie';
import { ZodIssue } from 'zod';
import { RegisterSchema, LoginSchema, VerifyEmailSchema, ResendVerificationSchema } from './auth.schema';
import { registerUser, loginUser, refreshUserSession, logoutUser, verifyEmail, resendVerification } from './auth.service';
import { authMiddleware } from '../../middleware/auth.middleware';
import { env } from '../../config/env';
import { prisma } from '../../config/database';

export const authRouter = new Hono();

// POST /register
authRouter.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: parsed.error.issues.map((i: ZodIssue) => ({ field: i.path.join('.'), message: i.message })),
          },
        },
        400
      );
    }

    const result = await registerUser(parsed.data);

    // Store refresh token as a secure cookie
    setCookie(c, 'refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 30 * 24 * 60 * 60,
    });

    return c.json(
      {
        success: true,
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      },
      201
    );
  } catch (err: unknown) {
    return c.json(
      {
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: (err as Error).message,
        },
      },
      400
    );
  }
});

// POST /login
authRouter.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: parsed.error.issues.map((i: ZodIssue) => ({ field: i.path.join('.'), message: i.message })),
          },
        },
        400
      );
    }

    const result = await loginUser(parsed.data);

    // Store refresh token as a secure cookie
    setCookie(c, 'refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 30 * 24 * 60 * 60,
    });

    return c.json({
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  } catch (err: unknown) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: (err as Error).message,
        },
      },
      401
    );
  }
});

// POST /refresh
authRouter.post('/refresh', async (c) => {
  try {
    const cookieToken = getCookie(c, 'refresh_token');

    if (!cookieToken) {
      return c.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'No refresh token provided in cookies',
          },
        },
        401
      );
    }

    const result = await refreshUserSession(cookieToken);

    // Rotate the cookie token
    setCookie(c, 'refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 30 * 24 * 60 * 60,
    });

    return c.json({
      success: true,
      data: {
        accessToken: result.accessToken,
      },
    });
  } catch (err: unknown) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: (err as Error).message,
        },
      },
      401
    );
  }
});

// POST /logout
authRouter.post('/logout', async (c) => {
  try {
    const cookieToken = getCookie(c, 'refresh_token');
    if (cookieToken) {
      await logoutUser(cookieToken);
    }

    // Explicitly delete/expire the refresh cookie
    setCookie(c, 'refresh_token', '', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 0,
    });

    return c.json({ success: true, data: null });
  } catch (err: unknown) {
    return c.json({ success: true, data: null }); // Soft failure: just invalidate the session
  }
});

// GET /me (Protected)
authRouter.get('/me', authMiddleware, async (c) => {
  const userPayload = c.get('user' as never) as { id: string } | undefined;

  if (!userPayload || !userPayload.id) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User is not authenticated.',
        },
      },
      401
    );
  }

  const user = await prisma.user.findFirst({
    where: { id: userPayload.id },
  });

  if (!user) {
    return c.json(
      {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found.',
        },
      },
      404
    );
  }

  return c.json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium,
      },
    },
  });
});

// POST /verify-email
authRouter.post('/verify-email', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = VerifyEmailSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: parsed.error.issues.map((i: ZodIssue) => ({ field: i.path.join('.'), message: i.message })),
          },
        },
        400
      );
    }

    await verifyEmail(parsed.data.token);

    return c.json({
      success: true,
      data: {
        message: 'Email successfully verified.',
      },
    });
  } catch (err: unknown) {
    return c.json(
      {
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: (err as Error).message,
        },
      },
      400
    );
  }
});

// POST /resend-verification
authRouter.post('/resend-verification', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = ResendVerificationSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: parsed.error.issues.map((i: ZodIssue) => ({ field: i.path.join('.'), message: i.message })),
          },
        },
        400
      );
    }

    await resendVerification(parsed.data.email);

    return c.json({
      success: true,
      data: {
        message: 'Verification email resent.',
      },
    });
  } catch (err: unknown) {
    return c.json(
      {
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: (err as Error).message,
        },
      },
      400
    );
  }
});
