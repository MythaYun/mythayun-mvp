'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { IUser } from '@/lib/models/User';

// Updated system information
const CURRENT_TIMESTAMP = "2025-05-16 11:16:22";
const CURRENT_USER = "Sdiabate1337";

// Type definitions for authentication functions
interface LoginResponse {
  success: boolean;
  user?: Partial<IUser>;
  error?: string;
  requiresEmailVerification?: boolean;
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
  authCheckComplete: boolean;  // Add this to track when auth check is complete
  login: (email: string, password: string) => Promise<LoginResponse>;
  register: (data: RegisterData) => Promise<LoginResponse>;
  updateUser: (user: Partial<IUser> | null | undefined) => void;
  logout: () => Promise<void>;
  refreshUser: (shouldRedirect?: boolean) => Promise<Partial<IUser> | null>;
  handleSocialLoginSuccess: (userData: Partial<IUser>) => void;
  authError: string | null;
  clearAuthError: () => void;
  updateUserPreferences: (preferences: any) => Promise<void>;
  showOnboarding: boolean; 
  setShowOnboarding: (value: boolean) => void;
  completeOnboarding: (preferences?: any) => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Authentication provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Partial<IUser> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(0);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [authCheckComplete, setAuthCheckComplete] = useState<boolean>(false); // Add this state
  
  // Refs for tracking states
  const initialAuthCheckDone = useRef<boolean>(false);
  const refreshInProgress = useRef<boolean>(false);
  const redirectPending = useRef<boolean>(false);
  // Add safeguard timeout to prevent infinite loading
  const authCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const router = useRouter();

  // Clear authentication error
  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

// Updated checkOnboardingStatus function with better logging
const checkOnboardingStatus = useCallback((userData: Partial<IUser> | null) => {
  const timestamp = new Date().toISOString(); // Use current timestamp
  
  if (!userData) {
    console.log(`[${timestamp}] No user data provided to checkOnboardingStatus`);
    setShowOnboarding(false);
    return false;
  }
  
  console.log(`[${timestamp}] Checking onboarding status for: ${userData.email}`);
  console.log(`[${timestamp}] User properties:`, {
    isNewUser: userData.isNewUser,
    hasCompletedOnboarding: userData.hasCompletedOnboarding,
    isFirstLogin: userData.isFirstLogin,
    lastLogin: userData.lastLogin ? new Date(userData.lastLogin).toISOString() : 'none'
  });
  
  // Priority 1: URL parameter takes precedence
  const urlHasWelcome = typeof window !== 'undefined' && 
    window.location.search.includes('welcome=true');
  
  if (urlHasWelcome) {
    console.log(`[${timestamp}] 'welcome=true' parameter found in URL, enabling onboarding`);
    setShowOnboarding(true);
    return true;
  }
  
  // Priority 2: User properties check
  const isExplicitlyNewUser = userData.isNewUser === true;
  const hasNotCompletedOnboarding = userData.hasCompletedOnboarding !== true;
  const isFirstLogin = userData.isFirstLogin === true;
  
  // Make the decision
  const shouldShowOnboarding = 
    (isExplicitlyNewUser || isFirstLogin) && 
    hasNotCompletedOnboarding;
  
  console.log(`[${timestamp}] Onboarding decision:`, {
    isExplicitlyNewUser,
    isFirstLogin,
    hasNotCompletedOnboarding,
    decision: shouldShowOnboarding
  });
  
  setShowOnboarding(shouldShowOnboarding);
  return shouldShowOnboarding;
}, []);

