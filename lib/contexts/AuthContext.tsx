'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { IUser } from '@/lib/models/User';

// Updated system information
const CURRENT_TIMESTAMP = "2025-05-14 02:05:22";
const CURRENT_USER = "Sdiabate1337";

// Type definitions for authentication functions
interface LoginResponse {
  success: boolean;
  user?: Partial<IUser>;
  error?: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

// Enhanced AuthContextType with login, register functions and more
interface AuthContextType {
  user: Partial<IUser> | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  register: (data: RegisterData) => Promise<LoginResponse>;
  updateUser: (user: Partial<IUser> | null | undefined) => void;
  logout: () => Promise<void>;
  refreshUser: (shouldRedirect?: boolean) => Promise<Partial<IUser> | null>;
  handleSocialLoginSuccess: (userData: Partial<IUser>) => void;
  authError: string | null;
  clearAuthError: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Authentication provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Partial<IUser> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(0);
  // FIX 1: Track initial auth check completion
  const initialAuthCheckDone = useRef<boolean>(false);
  // FIX 2: Track if a refresh operation is in progress
  const refreshInProgress = useRef<boolean>(false);
  // FIX 3: Track if a redirect is pending
  const redirectPending = useRef<boolean>(false);
  const router = useRouter();

  // Clear authentication error
  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  // Function to check authentication status
const checkAuth = useCallback(async () => {
  // Skip check if already in progress
  if (refreshInProgress.current) {
    console.log(`[${new Date().toISOString()}] Auth check skipped - refresh already in progress`);
    return null;
  }
  
  try {
    refreshInProgress.current = true;
    setIsLoading(true);
    
    console.log(`[${new Date().toISOString()}] Checking authentication status...`);
    
    // Add a timestamp query parameter to prevent caching
    const response = await fetch('/api/auth/me?t=' + Date.now(), {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      credentials: 'include', // Important: This ensures cookies are sent with the request
    });
    
    // Log the status code for debugging
    console.log(`[${new Date().toISOString()}] Auth check response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.user) {
        setUser(data.user);
        console.log(`[${new Date().toISOString()}] User authenticated:`, data.user.email);
        return data.user;
      } else {
        setUser(null);
        console.log(`[${new Date().toISOString()}] No authenticated user found in response`);
        return null;
      }
    } else {
      setUser(null);
      const errorStatus = response.status;
      
      // Only set error for non-401 responses
      if (response.status !== 401) {
        setAuthError(`Authentication error: ${errorStatus}`);
      } else {
        console.log(`[${new Date().toISOString()}] Not authenticated (401 response)`);
      }
      
      return null;
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error checking authentication:`, error);
    setUser(null);
    setAuthError('Failed to verify authentication status');
    return null;
  } finally {
    setIsLoading(false);
    setLastRefresh(Date.now());
    refreshInProgress.current = false;
    initialAuthCheckDone.current = true;
  }
}, []);

const login = async (email: string, password: string) => {
  try {
    setAuthError(null); // Clear previous errors
    
    console.log(`[${new Date().toISOString()}] Attempting login for: ${email}`);
    
    // Use JSON format for consistency
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include', // Important: This ensures cookies are stored
    });
    
    // Always try to parse the response body
    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.error('Failed to parse response:', e);
      throw new Error('Erreur serveur: Réponse invalide');
    }
    
    if (!response.ok) {
      // Use the server's error message if available
      const errorMessage = data?.message || `Login failed: ${response.status}`;
      throw new Error(errorMessage);
    }
    
