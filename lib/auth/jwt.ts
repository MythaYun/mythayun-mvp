import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { IUser } from '../models/User';

// Informations système actuelles
const CURRENT_TIMESTAMP = "2025-05-07 12:49:05";
const CURRENT_USER = "Sdiabate1337";
import { JwtPayload, JWT_SECRET, JWT_ACCESS_EXPIRY_SECONDS, JWT_REFRESH_EXPIRY_SECONDS } from './jwt-types';

/**
 * Generate an access token for authentication
 */
export function generateAccessToken(payload: JwtPayload): string {
  const options: SignOptions = { 
    expiresIn: JWT_ACCESS_EXPIRY_SECONDS 
  };
  
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Generate a refresh token for maintaining session
 */
export function generateRefreshToken(user: IUser): string {
  // Create a payload that explicitly maps IUser properties to JwtPayload
  const payload: JwtPayload = {
    userId: user._id!.toString(), // Convert MongoDB ObjectId to string
    name: user.name,
    email: user.email,
    role: user.role,
    tokenType: 'refresh'
  };
  
  const options: SignOptions = { 
    expiresIn: JWT_REFRESH_EXPIRY_SECONDS 
  };
  
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Vérifier un token JWT
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    console.error('Erreur de vérification JWT:', error);
    return null;
  }
}

/**
 * Définir les cookies d'authentification
 */
/**
 * Définir les cookies d'authentification
 */
export async function setAuthCookies(accessToken: string, refreshToken: string): Promise<void> {
  const cookieStore = await cookies();
  
  // Detect GitHub Codespaces environment
  const isGitHubCodespaces = process.env.CODESPACES === 'true' || 
                            process.env.GITHUB_CODESPACES === 'true' || 
                            process.env.NEXT_PUBLIC_APP_URL?.includes('.app.github.dev');
                            
  // Setup cookie options based on environment
  const cookieOptions = {
    httpOnly: true,
    secure: true, // Always secure in Codespaces
    sameSite: isGitHubCodespaces ? 'none' as const : 'strict' as const,
    path: '/',
    // Domain is important for Codespaces - remove domain setting for local development
    ...(isGitHubCodespaces ? {} : {})
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
  
  console.log('Auth cookies set:', { isGitHubCodespaces, cookieOptions });
}

/**
 * Effacer les cookies d'authentification
 */
export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set({
    name: 'accessToken',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/'
  });
  
  cookieStore.set({
    name: 'refreshToken',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/'
  });
}

/**
 * Récupérer le token d'accès depuis les cookies
 */
export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('accessToken')?.value;
}

/**
 * Récupérer le token de rafraîchissement depuis les cookies
 */
export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('refreshToken')?.value;
}

/**
 * Utilitaires pour le middleware
 */
export const middlewareUtils = {
  // Récupérer le token d'accès depuis la requête
  getAccessTokenFromRequest(request: NextRequest): string | undefined {
    return request.cookies.get('accessToken')?.value;
  },
  
  // Récupérer le token de rafraîchissement depuis la requête
  getRefreshTokenFromRequest(request: NextRequest): string | undefined {
    return request.cookies.get('refreshToken')?.value;
  }
};




/**
 * Exporter tous les utilitaires JWT
 * CORRECTION: Assurer la cohérence des noms de fonctions
 */
export const jwtUtils = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  setAuthCookies,
  clearAuthCookies,
  getAccessToken,           // Corrigé: renommé de getAccessTokenFromCookies
  getRefreshToken,          // Corrigé: renommé de getRefreshTokenFromCookies
  middlewareUtils
};

export default jwtUtils;