'use client';

import { useState, useEffect } from 'react';
import { 
  FiX, FiArrowRight, FiArrowLeft, FiCheck, FiBell, 
  FiShield, FiStar, FiTrendingUp, FiInfo, FiHeart, FiUser,
  FiCalendar
} from 'react-icons/fi';
import { useAuth } from '@/lib/contexts/AuthContext';

// Current system info
const CURRENT_TIMESTAMP = "2025-05-17 02:37:39";
const CURRENT_USER = "Sdiabate1337";

// Update interface to pass preferences to parent
interface OnboardingWizardProps {
  onComplete: (preferences: any) => void; // Modified to accept preferences
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
  icon?: React.ReactNode;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { user } = useAuth();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [animatingOut, setAnimatingOut] = useState(false);
  const [animatingIn, setAnimatingIn] = useState(true);
  const [preferences, setPreferences] = useState({
    favoriteLeagues: [] as string[],
    favoriteTeams: [] as string[],
    notificationPreferences: {
      matchReminders: true,
      scoreUpdates: true,
      newsAlerts: false,
    },
    displayPreferences: {
      darkMode: true,
      compactView: false,
    }
  });
  
  // Handle initial animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatingIn(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Define all onboarding steps
  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Mythayun!',
      description: 'Let\'s set up your experience in a few simple steps.',
      component: <WelcomeStep username={user?.name || CURRENT_USER} />,
      icon: <FiUser className="text-indigo-300" />
    },
    {
      id: 'leagues',
      title: 'Which leagues do you follow?',
      description: 'Select your favorite leagues to customize your content.',
      component: (
        <LeaguesStep 
          selectedLeagues={preferences.favoriteLeagues} 
          onChange={(leagues) => setPreferences({...preferences, favoriteLeagues: leagues})} 
        />
      ),
      icon: <FiStar className="text-indigo-300" />
    },
    {
      id: 'teams',
      title: 'Your favorite teams',
      description: 'Select the teams you want to follow as a priority.',
      component: (
        <TeamsStep 
          selectedTeams={preferences.favoriteTeams} 
          onChange={(teams) => setPreferences({...preferences, favoriteTeams: teams})} 
        />
      ),
      icon: <FiHeart className="text-indigo-300" />
    },
    {
      id: 'notifications',
      title: 'Configure your notifications',
      description: 'Choose the types of alerts you want to receive.',
      component: (
        <NotificationsStep 
          notificationPreferences={preferences.notificationPreferences}
          onChange={(notificationPrefs) => setPreferences({
            ...preferences, 
            notificationPreferences: notificationPrefs
          })}
        />
      ),
      icon: <FiBell className="text-indigo-300" />
    },
    {
      id: 'complete',
      title: 'All done!',
      description: 'Your space is now customized according to your preferences.',
      component: <CompleteStep username={user?.name || CURRENT_USER} preferences={preferences} />,
      icon: <FiCheck className="text-indigo-300" />
    }
  ];

  // Handle step navigation with animation
  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setAnimatingOut(true);
      setTimeout(() => {
        setCurrentStepIndex(currentStepIndex + 1);
        setAnimatingOut(false);
      }, 200);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setAnimatingOut(true);
      setTimeout(() => {
        setCurrentStepIndex(currentStepIndex - 1);
        setAnimatingOut(false);
      }, 200);
    }
  };

  // Handle onboarding completion
  const completeOnboarding = async () => {
    try {
      console.log(`[${CURRENT_TIMESTAMP}] Onboarding completed by ${CURRENT_USER}, passing preferences to parent:`, 
        JSON.stringify(preferences));
      
      // Pass preferences to the parent component
      onComplete(preferences);
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error during onboarding completion:`, error);
      // Still pass preferences even if there's an error
      onComplete(preferences);
    }
  };

  // Skip onboarding
  const skipOnboarding = () => {
    console.log(`[${CURRENT_TIMESTAMP}] Onboarding skipped by ${CURRENT_USER}, passing default preferences`);
    onComplete(preferences);
  };

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-opacity duration-300 animate-fadeIn">
      <div className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden border border-slate-700/50 relative">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full filter blur-3xl opacity-5"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500 rounded-full filter blur-3xl opacity-5"></div>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-600 p-6 sm:p-8 relative">
          <button 
            onClick={skipOnboarding} 
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-2 hover:bg-indigo-800/20 rounded-full"
            aria-label="Close"
          >
            <FiX size={24} />
          </button>
          
          <div className="flex items-center gap-3">
            {currentStep.icon && (
              <div className="hidden sm:flex w-10 h-10 rounded-full bg-indigo-800/50 items-center justify-center">
                {currentStep.icon}
              </div>
            )}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                {currentStep.title}
              </h2>
              <p className="text-indigo-100 mt-1 text-sm sm:text-base">{currentStep.description}</p>
            </div>
          </div>
          
          {/* Session info */}
          <div className="absolute top-3 left-4 text-[10px] text-indigo-200/50 hidden sm:block">
            Session: {CURRENT_USER} • {CURRENT_TIMESTAMP}
          </div>
          
          {/* Progress bar */}
          <div className="mt-6 flex gap-2">
            {steps.map((step, idx) => (
              <div 
                key={step.id} 
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                  idx < currentStepIndex 
                    ? 'bg-white' 
                    : idx === currentStepIndex 
                      ? 'bg-white shadow-glow' 
                      : 'bg-indigo-400/30'
                }`}
              ></div>
            ))}
          </div>
          
          {/* Step indicators */}
          <div className="mt-3 flex justify-between items-center">
            <div className="text-xs text-indigo-100">
              Step {currentStepIndex + 1} of {steps.length}
            </div>
            <div className="text-xs text-indigo-100">
              {Math.round(((currentStepIndex + 1) / steps.length) * 100)}% Complete
            </div>
          </div>
        </div>
        
        {/* Step content with animation */}
        <div className={`p-6 sm:p-8 transition-opacity duration-200 ${animatingOut ? 'opacity-0' : 'opacity-100'}`}>
          {currentStep.component}
        </div>
        
        {/* Navigation buttons */}
        <div className="p-6 sm:p-8 bg-slate-800/50 border-t border-slate-700/50 flex justify-between items-center">
          <div>
            {!isFirstStep && (
              <button
                onClick={prevStep}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-all shadow-sm hover:shadow active:scale-95"
              >
                <FiArrowLeft size={18} />
                <span>Previous</span>
              </button>
            )}
          </div>
          
          <div className="text-xs text-slate-400">
            {isLastStep ? 'Finish setup to access your dashboard' : 'Press ESC to skip setup'}
          </div>
          
          <div>
            {!isLastStep ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-sm hover:shadow-md active:scale-95"
              >
                <span>Next</span>
                <FiArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={completeOnboarding}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-500 hover:to-emerald-500 transition-all shadow-sm hover:shadow-md active:scale-95"
              >
                <span>Finish</span>
                <FiCheck size={18} />
              </button>
            )}
          </div>
        </div>
        
        {/* Bottom info text */}
        <div className="absolute bottom-2 right-3 text-[10px] text-slate-500">
          Mythayun v2.5.1
        </div>
      </div>
      
      {/* Add CSS for special effects */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .shadow-glow {
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
        }
        
        /* Custom scrollbar styles */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.3);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.5);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.7);
        }
      `}</style>
    </div>
  );
}

// Step Components - Enhanced
function WelcomeStep({ username }: { username: string }) {
  return (
    <div className="text-center py-8">
      <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center mb-6 shadow-lg animate-pulse">
        <span className="text-3xl font-bold text-white">
          {username.slice(0, 2).toUpperCase()}
        </span>
      </div>
      <h3 className="text-xl font-bold text-white mb-4 animate-fadeInUp">
        Nice to see you, {username}!
      </h3>
      <div className="max-w-md mx-auto p-4 bg-slate-700/20 border border-slate-700/50 rounded-xl">
        <p className="text-slate-300 mb-3">
          We'll help you personalize your experience so you can get the most out of your passion for football.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center mb-3">
          <div className="flex items-center gap-2 text-sm text-indigo-400">
            <FiStar size={16} />
            <span>Choose your favorite leagues</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-indigo-400">
            <FiHeart size={16} />
            <span>Follow your teams</span>
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-center">
        <div className="inline-block animate-bounce bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-full p-1.5">
          <FiArrowRight className="text-white" />
        </div>
      </div>
    </div>
  );
}

function LeaguesStep({ selectedLeagues, onChange }: { 
  selectedLeagues: string[], 
  onChange: (leagues: string[]) => void 
}) {
  const leagues = [
    { id: 'premier-league', name: 'Premier League', logo: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', region: 'England' },
    { id: 'la-liga', name: 'La Liga', logo: '🇪🇸', region: 'Spain' },
    { id: 'bundesliga', name: 'Bundesliga', logo: '🇩🇪', region: 'Germany' },
    { id: 'serie-a', name: 'Serie A', logo: '🇮🇹', region: 'Italy' },
    { id: 'ligue-1', name: 'Ligue 1', logo: '🇫🇷', region: 'France' },
    { id: 'champions-league', name: 'Champions League', logo: '🌟', region: 'Europe' },
    { id: 'europa-league', name: 'Europa League', logo: '🔶', region: 'Europe' },
    { id: 'mls', name: 'MLS', logo: '🇺🇸', region: 'USA' }
  ];
  
  const handleToggleLeague = (leagueId: string) => {
    if (selectedLeagues.includes(leagueId)) {
      onChange(selectedLeagues.filter(id => id !== leagueId));
    } else {
      onChange([...selectedLeagues, leagueId]);
    }
  };
  
  return (
    <div className="py-2">
      <p className="mb-4 text-sm text-slate-400">
        Select the leagues you're interested in. We'll use this to personalize your experience.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
        {leagues.map((league, index) => (
          <button
            key={league.id}
            onClick={() => handleToggleLeague(league.id)}
            className={`p-4 rounded-xl flex items-center gap-3 border transition-all ${
              selectedLeagues.includes(league.id)
                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                : 'bg-slate-700/30 border-slate-700 text-slate-300 hover:bg-slate-700/50 hover:border-slate-600'
            }`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="w-10 h-10 flex items-center justify-center text-2xl bg-slate-800 rounded-full shadow-inner">
              {league.logo}
            </div>
            <div className="flex-1">
              <span className="font-medium block">{league.name}</span>
              <span className="text-xs opacity-70">{league.region}</span>
            </div>
            
            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
              selectedLeagues.includes(league.id) 
                ? 'bg-indigo-500 text-white' 
                : 'bg-slate-700 text-slate-400'
            }`}>
              {selectedLeagues.includes(league.id) ? (
                <FiCheck size={14} />
              ) : null}
            </div>
          </button>
        ))}
      </div>
      
      <div className="mt-5 pt-4 border-t border-slate-700/30 flex justify-between text-sm">
        <span className="text-slate-400">
          {selectedLeagues.length} leagues selected
        </span>
        
        {selectedLeagues.length > 0 ? (
          <button 
            onClick={() => onChange([])}
            className="text-slate-400 hover:text-indigo-400 transition-colors"
          >
            Clear selection
          </button>
        ) : (
          <span className="text-amber-400/70 flex items-center gap-1">
            <FiInfo size={14} />
            <span>Select at least one league</span>
          </span>
        )}
      </div>
    </div>
  );
}

