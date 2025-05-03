import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Create a nodemailer transport for sending emails
 */
const createTransport = () => {
  // For production
  if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
      secure: process.env.EMAIL_SERVER_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });
  }
  
  // For development/testing - use Ethereal (fake SMTP service)
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: 'ethereal.user@ethereal.email', // Replace with actual Ethereal credentials
      pass: 'ethereal.password',
    },
  });
};

/**
 * Send an email
 * @param options Email options (to, subject, html)
 */
const sendEmail = async (options: EmailOptions) => {
  const transporter = createTransport();
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@mythayun.com',
    ...options,
  };
  
  // Send email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    
    // For development, log Ethereal URL
    if (!process.env.EMAIL_SERVER && info.messageId) {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};

/**
 * Send a verification email
 * @param email Recipient email
 * @param name Recipient name
 * @param token Verification token
 */
export const sendVerificationEmail = async (email: string, name: string, token: string) => {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${token}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Verify Your Email Address</h2>
      <p>Hello ${name},</p>
      <p>Thank you for registering with MythaYun! Please verify your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
      </div>
      <p>If you didn't create this account, you can safely ignore this email.</p>
      <p>This verification link will expire in 24 hours.</p>
      <p>Best regards,<br>The MythaYun Team</p>
      <hr>
      <p style="color: #666; font-size: 12px;">If the button doesn't work, copy and paste this link into your browser: ${verificationUrl}</p>
      <p style="color: #666; font-size: 12px;">Current Date: 2025-05-02 14:26:17</p>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject: 'Verify Your MythaYun Account',
    html,
  });
};

/**
 * Send a password reset email
 * @param email Recipient email
 * @param name Recipient name
 * @param token Reset token
 */
export const sendPasswordResetEmail = async (email: string, name: string, token: string) => {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Reset Your Password</h2>
      <p>Hello ${name},</p>
      <p>We received a request to reset your password for your MythaYun account. Click the button below to reset it:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
      </div>
      <p>If you didn't request a password reset, you can safely ignore this email.</p>
      <p>This password reset link will expire in 1 hour.</p>
      <p>Best regards,<br>The MythaYun Team</p>
      <hr>
      <p style="color: #666; font-size: 12px;">If the button doesn't work, copy and paste this link into your browser: ${resetUrl}</p>
      <p style="color: #666; font-size: 12px;">Current Date: 2025-05-02 14:26:17</p>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject: 'Reset Your MythaYun Password',
    html,
  });
};