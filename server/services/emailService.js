// server/services/emailService.js
import nodemailer from 'nodemailer';
import env from '../config/env.js';
import logger from '../utils/logger.js';

let transporter = null;

// Initialize transporter if SMTP configuration is present
const initTransporter = () => {
  const user = env.email.user;
  const pass = (env.email.pass || '').replace(/\s+/g, '');

  if (user && pass) {
    if (env.email.host?.includes('gmail') || user.includes('@gmail.com')) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass,
        },
      });
    } else if (env.email.host) {
      transporter = nodemailer.createTransport({
        host: env.email.host,
        port: env.email.port,
        secure: env.email.secure,
        auth: {
          user,
          pass,
        },
      });
    }
  } else {
    transporter = null;
  }
};

initTransporter();

/**
 * Send password reset email with secure token link
 * @param {string} toEmail - Recipient email
 * @param {string} userName - Recipient name
 * @param {string} resetToken - Raw unhashed token
 */
export const sendPasswordResetEmail = async (toEmail, userName, resetToken) => {
  const resetUrl = `${env.frontendUrl}/auth/reset-password?token=${resetToken}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Password PRAKTIS</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
        .brand { text-align: center; margin-bottom: 24px; }
        .brand h2 { color: #2563eb; margin: 0; letter-spacing: 1px; font-size: 26px; }
        .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 24px 0; }
        .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #64748b; }
        .warning { font-size: 13px; color: #64748b; border-left: 3px solid #f59e0b; padding-left: 12px; margin-top: 20px; }
        .link-text { word-break: break-all; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="brand">
          <h2>PRAKTIS</h2>
          <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">Platform Manajemen Praktikum</p>
        </div>
        <p>Halo, <strong>${userName}</strong>,</p>
        <p>Kami menerima permintaan untuk mereset kata sandi akun PRAKTIS Anda. Silakan klik tombol di bawah untuk membuat kata sandi baru:</p>
        <div style="text-align: center;">
          <a href="${resetUrl}" class="btn" target="_blank">Reset Password Saya</a>
        </div>
        <div class="warning">
          <strong>Perhatian:</strong> Tautan ini hanya berlaku selama <strong>15 menit</strong>. Jika Anda tidak merasa meminta reset kata sandi, abaikan email ini. Akun Anda tetap aman.
        </div>
        <p style="margin-top: 24px; font-size: 13px; color: #64748b;">
          Jika tombol di atas tidak dapat diklik, salin tautan berikut ke browser Anda:<br>
          <span class="link-text">${resetUrl}</span>
        </p>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Lab Teknik &bull; Sistem Informasi PRAKTIS
        </div>
      </div>
    </body>
    </html>
  `;

  // If SMTP is not configured or in development mode without SMTP, log URL for seamless local testing
  if (!transporter) {
    logger.warn('⚠️ SMTP Transporter is not configured. Emulating email delivery in development mode:');
    logger.info(`📧 [DEV EMAIL] To: ${toEmail} | Reset Link: ${resetUrl}`);
    return { success: true, simulated: true, resetUrl };
  }

  try {
    const info = await transporter.sendMail({
      from: env.email.from,
      to: toEmail,
      subject: 'Reset Password Akun PRAKTIS Anda',
      html: htmlContent,
    });

    logger.info(`📧 Password reset email dispatched to ${toEmail}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    const isBadCredentials = error.message?.includes('535') || error.message?.includes('BadCredentials');
    logger.error('❌ Failed to send password reset email:', {
      error: error.message,
      to: toEmail,
      hint: isBadCredentials
        ? 'Gmail SMTP memerlukan Google App Password (Sandi Aplikasi 16 karakter), bukan password akun Google biasa. Buat di https://myaccount.google.com/apppasswords'
        : undefined,
    });
    // Always print reset link to container logs as emergency backup
    logger.warn(`🔗 [RESET LINK BACKUP] Gunakan link berikut untuk reset password (${toEmail}):\n${resetUrl}`);
    throw error;
  }
};

export default {
  sendPasswordResetEmail,
};
