'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Current information
const CURRENT_TIMESTAMP = "2025-05-03 14:32:35";
const CURRENT_USER = "Sdiabate1337";

// User type definition
export interface User {
  _id?: string;
  name: string;
  email?: string;
  role?: 'user' | 'admin';
  avatar?: string;
  lastLogin?: Date;
  provider?: 'email' | 'google' | 'facebook';
}

// Auth context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// Create the context with undefined as default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props for AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simple login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Demo login logic (replace with real API call)
      if (email === `${CURRENT_USER.toLowerCase()}@mythayun.com` && password === 'password123') {
        setUser({
          name: CURRENT_USER,
          email: email,
          role: 'user',
          provider: 'email',
          lastLogin: new Date(CURRENT_TIMESTAMP)
        });
        setIsAuthenticated(true);
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Google login function
  const loginWithGoogle = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Demo Google login (replace with real Google Auth)
      setUser({
        name: CURRENT_USER,
        email: `${CURRENT_USER.toLowerCase()}@gmail.com`,
        role: 'user',
        provider: 'google',
        avatar: 'https://lh3.googleusercontent.com/a/default-user',
        lastLogin: new Date(CURRENT_TIMESTAMP)
      });
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.message || 'Google login failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Facebook login function
  const loginWithFacebook = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Demo Facebook login (replace with real Facebook Auth)
      setUser({
        name: CURRENT_USER,
        email: `${CURRENT_USER.toLowerCase()}@facebook.com`,
        role: 'user',
        provider: 'facebook',
        avatar: 'https://graph.facebook.com/default-user/picture',
        lastLogin: new Date(CURRENT_TIMESTAMP)
      });
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.message || 'Facebook login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Simple register function
  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Demo register logic (replace with real API call)
      setUser({
        name: name,
        email: email,
        role: 'user',
        provider: 'email',
        lastLogin: new Date(CURRENT_TIMESTAMP)
      });
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Simple logout function
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  // Clear error message
  const clearError = () => setError(null);

  // Create context value
  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    loginWithGoogle,
    loginWithFacebook,
    register,
    logout,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}