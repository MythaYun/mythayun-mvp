'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import OnboardingWizard from '../components/onboarding/OnboardingWizard'; 
import { 
  FiUser, FiLogOut, FiHome, FiSettings, FiCalendar, 
  FiMessageCircle, FiHeart, FiActivity, FiMenu, FiX 
} from 'react-icons/fi';

// Current system information
const CURRENT_TIMESTAMP = "2025-05-16 01:54:51";
const CURRENT_USER = "Sdiabate1337";

export default function Dashboard() {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    logout, 
    showOnboarding, // Use the shared state from AuthContext
    setShowOnboarding, // Direct setter if needed
    completeOnboarding // Function to mark onboarding as complete
  } = useAuth();
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);
  
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
      // Check if the welcome parameter is in the URL
      const welcome = searchParams.get('welcome');
      
      if (welcome === 'true') {
        console.log(`[${CURRENT_TIMESTAMP}] Welcome parameter detected, enabling onboarding`);
        setShowOnboarding(true);
      }
      
      // If showOnboarding is true (from context), show the wizard
      if (showOnboarding && !showOnboardingWizard) {
        console.log(`[${CURRENT_TIMESTAMP}] Showing onboarding wizard to ${user?.name || 'user'}`);
        setShowOnboardingWizard(true);
      }
    }
  }, [isAuthenticated, isLoading, searchParams, user, showOnboarding, showOnboardingWizard, setShowOnboarding]);
  
  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    try {
      console.log(`[${CURRENT_TIMESTAMP}] Completing onboarding for user: ${user?.email}`);
      
      // Call the AuthContext function to update server and state
      await completeOnboarding();
      
      // Update local UI state
      setShowOnboardingWizard(false);
      
      // Remove welcome parameter from URL if it exists
      if (searchParams.get('welcome')) {
        router.replace('/dashboard');
      }
      
      console.log(`[${CURRENT_TIMESTAMP}] Onboarding completed successfully`);
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error completing onboarding:`, error);
      // Still close the wizard even if there's an error
      setShowOnboardingWizard(false);
    }
  };
  
  // Handle logout with confirmation
  const handleLogout = () => {
    if (confirmingLogout) {
      logout();
      router.push('/'); // Redirect to home page after logout
    } else {
      setConfirmingLogout(true);
      // Reset after 3 seconds if there's no confirmation
      setTimeout(() => setConfirmingLogout(false), 3000);
    }
  };
  
  // Display loading indicator while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-indigo-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-indigo-300 text-lg">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }
  
  // Protect against displaying if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Mobile menu tabs
  const renderContent = () => {
    switch(activeTab) {
      case 'events':
        return <EventsTab />;
      case 'favorites':
        return <FavoritesTab />;
      case 'messages':
        return <MessagesTab />;
      case 'settings':
        return <SettingsTab />;
      case 'dashboard':
      default:
        return <DashboardTab />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Mobile-optimized header */}
      <header className="sticky top-0 z-40 backdrop-blur-lg shadow-sm border-b bg-slate-900/70 border-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-500">
                Mythayun
              </h1>
            </div>
            
            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-full bg-slate-800 text-slate-300"
              >
                {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-300">
                <FiUser className="text-indigo-500" />
                <span>Bienvenue, </span>
                <span>{user?.name || "Utilisateur"}</span>
              </div>
              <button
                onClick={handleLogout}
                className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-sm transition-all 
                  ${confirmingLogout 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
              >
                <FiLogOut className={confirmingLogout ? "text-white" : "text-slate-400"} />
                {confirmingLogout ? "Confirmer" : "Déconnexion"}
              </button>
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 px-4 py-2 rounded-full shadow-sm transition-all bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700"
              >
                <FiHome className="text-slate-400" />
                <span>Accueil</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-slate-900/95 pt-16 pb-20">
          <div className="px-4 py-6 space-y-6">
            <div className="flex items-center gap-4 mb-8 p-4 bg-slate-800 rounded-xl">
              <div className="bg-indigo-600 rounded-xl w-16 h-16 flex items-center justify-center text-2xl font-bold text-white">
                {user?.name?.slice(0, 2)?.toUpperCase() || "UT"}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{user?.name || "Utilisateur"}</h2>
                <p className="text-slate-400">{user?.email || "utilisateur@exemple.com"}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <button 
                onClick={() => {setActiveTab('dashboard'); setMobileMenuOpen(false);}}
                className="w-full flex items-center gap-3 p-4 rounded-xl transition-colors text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <FiActivity size={22} />
                <span className="text-lg">Mon Dashboard</span>
              </button>
              <button 
                onClick={() => {setActiveTab('events'); setMobileMenuOpen(false);}}
                className="w-full flex items-center gap-3 p-4 rounded-xl transition-colors text-white bg-slate-800 hover:bg-slate-700"
              >
                <FiCalendar size={22} />
                <span className="text-lg">Mes Événements</span>
              </button>
              <button 
                onClick={() => {setActiveTab('favorites'); setMobileMenuOpen(false);}}
                className="w-full flex items-center gap-3 p-4 rounded-xl transition-colors text-white bg-slate-800 hover:bg-slate-700"
              >
                <FiHeart size={22} />
                <span className="text-lg">Favoris</span>
              </button>
              <button 
                onClick={() => {setActiveTab('messages'); setMobileMenuOpen(false);}}
                className="w-full flex items-center gap-3 p-4 rounded-xl transition-colors text-white bg-slate-800 hover:bg-slate-700"
              >
                <FiMessageCircle size={22} />
                <span className="text-lg">Messages</span>
              </button>
              <button 
                onClick={() => {setActiveTab('settings'); setMobileMenuOpen(false);}}
                className="w-full flex items-center gap-3 p-4 rounded-xl transition-colors text-white bg-slate-800 hover:bg-slate-700"
              >
                <FiSettings size={22} />
                <span className="text-lg">Paramètres</span>
              </button>
            </div>
            
            <div className="pt-4 space-y-4">
              <button 
                onClick={() => router.push('/')}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-slate-800 text-white hover:bg-slate-700"
              >
                <FiHome size={20} />
                <span>Accueil</span>
              </button>
              <button 
                onClick={handleLogout}
                className={`w-full flex items-center justify-center gap-2 p-4 rounded-xl 
                  ${confirmingLogout 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-slate-800 text-white hover:bg-slate-700'
                  }`}
              >
                <FiLogOut size={20} />
                <span>{confirmingLogout ? "Confirmer la déconnexion" : "Déconnexion"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content based on desktop or mobile view */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* For desktop: Sidebar + Content layout */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-slate-800 rounded-2xl p-6 shadow-lg mb-6">
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-indigo-600 rounded-xl w-16 h-16 flex items-center justify-center text-2xl font-bold text-white">
                  {user?.name?.slice(0, 2)?.toUpperCase() || "UT"}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{user?.name || "Utilisateur"}</h2>
                  <p className="text-slate-400">{user?.email || "utilisateur@exemple.com"}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${activeTab === 'dashboard' ? 'text-indigo-400 bg-slate-700/50' : 'text-slate-300 hover:bg-slate-700/30'}`}>
                  <FiActivity className={activeTab === 'dashboard' ? "text-indigo-400" : "text-slate-400"} />
                  <span>Mon Dashboard</span>
                </button>
                <button 
                  onClick={() => setActiveTab('events')}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${activeTab === 'events' ? 'text-indigo-400 bg-slate-700/50' : 'text-slate-300 hover:bg-slate-700/30'}`}>
                  <FiCalendar className={activeTab === 'events' ? "text-indigo-400" : "text-slate-400"} />
                  <span>Mes Événements</span>
                </button>
                <button 
                  onClick={() => setActiveTab('favorites')}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${activeTab === 'favorites' ? 'text-indigo-400 bg-slate-700/50' : 'text-slate-300 hover:bg-slate-700/30'}`}>
                  <FiHeart className={activeTab === 'favorites' ? "text-indigo-400" : "text-slate-400"} />
                  <span>Favoris</span>
                </button>
                <button 
                  onClick={() => setActiveTab('messages')}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${activeTab === 'messages' ? 'text-indigo-400 bg-slate-700/50' : 'text-slate-300 hover:bg-slate-700/30'}`}>
                  <FiMessageCircle className={activeTab === 'messages' ? "text-indigo-400" : "text-slate-400"} />
                  <span>Messages</span>
                </button>
                <button 
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${activeTab === 'settings' ? 'text-indigo-400 bg-slate-700/50' : 'text-slate-300 hover:bg-slate-700/30'}`}>
                  <FiSettings className={activeTab === 'settings' ? "text-indigo-400" : "text-slate-400"} />
                  <span>Paramètres</span>
                </button>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-6 shadow-lg text-white">
              <h3 className="text-lg font-bold mb-2">Abonnement Pro</h3>
              <p className="mb-4 opacity-80">Accédez à toutes les fonctionnalités premium et profitez d'une expérience sans publicité.</p>
              <button className="w-full py-2 rounded-xl bg-white text-indigo-600 font-medium hover:bg-slate-100 transition-colors">
                Mettre à niveau
              </button>
            </div>
          </div>
          
          {/* Main content for desktop */}
          <div className="md:col-span-2">
            {renderContent()}
          </div>
        </div>
        
        {/* For mobile: Content only (the sidebar is handled by the mobile menu) */}
        <div className="md:hidden">
          {renderContent()}
          
          {/* Mobile Pro Upgrade Banner */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-5 shadow-lg text-white mt-6">
            <h3 className="text-lg font-bold mb-2">Abonnement Pro</h3>
            <p className="mb-4 opacity-80">Accédez à toutes les fonctionnalités premium.</p>
            <button className="w-full py-3 rounded-xl bg-white text-indigo-600 font-medium hover:bg-slate-100 transition-colors">
              Mettre à niveau
            </button>
          </div>
        </div>
      </main>

      {/* Mobile bottom navigation bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 z-40">
        <div className="grid grid-cols-5 h-16">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center ${activeTab === 'dashboard' ? 'text-indigo-400' : 'text-slate-400'}`}
          >
            <FiActivity size={20} />
            <span className="text-xs mt-1">Dashboard</span>
          </button>
          <button 
            onClick={() => setActiveTab('events')}
            className={`flex flex-col items-center justify-center ${activeTab === 'events' ? 'text-indigo-400' : 'text-slate-400'}`}
          >
            <FiCalendar size={20} />
            <span className="text-xs mt-1">Événements</span>
          </button>
          <button 
            onClick={() => setActiveTab('favorites')}
            className={`flex flex-col items-center justify-center ${activeTab === 'favorites' ? 'text-indigo-400' : 'text-slate-400'}`}
          >
            <FiHeart size={20} />
            <span className="text-xs mt-1">Favoris</span>
          </button>
          <button 
            onClick={() => setActiveTab('messages')}
            className={`flex flex-col items-center justify-center ${activeTab === 'messages' ? 'text-indigo-400' : 'text-slate-400'}`}
          >
            <FiMessageCircle size={20} />
            <span className="text-xs mt-1">Messages</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center ${activeTab === 'settings' ? 'text-indigo-400' : 'text-slate-400'}`}
          >
            <FiSettings size={20} />
            <span className="text-xs mt-1">Paramètres</span>
          </button>
        </div>
      </div>

      {/* Footer - hidden on mobile to save space */}
      <footer className="hidden md:block max-w-7xl mx-auto px-4 py-6 mt-8 border-t border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-slate-500">© 2025 Mythayun. Tous droits réservés.</p>
          <p className="text-sm text-slate-500 mt-2 md:mt-0">Dernière mise à jour: {CURRENT_TIMESTAMP}</p>
        </div>
      </footer>
      
      {/* Add padding at bottom on mobile to account for the navigation bar */}
      <div className="md:hidden h-20"></div>

      {/* Onboarding Wizard for new users */}
      {showOnboardingWizard && (
        <OnboardingWizard onComplete={handleOnboardingComplete} />
      )}
    </div>
  );
}

