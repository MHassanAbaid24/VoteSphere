import { Context } from 'hono';
import { setCookie, getCookie } from 'hono/cookie';
import { registerUser, loginUser, refreshUserSession, logoutUser, verifyEmail, resendVerification, handleOAuthUser } from './auth.service';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { generateState, generateCodeVerifier } from 'arctic';
import { googleOAuth, githubOAuth } from '../../config/oauth';

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

/**
 * Redirect to Google OAuth
 */
export const googleLogin = async (c: Context) => {
  if (env.GOOGLE_CLIENT_ID === 'mock_google_client_id' || env.GOOGLE_CLIENT_ID === 'mock') {
    // Return mock OAuth redirect (Direct to callback automatically in local dev for extreme convenience)
    const state = generateState();
    return c.redirect(`/v1/auth/google/callback?code=mock_code&state=${state}`);
  }

  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  setCookie(c, 'google_oauth_state', state, { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'Lax', maxAge: 60 * 10 });
  setCookie(c, 'google_oauth_code_verifier', codeVerifier, { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'Lax', maxAge: 60 * 10 });

  try {
    const url = await googleOAuth.createAuthorizationURL(state, codeVerifier, { scopes: ['openid', 'profile', 'email'] });
    return c.redirect(url.toString());
  } catch (err: any) {
    return c.text(`OAuth Redirect error: ${err.message}`, 400);
  }
};

/**
 * Google Callback
 */
export const googleCallback = async (c: Context) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const storedState = getCookie(c, 'google_oauth_state');
  const storedCodeVerifier = getCookie(c, 'google_oauth_code_verifier');

  if (env.GOOGLE_CLIENT_ID === 'mock_google_client_id' || env.GOOGLE_CLIENT_ID === 'mock' || code === 'mock_code') {
    const mockEmail = `mock_google_${Date.now()}@test.com`;
    const result = await handleOAuthUser('google', `mock_sub_${Date.now()}`, mockEmail, 'Mock Google User');

    setCookie(c, 'refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 30 * 24 * 60 * 60,
    });

    const frontendUrl = env.APP_URL || 'http://localhost:8081';
    return c.redirect(`${frontendUrl}/auth/callback?token=${result.accessToken}`);
  }

  if (!code || !state || state !== storedState || !storedCodeVerifier) {
    return c.text('Invalid OAuth state or verifier.', 400);
  }

  try {
    const tokens = await googleOAuth.validateAuthorizationCode(code, storedCodeVerifier);
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });
    const userInfo = await userResponse.json();

    if (!userInfo.email) {
      return c.text('OAuth callback did not provide an email address.', 400);
    }

    const result = await handleOAuthUser('google', userInfo.sub, userInfo.email, userInfo.name || userInfo.email.split('@')[0]);

    setCookie(c, 'refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 30 * 24 * 60 * 60,
    });

    const frontendUrl = env.APP_URL || 'http://localhost:8081';
    return c.redirect(`${frontendUrl}/auth/callback?token=${result.accessToken}`);
  } catch (err: any) {
    return c.text(`OAuth error: ${err.message}`, 400);
  }
};

/**
 * Redirect to GitHub OAuth
 */
export const githubLogin = async (c: Context) => {
  if (env.GITHUB_CLIENT_ID === 'mock_github_client_id' || env.GITHUB_CLIENT_ID === 'mock') {
    // Return mock OAuth redirect in local dev
    const state = generateState();
    return c.redirect(`/v1/auth/github/callback?code=mock_code&state=${state}`);
  }

  const state = generateState();
  setCookie(c, 'github_oauth_state', state, { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'Lax', maxAge: 60 * 10 });

  try {
    const url = await githubOAuth.createAuthorizationURL(state, { scopes: ['user:email'] });
    return c.redirect(url.toString());
  } catch (err: any) {
    return c.text(`OAuth Redirect error: ${err.message}`, 400);
  }
};

/**
 * GitHub Callback
 */
export const githubCallback = async (c: Context) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const storedState = getCookie(c, 'github_oauth_state');

  if (env.GITHUB_CLIENT_ID === 'mock_github_client_id' || env.GITHUB_CLIENT_ID === 'mock' || code === 'mock_code') {
    const mockEmail = `mock_github_${Date.now()}@test.com`;
    const result = await handleOAuthUser('github', `mock_id_${Date.now()}`, mockEmail, 'Mock GitHub User');

    setCookie(c, 'refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 30 * 24 * 60 * 60,
    });

    const frontendUrl = env.APP_URL || 'http://localhost:8081';
    return c.redirect(`${frontendUrl}/auth/callback?token=${result.accessToken}`);
  }

  if (!code || !state || state !== storedState) {
    return c.text('Invalid OAuth state.', 400);
  }

  try {
    const tokens = await githubOAuth.validateAuthorizationCode(code);
    const userResponse = await fetch('https://api.github.com/user', {
      headers: { 
        Authorization: `Bearer ${tokens.accessToken}`,
        'User-Agent': 'VoteSphere'
      },
    });
    const userInfo = await userResponse.json();

    let email = userInfo.email;
    if (!email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: { 
          Authorization: `Bearer ${tokens.accessToken}`,
          'User-Agent': 'VoteSphere'
        },
      });
      const emails = await emailsResponse.json();
      const primaryEmailObj = emails.find((e: any) => e.primary) || emails[0];
      email = primaryEmailObj?.email;
    }

    if (!email) {
      return c.text('OAuth callback did not provide an email address.', 400);
    }

    const result = await handleOAuthUser('github', String(userInfo.id), email, userInfo.name || userInfo.login);

    setCookie(c, 'refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 30 * 24 * 60 * 60,
    });

    const frontendUrl = env.APP_URL || 'http://localhost:8081';
    return c.redirect(`${frontendUrl}/auth/callback?token=${result.accessToken}`);
  } catch (err: any) {
    return c.text(`OAuth error: ${err.message}`, 400);
  }
};
