'use client';

import { useState } from 'react';
import { FiX, FiArrowRight, FiArrowLeft, FiCheck } from 'react-icons/fi';
import { useAuth } from '@/lib/contexts/AuthContext';

// Update interface to pass preferences to parent
interface OnboardingWizardProps {
  onComplete: (preferences: any) => void; // Modified to accept preferences
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { user } = useAuth(); // Remove updateUserPreferences - let parent handle this
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
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

  // Define all onboarding steps
  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Bienvenue sur Mythayun!',
      description: 'Configurons votre expérience en quelques étapes simples.',
      component: <WelcomeStep username={user?.name || 'Utilisateur'} />
    },
    {
      id: 'leagues',
      title: 'Quelles ligues suivez-vous?',
      description: 'Sélectionnez vos ligues préférées pour personnaliser votre contenu.',
      component: (
        <LeaguesStep 
          selectedLeagues={preferences.favoriteLeagues} 
          onChange={(leagues) => setPreferences({...preferences, favoriteLeagues: leagues})} 
        />
      )
    },
    {
      id: 'teams',
      title: 'Vos équipes favorites',
      description: 'Sélectionnez les équipes que vous souhaitez suivre en priorité.',
      component: (
        <TeamsStep 
          selectedTeams={preferences.favoriteTeams} 
          onChange={(teams) => setPreferences({...preferences, favoriteTeams: teams})} 
        />
      )
    },
    {
      id: 'notifications',
      title: 'Configurez vos notifications',
      description: 'Choisissez les types d\'alertes que vous souhaitez recevoir.',
      component: (
        <NotificationsStep 
          notificationPreferences={preferences.notificationPreferences}
          onChange={(notificationPrefs) => setPreferences({
            ...preferences, 
            notificationPreferences: notificationPrefs
          })}
        />
      )
    },
    {
      id: 'complete',
      title: 'C\'est terminé!',
      description: 'Votre espace est maintenant personnalisé selon vos préférences.',
      component: <CompleteStep username={user?.name || 'Utilisateur'} />
    }
  ];

  // Handle step navigation
  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  // Handle onboarding completion - UPDATED TO PASS PREFERENCES
  const completeOnboarding = async () => {
    try {
      const timestamp = new Date().toISOString();
      
      console.log(`[${timestamp}] Onboarding completed, passing preferences to parent:`, 
        JSON.stringify(preferences));
      
      // Pass preferences to the parent component
      onComplete(preferences);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error during onboarding completion:`, error);
      // Still pass preferences even if there's an error
      onComplete(preferences);
    }
  };

  // Skip onboarding - ALSO UPDATED TO PASS DEFAULT PREFERENCES
  const skipOnboarding = () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Onboarding skipped by user, passing default preferences`);
    onComplete(preferences);
  };

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 p-6 relative">
          <button 
            onClick={skipOnboarding} 
            className="absolute top-4 right-4 text-white/70 hover:text-white"
            aria-label="Fermer"
          >
            <FiX size={24} />
          </button>
          <h2 className="text-2xl font-bold text-white">{currentStep.title}</h2>
          <p className="text-indigo-100 mt-1">{currentStep.description}</p>
          
          {/* Progress bar */}
          <div className="mt-6 flex gap-1">
            {steps.map((step, idx) => (
              <div 
                key={step.id} 
                className={`flex-1 h-1 rounded-full ${
                  idx <= currentStepIndex ? 'bg-white' : 'bg-indigo-400/30'
                }`}
              ></div>
            ))}
          </div>
        </div>
        
        {/* Step content */}
        <div className="p-6">
          {currentStep.component}
        </div>
        
        {/* Navigation buttons */}
        <div className="p-6 bg-slate-800 border-t border-slate-700 flex justify-between">
          <div>
            {!isFirstStep && (
              <button
                onClick={prevStep}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
              >
                <FiArrowLeft size={18} />
                <span>Précédent</span>
              </button>
            )}
          </div>
          
          <div className="flex gap-3">
            {!isLastStep ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
              >
                <span>Suivant</span>
                <FiArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={completeOnboarding}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 transition-colors"
              >
                <span>Terminer</span>
                <FiCheck size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step Components
function WelcomeStep({ username }: { username: string }) {
  return (
    <div className="text-center py-8">
      <div className="w-24 h-24 mx-auto rounded-full bg-indigo-600 flex items-center justify-center mb-6">
        <span className="text-3xl font-bold text-white">
          {username.slice(0, 2).toUpperCase()}
        </span>
      </div>
      <h3 className="text-xl font-bold text-white mb-4">
        Ravi de vous voir, {username}!
      </h3>
      <p className="text-slate-300 mb-6 max-w-md mx-auto">
        Nous allons vous aider à personnaliser votre expérience pour que vous puissiez profiter 
        au maximum de votre passion pour le football.
      </p>
      <p className="text-indigo-400">Cliquez sur Suivant pour continuer</p>
    </div>
  );
}

function LeaguesStep({ selectedLeagues, onChange }: { 
  selectedLeagues: string[], 
  onChange: (leagues: string[]) => void 
}) {
  const leagues = [
    { id: 'premier-league', name: 'Premier League', logo: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    { id: 'la-liga', name: 'La Liga', logo: '🇪🇸' },
    { id: 'bundesliga', name: 'Bundesliga', logo: '🇩🇪' },
    { id: 'serie-a', name: 'Serie A', logo: '🇮🇹' },
    { id: 'ligue-1', name: 'Ligue 1', logo: '🇫🇷' },
    { id: 'champions-league', name: 'Champions League', logo: '🌟' }
  ];
  
  const handleToggleLeague = (leagueId: string) => {
    if (selectedLeagues.includes(leagueId)) {
      onChange(selectedLeagues.filter(id => id !== leagueId));
    } else {
      onChange([...selectedLeagues, leagueId]);
    }
  };
  
  return (
    <div className="py-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {leagues.map(league => (
          <button
            key={league.id}
            onClick={() => handleToggleLeague(league.id)}
            className={`p-4 rounded-xl flex items-center gap-3 border transition-all ${
              selectedLeagues.includes(league.id)
                ? 'bg-indigo-600/20 border-indigo-500 text-white'
                : 'bg-slate-700/30 border-slate-700 text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            <div className="w-10 h-10 flex items-center justify-center text-2xl">
              {league.logo}
            </div>
            <span className="font-medium">{league.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TeamsStep({ selectedTeams, onChange }: { 
  selectedTeams: string[], 
  onChange: (teams: string[]) => void 
}) {
  const teams = [
    { id: 'team-1', name: 'Manchester United', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    { id: 'team-2', name: 'Barcelona', country: '🇪🇸' },
    { id: 'team-3', name: 'Bayern Munich', country: '🇩🇪' },
    { id: 'team-4', name: 'Juventus', country: '🇮🇹' },
    { id: 'team-5', name: 'Paris Saint-Germain', country: '🇫🇷' },
    { id: 'team-6', name: 'Liverpool', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    { id: 'team-7', name: 'Real Madrid', country: '🇪🇸' },
    { id: 'team-8', name: 'Manchester City', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' }
  ];
  
  const handleToggleTeam = (teamId: string) => {
    if (selectedTeams.includes(teamId)) {
      onChange(selectedTeams.filter(id => id !== teamId));
    } else {
      onChange([...selectedTeams, teamId]);
    }
  };
  
  return (
    <div className="py-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
        {teams.map(team => (
          <button
            key={team.id}
            onClick={() => handleToggleTeam(team.id)}
            className={`p-4 rounded-xl flex items-center gap-3 border transition-all ${
              selectedTeams.includes(team.id)
                ? 'bg-indigo-600/20 border-indigo-500 text-white'
                : 'bg-slate-700/30 border-slate-700 text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            <div className="w-8 h-8 flex items-center justify-center text-xl">
              {team.country}
            </div>
            <span className="font-medium">{team.name}</span>
          </button>
        ))}
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
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30">
          <div>
            <h4 className="font-medium text-white">Rappel de match</h4>
            <p className="text-sm text-slate-400">Recevez des rappels avant les matchs de vos équipes favorites</p>
          </div>
          <button
            onClick={() => toggleOption('matchReminders')}
            className={`w-12 h-6 rounded-full relative transition-colors ${
              notificationPreferences.matchReminders ? 'bg-indigo-600' : 'bg-slate-600'
            }`}
          >
            <span 
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                notificationPreferences.matchReminders ? 'right-0.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>
        
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30">
          <div>
            <h4 className="font-medium text-white">Mises à jour des scores</h4>
            <p className="text-sm text-slate-400">Soyez informé des buts et des résultats en temps réel</p>
          </div>
          <button
            onClick={() => toggleOption('scoreUpdates')}
            className={`w-12 h-6 rounded-full relative transition-colors ${
              notificationPreferences.scoreUpdates ? 'bg-indigo-600' : 'bg-slate-600'
            }`}
          >
            <span 
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                notificationPreferences.scoreUpdates ? 'right-0.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>
        
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30">
          <div>
            <h4 className="font-medium text-white">Actualités sportives</h4>
            <p className="text-sm text-slate-400">Recevez des alertes sur les actualités importantes</p>
          </div>
          <button
            onClick={() => toggleOption('newsAlerts')}
            className={`w-12 h-6 rounded-full relative transition-colors ${
              notificationPreferences.newsAlerts ? 'bg-indigo-600' : 'bg-slate-600'
            }`}
          >
            <span 
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                notificationPreferences.newsAlerts ? 'right-0.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

function CompleteStep({ username }: { username: string }) {
  return (
    <div className="text-center py-8">
      <div className="w-24 h-24 mx-auto rounded-full bg-green-600 flex items-center justify-center mb-6">
        <FiCheck size={40} className="text-white" />
      </div>
      <h3 className="text-xl font-bold text-white mb-4">
        Parfait, {username}!
      </h3>
      <p className="text-slate-300 mb-6 max-w-md mx-auto">
        Votre espace personnel est maintenant configuré selon vos préférences.
        Vous pourrez modifier ces paramètres à tout moment dans les réglages.
      </p>
      <p className="text-green-400">Cliquez sur Terminer pour accéder à votre tableau de bord</p>
    </div>
  );
}