// Tab component definitions
const DashboardTab = () => (
  <div className="space-y-6">
    <div className="bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg">
      <h2 className="text-xl font-bold mb-5 text-white">Tableaux de bord personnels</h2>
      <p className="text-slate-400 mb-4">Bienvenue sur votre espace personnel. Voici un aperçu de votre activité récente et des événements à venir.</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-indigo-400">Matchs suivis</h3>
            <span className="text-slate-300 font-bold text-xl">5</span>
          </div>
          <p className="text-sm text-slate-400">Prochain match: PSG vs. Real Madrid</p>
        </div>
        <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-indigo-400">Soirées football</h3>
            <span className="text-slate-300 font-bold text-xl">2</span>
          </div>
          <p className="text-sm text-slate-400">Prochainement: Finale Champions League</p>
        </div>
      </div>
      
      <h3 className="text-lg font-bold mb-4 text-white">Événements à venir</h3>
      <div className="space-y-3">
        <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors cursor-pointer">
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400">
            <FiCalendar size={20} />
          </div>
          <div className="flex-grow">
            <h4 className="font-medium text-white">Champions League</h4>
            <p className="text-sm text-slate-400">20 mai 2025 • 20:45</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors cursor-pointer">
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400">
            <FiCalendar size={20} />
          </div>
          <div className="flex-grow">
            <h4 className="font-medium text-white">Premier League</h4>
            <p className="text-sm text-slate-400">23 mai 2025 • 16:00</p>
          </div>
        </div>
      </div>
    </div>
    
    <div className="bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-white">Statistiques d'utilisation</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-xl bg-slate-700/30 text-center">
          <h3 className="text-3xl font-bold text-indigo-400">12</h3>
          <p className="text-sm text-slate-400">Visites</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-700/30 text-center">
          <h3 className="text-3xl font-bold text-indigo-400">5</h3>
          <p className="text-sm text-slate-400">Matchs</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-700/30 text-center">
          <h3 className="text-3xl font-bold text-indigo-400">3</h3>
          <p className="text-sm text-slate-400">Commentaires</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-700/30 text-center">
          <h3 className="text-3xl font-bold text-indigo-400">8</h3>
          <p className="text-sm text-slate-400">Favoris</p>
        </div>
      </div>
    </div>
  </div>
);

