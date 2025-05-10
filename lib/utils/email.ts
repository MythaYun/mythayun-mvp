'use server';

import nodemailer from 'nodemailer';

// Configuration système actuelle
const CURRENT_TIMESTAMP = "2025-05-10 03:09:10";
const CURRENT_USER = "Sdiabate1337";

// Get host name, defaulting to "mailhog" for docker-compose environments
// but allowing override through environment variables
const emailHost = process.env.EMAIL_HOST || 'mailhog';
const emailPort = Number(process.env.EMAIL_PORT) || 1025;

console.log(`[${CURRENT_TIMESTAMP}] Email server configuration: ${emailHost}:${emailPort}`);

// Options du transporteur adaptées pour tous les environnements
const transportOptions = {
  host: emailHost,
  port: emailPort,
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || ''
  },
  secure: false,
  tls: {
    rejectUnauthorized: false
  }
};

// Créer un transporteur pour l'envoi d'emails
let transporter: any;

try {
  transporter = nodemailer.createTransport(transportOptions);
  console.log(`[${CURRENT_TIMESTAMP}] Email transport created successfully`);
} catch (error) {
  console.error(`[${CURRENT_TIMESTAMP}] Failed to create email transport:`, error);
  
  // Fallback transport that just logs emails instead of sending
  transporter = {
    sendMail: async (options: any) => {
      console.log('📧 EMAIL LOG (Transport Error):', options);
      return { messageId: 'log-only-no-transport' };
    }
  };
}

/**
 * Helper function to get the appropriate base URL
 */
function getBaseUrl(): string {
  if (process.env.CODESPACE_NAME) {
    return `https://${process.env.CODESPACE_NAME}-3000.app.github.dev`;
  }
  
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

/**
 * Helper function to get the appropriate MailHog URL
 */
function getMailhogUrl(): string {
  if (process.env.CODESPACE_NAME) {
    return `https://${process.env.CODESPACE_NAME}-8025.app.github.dev`;
  }
  
  return 'http://localhost:8025';
}

/**
 * Envoyer un email
 */
async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  text?: string;
}): Promise<boolean> {
  const { to, subject, html, text, from } = options;
  
  try {
    const fromAddress = from || process.env.EMAIL_FROM || 'dev@mythayun.com';
    
    console.log(`[${CURRENT_TIMESTAMP}] Attempting to send email to ${to} via ${emailHost}:${emailPort}`);
    
    const result = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>?/gm, '') // Version texte brut fallback
    });
    
    console.log(`[${CURRENT_TIMESTAMP}] Email sent to ${to}, ID: ${result.messageId}`);
    console.log(`[${CURRENT_TIMESTAMP}] View email at: ${getMailhogUrl()}`);
    
    return true;
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] Error sending email:`, error);
    return false;
  }
}

/**
 * Envoyer un email de vérification
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<boolean> {
  console.log(`[${CURRENT_TIMESTAMP}] Generating verification email for ${email}`);
  
  try {
    const baseUrl = getBaseUrl();
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;
    
    console.log(`[${CURRENT_TIMESTAMP}] Base URL: ${baseUrl}`);
    console.log(`[${CURRENT_TIMESTAMP}] Verification URL: ${verificationUrl}`);
    
    // Template HTML de base pour l'email de vérification
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4f46e5;">Bienvenue sur MythaYun!</h2>
        <p>Bonjour ${name},</p>
        <p>Merci de vous être inscrit sur MythaYun. Pour activer votre compte, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Vérifier mon email</a>
        </div>
        <p>Ou copiez et collez ce lien dans votre navigateur:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>Ce lien expirera dans 24 heures.</p>
        <p>Si vous n'avez pas créé de compte, veuillez ignorer cet email.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eaeaea;" />
        <p style="color: #6b7280; font-size: 14px;">L'équipe MythaYun<br>© 2025 MythaYun. Tous droits réservés.</p>
      </div>
    `;
    
    return await sendMail({
      to: email,
      subject: "Vérifiez votre email - MythaYun",
      html
    });
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] Error preparing verification email:`, error);
    return false;
  }
}

/**
 * Envoyer un email de réinitialisation de mot de passe
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
): Promise<boolean> {
  console.log(`[${CURRENT_TIMESTAMP}] Generating password reset email for ${email}`);
  
  try {
    const baseUrl = getBaseUrl();
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    
    // Template HTML de base pour l'email de réinitialisation
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4f46e5;">Réinitialisation de mot de passe</h2>
        <p>Bonjour ${name},</p>
        <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte MythaYun. Si vous n'avez pas fait cette demande, vous pouvez ignorer cet email.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Réinitialiser mon mot de passe</a>
        </div>
        <p>Ou copiez et collez ce lien dans votre navigateur:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>Ce lien expirera dans 1 heure.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eaeaea;" />
        <p style="color: #6b7280; font-size: 14px;">L'équipe MythaYun<br>© 2025 MythaYun. Tous droits réservés.</p>
      </div>
    `;
    
    return await sendMail({
      to: email,
      subject: "Réinitialisez votre mot de passe - MythaYun",
      html
    });
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] Error preparing reset email:`, error);
    return false;
  }
}

/**
 * Envoyer un email de bienvenue après vérification
 */
export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<boolean> {
  console.log(`[${CURRENT_TIMESTAMP}] Generating welcome email for ${email}`);
  
  try {
    const baseUrl = getBaseUrl();
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4f46e5;">Bienvenue sur MythaYun!</h2>
        <p>Bonjour ${name},</p>
        <p>Votre compte a été vérifié avec succès. Bienvenue dans la communauté MythaYun!</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${baseUrl}/dashboard" style="background-color: #4f46e5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Accéder à mon tableau de bord</a>
        </div>
        <p>Nous espérons que vous apprécierez votre expérience sur notre plateforme.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eaeaea;" />
        <p style="color: #6b7280; font-size: 14px;">L'équipe MythaYun<br>© 2025 MythaYun. Tous droits réservés.</p>
      </div>
    `;
    
    return await sendMail({
      to: email,
      subject: "Bienvenue sur MythaYun!",
      html
    });
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] Error preparing welcome email:`, error);
    return false;
  }
}