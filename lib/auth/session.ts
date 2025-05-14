import { jwtUtils } from './jwt';
import { connectToDatabase } from '../db/mongodb';
import User, { IUser } from '../models/User';
import { cookies } from 'next/headers';
import mongoose from 'mongoose';

// Informations système actuelles
const CURRENT_TIMESTAMP = "2025-05-07 12:35:03";
const CURRENT_USER = "Sdiabate1337";



/**
 * Récupérer l'utilisateur actuel à partir du token JWT
 */
export async function getCurrentUser(): Promise<IUser | null> {
  try {
    // Récupérer le token d'accès
    const accessToken = await jwtUtils.getAccessToken();
    
    if (!accessToken) {
      return null;
    }
    
    // Vérifier le token
    const payload = jwtUtils.verifyToken(accessToken);
    
    if (!payload) {
      // Essayer de rafraîchir le token
      const refreshResult = await refreshSession();
      if (!refreshResult.success) {
        return null;
      }
      
      // Récupérer le nouveau token et le vérifier
      const newAccessToken = await jwtUtils.getAccessToken();
      const newPayload = newAccessToken ? jwtUtils.verifyToken(newAccessToken) : null;
      
      if (!newPayload) {
        return null;
      }
      
      // Continuer avec le nouveau payload
      return getUserFromPayload(newPayload);
    }
    
    // Récupérer l'utilisateur à partir du payload
    return getUserFromPayload(payload);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur actuel:', error);
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