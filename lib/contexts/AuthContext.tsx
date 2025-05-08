'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser } from '@/lib/models/User';

// Type pour l'état d'authentification
interface AuthContextType {
  user: Partial<IUser> | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  updateUser: (user: Partial<IUser> | null | undefined) => void;
  logout: () => Promise<void>;
}

// Informations système actuelles
const CURRENT_TIMESTAMP = "2025-05-07 17:16:45";
const CURRENT_USER = "Sdiabate1337";

// Création du contexte
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fournisseur du contexte d'authentification
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Partial<IUser> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUser(data.user);
            console.log(`[${CURRENT_TIMESTAMP}] Utilisateur authentifié:`, data.user.email);
          } else {
            setUser(null);
            console.log(`[${CURRENT_TIMESTAMP}] Aucun utilisateur authentifié`);
          }
        } else {
          setUser(null);
          console.log(`[${CURRENT_TIMESTAMP}] Erreur lors de la récupération des données utilisateur`);
        }
      } catch (error) {
        console.error(`[${CURRENT_TIMESTAMP}] Erreur lors de la vérification de l'authentification:`, error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Mettre à jour l'utilisateur - Fonction corrigée
  const updateUser = (newUser: Partial<IUser> | null | undefined) => {
    // Convertir undefined en null
    const actualUser = newUser === undefined ? null : newUser;
    
    if (actualUser) {
      console.log(`[${CURRENT_TIMESTAMP}] Mise à jour utilisateur:`, actualUser.email);
    } else {
      console.log(`[${CURRENT_TIMESTAMP}] Effacement des données utilisateur`);
    }
    
    setUser(actualUser);
  };

  // Déconnexion
  const logout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        setUser(null);
        console.log(`[${CURRENT_TIMESTAMP}] Déconnexion réussie`);
      } else {
        console.error(`[${CURRENT_TIMESTAMP}] Erreur lors de la déconnexion:`, response.status);
      }
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Erreur lors de la déconnexion:`, error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      updateUser,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};