import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { IUser, UserDocument } from '../models/User';

// Informations système actuelles
const CURRENT_TIMESTAMP = "2025-07-04 15:08:37";
const CURRENT_USER = "Sdiabate1337";

import { JwtPayload, JWT_SECRET, JWT_ACCESS_EXPIRY_SECONDS, JWT_REFRESH_EXPIRY_SECONDS } from './jwt-types';

/**
 * Generate an access token for authentication
 */
export function generateAccessToken(payload: JwtPayload): string {
  const options: SignOptions = { 
    expiresIn: JWT_ACCESS_EXPIRY_SECONDS 
  };
  
  console.log(`[${CURRENT_TIMESTAMP}] Generating access token for user: ${payload.userId}`);
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Generate a refresh token for maintaining session
 * Updated to accept a JwtPayload instead of IUser
 */
export function generateRefreshToken(payload: JwtPayload): string {
  const options: SignOptions = { 
    expiresIn: JWT_REFRESH_EXPIRY_SECONDS 
  };
  
  console.log(`[${CURRENT_TIMESTAMP}] Generating refresh token for user: ${payload.userId}`);
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Helper function to safely extract user data from IUser or UserDocument
 */
function extractUserData(user: IUser | UserDocument): JwtPayload {
  // Check if it's a Mongoose document with toObject method
  if (typeof (user as any).toObject === 'function') {
    const userObj = (user as UserDocument).toObject();
    return {
      userId: userObj._id?.toString() || '',
      name: userObj.name,
      email: userObj.email,
      role: userObj.role,
      tokenType: 'refresh'
    };
  }
  
  // Handle plain IUser object
  return {
    userId: typeof user._id === 'string' ? user._id : user._id?.toString() || '',
    name: user.name,
    email: user.email,
    role: user.role,
    tokenType: 'refresh'
  };
}

/**
 * Generate a refresh token from user object
 */
export function generateRefreshTokenFromUser(user: IUser | UserDocument): string {
  try {
    console.log(`[${CURRENT_TIMESTAMP}] Generating refresh token from user object for: ${user.email}`);
    
    const payload = extractUserData(user);
    
    if (!payload.userId) {
      throw new Error('User ID is required for token generation');
    }
    
    return generateRefreshToken(payload);
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] Error generating refresh token from user:`, error);
    throw new Error('Failed to generate refresh token from user');
  }
}

/**
 * Vérifier un token JWT
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    console.log(`[${CURRENT_TIMESTAMP}] Verifying JWT token`);
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] JWT verification error:`, error);
    return null;
  }
}

/**
 * Définir les cookies d'authentification
 */
export async function setAuthCookies(accessToken: string, refreshToken: string): Promise<void> {
  try {
    console.log(`[${CURRENT_TIMESTAMP}] Setting auth cookies`);
    
    const cookieStore = await cookies();
    
    // Detect GitHub Codespaces environment
    const isGitHubCodespaces = process.env.CODESPACES === 'true' || 
                              process.env.GITHUB_CODESPACES === 'true' || 
                              process.env.NEXT_PUBLIC_APP_URL?.includes('.app.github.dev');
                              
    // Setup cookie options based on environment
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || isGitHubCodespaces,
      sameSite: isGitHubCodespaces ? 'none' as const : 'strict' as const,
      path: '/',
    };
    
    // Cookie du token d'accès
    cookieStore.set({
      name: 'accessToken',
      value: accessToken,
      ...cookieOptions,
      maxAge: JWT_ACCESS_EXPIRY_SECONDS,
    });
    
    // Cookie du token de rafraîchissement
    cookieStore.set({
      name: 'refreshToken',
      value: refreshToken,
      ...cookieOptions,
      maxAge: JWT_REFRESH_EXPIRY_SECONDS,
    });
    
    console.log(`[${CURRENT_TIMESTAMP}] Auth cookies set successfully`, { 
      isGitHubCodespaces, 
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite
    });
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] Error setting auth cookies:`, error);
    throw error;
  }
}

/**
 * Effacer les cookies d'authentification
 */
export async function clearAuthCookies(): Promise<void> {
  try {
    console.log(`[${CURRENT_TIMESTAMP}] Clearing auth cookies`);
    
    const cookieStore = await cookies();
    
    // Detect GitHub Codespaces environment
    const isGitHubCodespaces = process.env.CODESPACES === 'true' || 
                              process.env.GITHUB_CODESPACES === 'true' || 
                              process.env.NEXT_PUBLIC_APP_URL?.includes('.app.github.dev');
    
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || isGitHubCodespaces,
      sameSite: isGitHubCodespaces ? 'none' as const : 'strict' as const,
      path: '/',
      maxAge: 0,
    };
    
    cookieStore.set({
      name: 'accessToken',
      value: '',
      ...cookieOptions,
    });
    
    cookieStore.set({
      name: 'refreshToken',
      value: '',
      ...cookieOptions,
    });
    
    console.log(`[${CURRENT_TIMESTAMP}] Auth cookies cleared successfully`);
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] Error clearing auth cookies:`, error);
    throw error;
  }
}

/**
 * Récupérer le token d'accès depuis les cookies
 */
export async function getAccessToken(): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    
    if (token) {
      console.log(`[${CURRENT_TIMESTAMP}] Access token retrieved from cookies`);
    }
    
    return token;
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] Error getting access token:`, error);
    return undefined;
  }
}

/**
 * Récupérer le token de rafraîchissement depuis les cookies
 */
export async function getRefreshToken(): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('refreshToken')?.value;
    
    if (token) {
      console.log(`[${CURRENT_TIMESTAMP}] Refresh token retrieved from cookies`);
    }
    
    return token;
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] Error getting refresh token:`, error);
    return undefined;
  }
}

/**
 * Utilitaires pour le middleware
 */
export const middlewareUtils = {
  // Récupérer le token d'accès depuis la requête
  getAccessTokenFromRequest(request: NextRequest): string | undefined {
    const token = request.cookies.get('accessToken')?.value;
    if (token) {
      console.log(`[${CURRENT_TIMESTAMP}] Access token retrieved from request`);
    }
    return token;
  },
  
  // Récupérer le token de rafraîchissement depuis la requête
  getRefreshTokenFromRequest(request: NextRequest): string | undefined {
    const token = request.cookies.get('refreshToken')?.value;
    if (token) {
      console.log(`[${CURRENT_TIMESTAMP}] Refresh token retrieved from request`);
    }
    return token;
  },
  
  // Vérifier si une requête est authentifiée
  isAuthenticated(request: NextRequest): boolean {
    const accessToken = this.getAccessTokenFromRequest(request);
    if (!accessToken) {
      return false;
    }
    
    const payload = verifyToken(accessToken);
    return payload !== null;
  }
};

/**
 * Exporter tous les utilitaires JWT
 */
export const jwtUtils = {
  generateAccessToken,
  generateRefreshToken,
  generateRefreshTokenFromUser,
  verifyToken,
  setAuthCookies,
  clearAuthCookies,
  getAccessToken,
  getRefreshToken,
  middlewareUtils,
  extractUserData, // Export helper function
};

export default jwtUtils;

// Re-export types for convenience
export type { JwtPayload } from './jwt-types';