'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { FiHeart, FiSearch, FiFilter, FiTrash2, FiPlus, FiCalendar, FiAlertCircle, FiX, FiCheckCircle } from 'react-icons/fi';
import Image from 'next/image';

// Type definitions for favorites
interface Team {
  id: string;
  name: string;
  logo: string;
  country: string;
  league: string;
  nextMatch?: {
    opponent: string;
    date: string;
    time: string;
    competition: string;
    isHome: boolean;
  };
}

interface Match {
  id: string;
  homeTeam: {
    id: string;
    name: string;
    logo: string;
  };
  awayTeam: {
    id: string;
    name: string;
    logo: string;
  };
  date: string;
  time: string;
  competition: string;
  venue: string;
}

interface Notification {
  message: string;
  type: 'success' | 'error';
}

// Define proper preference types to match AuthContext
interface NotificationPreferences {
  matchReminders: boolean;
  scoreUpdates: boolean;
  newsAlerts: boolean;
}

interface DisplayPreferences {
  darkMode: boolean;
  compactView: boolean;
}

interface UserPreferences {
  notificationPreferences: NotificationPreferences;
  displayPreferences: DisplayPreferences;
  favoriteLeagues: string[];
  favoriteTeams: string[];
  favoriteMatches: string[];
}

// Sample team data - in a real app, this would come from an API
const popularTeams: Team[] = [
  {
    id: 'team-1',
    name: 'Paris Saint-Germain',
    logo: '/teams/psg.png',
    country: 'France',
    league: 'Ligue 1',
    nextMatch: {
      opponent: 'Olympique Marseille',
      date: '22 mai 2025',
      time: '20:45',
      competition: 'Ligue 1',
      isHome: true
    }
  },
  {
    id: 'team-2',
    name: 'Real Madrid',
    logo: '/teams/real-madrid.png',
    country: 'Espagne',
    league: 'La Liga',
    nextMatch: {
      opponent: 'FC Barcelona',
      date: '24 mai 2025',
      time: '21:00',
      competition: 'La Liga',
      isHome: false
    }
  },
  {
    id: 'team-3',
    name: 'Bayern Munich',
    logo: '/teams/bayern.png',
    country: 'Allemagne',
    league: 'Bundesliga',
    nextMatch: {
      opponent: 'Borussia Dortmund',
      date: '21 mai 2025',
      time: '18:30',
      competition: 'Bundesliga',
      isHome: true
    }
  },
  {
    id: 'team-4',
    name: 'Manchester City',
    logo: '/teams/man-city.png',
    country: 'Angleterre',
    league: 'Premier League',
    nextMatch: {
      opponent: 'Liverpool',
      date: '23 mai 2025',
      time: '17:00',
      competition: 'Premier League',
      isHome: false
    }
  },
  {
    id: 'team-5',
    name: 'Juventus',
    logo: '/teams/juventus.png',
    country: 'Italie',
    league: 'Serie A',
    nextMatch: {
      opponent: 'AC Milan',
      date: '25 mai 2025',
      time: '20:45',
      competition: 'Serie A',
      isHome: true
    }
  }
];

// Sample match data
const upcomingMatches: Match[] = [
  {
    id: 'match-1',
    homeTeam: {
      id: 'team-1',
      name: 'Paris Saint-Germain',
      logo: '/teams/psg.png'
    },
    awayTeam: {
      id: 'team-2',
      name: 'Real Madrid',
      logo: '/teams/real-madrid.png'
    },
    date: '26 mai 2025',
    time: '20:45',
    competition: 'Champions League - Finale',
    venue: 'Wembley Stadium, Londres'
  },
  {
    id: 'match-2',
    homeTeam: {
      id: 'team-3',
      name: 'Bayern Munich',
      logo: '/teams/bayern.png'
    },
    awayTeam: {
      id: 'team-4',
      name: 'Manchester City',
      logo: '/teams/man-city.png'
    },
    date: '28 mai 2025',
    time: '20:00',
    competition: 'Amical International',
    venue: 'Allianz Arena, Munich'
  }
];

