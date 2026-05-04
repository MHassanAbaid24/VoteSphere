import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.GMAIL_USER,
    pass: env.GMAIL_APP_PASSWORD,
  },
});

/**
 * Sends a verification email.
 * Returns true if sent successfully, false on any failure.
 * Never throws — caller decides how to handle the failure.
 */
export const sendVerificationEmail = async (to: string, token: string): Promise<boolean> => {
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
    console.warn(`[Mailer] Email not sent (GMAIL_USER not configured). Verify URL: ${env.APP_URL}/verify-email?token=${token}`);
    return false;
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
    return true;
  } catch (err: any) {
    // Classify DNS / network errors for better logging
    if (err?.code === 'EDNS' || err?.code === 'ECONNREFUSED' || err?.code === 'ETIMEDOUT') {
      console.error(`[Mailer] Network error sending email to ${to}: ${err.message} (${err.code})`);
    } else {
      console.error('[Mailer] Error sending email:', err);
    }
    return false;
  }
};
