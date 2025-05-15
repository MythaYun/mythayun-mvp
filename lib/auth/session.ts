import { jwtUtils } from './jwt';
import { connectToDatabase } from '../db/mongodb';
import User, { IUser } from '../models/User';
import { cookies } from 'next/headers';
import mongoose from 'mongoose';
import { JWT_ACCESS_EXPIRY_SECONDS } from './jwt-types';

// Informations système actuelles
const CURRENT_TIMESTAMP = "2025-05-07 12:35:03";
const CURRENT_USER = "Sdiabate1337";



/**
 * Récupérer l'utilisateur actuel à partir du token JWT
 */
  async function getCurrentUser(): Promise<IUser | null> {
    try {
      console.log('[Session] Getting current user...');
      
      // Try access token first
      const accessToken = await jwtUtils.getAccessToken();
      
      if (accessToken) {
        console.log('[Session] Access token found, verifying...');
        const payload = jwtUtils.verifyToken(accessToken);
        
        if (payload && payload.userId) {
          console.log('[Session] Valid access token, fetching user...');
          await connectToDatabase();
          const user = await User.findById(payload.userId).select('-password');
          return user;
        }
      }
      
      // If access token is invalid or missing, try refresh token
      const refreshToken = await jwtUtils.getRefreshToken();
      
      if (refreshToken) {
        console.log('[Session] Trying refresh token...');
        const payload = jwtUtils.verifyToken(refreshToken);
        
        if (payload && payload.userId && payload.tokenType === 'refresh') {
          console.log('[Session] Valid refresh token, refreshing access token...');
          
          // Get user to generate new tokens
          await connectToDatabase();
          const user = await User.findById(payload.userId).select('-password');
          
          if (user) {
            // Generate new access token
            const newAccessToken = jwtUtils.generateAccessToken({
              userId: user._id.toString(),
              name: user.name,
              email: user.email,
              role: user.role,
              tokenType: 'access'
            });
            
            // Set the new access token cookie
            const cookieStore = cookies();
            (await cookieStore).set({
              name: 'accessToken',
              value: newAccessToken,
              httpOnly: true,
              secure: true,
              maxAge: JWT_ACCESS_EXPIRY_SECONDS,
              path: '/',
              sameSite: 'lax'
            });
            
            console.log('[Session] Access token refreshed');
            return user;
          }
        }
      }
      
      console.log('[Session] No valid tokens found');
      return null;
    } catch (error) {
      console.error('[Session] Error getting current user:', error);
      return null;
    }
  }

/**
 * Récupérer l'utilisateur à partir du payload JWT
 */
async function getUserFromPayload(payload: any): Promise<IUser | null> {
  try {
    await connectToDatabase();
    
    // Rechercher l'utilisateur dans la base de données
    const user = await User.findById(new mongoose.Types.ObjectId(payload.userId));
    
    if (!user) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return null;
  }
}

/**
 * Rafraîchir la session utilisateur
 */
export async function refreshSession(): Promise<{ success: boolean; message?: string }> {
  try {
    // Récupérer le token de rafraîchissement
    const refreshToken = await jwtUtils.getRefreshToken();
    
    if (!refreshToken) {
      return { success: false, message: 'Aucun token de rafraîchissement disponible' };
    }
    
    // Vérifier le token de rafraîchissement
    const payload = jwtUtils.verifyToken(refreshToken);
    
    if (!payload || payload.tokenType !== 'refresh') {
      return { success: false, message: 'Token de rafraîchissement invalide' };
    }
    
    // Récupérer l'utilisateur
    await connectToDatabase();
    const user = await User.findById(new mongoose.Types.ObjectId(payload.userId));
    
    if (!user) {
      return { success: false, message: 'Utilisateur non trouvé' };
    }
    
    // Générer un nouveau token d'accès
    const newAccessToken = jwtUtils.generateAccessToken(user);
    
    // Définir le nouveau token d'accès dans les cookies
    await jwtUtils.setAuthCookies(newAccessToken, refreshToken);
    
    return { success: true };
  } catch (error) {
    console.error('Erreur lors du rafraîchissement de la session:', error);
    return { success: false, message: 'Erreur lors du rafraîchissement de la session' };
  }
}

/**
 * Exporter les utilitaires de session
 */
export const sessionUtils = {
  getCurrentUser,
  refreshSession
};

export default sessionUtils;