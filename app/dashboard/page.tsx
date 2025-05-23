'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import OnboardingWizard from '../components/onboarding/OnboardingWizard'; 
import SettingsTab from './SettingsTab';
import FavoritesTab from './FavoritesTab'; 
import EventsTab from './EventsTab';
import DashboardTab from './DashboardTab';

import { 
  FiUser, FiLogOut, FiHome, FiSettings, FiCalendar, 
  FiMessageCircle, FiHeart, FiActivity, FiMenu, FiX, 
  FiChevronRight, FiShield, FiStar, FiAlertCircle, 
  FiCheckCircle, FiClock, FiHelpCircle, FiArrowLeft,
  FiBell, FiInfo, FiChevronsRight
} from 'react-icons/fi';

// Current system information
const CURRENT_TIMESTAMP = "2025-05-22 15:48:41"; // Updated timestamp
const CURRENT_USER = "Sdiabate1337for";

// Storage key for persistence
const TAB_STORAGE_KEY = 'mythayun-active-tab';

// Toast notification component
const Toast = ({ 
  message, 
  type, 
  onClose 
}: { 
  message: string; 
  type: 'success' | 'error' | 'info'; 
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div 
      className={`fixed top-4 right-4 z-50 flex items-center gap-2 p-3 rounded-lg shadow-lg animate-slideIn transform transition-all ${
        type === 'success' ? 'bg-green-600/95 text-white' : 
        type === 'error' ? 'bg-red-600/95 text-white' : 
        'bg-indigo-600/95 text-white'
      }`}
      role="alert"
      aria-live="assertive"
    >
      {type === 'success' ? (
        <FiCheckCircle size={20} className="animate-scaleIn" />
      ) : type === 'error' ? (
        <FiAlertCircle size={20} className="animate-pulse" />
      ) : (
        <FiInfo size={20} />
      )}
      <p className="pr-6">{message}</p>
      <button 
        onClick={onClose} 
        className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
        aria-label="Close notification"
      >
        <FiX size={16} />
      </button>
    </div>
  );
};

// Tooltip component
const Tooltip = ({ children, text }: { children: React.ReactNode; text: string }) => {
  return (
    <div className="relative group">
      {children}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
        {text}
      </div>
    </div>
  );
};

