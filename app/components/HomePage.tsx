"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/navigation";
import { useSearchParams } from "next/navigation";
import { 
  FiUser, FiLogOut, FiHome, FiClock, FiMap, FiVideo, 
  FiInfo, FiTrendingUp, FiUsers, FiMenu, FiCheck,
  FiCalendar, FiTarget, FiAward, FiHelpCircle, FiMessageCircle,
  FiClock as FiClockIcon
} from "react-icons/fi";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useModal } from "@/lib/contexts/ModalContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/contexts/ToastContext";
import AppFooter from './AppFooter';

// Current system information
const CURRENT_TIMESTAMP = "2025-06-10 17:45:04"; // Updated timestamp
const CURRENT_USER = "Sdiabate1337";

export default function Home() {
  // Use auth context
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    logout, 
    authError, 
    refreshUser,
    authCheckComplete
  } = useAuth();
  
  const router = useRouter();
  
  // Use modal context
  const { openModal } = useModal();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Refs for click management
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuContentRef = useRef<HTMLDivElement | null>(null);
  
  // Use search params for handling email verification
  const searchParams = useSearchParams();
  
  // Add state to track parameter processing
  const [paramsProcessed, setParamsProcessed] = useState(false);
  
  // Track if a redirection is pending
  const redirectPendingRef = useRef<boolean>(false);

  // Create a memoized function to process URL parameters only once
  const processUrlParameters = useCallback(async () => {
    // Skip if already processed
    if (paramsProcessed) return;
    
    // Get all possible authentication-related URL parameters
    const verified = searchParams.get('verified');
    const error = searchParams.get('error');
    const openModalParam = searchParams.get('openModal');
    const token = searchParams.get('token');
    const passwordReset = searchParams.get('passwordReset');
    const authSuccess = searchParams.get('auth_success');
    const provider = searchParams.get('provider');
    
    console.log(`[${CURRENT_TIMESTAMP}] Processing URL parameters:`, {
      verified,
      error,
      openModalParam,
      token: token ? `${token.substring(0, 10)}...` : null,
      passwordReset,
      authSuccess,
      provider
    });
    
    // CASE 1: Social authentication success
    if (authSuccess === 'true') {
      console.log(`[${CURRENT_TIMESTAMP}] Social authentication successful via ${provider || 'unknown provider'}`);
      
      // Set the redirect pending flag to avoid multiple redirects
      redirectPendingRef.current = true;
      
      try {
        // Clean up URL parameters FIRST to prevent reprocessing
        const url = new URL(window.location.href);
        url.searchParams.delete('auth_success');
        url.searchParams.delete('provider');
        window.history.replaceState({}, document.title, url.pathname);
        
        // Then refresh user data and redirect
        await refreshUser(true);
      } catch (error) {
        console.error(`[${CURRENT_TIMESTAMP}] Error during auth success handling:`, error);
      }
      
      setParamsProcessed(true);
      return;
    }
    
    // CASE 2: Email verification success
    if (verified === 'true') {
      console.log(`[${CURRENT_TIMESTAMP}] Email verification successful, opening login modal`);
      // Open login modal with verification success message
      openModal('login', { verified: true });
      
      // Clean up URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete('verified');
      window.history.replaceState({}, document.title, url.pathname);
      
      setParamsProcessed(true);
      return;
    }
    
    // CASE 3: Authentication error
    if (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Authentication error: ${error}`);
      
      // Handle specific error types
      if (error.includes('google_auth_failed')) {
        alert('Google login failed. Please try again.');
      } else if (error.includes('facebook_auth_failed')) {
        alert('Facebook login failed. Please try again.');
      } else if (error.includes('email_verification')) {
        // Special handling for email verification errors
        openModal('login', { requiresVerification: true });
      } else {
        alert(`Authentication error: ${error}`);
      }
      
      // Clean up error parameter
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState({}, document.title, url.pathname);
      
      setParamsProcessed(true);
      return;
    }
    
    // CASE 4: Modal opening parameters
    if (openModalParam) {
      console.log(`[${CURRENT_TIMESTAMP}] Opening modal from URL: ${openModalParam}`);
      
      if (openModalParam === 'resetPassword' && token) {
        openModal('resetPassword', { token });
      } else if (openModalParam === 'login') {
        openModal('login', passwordReset === 'true' ? { passwordReset: true } : undefined);
      } else if (['register', 'forgotPassword'].includes(openModalParam)) {
        openModal(openModalParam as any);
      }
      
      // Clean up URL parameters after handling
      const url = new URL(window.location.href);
      url.searchParams.delete('openModal');
      url.searchParams.delete('token');
      url.searchParams.delete('passwordReset');
      window.history.replaceState({}, document.title, url.pathname);
      
      setParamsProcessed(true);
      return;
    }
    
    // Handle authError from context (if present)
    if (authError && !error) {
      console.error(`[${CURRENT_TIMESTAMP}] Auth context error: ${authError}`);
      
      // Show appropriate error based on type
      if (authError.includes('verification') || authError.includes('vérifi')) {
        openModal('login', { requiresVerification: true });
      } else {
        alert(authError);
      }
      
      setParamsProcessed(true);
      return;
    }
    
    // Mark as processed if there were no parameters to handle
    setParamsProcessed(true);
  }, [searchParams, openModal, paramsProcessed, refreshUser, authError]);

  // Use a dedicated effect for authentication redirect
  useEffect(() => {
    // Only run this effect when auth state is confirmed and not loading
    if (!isLoading && authCheckComplete && !redirectPendingRef.current) {
      if (isAuthenticated && user) {
        // Only redirect if user is authenticated AND verified
        if (user.isVerified !== false) {
          console.log(`[${CURRENT_TIMESTAMP}] User is authenticated and verified, redirecting to dashboard`);
          redirectPendingRef.current = true;
          router.push('/dashboard');
        } else {
          console.log(`[${CURRENT_TIMESTAMP}] User is authenticated but not verified, staying on homepage`);
          // Optionally show verification reminder
          openModal('login', { requiresVerification: true });
        }
      }
    }
  }, [isAuthenticated, isLoading, user, router, authCheckComplete, openModal]);

  // Process URL parameters after auth check
  useEffect(() => {
    if (authCheckComplete && !paramsProcessed) {
      console.log(`[${CURRENT_TIMESTAMP}] Auth check complete, processing URL parameters`);
      processUrlParameters();
    }
  }, [authCheckComplete, paramsProcessed, processUrlParameters]);

  // Toggle mobile menu
  const toggleMobileMenu = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  // Close mobile menu when clicking outside
  useEffect(() => {
    if (!mobileMenuOpen) return;
    
    const handleOutsideClick = (event: MouseEvent): void => {
      if (!menuButtonRef.current || !menuContentRef.current) return;
      
      // TypeScript safety check: ensure target is an Element
      const target = event.target;
      if (!(target instanceof Element)) return;
      
      // Check if click was outside menu and button
      if (
        !menuButtonRef.current.contains(target) && 
        !menuContentRef.current.contains(target)
      ) {
        setMobileMenuOpen(false);
      }
    };
    
    // Add event listener with delay to prevent immediate closure
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [mobileMenuOpen]);

  return (
    <main className="min-h-screen font-sans text-base bg-slate-900 text-slate-100">
      {/* Modern Navbar with glassmorphism effect - Mobile Optimized */}
      <header className="sticky top-0 z-40 backdrop-blur-lg shadow-sm border-b bg-slate-900/70 border-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-500">
                Mythayun
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Mobile menu button */}
              <div className="md:hidden">
                <button 
                  ref={menuButtonRef}
                  id="mobile-menu-button"
                  onClick={toggleMobileMenu}
                  className="p-2 rounded-md text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                >
                  <FiMenu size={24} />
                </button>
              </div>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden md:flex items-center gap-4">
              {isLoading ? (
                <div className="flex items-center text-slate-300">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </div>
              ) : isAuthenticated ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-slate-300">
                    <FiUser className="text-indigo-500" />
                    <span>Welcome, {user?.name || CURRENT_USER}</span>
                  </div>
                  <button
                    onClick={() => logout()}
                    className="flex items-center gap-2 px-4 py-2 rounded-full shadow-sm transition-all bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700"
                  >
                    <FiLogOut className="text-slate-400" /> Logout
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => openModal('login')}
                    className="px-5 py-2 font-medium rounded-full shadow-sm transition-colors bg-slate-800 border border-slate-700 text-indigo-400 hover:bg-slate-700"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => openModal('register')}
                    className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-500 text-white font-medium rounded-full hover:from-indigo-700 hover:to-violet-600 transition-colors shadow-sm"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div 
            ref={menuContentRef}
            id="mobile-menu-content"
            className="md:hidden absolute top-16 inset-x-0 rounded-b-xl border-t shadow-lg p-4 z-50 bg-slate-800 border-slate-700"
          >
            {isLoading ? (
              <div className="flex items-center justify-center p-4 text-slate-300">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </div>
            ) : isAuthenticated ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-2 text-slate-300">
                  <FiUser className="text-indigo-500" />
                  <span>Welcome, {user?.name || CURRENT_USER}</span>
                </div>
                <button
                  onClick={() => logout()}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl shadow-sm transition-all bg-slate-700 text-slate-300 hover:bg-slate-600"
                >
                  <FiLogOut className="text-slate-400" /> Logout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => {
                    openModal('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full p-3 font-medium rounded-xl shadow-sm transition-colors bg-slate-700 text-indigo-400 hover:bg-slate-600"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    openModal('register');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full p-3 bg-gradient-to-r from-indigo-600 to-violet-500 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-violet-600 transition-colors shadow-sm"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Enhanced Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0 -z-5 overflow-hidden">
          <div className="absolute top-20 right-10 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 left-10 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="px-4 py-16 sm:py-24 md:py-32 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-12">
            <div className="flex-1 space-y-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-center md:text-left text-white">
                <span>Football Experience </span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">
                  Reimagined
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl max-w-2xl text-center md:text-left text-slate-300">
                Mythayun brings together live scores, stadium guides, and official news for an unmatched football experience.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto">
                <button 
                  onClick={() => openModal('register')}
                  className="w-full sm:w-auto px-6 py-4 bg-gradient-to-r from-indigo-600 to-violet-500 text-white rounded-xl sm:rounded-full text-lg font-medium hover:from-indigo-700 hover:to-violet-600 shadow-lg shadow-indigo-900/20 hover:shadow-xl hover:shadow-indigo-900/30 transition-all"
                >
                  Join Now
                </button>
                <button 
                  onClick={() => {}}
                  className="w-full sm:w-auto px-6 py-4 border rounded-xl sm:rounded-full text-lg font-medium shadow-sm hover:shadow transition-all bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                >
                  Learn More
                </button>
              </div>
            </div>
            
            {/* Enhanced Football Illustration */}
            <div className="flex-1 flex justify-center w-full md:w-auto">
              <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md">
                <div className="absolute -top-8 -right-8 w-40 h-40 sm:w-48 sm:h-48 bg-indigo-400/20 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-4 -left-4 w-28 h-28 sm:w-36 sm:h-36 bg-violet-400/20 rounded-full blur-2xl"></div>
                
                <div className="relative z-10 aspect-square flex items-center justify-center">
                  {/* Football illustration with highlights */}
                  <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 shadow-xl relative overflow-hidden animate-float">
                    <div className="absolute inset-2 rounded-full flex items-center justify-center bg-slate-800">
                      <div className="w-full h-full relative">
                        <div className="absolute inset-0 grid grid-cols-2">
                          {Array.from({length: 6}).map((_, i) => (
                            <div key={i} className="aspect-square border border-slate-700"></div>
                          ))}
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-full shadow-inner"></div>
                        <div className="absolute inset-0 bg-white/5 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

             <AppFooter />
          </div>
        </div>
      </section>

      {/* Add some custom styles for animations */}
      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </main>
  );
}