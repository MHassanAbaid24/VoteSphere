import { Context } from 'hono';
import { setCookie, getCookie } from 'hono/cookie';
import { registerUser, loginUser, refreshUserSession, logoutUser, verifyEmail, resendVerification } from './auth.service';
import { prisma } from '../../config/database';
import { env } from '../../config/env';

/**
 * Register a new user
 */
export const register = async (c: Context) => {
  try {
    const body = c.get('validBody' as any);
    const result = await registerUser(body);

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
          emailSent: result.emailSent ?? false,
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
};

/**
 * Login a user
 */
export const login = async (c: Context) => {
  try {
    const body = c.get('validBody' as any);
    const result = await loginUser(body);

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
};

/**
 * Refresh user access token using cookie refresh token
 */
export const refresh = async (c: Context) => {
  try {
    const cookieToken = getCookie(c, 'refresh_token');

    if (!cookieToken) {
      return c.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Session expired. Please log in again.',
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
};

/**
 * Logout user session
 */
export const logout = async (c: Context) => {
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
    return c.json({ success: true, data: null }); // Soft failure
  }
};

/**
 * Get the currently logged in user profile
 */
export const me = async (c: Context) => {
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
        emailVerified: user.emailVerified,
      },
    },
  });
};

/**
 * Verify user email via token
 */
export const verify = async (c: Context) => {
  try {
    const body = c.get('validBody' as any);
    await verifyEmail(body.token);

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
};

/**
 * Resend validation email
 */
export const resend = async (c: Context) => {
  try {
    const body = c.get('validBody' as any);
    await resendVerification(body.email);

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
};
