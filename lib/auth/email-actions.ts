'use server';

import { connectToDatabase } from '../db/mongodb';
import User from '../models/User';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';
import crypto from 'crypto';

// Informations système actuelles
const CURRENT_TIMESTAMP = "2025-05-07 13:20:57";
const CURRENT_USER = "Sdiabate1337";

// Types de réponses
type EmailActionResult = {
  success: boolean;
  message: string;
};

/**
 * Demander un email de vérification
 */
export async function requestVerificationEmail(email: string): Promise<EmailActionResult> {
  try {
    await connectToDatabase();
    
    // Rechercher l'utilisateur
    const user = await User.findOne({ email });
    
    if (!user) {
      // Ne pas révéler si l'email existe pour des raisons de sécurité
      return { 
        success: true, 
        message: 'Si cette adresse email existe dans notre système, un email de vérification sera envoyé.'
      };
    }
    
    // Si déjà vérifié
    if (user.isVerified) {
      return { 
        success: false, 
        message: 'Cette adresse email est déjà vérifiée.'
      };
    }
    
    // Générer un token de vérification
    const verificationToken = user.generateVerificationToken();
    await user.save();
    
    // Envoyer l'email
    const emailSent = await sendVerificationEmail(
      user.email,
      user.name,
      verificationToken
    );
    
    if (emailSent) {
      return { 
        success: true, 
        message: 'Un email de vérification a été envoyé.'
      };
    } else {
      return { 
        success: false, 
        message: 'Impossible d\'envoyer l\'email de vérification.'
      };
    }
  } catch (error) {
    console.error('Erreur lors de la demande de vérification:', error);
    return { 
      success: false, 
      message: 'Une erreur s\'est produite lors de la demande de vérification.'
    };
  }
}

/**
 * Vérifier l'adresse email avec un token
 */
export async function verifyEmail(token: string): Promise<EmailActionResult> {
  try {
    await connectToDatabase();
    
    // Hash le token pour la comparaison avec celui stocké en base de données
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Rechercher l'utilisateur avec ce token
    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationExpires: { $gt: new Date() }
    });
    
    if (!user) {
      return { 
        success: false, 
        message: 'Le lien de vérification est invalide ou a expiré.'
      };
    }
    
    // Marquer l'email comme vérifié
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();
    
    return { 
      success: true, 
      message: 'Votre adresse email a été vérifiée avec succès.'
    };
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'email:', error);
    return { 
      success: false, 
      message: 'Une erreur s\'est produite lors de la vérification de l\'email.'
    };
  }
}

/**
 * Demander une réinitialisation de mot de passe
 */
export async function requestPasswordReset(email: string): Promise<EmailActionResult> {
  try {
    await connectToDatabase();
    
    // Rechercher l'utilisateur
    const user = await User.findOne({ email });
    
    if (!user) {
      // Ne pas révéler si l'email existe pour des raisons de sécurité
      return { 
        success: true, 
        message: 'Si cette adresse email existe dans notre système, un email de réinitialisation sera envoyé.'
      };
    }
    
    // Générer un token de réinitialisation
    const resetToken = user.generatePasswordResetToken();
    await user.save();
    
    // Envoyer l'email
    const emailSent = await sendPasswordResetEmail(
      user.email,
      user.name,
      resetToken
    );
    
    if (emailSent) {
      return { 
        success: true, 
        message: 'Un email de réinitialisation de mot de passe a été envoyé.'
      };
    } else {
      return { 
        success: false, 
        message: 'Impossible d\'envoyer l\'email de réinitialisation.'
      };
    }
  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error);
    return { 
      success: false, 
      message: 'Une erreur s\'est produite lors de la demande de réinitialisation.'
    };
  }
}

/**
 * Réinitialiser le mot de passe avec un token
 */
export async function resetPassword(
  token: string, 
  newPassword: string
): Promise<EmailActionResult> {
  try {
    await connectToDatabase();
    
    // Valider le nouveau mot de passe
    if (!newPassword || newPassword.length < 8) {
      return { 
        success: false, 
        message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.'
      };
    }
    
    // Hash le token pour la comparaison avec celui stocké en base de données
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Rechercher l'utilisateur avec ce token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });
    
    if (!user) {
      return { 
        success: false, 
        message: 'Le lien de réinitialisation est invalide ou a expiré.'
      };
    }
    
    // Mettre à jour le mot de passe
    user.password = newPassword; // Sera hashé par le middleware mongoose
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    return { 
      success: true, 
      message: 'Votre mot de passe a été réinitialisé avec succès.'
    };
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    return { 
      success: false, 
      message: 'Une erreur s\'est produite lors de la réinitialisation du mot de passe.'
    };
  }
}