'use strict';

import formData from 'form-data';
import Mailgun from 'mailgun.js';
import type { MailgunMessageData } from 'mailgun.js';

// Initialize Mailgun
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY || '',
});

const domain = process.env.MAILGUN_DOMAIN || '';
const from = process.env.EMAIL_FROM || 'noreply@yourdomain.com';

/**
 * Send an email using Mailgun
 */
async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html: string
): Promise<boolean> {
  try {
    const currentTime = new Date().toISOString();
    console.log(`[${currentTime}] Sending email to: ${to}`);
    
    const messageData: MailgunMessageData = {
      from,
      to,
      subject,
      text,
      html,
    };

    const response = await mg.messages.create(domain, messageData);
    console.log(`[${currentTime}] Email sent successfully. ID: ${response.id}`);
    
    return true;
  } catch (error) {
    console.error(`Error sending email: `, error);
    return false;
  }
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
  
  const subject = 'Verify Your Email Address';
  const text = `Hello ${name},\n\n` +
    `Please verify your email address by clicking the link below:\n\n` +
    `${verificationUrl}\n\n` +
    `This link will expire in 24 hours.\n\n` +
    `If you did not create an account, please ignore this email.\n\n` +
    `Thank you,\n` +
    `The Team`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Email Verification</h2>
      <p>Hello ${name},</p>
      <p>Please verify your email address by clicking the button below:</p>
      <p style="text-align: center;">
        <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Verify Email
        </a>
      </p>
      <p>Or copy and paste this link in your browser:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not create an account, please ignore this email.</p>
      <p>Thank you,<br>The Team</p>
    </div>
  `;
  
  return sendEmail(email, subject, text, html);
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  
  const subject = 'Reset Your Password';
  const text = `Hello ${name},\n\n` +
    `You requested a password reset. Please click the link below to create a new password:\n\n` +
    `${resetUrl}\n\n` +
    `This link will expire in 1 hour.\n\n` +
    `If you did not request a password reset, please ignore this email.\n\n` +
    `Thank you,\n` +
    `The Team`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset</h2>
      <p>Hello ${name},</p>
      <p>You requested a password reset. Please click the button below to create a new password:</p>
      <p style="text-align: center;">
        <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Reset Password
        </a>
      </p>
      <p>Or copy and paste this link in your browser:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request a password reset, please ignore this email.</p>
      <p>Thank you,<br>The Team</p>
    </div>
  `;
  
  return sendEmail(email, subject, text, html);
}