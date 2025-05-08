'use server';

import { redirect } from 'next/navigation';
import { connectToDatabase } from '../db/mongodb';
import User, { IUser } from '../models/User';
import { jwtUtils } from './jwt';
import { sessionUtils } from './session';
import mongoose from 'mongoose';

// Informations système actuelles
const CURRENT_TIMESTAMP = "2025-05-07 12:35:03";
const CURRENT_USER = "Sdiabate1337";

// Types de réponses pour les actions
type AuthResult = {
  success: boolean;
  message?: string;
  user?: Partial<IUser>;
};

/**
 * Action de connexion
 */
export async function loginAction(formData: FormData): Promise<AuthResult> {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    // Validation simple
    if (!email || !password) {
      return { success: false, message: 'Email et mot de passe requis' };
    }
    
    await connectToDatabase();
    
    // Rechercher l'utilisateur et inclure le mot de passe pour la vérification
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return { success: false, message: 'Identifiants invalides' };
    }
    
    // Vérifier si le compte est verrouillé
    if (user.isAccountLocked()) {
      return { success: false, message: 'Compte temporairement verrouillé. Veuillez réessayer plus tard' };
    }
    
    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      // Incrémenter les tentatives de connexion
      await user.incrementLoginAttempts();
      return { success: false, message: 'Identifiants invalides' };
    }
    
    // Réinitialiser les tentatives de connexion
    await user.resetLoginAttempts();
    
    // Mettre à jour la date de dernière connexion
    user.lastLogin = new Date(CURRENT_TIMESTAMP);
    await user.save();
    
    // Générer les tokens
    const accessToken = jwtUtils.generateAccessToken(user);
    const refreshToken = jwtUtils.generateRefreshToken(user);
    
    // Définir les cookies
    await jwtUtils.setAuthCookies(accessToken, refreshToken);
    
    // Retourner l'utilisateur (sans données sensibles)
    return {
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
        lastLogin: user.lastLogin
      }
    };
  } catch (error) {
    console.error('Erreur de connexion:', error);
    return { success: false, message: 'Une erreur s\'est produite lors de la connexion' };
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
    const user = new User({
      name,
      email,
      password,
      role: 'user',
      isVerified: false,
      isActive: true,
      favoriteTeams: [],
      createdAt: new Date(CURRENT_TIMESTAMP),
      updatedAt: new Date(CURRENT_TIMESTAMP),
      loginAttempts: 0
    });
    
    await user.save();
    
    // Générer les tokens
    const accessToken = jwtUtils.generateAccessToken(user);
    const refreshToken = jwtUtils.generateRefreshToken(user);
    
    // Définir les cookies
    await jwtUtils.setAuthCookies(accessToken, refreshToken);
    
    // Retourner l'utilisateur (sans données sensibles)
    return {
      success: true,
      message: 'Inscription réussie',
      user: {
        _id: user._id,
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