function TeamsStep({ selectedTeams, onChange }: { 
  selectedTeams: string[], 
  onChange: (teams: string[]) => void 
}) {
  const teams = [
    { id: 'team-1', name: 'Manchester United', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', league: 'Premier League' },
    { id: 'team-2', name: 'Barcelona', country: '🇪🇸', league: 'La Liga' },
    { id: 'team-3', name: 'Bayern Munich', country: '🇩🇪', league: 'Bundesliga' },
    { id: 'team-4', name: 'Juventus', country: '🇮🇹', league: 'Serie A' },
    { id: 'team-5', name: 'Paris Saint-Germain', country: '🇫🇷', league: 'Ligue 1' },
    { id: 'team-6', name: 'Liverpool', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', league: 'Premier League' },
    { id: 'team-7', name: 'Real Madrid', country: '🇪🇸', league: 'La Liga' },
    { id: 'team-8', name: 'Manchester City', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', league: 'Premier League' },
    { id: 'team-9', name: 'Chelsea', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', league: 'Premier League' },
    { id: 'team-10', name: 'Inter Milan', country: '🇮🇹', league: 'Serie A' }
  ];
  
  const handleToggleTeam = (teamId: string) => {
    if (selectedTeams.includes(teamId)) {
      onChange(selectedTeams.filter(id => id !== teamId));
    } else {
      onChange([...selectedTeams, teamId]);
    }
  };
  
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredTeams = searchTerm 
    ? teams.filter(team => team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           team.league.toLowerCase().includes(searchTerm.toLowerCase()))
    : teams;
  
  return (
    <div className="py-2">
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition-all"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <FiSearch size={16} />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
        {filteredTeams.map((team, index) => (
          <button
            key={team.id}
            onClick={() => handleToggleTeam(team.id)}
            className={`p-4 rounded-xl flex items-center gap-3 border transition-all ${
              selectedTeams.includes(team.id)
                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                : 'bg-slate-700/30 border-slate-700 text-slate-300 hover:bg-slate-700/50 hover:border-slate-600'
            }`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="w-8 h-8 flex items-center justify-center text-xl bg-slate-800 rounded-full shadow-inner">
              {team.country}
            </div>
            <div className="flex-1 text-left">
              <span className="font-medium block">{team.name}</span>
              <span className="text-xs opacity-70">{team.league}</span>
            </div>
            
            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
              selectedTeams.includes(team.id) 
                ? 'bg-indigo-500 text-white' 
                : 'bg-slate-700 text-slate-400'
            }`}>
              {selectedTeams.includes(team.id) ? (
                <FiCheck size={14} />
              ) : null}
            </div>
          </button>
        ))}
      </div>
      
      <div className="mt-5 pt-4 border-t border-slate-700/30 flex justify-between text-sm">
        <span className="text-slate-400">
          {selectedTeams.length} teams selected
        </span>
        
        {selectedTeams.length > 0 ? (
          <button 
            onClick={() => onChange([])}
            className="text-slate-400 hover:text-indigo-400 transition-colors"
          >
            Clear selection
          </button>
        ) : (
          <span className="text-amber-400/70 flex items-center gap-1">
            <FiInfo size={14} />
            <span>Select your favorite teams</span>
          </span>
        )}
      </div>
    </div>
  );
}

function NotificationsStep({ 
  notificationPreferences, 
  onChange 
}: { 
  notificationPreferences: any, 
  onChange: (prefs: any) => void 
}) {
  const toggleOption = (key: string) => {
    onChange({
      ...notificationPreferences,
      [key]: !notificationPreferences[key]
    });
  };
  
  return (
    <div className="py-4">
      <div className="space-y-5">
        <div className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-br from-slate-700/30 to-slate-800/30 border border-slate-700/50 hover:from-slate-700/40 hover:to-slate-800/40 transition-all shadow-sm">
          <div>
            <h4 className="font-medium text-white flex items-center gap-2">
              <FiCalendar className="text-indigo-400" size={18} />
              <span>Match Reminders</span>
            </h4>
            <p className="text-sm text-slate-400 mt-1">
              Receive reminders before your favorite teams' matches
            </p>
          </div>
          <button
            onClick={() => toggleOption('matchReminders')}
            className={`w-14 h-7 rounded-full relative transition-all duration-300 ${
              notificationPreferences.matchReminders 
                ? 'bg-indigo-600' 
                : 'bg-slate-600/80'
            }`}
          >
            <span 
              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${
                notificationPreferences.matchReminders ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>
        
        <div className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-br from-slate-700/30 to-slate-800/30 border border-slate-700/50 hover:from-slate-700/40 hover:to-slate-800/40 transition-all shadow-sm">
          <div>
            <h4 className="font-medium text-white flex items-center gap-2">
              <FiTrendingUp className="text-indigo-400" size={18} />
              <span>Score Updates</span>
            </h4>
            <p className="text-sm text-slate-400 mt-1">
              Be informed of goals and results in real time
            </p>
          </div>
          <button
            onClick={() => toggleOption('scoreUpdates')}
            className={`w-14 h-7 rounded-full relative transition-all duration-300 ${
              notificationPreferences.scoreUpdates 
                ? 'bg-indigo-600' 
                : 'bg-slate-600/80'
            }`}
          >
            <span 
              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${
                notificationPreferences.scoreUpdates ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>
        
        <div className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-br from-slate-700/30 to-slate-800/30 border border-slate-700/50 hover:from-slate-700/40 hover:to-slate-800/40 transition-all shadow-sm">
          <div>
            <h4 className="font-medium text-white flex items-center gap-2">
              <FiInfo className="text-indigo-400" size={18} />
              <span>Sports News</span>
            </h4>
            <p className="text-sm text-slate-400 mt-1">
              Receive alerts about important news and transfers
            </p>
          </div>
          <button
            onClick={() => toggleOption('newsAlerts')}
            className={`w-14 h-7 rounded-full relative transition-all duration-300 ${
              notificationPreferences.newsAlerts 
                ? 'bg-indigo-600' 
                : 'bg-slate-600/80'
            }`}
          >
            <span 
              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${
                notificationPreferences.newsAlerts ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>
        
        <div className="bg-slate-700/20 p-3 rounded-lg text-xs text-slate-400 flex items-start gap-3 mt-3">
          <FiInfo className="text-indigo-400 flex-shrink-0" size={16} />
          <p>
            You can modify these notification settings later in your profile preferences. Push notifications may require additional browser or device permissions.
          </p>
        </div>
      </div>
    </div>
  );
}

function CompleteStep({ username, preferences }: { username: string, preferences: { favoriteTeams: string[], favoriteLeagues: string[] } }) {
  const [countdown, setCountdown] = useState(3);
  
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);
  
  return (
    <div className="text-center py-6">
      <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-6 shadow-lg">
        <FiCheck size={48} className="text-white" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-3">
        Perfect, {username}!
      </h3>
      <div className="bg-gradient-to-br from-slate-700/30 to-slate-800/30 rounded-xl p-6 mb-4 max-w-md mx-auto border border-slate-700/50">
        <p className="text-slate-300">
          Your personal space is now set up according to your preferences.
          You can modify these settings at any time in the settings.
        </p>
      </div>
      
      <div className="flex items-center justify-center gap-3 text-green-400">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-900/30 text-green-500 font-medium">
          {countdown}
        </div>
        <p>Auto-redirecting to your personalized dashboard...</p>
      </div>
      
      <div className="mt-6 grid grid-cols-3 gap-3 max-w-xs mx-auto">
        <div className="bg-slate-800/50 rounded-lg p-2 text-center">
          <div className="text-xl font-bold text-white">{preferences.favoriteTeams.length}</div>
          <div className="text-xs text-slate-400">Teams</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-2 text-center">
          <div className="text-xl font-bold text-white">{preferences.favoriteLeagues.length}</div>
          <div className="text-xs text-slate-400">Leagues</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-2 text-center">
          <div className="text-xl font-bold text-white">3</div>
          <div className="text-xs text-slate-400">Features</div>
        </div>
      </div>
    </div>
  );
}

// Missing components added
function FiSearch({ size }: { size: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  );
}

function FiClock({ size }: { size: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  );
}