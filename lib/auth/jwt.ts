import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { IUser } from '../models/User';

// Informations système actuelles
const CURRENT_TIMESTAMP = "2025-05-07 12:49:05";
const CURRENT_USER = "Sdiabate1337";

// Type du payload JWT
export interface JwtPayload {
  userId: string;
  name: string;
  email: string;
  role: string;
  tokenType?: string;
  iat?: number;
  exp?: number;
}

// Configuration JWT
const JWT_SECRET = process.env.JWT_SECRET || 'mythayun-jwt-secret-key';
// Définir l'expiration en secondes au lieu de chaînes
const JWT_EXPIRY_SECONDS = 15 * 60; // 15 minutes
const JWT_REFRESH_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 jours

/**
 * Générer un token d'accès
 */
export function generateAccessToken(user: IUser): string {
  const payload: JwtPayload = {
    userId: user._id!.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    tokenType: 'access'
  };
  
  // Utiliser des valeurs numériques pour expiresIn (en secondes)
  const options: SignOptions = { 
    expiresIn: JWT_EXPIRY_SECONDS 
  };
  
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Générer un token de rafraîchissement
 */
export function generateRefreshToken(user: IUser): string {
  const payload: JwtPayload = {
    userId: user._id!.toString(),
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
export async function setAuthCookies(accessToken: string, refreshToken: string): Promise<void> {
  const cookieStore = await cookies();
  
  // Cookie du token d'accès
  cookieStore.set({
    name: 'accessToken',
    value: accessToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: JWT_EXPIRY_SECONDS,
    path: '/'
  });
  
  // Cookie du token de rafraîchissement
  cookieStore.set({
    name: 'refreshToken',
    value: refreshToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: JWT_REFRESH_EXPIRY_SECONDS,
    path: '/'
  });
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