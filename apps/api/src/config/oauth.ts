import { Google, GitHub } from 'arctic';
import { env } from './env';

// Determine backend callback URL for Google/GitHub OAuth consent redirects
// Default to standard local dev if not explicitly customized
const backendBaseUrl = process.env.NODE_ENV === 'production' 
  ? 'https://api.votesphere.com'
  : 'http://localhost:3000';

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
