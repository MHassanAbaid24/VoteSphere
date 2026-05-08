import { z } from 'zod';
import * as dotenv from 'dotenv';

// Load .env file
dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().default('supersecret-default-jwt-secret-key-for-development'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),
  PORT: z.string().or(z.number()).default(3000).transform(v => Number(v)),
  GMAIL_USER: z.string().optional(),
  GMAIL_APP_PASSWORD: z.string().optional(),
  APP_URL: z.string().default('http://localhost:8080'),
  GOOGLE_CLIENT_ID: z.string().default('mock_google_client_id'),
  GOOGLE_CLIENT_SECRET: z.string().default('mock_google_client_secret'),
  GITHUB_CLIENT_ID: z.string().default('mock_github_client_id'),
  GITHUB_CLIENT_SECRET: z.string().default('mock_github_client_secret'),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  REDIS_URL: z.string().optional(),
  TAVILY_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
});

// Parse and validate environment variables
const parseEnv = () => {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }
  return parsed.data;
};

export const env = parseEnv();
