import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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