    // Successful login
    if (data.success && data.user) {
      setUser(data.user);
      console.log(`[${new Date().toISOString()}] Login successful for: ${email}`);
      return { success: true, user: data.user };
    } else if (data.success) {
      // We need to fetch the user data if not provided
      console.log(`[${new Date().toISOString()}] Login successful but fetching user data...`);
      
      // Refresh user data immediately
      const userData = await checkAuth();
      if (userData) {
        return { success: true, user: userData };
      } else {
        throw new Error('Failed to fetch user data after successful login');
      }
    } else {
      console.log(`[${new Date().toISOString()}] Login returned success:false: ${data.message}`);
      setAuthError(data.message || 'Authentication failed');
      return { success: false, error: data.message || 'Authentication failed' };
    }
  } catch (error) {
    console.error('Login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Server error during login';
    setAuthError(errorMessage);
    return { success: false, error: errorMessage };
  }
};

  // Register function
  const register = useCallback(async (data: RegisterData): Promise<LoginResponse> => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      console.log(`[${CURRENT_TIMESTAMP}] Attempting registration for: ${data.email}`);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        const errorMessage = responseData.message || 'Registration failed';
        console.error(`[${CURRENT_TIMESTAMP}] Registration error:`, errorMessage);
        setAuthError(errorMessage);
        return { success: false, error: errorMessage };
      }
      
      console.log(`[${CURRENT_TIMESTAMP}] Registration successful for: ${data.email}`);
      

      
      return { success: true, user: responseData.user };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error(`[${CURRENT_TIMESTAMP}] Registration exception:`, errorMessage);
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle successful social login with dashboard redirection
  const handleSocialLoginSuccess = useCallback((userData: Partial<IUser>) => {
    console.log(`[${CURRENT_TIMESTAMP}] Social login success for:`, userData.email);
    setUser(userData);
    
    // Set redirect pending flag
    redirectPending.current = true;
    
    router.push('/dashboard');
  }, [router]);

  // Function to refresh user data manually with optional redirection
  const refreshUser = useCallback(async (shouldRedirect = false) => {
    // FIX 5: Don't refresh if a refresh is already in progress
    if (refreshInProgress.current) {
      console.log(`[${CURRENT_TIMESTAMP}] Refresh skipped - already in progress`);
      return user;
    }
    
    // Don't refresh too frequently (minimum 2 seconds between refreshes)
    const now = Date.now();
    if (now - lastRefresh < 2000) {
      console.log(`[${CURRENT_TIMESTAMP}] Refresh skipped - too soon since last refresh`);
      return user;
    }
    
    try {
      refreshInProgress.current = true;
      console.log(`[${CURRENT_TIMESTAMP}] Refreshing user data, shouldRedirect: ${shouldRedirect}`);
      
      const userData = await checkAuth();
      
      // Redirect to dashboard if requested and user is authenticated
      if (shouldRedirect && userData) {
        console.log(`[${CURRENT_TIMESTAMP}] Redirecting to dashboard after refresh`);
        // Set redirect pending flag
        redirectPending.current = true;
        router.push('/dashboard');
      }
      
      return userData;
    } finally {
      refreshInProgress.current = false;
    }
  }, [checkAuth, lastRefresh, user, router]);

  // Update user
  const updateUser = useCallback((newUser: Partial<IUser> | null | undefined) => {
    // Convert undefined to null
    const actualUser = newUser === undefined ? null : newUser;
    
    if (actualUser) {
      console.log(`[${CURRENT_TIMESTAMP}] Updating user:`, actualUser.email);
    } else {
      console.log(`[${CURRENT_TIMESTAMP}] Clearing user data`);
    }
    
    setUser(actualUser);
  }, []);

  // Logout function with redirect to home
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log(`[${CURRENT_TIMESTAMP}] Logging out...`);
      
      const response = await fetch('/api/auth/logout', { 
        method: 'POST',
        // Prevent caching of the logout request
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        setUser(null);
        console.log(`[${CURRENT_TIMESTAMP}] Logout successful`);
      } else {
        const errorText = await response.text();
        console.error(`[${CURRENT_TIMESTAMP}] Error during logout (${response.status}): ${errorText}`);
        
        // Even if the server logout fails, clear the user client-side
        setUser(null);
      }
      
      // Set redirect pending flag
      redirectPending.current = true;
      
      // Redirect to home page after logout
      router.push('/');
      
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error during logout:`, error);
      // Even if there's an error, clear the user client-side
      setUser(null);
      
      // Set redirect pending flag
      redirectPending.current = true;
      
      // Still redirect to home page
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // FIX 6: Separate effect for handling URL parameters
  useEffect(() => {
    // Only run once on mount
    if (typeof window !== 'undefined' && !redirectPending.current) {
      const url = new URL(window.location.href);
      const error = url.searchParams.get('error');
      const authSuccess = url.searchParams.get('auth_success');
      const provider = url.searchParams.get('provider');
      
      // Handle auth errors in URL
      if (error) {
        console.error(`[${CURRENT_TIMESTAMP}] Authentication error from URL: ${error}`);
        setAuthError(error);
        // Clean URL immediately to prevent reprocessing
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }
      
      // Handle auth success in URL
      if (authSuccess === 'true') {
        console.log(`[${CURRENT_TIMESTAMP}] Authentication success from URL via ${provider || 'unknown provider'}`);
        
        // Clean URL immediately to prevent reprocessing
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Set redirect pending flag
        redirectPending.current = true;
        
        // Refresh user data and redirect if user exists
        refreshUser(true);
      }
    }
  }, [refreshUser]); // Only depend on refreshUser to prevent multiple executions

  // FIX 7: Separate initial auth check from URL parameter handling
  useEffect(() => {
    // Only run the initial auth check once
    if (!initialAuthCheckDone.current && !refreshInProgress.current) {
      console.log(`[${CURRENT_TIMESTAMP}] Running initial auth check`);
      checkAuth();
    }
  }, [checkAuth]);

  // Context value
  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    updateUser,
    logout,
    refreshUser,
    handleSocialLoginSuccess,
    authError,
    clearAuthError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};