// Placeholder components for other tabs
const EventsTab = () => (
  <div className="bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg">
    <h2 className="text-xl font-bold mb-6 text-white">Mes Événements</h2>
    <p className="text-slate-400 mb-4">Retrouvez ici tous vos événements à venir et passés.</p>
    
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
          <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400">
            <FiCalendar size={22} />
          </div>
          <div className="flex-grow">
            <h4 className="font-medium text-white">Événement de football #{i}</h4>
            <p className="text-sm text-slate-400">{20 + i} mai 2025 • 19:00</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-xs">À venir</span>
              <span className="px-2 py-0.5 bg-slate-600/40 text-slate-300 rounded text-xs">12 participants</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const FavoritesTab = () => (
  <div className="bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg">
    <h2 className="text-xl font-bold mb-6 text-white">Mes Favoris</h2>
    <p className="text-slate-400 mb-4">Accédez rapidement à vos équipes et matchs favoris.</p>
    
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-slate-700/30 rounded-xl p-4 hover:bg-slate-700/50 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400">
              <FiHeart size={18} />
            </div>
            <h3 className="font-medium text-white">Équipe favorite #{i}</h3>
          </div>
          <p className="text-sm text-slate-400">Prochain match le {18 + i} mai 2025</p>
        </div>
      ))}
    </div>
  </div>
);

