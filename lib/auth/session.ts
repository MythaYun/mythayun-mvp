import { jwtUtils } from './jwt';
import { connectToDatabase } from '../db/mongodb';
import { User, UserDocument, IUser } from '../models/User';
import { cookies } from 'next/headers';
import mongoose from 'mongoose';
import { JWT_ACCESS_EXPIRY_SECONDS, JwtPayload } from './jwt-types';

// Informations système actuelles
const CURRENT_TIMESTAMP = "2025-07-04 15:10:22";
const CURRENT_USER = "Sdiabate1337";

/**
 * Récupérer l'utilisateur actuel à partir du token JWT
 */
async function getCurrentUser(): Promise<IUser | null> {
  try {
    console.log(`[${CURRENT_TIMESTAMP}] [Session] Getting current user...`);
    
    // Try access token first
    const accessToken = await jwtUtils.getAccessToken();
    
    if (accessToken) {
      console.log(`[${CURRENT_TIMESTAMP}] [Session] Access token found, verifying...`);
      const payload = jwtUtils.verifyToken(accessToken);
      
      if (payload && payload.userId) {
        console.log(`[${CURRENT_TIMESTAMP}] [Session] Valid access token, fetching user...`);
        await connectToDatabase();
        const user = await User.findById(payload.userId).select('-password') as unknown as UserDocument | null;
        
        if (user) {
          console.log(`[${CURRENT_TIMESTAMP}] [Session] User found via access token: ${user.email}`);
          return user;
        }
      }
    }
    
    // If access token is invalid or missing, try refresh token
    const refreshToken = await jwtUtils.getRefreshToken();
    
    if (refreshToken) {
      console.log(`[${CURRENT_TIMESTAMP}] [Session] Trying refresh token...`);
      const payload = jwtUtils.verifyToken(refreshToken);
      
      if (payload && payload.userId && payload.tokenType === 'refresh') {
        console.log(`[${CURRENT_TIMESTAMP}] [Session] Valid refresh token, refreshing access token...`);
        
        // Get user to generate new tokens
        await connectToDatabase();
        const user = await User.findById(payload.userId).select('-password') as unknown as UserDocument | null;
        
        if (user) {
          // Generate new access token with correct JwtPayload structure
          const newPayload: JwtPayload = {
            userId: user._id!.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            tokenType: 'access'
          };
          
          const newAccessToken = jwtUtils.generateAccessToken(newPayload);
          
          // Set the new access token cookie using jwtUtils
          const cookieStore = await cookies();
          
          // Detect GitHub Codespaces environment
          const isGitHubCodespaces = process.env.CODESPACES === 'true' || 
                                    process.env.GITHUB_CODESPACES === 'true' || 
                                    process.env.NEXT_PUBLIC_APP_URL?.includes('.app.github.dev');
          
          cookieStore.set({
            name: 'accessToken',
            value: newAccessToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' || isGitHubCodespaces,
            maxAge: JWT_ACCESS_EXPIRY_SECONDS,
            path: '/',
            sameSite: isGitHubCodespaces ? 'none' : 'lax'
          });
          
          console.log(`[${CURRENT_TIMESTAMP}] [Session] Access token refreshed for user: ${user.email}`);
          return user;
        }
      }
    }
    
    console.log(`[${CURRENT_TIMESTAMP}] [Session] No valid tokens found`);
    return null;
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] [Session] Error getting current user:`, error);
    return null;
  }
}

/**
 * Récupérer l'utilisateur à partir du payload JWT
 */
async function getUserFromPayload(payload: JwtPayload): Promise<IUser | null> {
  try {
    console.log(`[${CURRENT_TIMESTAMP}] [Session] Getting user from payload for ID: ${payload.userId}`);
    
    await connectToDatabase();
    
    // Rechercher l'utilisateur dans la base de données
    const user = await User.findById(new mongoose.Types.ObjectId(payload.userId)).select('-password') as unknown as UserDocument | null;
    
    if (!user) {
      console.log(`[${CURRENT_TIMESTAMP}] [Session] User not found for ID: ${payload.userId}`);
      return null;
    }
    
    console.log(`[${CURRENT_TIMESTAMP}] [Session] User found from payload: ${user.email}`);
    return user;
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] [Session] Error getting user from payload:`, error);
    return null;
  }
}

/**
 * Rafraîchir la session utilisateur
 */