// Confirmation modal component
const ConfirmationModal = ({ 
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmButtonClass = "bg-red-600 hover:bg-red-700",
  onConfirm,
  onCancel
}: { 
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  // Focus trap for accessibility
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Tab') {
        // Trap focus inside modal
        if (!e.shiftKey && document.activeElement === confirmRef.current) {
          e.preventDefault();
          cancelRef.current?.focus();
        } else if (e.shiftKey && document.activeElement === cancelRef.current) {
          e.preventDefault();
          confirmRef.current?.focus();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-fadeIn"
      onClick={onCancel}
      aria-modal="true"
      role="dialog"
      aria-labelledby="confirmation-title"
    >
      <div 
        className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-xl border border-slate-700/70 max-w-md w-full animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-red-600/20 p-3 rounded-full">
            <FiAlertCircle size={24} className="text-red-500" />
          </div>
          <h3 id="confirmation-title" className="text-xl font-bold text-white">{title}</h3>
        </div>
        
        <p className="text-slate-300 mb-6">{message}</p>
        
        <div className="flex justify-end gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-800"
          >
            {cancelText}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`px-4 py-2 ${confirmButtonClass} text-white rounded-lg transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800`}
          >
            <FiLogOut size={16} />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    logout, 
    showOnboarding,
    setShowOnboarding,
    completeOnboarding
  } = useAuth();
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // UI state
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error' | 'info'} | null>(null);
  
  // Initialize activeTab from localStorage with improved error handling
  const [activeTab, setActiveTab] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedTab = localStorage.getItem(TAB_STORAGE_KEY);
        return savedTab || 'dashboard'; 
      }
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error accessing localStorage:`, error);
    }
    return 'dashboard';
  });
  
  // First visit detection
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [showingTips, setShowingTips] = useState(false);
  
  // Save activeTab to localStorage with error handling
  useEffect(() => {
    if (activeTab) {
      try {
        localStorage.setItem(TAB_STORAGE_KEY, activeTab);
        console.log(`[${CURRENT_TIMESTAMP}] Active tab saved: ${activeTab}`);
      } catch (error) {
        console.error(`[${CURRENT_TIMESTAMP}] Error saving to localStorage:`, error);
      }
    }
  }, [activeTab]);
  
  // Custom tab setter with animation and feedback
  const handleTabChange = (tab: string) => {
    if (tab === activeTab) return;
    
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.classList.add('animate-tabTransition');
      
      setTimeout(() => {
        setActiveTab(tab);
        mainContent.classList.remove('animate-tabTransition');
        
        // Haptic feedback on mobile
        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }
      }, 150);
    } else {
      setActiveTab(tab);
    }
    
    // Close mobile menu when changing tabs
    setMobileMenuOpen(false);
  };
  
  // Route protection - redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log(`[${CURRENT_TIMESTAMP}] User not authenticated, redirecting to login`);
      router.push('/?openModal=login');
    }
  }, [isAuthenticated, isLoading, router]);
  
  // Check for welcome parameter and show onboarding when needed
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const welcome = searchParams.get('welcome');
      
      if (welcome === 'true') {
        console.log(`[${CURRENT_TIMESTAMP}] Welcome parameter detected, enabling onboarding`);
        setShowOnboarding(true);
      }
      
      if (showOnboarding && !showOnboardingWizard) {
        console.log(`[${CURRENT_TIMESTAMP}] Showing onboarding wizard to ${user?.name || 'user'}`);
        setShowOnboardingWizard(true);
      }
    }
  }, [isAuthenticated, isLoading, searchParams, user, showOnboarding, showOnboardingWizard, setShowOnboarding]);
  
  // First visit feature tips
  useEffect(() => {
    if (isAuthenticated && isFirstVisit && !showOnboardingWizard) {
      const hasSeenTips = localStorage.getItem('mythayun-seen-tips');
      
      if (!hasSeenTips && !showingTips) {
        setTimeout(() => {
          setToast({ 
            message: 'Tip: Use keyboard shortcuts! Press ? for help', 
            type: 'info' 
          });
          setShowingTips(true);
          
          try {
            localStorage.setItem('mythayun-seen-tips', 'true');
          } catch (error) {
            console.error(`[${CURRENT_TIMESTAMP}] Error saving tips state:`, error);
          }
        }, 2000);
      }
      
      setIsFirstVisit(false);
    }
  }, [isAuthenticated, isFirstVisit, showOnboardingWizard, showingTips]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only respond to shortcuts if not in input fields
      if (
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      
      // ? key shows help
      if (e.key === '?') {
        setToast({ 
          message: 'Keyboard shortcuts: D (Dashboard), E (Events), F (Favorites), S (Settings), H (Home)', 
          type: 'info' 
        });
        return;
      }
      
      // Tab switching with single keys
      if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        if (e.key === 'd') {
          handleTabChange('dashboard');
        } else if (e.key === 'e') {
          handleTabChange('events');
        } else if (e.key === 'f') {
          handleTabChange('favorites');
        } else if (e.key === 's') {
          handleTabChange('settings');
        } else if (e.key === 'h') {
          router.push('/');
        }
      }
      
      // Escape closes mobile menu
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, mobileMenuOpen, router]);
  
  // Handle onboarding completion with preferences
  const handleOnboardingComplete = async (preferences: any) => {
    try {
      console.log(`[${CURRENT_TIMESTAMP}] Completing onboarding for: ${user?.email}`);
      console.log(`[${CURRENT_TIMESTAMP}] With preferences:`, JSON.stringify(preferences));
      
      await completeOnboarding(preferences);
      
      setShowOnboardingWizard(false);
      
      if (searchParams.get('welcome')) {
        router.replace('/dashboard');
      }
      
      // Show success toast
      setToast({ 
        message: 'Welcome to Mythayun! Your preferences have been saved.', 
        type: 'success' 
      });
      
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error completing onboarding:`, error);
      setShowOnboardingWizard(false);
      
      // Show error toast
      setToast({ 
        message: 'There was a problem saving your preferences. You can update them in Settings.', 
        type: 'error' 
      });
    }
  };
  
  // Handle logout process
  const handleLogout = () => {
    setShowLogoutModal(true);
  };
  
  // Perform logout when confirmed
  const confirmLogout = () => {
    try {
      localStorage.removeItem(TAB_STORAGE_KEY);
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error clearing localStorage:`, error);
    }
    
    logout();
    router.push('/');
  };
  
  // Display loading indicator with enhanced animation
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-20 w-20">
            <svg className="animate-spin h-20 w-20 text-indigo-500 opacity-30" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-indigo-400 text-xl font-bold">M</div>
          </div>
          <p className="text-indigo-300 text-lg animate-pulse">Loading your dashboard...</p>
          <div className="mt-2 text-xs text-slate-500">{CURRENT_TIMESTAMP}</div>
        </div>
      </div>
    );
  }
  
  // Protect against displaying if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Render the selected tab content
  const renderContent = () => {
    switch(activeTab) {
      case 'events':
        return <EventsTab />;
      case 'favorites':
        return <FavoritesTab />;
      case 'settings':
        return <SettingsTab />;
      case 'dashboard':
      default:
        return <DashboardTab />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Toast notifications */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      
      {/* Logout confirmation modal */}
      {showLogoutModal && (
        <ConfirmationModal
          title="Log Out"
          message="Are you sure you want to log out of your account? Your session will end."
          confirmText="Log Out"
          onConfirm={confirmLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
      
      {/* Mobile-optimized header with animations */}
      <header className="sticky top-0 z-40 backdrop-blur-lg shadow-sm border-b bg-slate-900/80 border-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="rounded-full w-8 h-8 flex items-center justify-center bg-gradient-to-br from-indigo-600 to-violet-500 text-white shadow-lg">
                <span className="font-extrabold text-sm">M</span>
              </div>
              <h1 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-500">
                Mythayun
              </h1>
              {!mobileMenuOpen && (
                <div className="ml-2 px-1.5 py-0.5 border border-slate-700 rounded text-xs text-slate-400 hidden sm:block">
                  {activeTab === 'dashboard' ? 'Dashboard' : 
                   activeTab === 'events' ? 'Events' : 
                   activeTab === 'favorites' ? 'Favorites' : 'Settings'}
                </div>
              )}
            </div>
            
            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors active:scale-95"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 rounded-full text-slate-300">
                <FiUser className="text-indigo-500" size={16} />
                <span>Welcome, </span>
                <span className="font-medium text-white">{user?.name || "User"}</span>
              </div>
              
              <Tooltip text="Return to home page">
                <button
                  onClick={() => router.push('/')}
                  className="p-2 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                  aria-label="Go to home page"
                >
                  <FiHome size={18} />
                </button>
              </Tooltip>
              
              <Tooltip text="Log out of your account">
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                  aria-label="Log out"
                >
                  <FiLogOut size={18} />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu dropdown with improved animations */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-slate-900/95 pt-16 pb-20 animate-fadeIn">
          <div className="px-4 py-6 space-y-6">
            <div className="flex items-center gap-4 mb-8 p-4 bg-gradient-to-br from-slate-800 to-slate-700/70 rounded-xl border border-slate-700/50 shadow-lg">
              <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl w-16 h-16 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                {user?.name?.slice(0, 2)?.toUpperCase() || "UT"}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{user?.name || "User"}</h2>
                <p className="text-slate-400">{user?.email || "user@example.com"}</p>
                <div className="mt-2 flex items-center gap-1 text-xs text-indigo-400">
                  <FiShield size={12} />
                  <span>Standard Account</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 animate-stagger">
              <button 
                onClick={() => handleTabChange('dashboard')}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all text-white ${
                  activeTab === 'dashboard' 
                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md' 
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
                aria-current={activeTab === 'dashboard' ? 'page' : undefined}
              >
                <div className="flex items-center gap-3">
                  <FiActivity size={22} className={activeTab === 'dashboard' ? 'text-white' : 'text-slate-400'} />
                  <span className="text-lg">My Dashboard</span>
                  <span className="ml-2 text-xs opacity-70">(D)</span>
                </div>
                <FiChevronRight />
              </button>
              
              <button 
                onClick={() => handleTabChange('events')}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all text-white ${
                  activeTab === 'events' 
                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md' 
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
                aria-current={activeTab === 'events' ? 'page' : undefined}
              >
                <div className="flex items-center gap-3">
                  <FiCalendar size={22} className={activeTab === 'events' ? 'text-white' : 'text-slate-400'} />
                  <span className="text-lg">My Events</span>
                  <span className="ml-2 text-xs opacity-70">(E)</span>
                </div>
                <FiChevronRight />
              </button>
              
              <button 
                onClick={() => handleTabChange('favorites')}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all text-white ${
                  activeTab === 'favorites' 
                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md' 
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
                aria-current={activeTab === 'favorites' ? 'page' : undefined}
              >
                <div className="flex items-center gap-3">
                  <FiHeart size={22} className={activeTab === 'favorites' ? 'text-white' : 'text-slate-400'} />
                  <span className="text-lg">Favorites</span>
                  <span className="ml-2 text-xs opacity-70">(F)</span>
                </div>
                <FiChevronRight />
              </button>
              
              <button 
                onClick={() => handleTabChange('settings')}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all text-white ${
                  activeTab === 'settings' 
                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md' 
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
                aria-current={activeTab === 'settings' ? 'page' : undefined}
              >
                <div className="flex items-center gap-3">
                  <FiSettings size={22} className={activeTab === 'settings' ? 'text-white' : 'text-slate-400'} />
                  <span className="text-lg">Settings</span>
                  <span className="ml-2 text-xs opacity-70">(S)</span>
                </div>
                <FiChevronRight />
              </button>
              
              <div className="mt-6 text-xs text-slate-500 bg-slate-800/50 rounded-lg p-3 flex items-center gap-2 animate-fadeIn">
                <FiInfo size={14} className="text-indigo-400" />
                <span>Press ? anywhere to view keyboard shortcuts</span>
              </div>
            </div>
            
            <div className="pt-4 space-y-4 animate-stagger" style={{animationDelay: '0.2s'}}>
              <button 
                onClick={() => router.push('/')}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-slate-800 text-white hover:bg-slate-700 border border-slate-700/50 transition-colors active:scale-98"
                aria-label="Return to home"
              >
                <FiHome size={20} />
                <span>Home</span>
                <span className="ml-2 text-xs opacity-70">(H)</span>
              </button>
              
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-red-600/90 hover:bg-red-700 text-white transition-colors active:scale-98"
                aria-label="Log out"
              >
                <FiLogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content based on desktop or mobile view */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* For desktop: Sidebar + Content layout */}
        <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Sidebar with improved animations */}
          <div className="md:col-span-1">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-lg mb-6 border border-slate-700/50 animate-fadeIn">
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl w-16 h-16 flex items-center justify-center text-2xl font-bold text-white shadow-md transition-transform hover:scale-105 ring-2 ring-indigo-500/20">
                  {user?.name?.slice(0, 2)?.toUpperCase() || "UT"}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{user?.name || "User"}</h2>
                  <p className="text-slate-400">{user?.email || "user@example.com"}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-indigo-400">
                    <FiShield size={12} />
                    <span>Standard Account</span>
                  </div>
                </div>
              </div>
              
              <nav aria-label="Dashboard navigation" className="space-y-2">
                <Tooltip text="Dashboard (press D)">
                  <button 
                    onClick={() => handleTabChange('dashboard')}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                      activeTab === 'dashboard' 
                        ? 'text-white bg-indigo-600 shadow-sm focus:ring-indigo-500' 
                        : 'text-slate-300 hover:bg-slate-700/30 focus:ring-slate-500'
                    }`}
                    aria-current={activeTab === 'dashboard' ? 'page' : undefined}
                  >
                    <FiActivity className={activeTab === 'dashboard' ? "text-white" : "text-slate-400"} />
                    <span>My Dashboard</span>
                    <span className="ml-auto text-xs opacity-70">(D)</span>
                  </button>
                </Tooltip>
                
                <Tooltip text="Events (press E)">
                  <button 
                    onClick={() => handleTabChange('events')}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                      activeTab === 'events' 
                        ? 'text-white bg-indigo-600 shadow-sm focus:ring-indigo-500' 
                        : 'text-slate-300 hover:bg-slate-700/30 focus:ring-slate-500'
                    }`}
                    aria-current={activeTab === 'events' ? 'page' : undefined}
                  >
                    <FiCalendar className={activeTab === 'events' ? "text-white" : "text-slate-400"} />
                    <span>My Events</span>
                    <span className="ml-auto text-xs opacity-70">(E)</span>
                  </button>
                </Tooltip>
                
                <Tooltip text="Favorites (press F)">
                  <button 
                    onClick={() => handleTabChange('favorites')}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                      activeTab === 'favorites' 
                        ? 'text-white bg-indigo-600 shadow-sm focus:ring-indigo-500' 
                        : 'text-slate-300 hover:bg-slate-700/30 focus:ring-slate-500'
                    }`}
                    aria-current={activeTab === 'favorites' ? 'page' : undefined}
                  >
                    <FiHeart className={activeTab === 'favorites' ? "text-white" : "text-slate-400"} />
                    <span>Favorites</span>
                    <span className="ml-auto text-xs opacity-70">(F)</span>
                  </button>
                </Tooltip>
                
                <Tooltip text="Settings (press S)">
                  <button 
                    onClick={() => handleTabChange('settings')}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                      activeTab === 'settings' 
                        ? 'text-white bg-indigo-600 shadow-sm focus:ring-indigo-500' 
                        : 'text-slate-300 hover:bg-slate-700/30 focus:ring-slate-500'
                    }`}
                    aria-current={activeTab === 'settings' ? 'page' : undefined}
                  >
                    <FiSettings className={activeTab === 'settings' ? "text-white" : "text-slate-400"} />
                    <span>Settings</span>
                    <span className="ml-auto text-xs opacity-70">(S)</span>
                  </button>
                </Tooltip>
              </nav>
              
              {/* Keyboard shortcut help */}
              <div className="mt-6 pt-4 border-t border-slate-700/50">
                <div 
                  className="text-xs text-slate-400 p-2 bg-slate-800/40 rounded-lg hover:bg-slate-800/60 cursor-help"
                  onClick={() => setToast({
                    message: 'Keyboard shortcuts: D (Dashboard), E (Events), F (Favorites), S (Settings), H (Home), ? (Help)',
                    type: 'info'
                  })}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">Keyboard Shortcuts</span>
                    <span className="bg-slate-700 px-1.5 rounded text-xs">?</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>D, E, F, S, H</span>
                    <FiHelpCircle size={12} className="text-indigo-400" />
                  </div>
                </div>
              </div>
              
              {/* System info */}
              <div className="mt-6 text-xs text-slate-500">
                <div className="flex items-center gap-1 mb-1">
                  <FiUser size={10} />
                  <span>{CURRENT_USER}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FiClock size={10} />
                  <span>{CURRENT_TIMESTAMP}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-6 shadow-lg text-white animate-fadeIn" style={{animationDelay: '0.2s'}}>
              <div className="flex items-center gap-2 mb-2">
                <FiStar className="text-yellow-300" size={20} />
                <h3 className="text-lg font-bold">Pro Subscription</h3>
              </div>
              <p className="mb-4 opacity-90">Access all premium features and enjoy an ad-free experience.</p>
              <button className="w-full py-2.5 rounded-xl bg-white text-indigo-600 font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 active:scale-98 focus:outline-none focus:ring-2 focus:ring-white/50">
                <FiShield size={18} />
                <span>Upgrade Now</span>
              </button>
            </div>
          </div>
          
          {/* Main content for desktop with transition animations */}
          <div 
            id="main-content"
            className="md:col-span-2 lg:col-span-3 animate-fadeIn"
            style={{animationDelay: '0.1s'}}
          >
            {renderContent()}
          </div>
        </div>
        
        {/* For mobile: Content only */}
        <div className="md:hidden animate-fadeIn">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            {activeTab === 'dashboard' ? (
              <>
                <FiActivity className="text-indigo-400" />
                <span>My Dashboard</span>
              </>
            ) : activeTab === 'events' ? (
              <>
                <FiCalendar className="text-indigo-400" />
                <span>My Events</span>
              </>
            ) : activeTab === 'favorites' ? (
              <>
                <FiHeart className="text-indigo-400" />
                <span>My Favorites</span>
              </>
            ) : (
              <>
                <FiSettings className="text-indigo-400" />
                <span>Settings</span>
              </>
            )}
            <span className="ml-2 text-xs text-slate-500">
              ({activeTab.charAt(0).toUpperCase()})
            </span>
          </h2>
          
          <div id="main-content">
            {renderContent()}
          </div>
          
          {/* Mobile Pro Upgrade Banner */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-5 shadow-lg text-white mt-6 animate-fadeIn" style={{animationDelay: '0.3s'}}>
            <div className="flex items-center gap-2 mb-2">
              <FiStar className="text-yellow-300" size={18} />
              <h3 className="text-lg font-bold">Pro Subscription</h3>
            </div>
            <p className="mb-4 opacity-90">Access all premium features.</p>
            <button className="w-full py-3 rounded-xl bg-white text-indigo-600 font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 active:scale-98">
              <FiShield size={18} />
              <span>Upgrade Now</span>
            </button>
          </div>
        </div>
      </main>

      {/* Help button visible on all screens */}
      <Tooltip text="Keyboard shortcuts (?)">
        <button
          onClick={() => setToast({
            message: 'Keyboard shortcuts: D (Dashboard), E (Events), F (Favorites), S (Settings), H (Home)',
            type: 'info'
          })}
          className="fixed bottom-20 md:bottom-6 right-6 z-20 w-10 h-10 bg-slate-800/80 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-indigo-700 transition-colors shadow-lg active:scale-95 md:active:scale-90"
          aria-label="Show keyboard shortcuts"
        >
          <FiHelpCircle size={20} />
        </button>
      </Tooltip>

      {/* Mobile bottom navigation bar with active indicators */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-slate-800/90 border-t border-slate-700 z-40 backdrop-blur-lg shadow-lg">
        <div className="grid grid-cols-4 h-16">
          <button 
            onClick={() => handleTabChange('dashboard')}
            className={`flex flex-col items-center justify-center relative ${activeTab === 'dashboard' ? 'text-indigo-400' : 'text-slate-400'}`}
            aria-label="Dashboard"
            aria-current={activeTab === 'dashboard' ? 'page' : undefined}
          >
            {activeTab === 'dashboard' && (
              <div className="absolute bottom-0 w-6 h-0.5 bg-indigo-400 rounded-full"></div>
            )}
            <FiActivity size={20} />
            <span className="text-xs mt-1">Dashboard</span>
          </button>
          <button 
            onClick={() => handleTabChange('events')}
            className={`flex flex-col items-center justify-center relative ${activeTab === 'events' ? 'text-indigo-400' : 'text-slate-400'}`}
            aria-label="Events"
            aria-current={activeTab === 'events' ? 'page' : undefined}
          >
            {activeTab === 'events' && (
              <div className="absolute bottom-0 w-6 h-0.5 bg-indigo-400 rounded-full"></div>
            )}
            <FiCalendar size={20} />
            <span className="text-xs mt-1">Events</span>
          </button>
          <button 
            onClick={() => handleTabChange('favorites')}
            className={`flex flex-col items-center justify-center relative ${activeTab === 'favorites' ? 'text-indigo-400' : 'text-slate-400'}`}
            aria-label="Favorites"
            aria-current={activeTab === 'favorites' ? 'page' : undefined}
          >
            {activeTab === 'favorites' && (
              <div className="absolute bottom-0 w-6 h-0.5 bg-indigo-400 rounded-full"></div>
            )}
            <FiHeart size={20} />
            <span className="text-xs mt-1">Favorites</span>
          </button>
          <button 
            onClick={() => handleTabChange('settings')}
            className={`flex flex-col items-center justify-center relative ${activeTab === 'settings' ? 'text-indigo-400' : 'text-slate-400'}`}
            aria-label="Settings"
            aria-current={activeTab === 'settings' ? 'page' : undefined}
          >
            {activeTab === 'settings' && (
              <div className="absolute bottom-0 w-6 h-0.5 bg-indigo-400 rounded-full"></div>
            )}
            <FiSettings size={20} />
            <span className="text-xs mt-1">Settings</span>
          </button>
        </div>
      </div>

      {/* Footer with improved layout */}
      <footer className="hidden md:block max-w-7xl mx-auto px-4 py-6 mt-8 border-t border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-slate-500">© 2025 Mythayun. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-2 md:mt-0">
            <a href="#" className="text-sm text-slate-500 hover:text-indigo-400 transition-colors">Privacy</a>
            <a href="#" className="text-sm text-slate-500 hover:text-indigo-400 transition-colors">Terms</a>
            <a href="#" className="text-sm text-slate-500 hover:text-indigo-400 transition-colors">Support</a>
          </div>
        </div>
      </footer>
      
      {/* Add padding at bottom on mobile to account for the navigation bar */}
      <div className="md:hidden h-20"></div>

      {/* Onboarding Wizard for new users */}
      {showOnboardingWizard && (
        <OnboardingWizard onComplete={handleOnboardingComplete} />
      )}
      
      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes tabTransition {
          0% { opacity: 1; transform: translateY(0); }
          50% { opacity: 0.8; transform: translateY(5px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
        
        .animate-tabTransition {
          animation: tabTransition 0.3s ease-out;
        }
        
        .animate-stagger > * {
          opacity: 0;
          transform: translateY(10px);
          animation: fadeIn 0.4s ease-out forwards;
        }
        
        .animate-stagger > *:nth-child(1) { animation-delay: 0.1s; }
        .animate-stagger > *:nth-child(2) { animation-delay: 0.2s; }
        .animate-stagger > *:nth-child(3) { animation-delay: 0.3s; }
        .animate-stagger > *:nth-child(4) { animation-delay: 0.4s; }
        .animate-stagger > *:nth-child(5) { animation-delay: 0.5s; }
        
        .active-scale-98:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
}