// Custom notification component
const Notification = ({ notification, onClose }: { notification: Notification, onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 p-3 rounded-lg shadow-lg ${
      notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
    }`}>
      {notification.type === 'success' ? <FiCheckCircle size={20} /> : <FiAlertCircle size={20} />}
      <p>{notification.message}</p>
      <button 
        onClick={onClose} 
        className="ml-2 text-white hover:text-white/70"
        aria-label="Close notification"
      >
        <FiX size={18} />
      </button>
    </div>
  );
};

// Helper function to ensure complete preferences structure
const ensureCompletePreferences = (prefs: any): UserPreferences => {
  return {
    favoriteTeams: prefs?.favoriteTeams || [],
    favoriteMatches: prefs?.favoriteMatches || [],
    favoriteLeagues: prefs?.favoriteLeagues || [],
    notificationPreferences: {
      matchReminders: prefs?.notificationPreferences?.matchReminders ?? true,
      scoreUpdates: prefs?.notificationPreferences?.scoreUpdates ?? true,
      newsAlerts: prefs?.notificationPreferences?.newsAlerts ?? false
    },
    displayPreferences: {
      darkMode: prefs?.displayPreferences?.darkMode ?? true,
      compactView: prefs?.displayPreferences?.compactView ?? false
    }
  };
};

export default function FavoritesTab() {
  const { user, updateUserPreferences } = useAuth();
  
  // Local state
  const [favoriteTeams, setFavoriteTeams] = useState<Team[]>([]);
  const [favoriteMatches, setFavoriteMatches] = useState<Match[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'teams' | 'matches'>('teams');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [filterLeague, setFilterLeague] = useState<string | null>(null);
  
  // Load user's favorites on component mount
  useEffect(() => {
    if (user) {
      // Use our helper to ensure complete preferences
      const preferences = ensureCompletePreferences(user.preferences);
      
      // Get the user's favorite teams from sample data
      const userTeams = popularTeams.filter(team => preferences.favoriteTeams.includes(team.id));
      setFavoriteTeams(userTeams);
      
      // Get the user's favorite matches from sample data
      const userMatches = upcomingMatches.filter(match => preferences.favoriteMatches.includes(match.id));
      setFavoriteMatches(userMatches);
      
      // Done loading
      setLoadingFavorites(false);
    }
  }, [user]);
  
  // Show notification
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
  };
  
  // Hide notification
  const hideNotification = () => {
    setNotification(null);
  };
  
  // Add a team to favorites
  const addTeamToFavorites = async (team: Team) => {
    try {
      // Check if already in favorites
      if (favoriteTeams.some(t => t.id === team.id)) {
        showNotification(`${team.name} est déjà dans vos favoris`, 'error');
        return;
      }
      
      // Get complete user preferences with defaults
      const currentPrefs = ensureCompletePreferences(user?.preferences);
      
      // Update local state
      setFavoriteTeams([...favoriteTeams, team]);
      
      // Update preferences in backend with complete structure
      const updatedPrefs = {
        ...currentPrefs,
        favoriteTeams: [...currentPrefs.favoriteTeams, team.id]
      };
      
      await updateUserPreferences(updatedPrefs);
      showNotification(`${team.name} ajouté à vos favoris`, 'success');
    } catch (error) {
      console.error('Error adding team to favorites:', error);
      showNotification('Erreur lors de l\'ajout à vos favoris', 'error');
      // Revert local state change on error
      setFavoriteTeams(favoriteTeams);
    }
  };
  
  // Remove a team from favorites
  const removeTeamFromFavorites = async (teamId: string) => {
    try {
      // Find the team to show name in notification
      const team = favoriteTeams.find(t => t.id === teamId);
      if (!team) return;
      
      // Update local state first
      const updatedFavorites = favoriteTeams.filter(t => t.id !== teamId);
      setFavoriteTeams(updatedFavorites);
      
      // Get complete user preferences with defaults
      const currentPrefs = ensureCompletePreferences(user?.preferences);
      
      // Update preferences in backend
      const updatedPrefs = {
        ...currentPrefs,
        favoriteTeams: currentPrefs.favoriteTeams.filter(id => id !== teamId)
      };
      
      await updateUserPreferences(updatedPrefs);
      showNotification(`${team.name} retiré de vos favoris`, 'success');
    } catch (error) {
      console.error('Error removing team from favorites:', error);
      showNotification('Erreur lors de la suppression de vos favoris', 'error');
      // Reload original favorites on error
      loadFavorites();
    }
  };
  
  // Add a match to favorites
  const addMatchToFavorites = async (match: Match) => {
    try {
      // Check if already in favorites
      if (favoriteMatches.some(m => m.id === match.id)) {
        showNotification(`Ce match est déjà dans vos favoris`, 'error');
        return;
      }
      
      // Get complete user preferences with defaults
      const currentPrefs = ensureCompletePreferences(user?.preferences);
      
      // Update local state
      setFavoriteMatches([...favoriteMatches, match]);
      
      // Update preferences in backend with complete structure
      const updatedPrefs = {
        ...currentPrefs,
        favoriteMatches: [...currentPrefs.favoriteMatches, match.id]
      };
      
      await updateUserPreferences(updatedPrefs);
      showNotification(`${match.homeTeam.name} vs ${match.awayTeam.name} ajouté à vos favoris`, 'success');
    } catch (error) {
      console.error('Error adding match to favorites:', error);
      showNotification('Erreur lors de l\'ajout à vos favoris', 'error');
      // Revert local state change on error
      setFavoriteMatches(favoriteMatches);
    }
  };
  
  // Remove a match from favorites
  const removeMatchFromFavorites = async (matchId: string) => {
    try {
      // Find the match to show names in notification
      const match = favoriteMatches.find(m => m.id === matchId);
      if (!match) return;
      
      // Update local state first
      const updatedFavorites = favoriteMatches.filter(m => m.id !== matchId);
      setFavoriteMatches(updatedFavorites);
      
      // Get complete user preferences with defaults
      const currentPrefs = ensureCompletePreferences(user?.preferences);
      
      // Update preferences in backend with complete structure
      const updatedPrefs = {
        ...currentPrefs,
        favoriteMatches: currentPrefs.favoriteMatches.filter(id => id !== matchId)
      };
      
      await updateUserPreferences(updatedPrefs);
      showNotification(`${match.homeTeam.name} vs ${match.awayTeam.name} retiré de vos favoris`, 'success');
    } catch (error) {
      console.error('Error removing match from favorites:', error);
      showNotification('Erreur lors de la suppression de vos favoris', 'error');
      // Reload original favorites on error
      loadFavorites();
    }
  };
  
  // Load favorites - used when needing to reset state
  const loadFavorites = () => {
    if (user) {
      const preferences = ensureCompletePreferences(user.preferences);
      
      const userTeams = popularTeams.filter(team => preferences.favoriteTeams.includes(team.id));
      setFavoriteTeams(userTeams);
      
      const userMatches = upcomingMatches.filter(match => preferences.favoriteMatches.includes(match.id));
      setFavoriteMatches(userMatches);
    }
  };
  
  // Filter teams by search query
  const filteredTeams = popularTeams.filter(team => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.league.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Get available leagues for filtering
  const availableLeagues = Array.from(new Set(popularTeams.map(team => team.league)));
  
  // Filter teams by league if filter is set
  const teamsToShow = filterLeague 
    ? filteredTeams.filter(team => team.league === filterLeague)
    : filteredTeams;
    
  // Loading state
  if (loadingFavorites) {
    return (
      <div className="bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg min-h-[300px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-t-2 border-indigo-500 rounded-full animate-spin"></div>
          <p className="text-slate-400">Chargement de vos favoris...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Show notification if active */}
      {notification && (
        <Notification 
          notification={notification} 
          onClose={hideNotification} 
        />
      )}
      
      {/* Favorites header with tabs */}
      <div className="bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Mes Favoris</h2>
            <p className="text-slate-400 mt-1">Gérez vos équipes et matchs préférés</p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('teams')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'teams' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Équipes
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'matches' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Matchs
            </button>
          </div>
        </div>
        
        {/* Search and filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center mb-6">
          <div className="relative w-full sm:max-w-xs">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={activeTab === 'teams' ? "Rechercher une équipe..." : "Rechercher un match..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
          
          {activeTab === 'teams' && (
            <div className="relative w-full sm:w-auto">
              <select
                value={filterLeague || ''}
                onChange={(e) => setFilterLeague(e.target.value || null)}
                className="w-full appearance-none pl-10 pr-8 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Toutes les ligues</option>
                {availableLeagues.map(league => (
                  <option key={league} value={league}>{league}</option>
                ))}
              </select>
              <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            </div>
          )}
          
          <button
            onClick={() => setShowAddModal(true)}
            className="sm:ml-auto w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            <FiPlus size={18} />
            <span>Ajouter des favoris</span>
          </button>
        </div>
        
        {/* Teams tab content */}
        {activeTab === 'teams' && (
          <>
            {favoriteTeams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 bg-slate-700/30 rounded-xl text-slate-400">
                <FiHeart size={48} className="mb-3 opacity-50" />
                <p className="text-lg">Vous n'avez pas encore d'équipes favorites</p>
                <p className="mt-2">Ajoutez vos équipes préférées pour les suivre facilement</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <FiPlus size={16} />
                  <span>Ajouter des équipes</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {favoriteTeams.map((team) => (
                  <div key={team.id} className="bg-slate-700/30 rounded-xl p-4 hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-800 p-1 flex items-center justify-center overflow-hidden">
                          <div className="relative w-10 h-10">
                            {/* Fallback when image is not available */}
                            <div className="absolute inset-0 bg-slate-700 flex items-center justify-center text-xs text-slate-300">
                              {team.name.substring(0, 2).toUpperCase()}
                            </div>
                            {/* Uncomment when you have actual team logos */}
                            {/* <Image 
                              src={team.logo} 
                              alt={team.name} 
                              fill
                              className="object-contain" 
                            /> */}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-medium text-white">{team.name}</h3>
                          <p className="text-xs text-slate-400">{team.league} • {team.country}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeTeamFromFavorites(team.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        aria-label={`Retirer ${team.name} des favoris`}
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                    
                    {team.nextMatch && (
                      <div className="mt-3 border-t border-slate-700 pt-3">
                        <p className="text-xs text-indigo-400">PROCHAIN MATCH</p>
                        <div className="flex items-center mt-1">
                          <div className="flex-1 text-right mr-2">
                            <p className="font-medium text-white">{team.nextMatch.isHome ? team.name : team.nextMatch.opponent}</p>
                          </div>
                          <div className="text-xs bg-slate-800 px-2 py-1 rounded">VS</div>
                          <div className="flex-1 ml-2">
                            <p className="font-medium text-white">{team.nextMatch.isHome ? team.nextMatch.opponent : team.name}</p>
                          </div>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                          <span>{team.nextMatch.competition}</span>
                          <span>{team.nextMatch.date} • {team.nextMatch.time}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        
        {/* Matches tab content */}
        {activeTab === 'matches' && (
          <>
            {favoriteMatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 bg-slate-700/30 rounded-xl text-slate-400">
                <FiCalendar size={48} className="mb-3 opacity-50" />
                <p className="text-lg">Vous n'avez pas encore de matchs favoris</p>
                <p className="mt-2">Ajoutez des matchs pour les suivre facilement</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <FiPlus size={16} />
                  <span>Ajouter des matchs</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {favoriteMatches.map((match) => (
                  <div key={match.id} className="bg-slate-700/30 rounded-xl p-4 hover:bg-slate-700/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-grow">
                        <p className="text-xs text-indigo-400">{match.competition}</p>
                        <div className="flex items-center justify-between mt-2 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-800 p-1 flex items-center justify-center overflow-hidden">
                              <div className="relative w-6 h-6">
                                <div className="absolute inset-0 bg-slate-700 flex items-center justify-center text-xs text-slate-300">
                                  {match.homeTeam.name.substring(0, 2).toUpperCase()}
                                </div>
                                {/* Uncomment when you have actual team logos */}
                                {/* <Image 
                                  src={match.homeTeam.logo} 
                                  alt={match.homeTeam.name} 
                                  fill
                                  className="object-contain" 
                                /> */}
                              </div>
                            </div>
                            <span className="font-medium text-white">{match.homeTeam.name}</span>
                          </div>
                          <div className="mx-2 px-2 py-1 bg-slate-800 rounded text-xs">
                            VS
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{match.awayTeam.name}</span>
                            <div className="w-8 h-8 rounded-full bg-slate-800 p-1 flex items-center justify-center overflow-hidden">
                              <div className="relative w-6 h-6">
                                <div className="absolute inset-0 bg-slate-700 flex items-center justify-center text-xs text-slate-300">
                                  {match.awayTeam.name.substring(0, 2).toUpperCase()}
                                </div>
                                {/* Uncomment when you have actual team logos */}
                                {/* <Image 
                                  src={match.awayTeam.logo} 
                                  alt={match.awayTeam.name} 
                                  fill
                                  className="object-contain" 
                                /> */}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>{match.venue}</span>
                          <span>{match.date} • {match.time}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeMatchFromFavorites(match.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors ml-4"
                        aria-label="Retirer ce match des favoris"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Recommended section */}
      <div className="bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4">Recommandés pour vous</h3>
        
        {activeTab === 'teams' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {popularTeams
              .filter(team => !favoriteTeams.some(t => t.id === team.id))
              .slice(0, 4)
              .map(team => (
                <div key={team.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 p-1 flex items-center justify-center overflow-hidden">
                      <div className="relative w-8 h-8">
                        <div className="absolute inset-0 bg-slate-700 flex items-center justify-center text-xs text-slate-300">
                          {team.name.substring(0, 2).toUpperCase()}
                        </div>
                        {/* Uncomment when you have actual team logos */}
                        {/* <Image 
                          src={team.logo} 
                          alt={team.name} 
                          fill
                          className="object-contain" 
                        /> */}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-white">{team.name}</p>
                      <p className="text-xs text-slate-400">{team.league}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => addTeamToFavorites(team)}
                    className="text-indigo-400 hover:text-indigo-300"
                    aria-label={`Ajouter ${team.name} aux favoris`}
                  >
                    <FiPlus size={20} />
                  </button>
                </div>
              ))}
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingMatches
              .filter(match => !favoriteMatches.some(m => m.id === match.id))
              .map(match => (
                <div key={match.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-800 p-1 flex items-center justify-center overflow-hidden">
                      <div className="relative w-6 h-6">
                        <div className="absolute inset-0 bg-slate-700 flex items-center justify-center text-xs text-slate-300">
                          {match.homeTeam.name.substring(0, 2).toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <span className="text-white">{match.homeTeam.name} vs {match.awayTeam.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{match.date}</span>
                    <button
                      onClick={() => addMatchToFavorites(match)}
                      className="text-indigo-400 hover:text-indigo-300"
                      aria-label="Ajouter ce match aux favoris"
                    >
                      <FiPlus size={20} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
      
      {/* Add to favorites modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                {activeTab === 'teams' ? 'Ajouter des équipes favorites' : 'Ajouter des matchs favoris'}
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <FiX size={24} />
              </button>
            </div>
            
            <div className="mb-4 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
            
            {activeTab === 'teams' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {teamsToShow.map(team => {
                  const isInFavorites = favoriteTeams.some(t => t.id === team.id);
                  
                  return (
                    <div 
                      key={team.id} 
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isInFavorites 
                          ? 'border-indigo-500 bg-indigo-500/10' 
                          : 'border-slate-700 bg-slate-700/30 hover:bg-slate-700/50'
                      } transition-colors`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 p-1 flex items-center justify-center overflow-hidden">
                          <div className="relative w-8 h-8">
                            <div className="absolute inset-0 bg-slate-700 flex items-center justify-center text-xs text-slate-300">
                              {team.name.substring(0, 2).toUpperCase()}
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-white">{team.name}</p>
                          <p className="text-xs text-slate-400">{team.league} • {team.country}</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => isInFavorites ? removeTeamFromFavorites(team.id) : addTeamToFavorites(team)}
                        className={`flex items-center justify-center h-8 w-8 rounded-full ${
                          isInFavorites 
                            ? 'bg-indigo-500 text-white hover:bg-red-500' 
                            : 'bg-slate-700 text-slate-300 hover:bg-indigo-500 hover:text-white'
                        }`}
                        aria-label={isInFavorites ? `Retirer ${team.name} des favoris` : `Ajouter ${team.name} aux favoris`}
                      >
                        {isInFavorites ? <FiX size={16} /> : <FiPlus size={16} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {upcomingMatches.map(match => {
                  const isInFavorites = favoriteMatches.some(m => m.id === match.id);
                  
                  return (
                    <div 
                      key={match.id} 
                      className={`p-3 rounded-lg border ${
                        isInFavorites 
                          ? 'border-indigo-500 bg-indigo-500/10' 
                          : 'border-slate-700 bg-slate-700/30 hover:bg-slate-700/50'
                      } transition-colors`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-indigo-400">{match.competition}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-white font-medium">{match.homeTeam.name}</span>
                            <span className="text-slate-400">vs</span>
                            <span className="text-white font-medium">{match.awayTeam.name}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{match.date} • {match.time}</p>
                        </div>
                        
                        <button
                          onClick={() => isInFavorites ? removeMatchFromFavorites(match.id) : addMatchToFavorites(match)}
                          className={`flex items-center justify-center h-8 w-8 rounded-full ${
                            isInFavorites 
                              ? 'bg-indigo-500 text-white hover:bg-red-500' 
                              : 'bg-slate-700 text-slate-300 hover:bg-indigo-500 hover:text-white'
                          }`}
                          aria-label={isInFavorites ? "Retirer des favoris" : "Ajouter aux favoris"}
                        >
                          {isInFavorites ? <FiX size={16} /> : <FiPlus size={16} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}