'use server';

import { redirect } from 'next/navigation';
import { connectToDatabase } from '../db/mongodb';
import User, { IUser } from '../models/User';
import { jwtUtils } from './jwt';
import { sessionUtils } from './session';
import mongoose from 'mongoose';
import { sendVerificationEmail } from '../utils/email';

// Informations système actuelles
const CURRENT_TIMESTAMP = "2025-05-07 12:35:03";
const CURRENT_USER = "Sdiabate1337";

// Types de réponses pour les actions
type AuthResult = {
  accessToken?: string;  // Make these optional with ?
  refreshToken?: string;
  success: boolean;
  message?: string;
  user?: Partial<IUser>;
  needsVerification?: boolean;
  token?: string; 
};

/**
 * Action de connexion
 */
export async function loginAction(formData: FormData): Promise<AuthResult> {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    // Current timestamp for logging
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Processing login for: ${email}`);

    // Validation simple
    if (!email || !password) {
      return { 
        success: false, 
        message: 'Email et mot de passe requis' 
      };
    }

    await connectToDatabase();

    // Rechercher l'utilisateur et inclure le mot de passe pour la vérification
    const user = await User.findOne({ email }).select('+password');
    
    // Si l'utilisateur n'existe pas
    if (!user) {
      // Délai pour limiter le brute-force
      await new Promise((r) => setTimeout(r, 1000));
      return { 
        success: false, 
        message: 'Email ou mot de passe incorrect'  // Message générique pour ne pas indiquer l'existence du compte
      };
    }

    // Vérifier si le compte est vérifié
    if (!user.isVerified) {
      return { 
        success: false, 
        message: 'Veuillez vérifier votre adresse email avant de vous connecter' 
      };
    }

    // Vérifier si le compte est verrouillé
    if (user.isAccountLocked && user.isAccountLocked()) {
      return { 
        success: false, 
        message: 'Compte temporairement verrouillé suite à plusieurs tentatives de connexion échouées. Veuillez réessayer plus tard ou réinitialiser votre mot de passe.' 
      };
    }

    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Incrémenter les tentatives de connexion
      if (user.incrementLoginAttempts) {
        await user.incrementLoginAttempts();
      }
      
      // Obtenir le nombre de tentatives restantes
      const attemptsRemaining = user.attemptsRemaining ? user.attemptsRemaining() : null;
      const attemptsMessage = attemptsRemaining !== null ? 
        ` (${attemptsRemaining} tentative${attemptsRemaining > 1 ? 's' : ''} restante${attemptsRemaining > 1 ? 's' : ''})` : '';
      
      // Délai pour limiter le brute-force
      await new Promise((r) => setTimeout(r, 1000));
      
      return { 
        success: false, 
        message: `Email ou mot de passe incorrect${attemptsMessage}` 
      };
    }

    // Réinitialiser les tentatives de connexion
    if (user.resetLoginAttempts) {
      await user.resetLoginAttempts();
    }

    // Mettre à jour la date de dernière connexion
    user.lastLogin = new Date();
    await user.save();

     const accessToken = jwtUtils.generateAccessToken({
      userId: user._id!.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      tokenType: 'access'
    });

    const refreshToken = jwtUtils.generateRefreshToken(user);

    // Set auth cookies (this is important!)
    await jwtUtils.setAuthCookies(accessToken, refreshToken);

    console.log(`[${new Date().toISOString()}] Login successful, tokens generated`);

    // Return user data and tokens
return {
      success: true,
      message: 'Connexion réussie.',
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      },
      accessToken,
      refreshToken
    };
  } catch (error) {
    console.error('Erreur d\'inscription:', error);
    return { 
      success: false, 
      message: 'Une erreur s\'est produite lors de l\'inscription',
      accessToken: undefined,
      refreshToken: undefined
    };
  }
}

/**
 * Action d'inscription
 */
export async function registerAction(formData: FormData): Promise<AuthResult> {
  try {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Validation simple
    if (!name || !email || !password) {
      return { success: false, message: 'Tous les champs sont obligatoires' };
    }

    await connectToDatabase();

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { success: false, message: 'Cet email est déjà utilisé' };
    }

    // Créer un nouvel utilisateur
    const now = new Date();
    const user = new User({
      name,
      email,
      password,
      role: 'user',
      isVerified: false,
      isActive: true,
      favoriteTeams: [],
      createdAt: now,
      updatedAt: now,
      loginAttempts: 0
    });

    // Générer le token de vérification
    const verificationToken = user.generateVerificationToken();

    await user.save();

    // Envoyer l'email de vérification
    const emailSent = await sendVerificationEmail(
      user.email,
      user.name,
      verificationToken
    );

  

    // Retourner l'utilisateur (sans données sensibles)
    return {
      success: true,
      message: emailSent
        ? 'Inscription réussie. Veuillez vérifier votre boîte email.'
        : 'Inscription réussie. Email de vérification non envoyé.',
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    };
  } catch (error) {
    console.error('Erreur d\'inscription:', error);
    return { success: false, message: 'Une erreur s\'est produite lors de l\'inscription' };
  }
}

/**
 * Action de déconnexion
 */
export async function logoutAction(): Promise<AuthResult> {
  try {
    const user = await sessionUtils.getCurrentUser();
    if (!user) {
      return { success: false, message: 'Aucun utilisateur connecté.' };
    }
    await jwtUtils.clearAuthCookies();
    return { success: true, message: 'Déconnexion réussie' };
  } catch (error) {
    console.error('Erreur de déconnexion:', error);
    return { success: false, message: 'Erreur lors de la déconnexion' };
  }
}

/**
 * Protéger une route (pour les composants serveur)
 */
export async function requireAuth(requiredRole?: string): Promise<IUser> {
  try {
    const user = await sessionUtils.getCurrentUser();
    
    if (!user) {
      redirect('/login?message=Veuillez vous connecter pour continuer');
    }
    
    // Si un rôle spécifique est requis, le vérifier
    if (requiredRole && user.role !== requiredRole) {
      redirect('/dashboard?message=Vous n\'avez pas les autorisations nécessaires');
    }
    
    return user;
  } catch (error) {
    console.error('Erreur de vérification d\'authentification:', error);
    redirect('/login?message=Erreur d\'authentification');
  }
}