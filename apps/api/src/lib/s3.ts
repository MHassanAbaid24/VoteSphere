import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';

let s3Client: S3Client | null = null;

if (env.AWS_REGION && env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
  s3Client = new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

export const uploadToS3 = async (
  key: string,
  buffer: Buffer,
  mimetype: string
): Promise<string> => {
  if (s3Client && env.AWS_S3_BUCKET) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
      })
    );
    return `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
  }

  // Fallback / Mock mode when S3 is not fully configured
  console.log(`[S3 Mock] Uploaded ${key} (${mimetype}) successfully.`);
  // Returns a data URL or a mock URL
  const base64 = buffer.toString('base64');
  return `data:${mimetype};base64,${base64}`;
};

/**
 * Generate a signed URL for accessing an S3 object
 * Signed URLs allow temporary access without exposing AWS credentials
 * 
 * @param s3Url - Full S3 URL (https://bucket.s3.region.amazonaws.com/key)
 * @param expiresIn - Seconds until URL expires (default 3600 = 1 hour)
 * @returns Signed URL with embedded signature and expiration, or original URL if S3 not configured
 */
export const generateSignedUrl = async (
  s3Url: string,
  expiresIn: number = 3600
): Promise<string> => {
  if (!s3Client || !env.AWS_S3_BUCKET) {
    // If S3 not configured, return URL as-is (e.g., data URL from mock mode)
    return s3Url;
  }

  try {
    // Extract the key from the full S3 URL
    // URL format: https://bucket.s3.region.amazonaws.com/key
    const url = new URL(s3Url);
    const key = url.pathname.substring(1); // Remove leading /

    // Generate signed URL with expiration
    const signedUrl = await getSignedUrl(s3Client, new GetObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
    }), { expiresIn });

    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    // Fallback to original URL if signing fails
    return s3Url;
  }
};
