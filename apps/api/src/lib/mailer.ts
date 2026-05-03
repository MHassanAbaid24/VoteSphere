import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.GMAIL_USER,
    pass: env.GMAIL_APP_PASSWORD,
  },
});

export const sendVerificationEmail = async (to: string, token: string): Promise<void> => {
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
    // Graceful no-op in development when env vars are not configured
    console.warn(`[Mailer] Email not sent (GMAIL_USER not configured). Verify URL: ${env.APP_URL}/verify-email?token=${token}`);
    return;
  }

  const verifyUrl = `${env.APP_URL}/verify-email?token=${token}`;

  try {
    await transporter.sendMail({
      from: `"VoteSphere" <${env.GMAIL_USER}>`,
      to,
      subject: 'Verify your VoteSphere email',
      html: `
        <h2>Welcome to VoteSphere!</h2>
        <p>Please verify your email address by clicking the button below:</p>
        <div style="margin: 24px 0;">
          <a href="${verifyUrl}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
            Verify Email
          </a>
        </div>
        <p>Or paste this link in your browser:</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p>This link expires in 24 hours.</p>
      `,
    });
  } catch (err) {
    console.error('[Mailer] Error sending email:', err);
  }
};