export async function refreshSession(): Promise<{ success: boolean; message?: string }> {
  try {
    console.log(`[${CURRENT_TIMESTAMP}] [Session] Refreshing session...`);
    
    // Récupérer le token de rafraîchissement
    const refreshToken = await jwtUtils.getRefreshToken();
    
    if (!refreshToken) {
      console.log(`[${CURRENT_TIMESTAMP}] [Session] No refresh token available`);
      return { success: false, message: 'Aucun token de rafraîchissement disponible' };
    }
    
    // Vérifier le token de rafraîchissement
    const payload = jwtUtils.verifyToken(refreshToken);
    
    if (!payload || payload.tokenType !== 'refresh') {
      console.log(`[${CURRENT_TIMESTAMP}] [Session] Invalid refresh token`);
      return { success: false, message: 'Token de rafraîchissement invalide' };
    }
    
    // Récupérer l'utilisateur
    await connectToDatabase();
    const user = await User.findById(new mongoose.Types.ObjectId(payload.userId)).select('-password') as unknown as UserDocument | null;
    
    if (!user) {
      console.log(`[${CURRENT_TIMESTAMP}] [Session] User not found for refresh: ${payload.userId}`);
      return { success: false, message: 'Utilisateur non trouvé' };
    }
    
    // Générer un nouveau token d'accès avec le bon format JwtPayload
    const newAccessPayload: JwtPayload = {
      userId: user._id!.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      tokenType: 'access'
    };
    
    const newAccessToken = jwtUtils.generateAccessToken(newAccessPayload);
    
    // Définir le nouveau token d'accès dans les cookies
    await jwtUtils.setAuthCookies(newAccessToken, refreshToken);
    
    console.log(`[${CURRENT_TIMESTAMP}] [Session] Session refreshed successfully for user: ${user.email}`);
    return { success: true };
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] [Session] Error refreshing session:`, error);
    return { success: false, message: 'Erreur lors du rafraîchissement de la session' };
  }
}

/**
 * Vérifier si l'utilisateur actuel est authentifié
 */
async function isAuthenticated(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return user !== null;
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] [Session] Error checking authentication:`, error);
    return false;
  }
}

/**
 * Obtenir le rôle de l'utilisateur actuel
 */
async function getCurrentUserRole(): Promise<string | null> {
  try {
    const user = await getCurrentUser();
    return user?.role || null;
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] [Session] Error getting user role:`, error);
    return null;
  }
}

/**
 * Vérifier si l'utilisateur actuel a un rôle spécifique
 */
async function hasRole(requiredRole: string): Promise<boolean> {
  try {
    const userRole = await getCurrentUserRole();
    return userRole === requiredRole;
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] [Session] Error checking role:`, error);
    return false;
  }
}

/**
 * Invalider la session actuelle
 */
async function invalidateSession(): Promise<{ success: boolean; message?: string }> {
  try {
    console.log(`[${CURRENT_TIMESTAMP}] [Session] Invalidating session...`);
    
    await jwtUtils.clearAuthCookies();
    
    console.log(`[${CURRENT_TIMESTAMP}] [Session] Session invalidated successfully`);
    return { success: true };
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] [Session] Error invalidating session:`, error);
    return { success: false, message: 'Erreur lors de l\'invalidation de la session' };
  }
}

/**
 * Obtenir les informations de session actuelles
 */
async function getSessionInfo(): Promise<{
  isAuthenticated: boolean;
  user?: IUser;
  expiresAt?: Date;
}> {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { isAuthenticated: false };
    }
    
    // Try to get expiration from access token
    const accessToken = await jwtUtils.getAccessToken();
    let expiresAt: Date | undefined;
    
    if (accessToken) {
      const payload = jwtUtils.verifyToken(accessToken);
      if (payload && payload.exp) {
        expiresAt = new Date(payload.exp * 1000);
      }
    }
    
    return {
      isAuthenticated: true,
      user,
      expiresAt
    };
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] [Session] Error getting session info:`, error);
    return { isAuthenticated: false };
  }
}

/**
 * Exporter les utilitaires de session
 */
export const sessionUtils = {
  getCurrentUser,
  getUserFromPayload,
  refreshSession,
  isAuthenticated,
  getCurrentUserRole,
  hasRole,
  invalidateSession,
  getSessionInfo
};

export default sessionUtils;