  // Function to check authentication status with timeout protection
  const checkAuth = useCallback(async () => {
    // Skip check if already in progress
    if (refreshInProgress.current) {
      console.log(`[${CURRENT_TIMESTAMP}] Auth check skipped - refresh already in progress`);
      return null;
    }
    
    // Clear any existing timeout
    if (authCheckTimeout.current) {
      clearTimeout(authCheckTimeout.current);
      authCheckTimeout.current = null;
    }
    
    // Set a timeout to prevent infinite loading
    authCheckTimeout.current = setTimeout(() => {
      console.error(`[${CURRENT_TIMESTAMP}] Auth check timed out after 8 seconds`);
      refreshInProgress.current = false;
      setIsLoading(false);
      setAuthCheckComplete(true); // Mark auth check as complete even if it timed out
      initialAuthCheckDone.current = true;
    }, 8000); // 8 seconds timeout
    
    try {
      refreshInProgress.current = true;
      setIsLoading(true);
      
      console.log(`[${CURRENT_TIMESTAMP}] Checking authentication status...`);
      
      // Add a timestamp query parameter to prevent caching
      const response = await fetch('/api/auth/me?t=' + Date.now(), {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        credentials: 'include',
      });
      
      // Log the status code for debugging
      console.log(`[${CURRENT_TIMESTAMP}] Auth check response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          // Check if user is verified
          if (data.user.isVerified === false) {
            console.log(`[${CURRENT_TIMESTAMP}] User not verified yet: ${data.user.email}`);
            setUser(null); // Don't set user if not verified
            setShowOnboarding(false);
            return null;
          }
          
          // User is verified, proceed with authentication
          const userData = data.user;
          
          // Set the user data
          setUser(userData);
          
          // Check onboarding status
          checkOnboardingStatus(userData);
          
          console.log(`[${CURRENT_TIMESTAMP}] User authenticated:`, userData.email);
          return userData;
        } else {
          setUser(null);
          setShowOnboarding(false);
          console.log(`[${CURRENT_TIMESTAMP}] No authenticated user found in response`);
          return null;
        }
      } else {
        setUser(null);
        setShowOnboarding(false);
        const errorStatus = response.status;
        
        // Only set error for non-401 responses
        if (response.status !== 401) {
          setAuthError(`Authentication error: ${errorStatus}`);
        } else {
          console.log(`[${CURRENT_TIMESTAMP}] Not authenticated (401 response)`);
        }
        
        return null;
      }
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error checking authentication:`, error);
      setUser(null);
      setShowOnboarding(false);
      setAuthError('Failed to verify authentication status');
      return null;
    } finally {
      // Clear the timeout as we've completed
      if (authCheckTimeout.current) {
        clearTimeout(authCheckTimeout.current);
        authCheckTimeout.current = null;
      }
      
      setIsLoading(false);
      setAuthCheckComplete(true); // Mark auth check as complete
      setLastRefresh(Date.now());
      refreshInProgress.current = false;
      initialAuthCheckDone.current = true;
    }
  }, [checkOnboardingStatus]);

// Login function with improved error handling and verification check
const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    setAuthError(null); // Clear previous errors
    setIsLoading(true);
    
