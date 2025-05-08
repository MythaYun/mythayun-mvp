// Utilitaire pour envoyer des emails - utilise un service d'email comme SendGrid, Nodemailer, etc.
import nodemailer from 'nodemailer';

// Configuration de l'environnement
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.example.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');
const EMAIL_USER = process.env.EMAIL_USER || 'user@example.com';
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || 'password';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@mythayun.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Création du transporteur d'email
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});

/**
 * Envoyer un email de vérification
 */
export async function sendVerificationEmail(
  email: string, 
  name: string, 
  token: string
): Promise<boolean> {
  const verificationLink = `${APP_URL}/verify-email?token=${token}`;
  
  try {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: email,
      subject: 'Vérification de votre adresse email - MythaYun',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Vérification de votre adresse email</h2>
          <p>Bonjour ${name},</p>
          <p>Merci de vous être inscrit sur MythaYun. Pour activer votre compte, veuillez cliquer sur le lien ci-dessous pour vérifier votre adresse email :</p>
          <p style="margin: 20px 0;">
            <a 
              href="${verificationLink}" 
              style="background-color: #4f46e5; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;"
            >
              Vérifier mon adresse email
            </a>
          </p>
          <p>Ou copiez-collez ce lien dans votre navigateur :</p>
          <p>${verificationLink}</p>
          <p>Ce lien expirera dans 24 heures.</p>
          <p>Si vous n'avez pas demandé cette vérification, vous pouvez ignorer cet email.</p>
          <p>Cordialement,<br>L'équipe MythaYun</p>
        </div>
      `,
      text: `
        Vérification de votre adresse email
        
        Bonjour ${name},
        
        Merci de vous être inscrit sur MythaYun. Pour activer votre compte, veuillez cliquer sur le lien ci-dessous pour vérifier votre adresse email :
        
        ${verificationLink}
        
        Ce lien expirera dans 24 heures.
        
        Si vous n'avez pas demandé cette vérification, vous pouvez ignorer cet email.
        
        Cordialement,
        L'équipe MythaYun
      `,
    });
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de vérification:', error);
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
  const resetLink = `${APP_URL}/reset-password?token=${token}`;
  
  try {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: email,
      subject: 'Réinitialisation de votre mot de passe - MythaYun',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Réinitialisation de votre mot de passe</h2>
          <p>Bonjour ${name},</p>
          <p>Vous avez demandé une réinitialisation de votre mot de passe. Veuillez cliquer sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
          <p style="margin: 20px 0;">
            <a 
              href="${resetLink}" 
              style="background-color: #4f46e5; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;"
            >
              Réinitialiser mon mot de passe
            </a>
          </p>
          <p>Ou copiez-collez ce lien dans votre navigateur :</p>
          <p>${resetLink}</p>
          <p>Ce lien expirera dans 1 heure.</p>
          <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
          <p>Cordialement,<br>L'équipe MythaYun</p>
        </div>
      `,
      text: `
        Réinitialisation de votre mot de passe
        
        Bonjour ${name},
        
        Vous avez demandé une réinitialisation de votre mot de passe. Veuillez cliquer sur le lien ci-dessous pour créer un nouveau mot de passe :
        
        ${resetLink}
        
        Ce lien expirera dans 1 heure.
        
        Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.
        
        Cordialement,
        L'équipe MythaYun
      `,
    });
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de réinitialisation:', error);
    return false;
  }
}

export default {
  sendVerificationEmail,
  sendPasswordResetEmail
};