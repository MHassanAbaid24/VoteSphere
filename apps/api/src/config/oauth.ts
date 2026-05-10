import { Google, GitHub } from 'arctic';
import { env } from './env';

// Determine backend callback URL for Google/GitHub OAuth consent redirects
// Dynamically defaults to BACKEND_URL from environment
const backendBaseUrl = env.BACKEND_URL;

export const googleOAuth = new Google(
  env.GOOGLE_CLIENT_ID || 'mock',
  env.GOOGLE_CLIENT_SECRET || 'mock',
  `${backendBaseUrl}/v1/auth/google/callback`
);

export const githubOAuth = new GitHub(
  env.GITHUB_CLIENT_ID || 'mock',
  env.GITHUB_CLIENT_SECRET || 'mock',
  null // No optional custom redirect URI for GitHub Arctic provider needed unless specified
);
