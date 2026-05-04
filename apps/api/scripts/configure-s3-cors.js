#!/usr/bin/env node
/**
 * S3 CORS Configuration Setup Script
 * 
 * This script configures CORS on an AWS S3 bucket to allow images to be loaded
 * from web browsers without 403 Forbidden errors.
 * 
 * Usage: bun run scripts/configure-s3-cors.js
 * 
 * Requirements:
 * - AWS credentials in environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION)
 * - S3 bucket name in AWS_S3_BUCKET
 * - AWS SDK already installed
 */

import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET'];
const missing = requiredEnvVars.filter(v => !process.env[v]);

if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * CORS configuration for S3 bucket
 * 
 * This allows:
 * - GET and HEAD requests from specified origins (browsers)
 * - All headers in requests (*)
 * - Response headers are exposed (ETag, version id)
 * - Browser caches CORS rules for 3000 seconds
 */
const corsConfiguration = {
  CORSRules: [
    {
      AllowedHeaders: ['*'],
      AllowedMethods: ['GET', 'HEAD'],
      AllowedOrigins: [
        // Development
        'http://localhost:8080',  // Vite dev server (web app)
        'http://localhost:5173',  // Vite default port
        'http://localhost:3000',  // API server (for testing)
        'http://127.0.0.1:8080',
        'http://127.0.0.1:5173',
        // Production - add your domains here:
        // 'https://yourdomain.com',
        // 'https://app.yourdomain.com',
      ],
      ExposeHeaders: ['ETag', 'x-amz-version-id'],
      MaxAgeSeconds: 3000,
    },
  ],
};

async function configureCORS() {
  try {
    console.log('🔧 Configuring S3 CORS...');
    console.log(`   Bucket: ${process.env.AWS_S3_BUCKET}`);
    console.log(`   Region: ${process.env.AWS_REGION}`);
    console.log('');

    const command = new PutBucketCorsCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      CORSConfiguration: corsConfiguration,
    });

    await s3Client.send(command);

    console.log('✅ CORS configuration applied successfully!');
    console.log('');
    console.log('Allowed Origins:');
    corsConfiguration.CORSRules[0].AllowedOrigins.forEach((origin) => {
      console.log(`   • ${origin}`);
    });
    console.log('');
    console.log('📝 Next Steps:');
    console.log('1. Images should now load without 403 errors');
    console.log('2. For production, update AllowedOrigins in this script with your domain');
    console.log('3. Re-run this script after updating origins: bun run scripts/configure-s3-cors.js');
  } catch (error) {
    console.error('❌ Failed to configure CORS:', error.message);
    process.exit(1);
  }
}

configureCORS();