    console.log(`[${CURRENT_TIMESTAMP}] Attempting login for: ${email}`);
    
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
      console.error(`[${CURRENT_TIMESTAMP}] Failed to parse login response:`, e);
      throw new Error('Erreur serveur: Réponse invalide');
    }
    
    if (!response.ok) {
      // Check specifically for verification errors
      if (data?.requiresEmailVerification || 
          data?.message?.toLowerCase().includes('vérifi') || 
          data?.message?.toLowerCase().includes('verif')) {
        console.log(`[${CURRENT_TIMESTAMP}] Login failed - email verification required: ${email}`);
        return { 
          success: false, 
          requiresEmailVerification: true,
          error: data?.message || "Veuillez vérifier votre adresse email avant de vous connecter"
        };
      }
      
      // Handle other errors
      const errorMessage = data?.message || `Échec de la connexion: ${response.status}`;
      console.error(`[${CURRENT_TIMESTAMP}] Login error: ${errorMessage}`);
      throw new Error(errorMessage);
    }
    
    // Check if the server explicitly indicated email verification is required
    if (data.requiresEmailVerification) {
      console.log(`[${CURRENT_TIMESTAMP}] Server indicated email verification required for: ${email}`);
      return { 
        success: false, 
        requiresEmailVerification: true,
        error: data.message || "Veuillez vérifier votre adresse email avant de vous connecter" 
      };
    }
    
    // Successful login with user data
    if (data.success && data.user) {
      // Double-check if user is verified (belt and suspenders approach)
      if (data.user.isVerified === false) {
        console.log(`[${CURRENT_TIMESTAMP}] Login rejected - user not verified: ${email}`);
        return { 
          success: false, 
          requiresEmailVerification: true,
          error: "Veuillez vérifier votre adresse email avant de vous connecter" 
        };
      }
      
      // User is verified - proceed with authentication
      const userData = data.user;
      
      // Set user as authenticated
      setUser(userData);
      
      // Then check if onboarding is needed
      const shouldOnboard = checkOnboardingStatus(userData);
      
      console.log(`[${CURRENT_TIMESTAMP}] Login successful for: ${email}, needs onboarding: ${shouldOnboard}`);
      return { success: true, user: userData };
    } 
    // Success response but no user data included
    else if (data.success) {
      console.log(`[${CURRENT_TIMESTAMP}] Login successful but user data not included, fetching...`);
      
      // Refresh user data to get the complete user object
      const userData = await checkAuth();
      
      if (userData) {
        // Double-check verification status on the fetched user
        if (userData.isVerified === false) {
          console.log(`[${CURRENT_TIMESTAMP}] Fetched user is not verified: ${email}`);
          setUser(null); // Clear any user data
          return { 
            success: false, 
            requiresEmailVerification: true,
            error: "Veuillez vérifier votre adresse email avant de vous connecter" 
          };
        }
        
        return { success: true, user: userData };
      } else {
        throw new Error('Échec de récupération des données utilisateur après connexion');
      }
    } 
    // Generic failure case
    else {
      console.log(`[${CURRENT_TIMESTAMP}] Login returned success:false: ${data.message}`);
      setAuthError(data.message || 'Échec de l\'authentification');
      return { 
        success: false, 
        error: data.message || 'Échec de l\'authentification' 
      };
    }
  } catch (error) {
    // Log and format error
    console.error(`[${CURRENT_TIMESTAMP}] Login exception:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur serveur lors de la connexion';
    setAuthError(errorMessage);
    return { success: false, error: errorMessage };
  } finally {
    setIsLoading(false);
  }
};
  // Register function with proper email verification flow
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
      
      // IMPORTANT: Do NOT set the user here - registration doesn't mean authentication
      // User needs to verify their email first
      
      // Return success but don't authenticate
      return { 
        success: true, 
        requiresEmailVerification: true,
        user: responseData.user 
      };
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
    
    // Check if user is verified
    if (userData.isVerified === false) {
      console.log(`[${CURRENT_TIMESTAMP}] Social login rejected - user not verified: ${userData.email}`);
      setAuthError("Veuillez vérifier votre adresse email avant de vous connecter");
      return;
    }
    
    // User is verified, proceed with authentication
    setUser(userData);
    
    // Check if user needs onboarding - for social auth, make it explicit
    const shouldOnboard = true; // Force onboarding for social logins to ensure visibility
    setShowOnboarding(shouldOnboard);
    
    // Set redirect pending flag
    redirectPending.current = true;
    
    // IMPORTANT: Always include welcome parameter for social auth to ensure onboarding visibility
    router.push('/dashboard?welcome=true');
  }, [router]);

  // Function to refresh user data manually with optional redirection
  const refreshUser = useCallback(async (shouldRedirect = false) => {
    // Reset refresh state to avoid getting stuck
    refreshInProgress.current = false;
    
    try {
      console.log(`[${CURRENT_TIMESTAMP}] Refreshing user data, shouldRedirect: ${shouldRedirect}`);
      
      const userData = await checkAuth();
      
      // Only redirect if the user is authenticated and verified
      if (shouldRedirect && userData && userData.isVerified !== false) {
        console.log(`[${CURRENT_TIMESTAMP}] Redirecting to dashboard after refresh`);
        // Set redirect pending flag
        redirectPending.current = true;
        
        // Add welcome parameter if onboarding is needed
        if (showOnboarding) {
          router.push('/dashboard?welcome=true');
        } else {
          router.push('/dashboard');
        }
      }
      
      return userData;
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error refreshing user:`, error);
      return null;
    }
  }, [checkAuth, router, showOnboarding]);

  // Update user with verification and onboarding check
  const updateUser = useCallback((newUser: Partial<IUser> | null | undefined) => {
    // Convert undefined to null
    const actualUser = newUser === undefined ? null : newUser;
    
    if (actualUser) {
      // Check if user is verified
      if (actualUser.isVerified === false) {
        console.log(`[${CURRENT_TIMESTAMP}] Not setting user - not verified: ${actualUser.email}`);
        return;
      }
      
      console.log(`[${CURRENT_TIMESTAMP}] Updating user:`, actualUser.email);
      // Set user first
      setUser(actualUser);
      // Then check onboarding status
      checkOnboardingStatus(actualUser);
    } else {
      console.log(`[${CURRENT_TIMESTAMP}] Clearing user data`);
      setUser(null);
      setShowOnboarding(false);
    }
  }, [checkOnboardingStatus]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log(`[${CURRENT_TIMESTAMP}] Logging out...`);
      
      const response = await fetch('/api/auth/logout', { 
        method: 'POST',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        setUser(null);
        setShowOnboarding(false);
        console.log(`[${CURRENT_TIMESTAMP}] Logout successful`);
      } else {
        const errorText = await response.text();
        console.error(`[${CURRENT_TIMESTAMP}] Error during logout (${response.status}): ${errorText}`);
        
        // Even if the server logout fails, clear the user client-side
        setUser(null);
        setShowOnboarding(false);
      }
      
      // Set redirect pending flag
      redirectPending.current = true;
      
      // Redirect to home page after logout
      router.push('/');
      
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error during logout:`, error);
      // Even if there's an error, clear the user client-side
      setUser(null);
      setShowOnboarding(false);
      
      // Set redirect pending flag
      redirectPending.current = true;
      
      // Still redirect to home page
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  }, [router]);
  
  // Update user preferences function
  const updateUserPreferences = useCallback(async (preferences: any) => {
    try {
      if (!user) {
        console.error(`[${CURRENT_TIMESTAMP}] Cannot update preferences: No authenticated user`);
        throw new Error("Utilisateur non authentifié");
      }
      
      console.log(`[${CURRENT_TIMESTAMP}] Updating user preferences`);
      setIsLoading(true);
      
      // API call to update user preferences
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(preferences),
      });
      
      // Handle errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        const errorMessage = errorData.message || `Failed to update preferences: ${response.status}`;
        console.error(`[${CURRENT_TIMESTAMP}] Preference update error:`, errorMessage);
        throw new Error(errorMessage);
      }
      
      // Parse the response
      const data = await response.json();
      
      // Update local user state with new preferences and updated onboarding status
      if (data.success && data.user) {
        setUser(prevUser => {
          if (!prevUser) return null;
          
          return { 
            ...prevUser, 
            preferences,
            hasCompletedOnboarding: true, // Mark onboarding as complete
            isNewUser: false // No longer a new user
          };
        });
        
        // Explicitly turn off onboarding
        setShowOnboarding(false);
        
        console.log(`[${CURRENT_TIMESTAMP}] User preferences updated successfully, onboarding complete`);
      } else {
        console.warn(`[${CURRENT_TIMESTAMP}] Preference update succeeded but no user data returned`);
      }
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error updating preferences:`, error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setAuthError(`Erreur lors de la mise à jour des préférences: ${errorMessage}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

// Complete onboarding function with proper preferences handling
const completeOnboarding = useCallback(async (preferences?: any) => {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Marking onboarding as complete`);
    
    if (!user) {
      console.error(`[${timestamp}] Cannot complete onboarding: No authenticated user`);
      setShowOnboarding(false);
      
      // Clear welcome parameter from URL if present
      if (typeof window !== 'undefined' && window.location.search.includes('welcome')) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      return;
    }
    
    // Use provided preferences or fallback to defaults if needed
    const finalPreferences = preferences || user.preferences || {
      favoriteLeagues: [],
      favoriteTeams: [],
      notificationPreferences: {
        matchReminders: true,
        scoreUpdates: true,
        newsAlerts: false
      },
      displayPreferences: {
        darkMode: true,
        compactView: false
      }
    };
    
    // Detailed logging
    console.log(`[${timestamp}] Completing onboarding for user: ${user.email}`);
    console.log(`[${timestamp}] Using preferences:`, JSON.stringify(finalPreferences));
    
    // Update user preferences via API call
    const response = await fetch('/api/user/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      credentials: 'include', // Important: Include cookies for auth
      body: JSON.stringify(finalPreferences),
    });
    
    // Parse response data
    const data = await response.json();
    
    if (!response.ok) {
      console.error(`[${timestamp}] Failed to update preferences: ${data.message || response.status}`);
      throw new Error(data.message || `Server error: ${response.status}`);
    }
    
    console.log(`[${timestamp}] API response:`, JSON.stringify(data));
    
    if (data.success && data.user) {
      // Update local user state with the returned data
      setUser(prevUser => {
        if (!prevUser) return null;
        
        return { 
          ...prevUser, 
          preferences: data.user.preferences,
          hasCompletedOnboarding: true,
          isNewUser: false
        };
      });
      
      console.log(`[${timestamp}] User preferences updated successfully`);
      setShowOnboarding(false);
    } else {
      console.warn(`[${timestamp}] Preferences update returned success:true but no user data`);
    }
    
    // Clear welcome parameter from URL if present
    if (typeof window !== 'undefined' && window.location.search.includes('welcome')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error completing onboarding:`, error);
    // Even on error, hide onboarding UI to prevent getting stuck
    setShowOnboarding(false);
    
    // Set error message
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    setAuthError(`Erreur lors de la finalisation de l'onboarding: ${errorMessage}`);
  }
}, [user, setUser, setAuthError]);

  // New effect for detecting welcome parameter in URL
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      // Check for welcome parameter in URL
      const hasWelcomeParam = new URLSearchParams(window.location.search).get('welcome') === 'true';
      
      if (hasWelcomeParam) {
        console.log(`[${CURRENT_TIMESTAMP}] Welcome parameter detected in URL, showing onboarding`);
        setShowOnboarding(true);
      }
    }
  }, [user]);

  // Effect for handling authentication cookies and errors
  useEffect(() => {
    // Only run once on mount
    if (typeof window !== 'undefined' && !redirectPending.current) {
      const url = new URL(window.location.href);
      const error = url.searchParams.get('error');
      const authSuccess = url.searchParams.get('auth_success');
      const verified = url.searchParams.get('verified');
      const provider = url.searchParams.get('provider');
      
      // Handle successful email verification
      if (verified === 'true') {
        console.log(`[${CURRENT_TIMESTAMP}] Email verification successful`);
        // Clean URL immediately
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      // Handle auth errors in URL
      if (error) {
        console.error(`[${CURRENT_TIMESTAMP}] Authentication error from URL: ${error}`);
        setAuthError(error);
        // Clean URL immediately to prevent reprocessing
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }
      
      // Check for auth_success in cookie
      const hasAuthSuccessCookie = document.cookie.includes('auth_success=true');
      
      // Handle auth success in URL or cookie
      if (authSuccess === 'true' || hasAuthSuccessCookie) {
        console.log(`[${CURRENT_TIMESTAMP}] Authentication success detected via ${provider || 'unknown provider'}`);
        
        // Clean URL immediately to prevent reprocessing
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Remove auth_success cookie if it exists
        if (hasAuthSuccessCookie) {
          document.cookie = "auth_success=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        }
        
        // Force a complete refresh to avoid state issues
        refreshInProgress.current = false;
        
        // Refresh user data and redirect if user exists
        refreshUser(true);
      }
    }
  }, [refreshUser]); // Added refreshUser as dependency

  // Initial authentication check
  useEffect(() => {
    if (!initialAuthCheckDone.current) {
      console.log(`[${CURRENT_TIMESTAMP}] Running initial auth check`);
      checkAuth();
    }
  }, [checkAuth]);

  // Auto-recovery mechanism for loading state
  useEffect(() => {
    // If loading state persists for more than 10 seconds, reset it
    let loadingTimeout: NodeJS.Timeout;
    
    if (isLoading) {
      loadingTimeout = setTimeout(() => {
        if (isLoading) {
          console.warn(`[${CURRENT_TIMESTAMP}] Loading state persisted for too long, resetting`);
          setIsLoading(false);
          setAuthCheckComplete(true); // Mark auth check as complete
          refreshInProgress.current = false;
          initialAuthCheckDone.current = true;
        }
      }, 10000); // 10 seconds timeout
    }
    
    return () => {
      clearTimeout(loadingTimeout);
    };
  }, [isLoading]);

  // Context value with updated properties
  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    authCheckComplete, // Add this to the context
    login,
    register,
    updateUser,
    logout,
    refreshUser,
    handleSocialLoginSuccess,
    authError,
    clearAuthError,
    updateUserPreferences,
    showOnboarding,
    setShowOnboarding,
    completeOnboarding
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