const MessagesTab = () => (
  <div className="bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg">
    <h2 className="text-xl font-bold mb-6 text-white">Messages</h2>
    <p className="text-slate-400 mb-4">Vos conversations avec d'autres passionnés de football.</p>
    
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
            U{i}
          </div>
          <div className="flex-grow">
            <div className="flex justify-between">
              <h4 className="font-medium text-white">Utilisateur #{i}</h4>
              <span className="text-xs text-slate-400">10:2{i} AM</span>
            </div>
            <p className="text-sm text-slate-400 truncate">Dernier message de la conversation avec cet utilisateur...</p>
          </div>
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
            {i}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SettingsTab = () => (
  <div className="bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg">
    <h2 className="text-xl font-bold mb-6 text-white">Paramètres</h2>
    <p className="text-slate-400 mb-4">Personnalisez votre expérience Mythayun.</p>
    
    <div className="space-y-5">
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-white">Compte</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <span className="text-slate-300">Nom d'utilisateur</span>
            <button className="text-indigo-400 hover:text-indigo-300">Modifier</button>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <span className="text-slate-300">Adresse e-mail</span>
            <button className="text-indigo-400 hover:text-indigo-300">Modifier</button>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <span className="text-slate-300">Mot de passe</span>
            <button className="text-indigo-400 hover:text-indigo-300">Modifier</button>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-white">Préférences</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <span className="text-slate-300">Notifications</span>
            <div className="w-12 h-6 bg-indigo-600 rounded-full relative">
              <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5"></div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <span className="text-slate-300">Mode sombre</span>
            <div className="w-12 h-6 bg-indigo-600 rounded-full relative">
              <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="pt-2">
        <button className="w-full py-3 text-white bg-red-600 hover:bg-red-700 rounded-xl font-medium transition-colors">
          Supprimer mon compte
        </button>
      </div>
    </div>
  </div>
);