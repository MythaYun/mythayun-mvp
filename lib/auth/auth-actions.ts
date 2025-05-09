'use server';

import { redirect } from 'next/navigation';
import { connectToDatabase } from '../db/mongodb';
import User, { IUser } from '../models/User';
import { jwtUtils } from './jwt';
import { sessionUtils } from './session';
import mongoose from 'mongoose';

// Current system information
const CURRENT_TIMESTAMP = "2025-05-09 16:45:45"; // Updated to current timestamp
const CURRENT_USER = "Sdiabate1337";

// Types for action responses
type AuthResult = {
  success: boolean;
  message?: string;
  user?: Partial<IUser> & { _id: string }; // Ensure _id is always a string
};

/**
 * Login action
 */
export async function loginAction(formData: FormData): Promise<AuthResult> {
  console.log('Starting login process...');
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    // Simple validation
    if (!email || !password) {
      return { success: false, message: 'Email et mot de passe requis' };
    }
    
    await connectToDatabase();
    console.log('Connected to database successfully');
    
    // Find user and include password for verification
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return { success: false, message: 'Identifiants invalides' };
    }
    
    // Check if account is locked
    if (user.isAccountLocked()) {
      return { success: false, message: 'Compte temporairement verrouillé. Veuillez réessayer plus tard' };
    }
    
    // Verify password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      // Increment login attempts
      await user.incrementLoginAttempts();
      return { success: false, message: 'Identifiants invalides' };
    }
    
    // Reset login attempts
    await user.resetLoginAttempts();
    
    // Update last login date
    user.lastLogin = new Date(CURRENT_TIMESTAMP);
    await user.save();
    
    // Generate tokens
    const accessToken = jwtUtils.generateAccessToken(user);
    const refreshToken = jwtUtils.generateRefreshToken(user);
    
    // Set cookies
    await jwtUtils.setAuthCookies(accessToken, refreshToken);
    
    console.log('Login successful for user:', user.email);
    
    // Return the user (without sensitive data)
    // FIX: Convert ObjectId to string
    return {
      success: true,
      user: {
        _id: user._id.toString(), // Convert to string to avoid serialization issues
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
        lastLogin: user.lastLogin
      }
    };
  } catch (error) {
    console.error('Login error details:', error);
    return { success: false, message: 'Une erreur s\'est produite lors de la connexion' };
  }
}

/**
 * Registration action
 */
export async function registerAction(formData: FormData): Promise<AuthResult> {
  console.log('Starting registration process...');
  try {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    console.log('Register data:', { name, email, passwordLength: password?.length });
    
    // Simple validation
    if (!name || !email || !password) {
      return { success: false, message: 'Tous les champs sont obligatoires' };
    }
    
    await connectToDatabase();
    console.log('Connected to database successfully');
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return { success: false, message: 'Cet email est déjà utilisé' };
    }
    
    // Create a new user
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
    console.log('New user saved:', email);
    
    // Generate tokens
    const accessToken = jwtUtils.generateAccessToken(user);
    const refreshToken = jwtUtils.generateRefreshToken(user);
    
    // Set cookies
    await jwtUtils.setAuthCookies(accessToken, refreshToken);
    
    console.log('Registration successful for user:', email);
    
    // Return the user (without sensitive data)
    // FIX: Convert ObjectId to string
    return {
      success: true,
      message: 'Inscription réussie',
      user: {
        _id: user._id.toString(), // Convert to string to avoid serialization issues
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    };
  } catch (error) {
    console.error('Registration error details:', {
  
    });
    return { success: false, message: 'Une erreur s\'est produite lors de l\'inscription' };
  }
}

/**
 * Logout action
 */
export async function logoutAction(): Promise<AuthResult> {
  try {
    await jwtUtils.clearAuthCookies();
    return { success: true, message: 'Déconnexion réussie' };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, message: 'Erreur lors de la déconnexion' };
  }
}

/**
 * Protect a route (for server components)
 */
export async function requireAuth(requiredRole?: string): Promise<IUser> {
  try {
    const user = await sessionUtils.getCurrentUser();
    
    if (!user) {
      redirect('/login?message=Veuillez vous connecter pour continuer');
    }
    
    // If a specific role is required, verify it
    if (requiredRole && user.role !== requiredRole) {
      redirect('/dashboard?message=Vous n\'avez pas les autorisations nécessaires');
    }
    
    // No need to convert to string here as it's not being sent to client components
    return user;
  } catch (error) {
    console.error('Authentication verification error:', error);
    redirect('/login?message=Erreur d\'authentification');
  }
}