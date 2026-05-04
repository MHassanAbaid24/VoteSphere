import { prisma } from '../../config/database';
import { hashPassword, verifyPassword } from '../../lib/password';
import { sign } from 'hono/jwt';
import { env } from '../../config/env';
import { RegisterInput, LoginInput } from './auth.schema';
import { sendVerificationEmail } from '../../lib/mailer';

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  emailSent?: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isPremium: boolean;
  };
}

/**
 * Register a new user and generate a hashed password
 */
export const registerUser = async (input: RegisterInput): Promise<AuthResult> => {
  // Check if email already exists
  const existingUser = await prisma.user.findFirst({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new Error('An account with this email already exists');
  }

  // Hash the password
  const passwordHash = await hashPassword(input.password);

  // Create the new user record in the DB
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
    },
  });

  // Generate the Access Token (JWT)
  const accessToken = await sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      isPremium: user.isPremium,
      exp: Math.floor(Date.now() / 1000) + 60 * 15, // 15 mins
    },
    env.JWT_SECRET,
    'HS256'
  );

  // Generate a random 64-byte Refresh Token
  const refreshTokenString = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');

  // Save the refresh token in the DB
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshTokenString,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  // Generate Email Verification Token (64-byte random string)
  const verificationTokenString = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');

  await prisma.emailVerificationToken.create({
    data: {
      email: user.email,
      token: verificationTokenString,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });

  const emailSent = await sendVerificationEmail(user.email, verificationTokenString);

  return {
    accessToken,
    refreshToken: refreshTokenString,
    emailSent,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isPremium: user.isPremium,
    },
  };
};

/**
 * Login a user by verifying password and issuing new tokens
 */
export const loginUser = async (input: LoginInput): Promise<AuthResult> => {
  const user = await prisma.user.findFirst({
    where: { email: input.email },
  });

  if (!user || !user.passwordHash) {
    throw new Error('Invalid email or password');
  }

  // Verify the password
  const isValid = await verifyPassword(input.password, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  // Generate the Access Token (JWT)
  const accessToken = await sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      isPremium: user.isPremium,
      exp: Math.floor(Date.now() / 1000) + 60 * 15, // 15 mins
    },
    env.JWT_SECRET,
    'HS256'
  );

  // Generate a random 64-byte Refresh Token
  const refreshTokenString = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');

  // Save the refresh token in the DB
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshTokenString,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  return {
    accessToken,
    refreshToken: refreshTokenString,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isPremium: user.isPremium,
    },
  };
};

/**
 * Exchange a valid Refresh Token for a new Access Token
 */
export const refreshUserSession = async (tokenString: string): Promise<{ accessToken: string; refreshToken: string }> => {
  const storedToken = await prisma.refreshToken.findFirst({
    where: { token: tokenString, revoked: false },
    include: { user: true },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    throw new Error('Invalid or expired refresh token');
  }

  // Token rotation: Revoke old token
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revoked: true },
  });

  // Check family tracking (to prevent reuse attacks)
  // Create a new fresh token
  const newRefreshTokenString = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');

  await prisma.refreshToken.create({
    data: {
      userId: storedToken.user.id,
      token: newRefreshTokenString,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  // Create Access Token
  const accessToken = await sign(
    {
      sub: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
      isPremium: storedToken.user.isPremium,
      exp: Math.floor(Date.now() / 1000) + 60 * 15, // 15 mins
    },
    env.JWT_SECRET,
    'HS256'
  );

  return { accessToken, refreshToken: newRefreshTokenString };
};

/**
 * Revoke a valid Refresh Token
 */
export const logoutUser = async (tokenString: string): Promise<void> => {
  await prisma.refreshToken.updateMany({
    where: { token: tokenString },
    data: { revoked: true },
  });
};

/**
 * Verify a user's email using the token
 */
export const verifyEmail = async (token: string): Promise<void> => {
  const storedToken = await prisma.emailVerificationToken.findFirst({
    where: { token, usedAt: null },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    throw new Error('Invalid or expired verification token');
  }

  // Find user and verify them
  const user = await prisma.user.findFirst({
    where: { email: storedToken.email },
  });

  if (!user) {
    throw new Error('User not found');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true },
  });

  // Mark token as used
  await prisma.emailVerificationToken.update({
    where: { id: storedToken.id },
    data: { usedAt: new Date() },
  });
};

/**
 * Resend email verification token
 */
export const resendVerification = async (email: string): Promise<void> => {
  const user = await prisma.user.findFirst({
    where: { email },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.emailVerified) {
    throw new Error('Email is already verified');
  }

  // Generate new token
  const verificationTokenString = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');

  await prisma.emailVerificationToken.create({
    data: {
      email: user.email,
      token: verificationTokenString,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });

  await sendVerificationEmail(user.email, verificationTokenString);
};
