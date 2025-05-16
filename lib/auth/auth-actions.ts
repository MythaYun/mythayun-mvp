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
  requiresEmailVerification?: boolean;
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
    // Include all needed fields for onboarding
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
        requiresEmailVerification: true, // Add this flag for the frontend
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

    // Check if this is the first login (for onboarding purposes)
    const isFirstLogin = !user.lastLogin;
    console.log(`[${timestamp}] User login status - isFirstLogin: ${isFirstLogin}, previous lastLogin: ${user.lastLogin || 'none'}`);
    
    // Mettre à jour la date de dernière connexion
    const previousLogin = user.lastLogin;
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const accessToken = jwtUtils.generateAccessToken({
      userId: user._id!.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      tokenType: 'access'
    });

    const refreshToken = jwtUtils.generateRefreshTokenFromUser(user);

    // Set auth cookies
    await jwtUtils.setAuthCookies(accessToken, refreshToken);

    // Log onboarding status
    console.log(`[${timestamp}] Login successful, tokens generated`);
    console.log(`[${timestamp}] User onboarding status - isNewUser: ${user.isNewUser || false}, hasCompletedOnboarding: ${user.hasCompletedOnboarding || false}, isFirstLogin: ${isFirstLogin}`);

    // Return user data and tokens WITH ONBOARDING PROPERTIES
    return {
      success: true,
      message: 'Connexion réussie.',
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        // Include these important properties for onboarding
        isNewUser: user.isNewUser || isFirstLogin || false,
        hasCompletedOnboarding: user.hasCompletedOnboarding || false,
        isFirstLogin: isFirstLogin,
        lastLogin: user.lastLogin,
        previousLogin: previousLogin, // Include previous login time
        createdAt: user.createdAt,
        preferences: user.preferences || {
          favoriteLeagues: [],
          favoriteTeams: [],
          notificationPreferences: {
            matchReminders: true,
            scoreUpdates: true,
            newsAlerts: false
          },
          displayPreferences: {
            darkMode: true,
            compactView: false
          }
        }
      },
      accessToken,
      refreshToken
    };
  } catch (error) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] Error during login:`, error);
    return { 
      success: false, 
      message: 'Une erreur s\'est produite lors de la connexion',
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
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Processing registration for new user`);
    
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
      console.log(`[${timestamp}] Registration failed: Email already in use: ${email}`);
      return { success: false, message: 'Cet email est déjà utilisé' };
    }

    // Créer un nouvel utilisateur
    const now = new Date();
    const user = new User({
      name,
      email,
      password,
      role: 'user',
      isVerified: false, // Important: User is NOT verified initially
      isActive: true,
      favoriteTeams: [],
      // Explicitly set onboarding flags for clarity
      isNewUser: true,
      hasCompletedOnboarding: false,
      preferences: {
        favoriteLeagues: [],
        favoriteTeams: [],
        notificationPreferences: {
          matchReminders: true,
          scoreUpdates: true,
          newsAlerts: false
        },
        displayPreferences: {
          darkMode: true,
          compactView: false
        }
      },
      createdAt: now,
      updatedAt: now,
      loginAttempts: 0
    });

    // Générer le token de vérification
    const verificationToken = user.generateVerificationToken();

    await user.save();
    console.log(`[${timestamp}] Successfully registered new user: ${email}`);

    // Envoyer l'email de vérification
    const emailSent = await sendVerificationEmail(
      user.email,
      user.name,
      verificationToken
    );

    console.log(`[${timestamp}] Verification email sent: ${emailSent ? 'success' : 'failed'}`);

    // IMPORTANT: Return the user without setting authentication
    // The user should NOT be considered authenticated until they verify their email
    return {
      success: true,
      requiresEmailVerification: true,
      message: emailSent
        ? 'Inscription réussie. Veuillez vérifier votre boîte email.'
        : 'Inscription réussie. Email de vérification non envoyé.',
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: false, // Explicitly mark as not verified
      }
    };
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Erreur d'inscription:`, error);
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