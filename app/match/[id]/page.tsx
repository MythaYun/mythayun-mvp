'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { 
  FiActivity, FiBarChart2, FiClock, FiMapPin, FiCalendar, 
  FiUsers, FiInfo, FiHeart, FiBell, FiBellOff, 
  FiArrowLeft, FiShare2, FiRefreshCw, FiStar,
  FiCheckCircle, FiX, FiAlertTriangle
} from 'react-icons/fi';
import { useFootballData } from '@/lib/contexts/FootballDataContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import MatchesService, { FootballMatch, MatchDetails, MatchStatus } from '@/lib/services/MatchesService';
import type { ReactNode } from 'react';

// Updated constants with the latest values
const CURRENT_TIMESTAMP = "2025-06-02 21:01:57";
const CURRENT_USER = "Sdiabate1337";

// Base64 encoded placeholder images
const PLACEHOLDER_TEAM_IMG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiMzNDNhNDAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPlQ8L3RleHQ+PC9zdmc+";
const PLACEHOLDER_LEAGUE_IMG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiMzNDNhNDAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPkw8L3RleHQ+PC9zdmc+";
const PLACEHOLDER_PLAYER_IMG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiMzNDNhNDAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPlA8L3RleHQ+PC9zdmc+";

// Function to complete the missing fields in the FootballMatch object
const completeFootballMatch = (match: any): FootballMatch => {
  return {
    ...match,
    followedByUser: false, // Default to false
    matchday: match.matchday || match.league?.round || "Unknown", // Use league.round as fallback
    season: match.season || "2024/2025", // Default season
    round: match.round || match.league?.round || "", // Use league.round as fallback
  } as FootballMatch;
};

// Types that match your application's structure
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

// Helper functions
const formatDateToDisplay = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (e) {
    console.error(`[${CURRENT_TIMESTAMP}] Date parsing error:`, e);
    return dateString;
  }
};

// Event interface based on your MatchDetails structure
interface MatchEvent {
  time: {
    elapsed: number;
    extra?: number;
  };
  team: {
    id: number;
    name: string;
    logo: string;
  };
  player: {
    id: number;
    name: string;
  };
  assist: {
    id: number | null;
    name: string | null;
  };
  type: string;
  detail: string;
  comments: string | null;
}

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

// Custom tooltip component
const Tooltip = ({ children, text }: { children: React.ReactNode; text: string }) => {
  return (
    <div className="relative group">
      {children}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        {text}
      </div>
    </div>
  );
};

// Loading skeleton for match details
const MatchDetailSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-slate-800 rounded-2xl p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <div className="w-8 h-8 bg-slate-700 rounded-full"></div>
        <div className="flex space-x-3">
          <div className="w-8 h-8 bg-slate-700 rounded-full"></div>
          <div className="w-8 h-8 bg-slate-700 rounded-full"></div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-8">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 bg-slate-700 rounded-full mb-3"></div>
          <div className="h-5 w-32 bg-slate-700 rounded-md"></div>
        </div>
        
        <div className="text-center">
          <div className="h-10 w-24 bg-slate-700 rounded-lg mx-auto mb-2"></div>
          <div className="h-4 w-16 bg-slate-700/60 rounded-md mx-auto"></div>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 bg-slate-700 rounded-full mb-3"></div>
          <div className="h-5 w-32 bg-slate-700 rounded-md"></div>
        </div>
      </div>
      
      <div className="flex justify-center space-x-4">
        <div className="h-8 w-20 bg-slate-700 rounded-lg"></div>
        <div className="h-8 w-20 bg-slate-700 rounded-lg"></div>
        <div className="h-8 w-20 bg-slate-700 rounded-lg"></div>
      </div>
    </div>
    
    <div className="bg-slate-800 rounded-2xl p-6 mb-6">
      <div className="h-6 w-32 bg-slate-700 rounded-md mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 w-full bg-slate-700 rounded-md"></div>
        <div className="h-4 w-full bg-slate-700 rounded-md"></div>
        <div className="h-4 w-3/4 bg-slate-700 rounded-md"></div>
      </div>
    </div>
  </div>
);

// TabButton component for match detail tabs
const TabButton = ({ 
  active, 
  onClick, 
  children,
  icon
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
  icon: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg ${
      active 
        ? 'bg-indigo-600 text-white' 
        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
    } transition-all text-sm font-medium`}
  >
    {icon}
    {children}
  </button>
);

// Event icon component
const EventIcon = ({ type }: { type: string }) => {
  switch (type.toLowerCase()) {
    case 'goal':
      return <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>;
    case 'card':
      return <div className="w-3 h-4 bg-yellow-400 border border-yellow-500"></div>;
    case 'subst':
      return <div className="flex flex-col items-center">
        <span className="text-xs text-green-500">↑</span>
        <span className="text-xs text-red-500 -mt-1">↓</span>
      </div>;
    case 'var':
      return <div className="text-xs font-bold text-blue-400">VAR</div>;
    default:
      return <div className="w-3 h-3 rounded-full bg-slate-500"></div>;
  }
};

// Stat bar component for visual comparison
const StatBar = ({ home, away, label }: { home: number; away: number; label: string }) => {
  const total = home + away;
  const homePercent = total > 0 ? (home / total) * 100 : 50;
  const awayPercent = total > 0 ? (away / total) * 100 : 50;
  
  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>{home}</span>
        <span className="text-slate-300 font-medium">{label}</span>
        <span>{away}</span>
      </div>
      <div className="flex h-2 bg-slate-700/50 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-indigo-700 to-indigo-500 h-full rounded-l-full"
          style={{ width: `${homePercent}%` }}
        ></div>
        <div
          className="bg-gradient-to-r from-slate-600 to-slate-500 h-full rounded-r-full"
          style={{ width: `${awayPercent}%` }}
        ></div>
      </div>
    </div>
  );
};

// Player card component for lineups
const PlayerCard = ({ player, isHome }: { 
  player: { 
    player: { 
      id: number, 
      name: string, 
      number: number, 
      pos: string, 
      grid?: string 
    } 
  }, 
  isHome: boolean 
}) => {
  const alignment = isHome ? 'text-right' : 'text-left';
  const imageOrder = isHome ? 'order-last' : 'order-first';
  
  return (
    <div className="flex items-center justify-between gap-3 p-2 hover:bg-slate-700/30 rounded-lg transition-colors">
      <div className={`flex items-center gap-2 ${isHome ? 'flex-row-reverse' : 'flex-row'} flex-1`}>
        <div className={`w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden ${imageOrder}`}>
          <span className="text-xs text-slate-400">{player.player.number}</span>
        </div>
        <div className={alignment}>
          <p className="text-white font-medium">{player.player.name}</p>
          <p className="text-xs text-slate-400">{player.player.pos || 'Unknown'}</p>
        </div>
      </div>
    </div>
  );
};

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, updateUserPreferences } = useAuth();
  const matchId = params.id as string;
  
  // Get initial tab from URL or default to 'summary'
  const initialTab = searchParams.get('tab') || 'summary';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchDetails, setMatchDetails] = useState<MatchDetails | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [hasReminder, setHasReminder] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Get data from context
  const { 
    liveMatches, 
    upcomingMatches, 
    todayMatches, 
    refreshData,
    isLoadingMatches
  } = useFootballData();
  
  // Handle the back navigation to dashboard
  const navigateToDashboard = () => {
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} navigated from match ${matchId} to dashboard`);
    router.push('/dashboard');
  };
  
  // Fetch match details directly from service
  useEffect(() => {
    const fetchMatchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try first to find match in context data
        const allMatches = [...(liveMatches || []), ...(upcomingMatches || []), ...(todayMatches || [])];
        let match = allMatches.find(m => m.id === matchId);
        
        // If not found, fetch directly from service
        if (!match) {
          const details = await MatchesService.getMatchDetails(matchId);
          
          if (details) {
            // Add missing properties required by FootballMatch interface
            const completeDetails = completeFootballMatch(details) as MatchDetails;
            setMatchDetails(completeDetails);
            console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} viewed match ${matchId}`);
            
            // Check if match is in favorites
            if (user?.preferences?.favoriteMatches) {
              setIsFavorite(user.preferences.favoriteMatches.includes(matchId));
            }
          } else {
            setError('Match not found');
          }
        } else {
          // If we found the match in context, fetch full details
          const details = await MatchesService.getMatchDetails(matchId);
          if (details) {
            // Add missing properties required by FootballMatch interface
            const completeDetails = completeFootballMatch(details) as MatchDetails;
            setMatchDetails(completeDetails);
          } else {
            // Fallback to basic match data if details can't be loaded
            const completeMatch = completeFootballMatch(match) as MatchDetails;
            setMatchDetails(completeMatch);
          }
          
          // Check if match is in favorites
          if (user?.preferences?.favoriteMatches) {
            setIsFavorite(user.preferences.favoriteMatches.includes(matchId));
          }
        }
      } catch (error) {
        console.error(`[${CURRENT_TIMESTAMP}] Error fetching match details:`, error);
        setError('Failed to load match data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMatchDetails();
  }, [matchId, liveMatches, upcomingMatches, todayMatches, user]);
  
  // Refresh match data (for live matches)
  const handleRefresh = async () => {
    if (!matchDetails || refreshing) return;
    
    setRefreshing(true);
    try {
      // Refresh data from context first
      await refreshData();
      
      // Fetch fresh match details
      const details = await MatchesService.getMatchDetails(matchId);
      if (details) {
        // Add missing properties required by FootballMatch interface
        const completeDetails = completeFootballMatch(details) as MatchDetails;
        setMatchDetails(completeDetails);
      }
      
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} refreshed match ${matchId}`);
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error refreshing match data:`, error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Auto-refresh for live matches
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (matchDetails?.status === 'live') {
      intervalId = setInterval(() => {
        handleRefresh();
      }, 60000); // Refresh every minute for live matches
      
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} set up auto-refresh for live match ${matchId}`);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} cleared auto-refresh for match ${matchId}`);
      }
    };
  }, [matchDetails?.status]);
  
  // Toggle favorite status
  const toggleFavorite = async () => {
    if (!user || !matchDetails) return;
    
    try {
      // Get complete user preferences
      const currentPrefs = ensureCompletePreferences(user.preferences);
      
      let updatedFavorites: string[];
      
      if (isFavorite) {
        // Remove from favorites
        updatedFavorites = currentPrefs.favoriteMatches.filter(id => id !== matchId);
        console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} removed match ${matchId} from favorites`);
      } else {
        // Add to favorites
        updatedFavorites = [...currentPrefs.favoriteMatches, matchId];
        console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} added match ${matchId} to favorites`);
      }
      
      // Create a complete preferences object with all required properties
      const updatedPrefs = {
        ...currentPrefs,
        favoriteMatches: updatedFavorites
      };
      
      await updateUserPreferences(updatedPrefs);
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error updating favorites:`, error);
    }
  };
  
  // Toggle reminder status
  const toggleReminder = async () => {
    if (!user || !matchDetails) return;
    
    try {
      // Get complete user preferences
      const currentPrefs = ensureCompletePreferences(user.preferences);
      
      // For now, just toggle the local state
      // In a real implementation, you would update a "matchReminders" array in user preferences
      setHasReminder(!hasReminder);
      
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} ${hasReminder ? 'removed' : 'set'} reminder for match ${matchId}`);
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error updating reminder:`, error);
    }
  };
  
  // Share match
  const shareMatch = async () => {
    if (!matchDetails) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${matchDetails.homeTeam.name} vs ${matchDetails.awayTeam.name}`,
          text: `Check out this match between ${matchDetails.homeTeam.name} and ${matchDetails.awayTeam.name}!`,
          url: window.location.href
        });
        console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} shared match ${matchId}`);
      } else {
        // Fallback - copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error sharing match:`, error);
    }
  };
  
  // Change URL when tab changes without full reload
  const changeTab = (tab: string) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.pushState({}, '', url.toString());
  };
  
  // Determine match status display
  const getMatchStatusDisplay = () => {
    if (!matchDetails) return '';
    
    switch (matchDetails.status) {
      case 'live':
        return (
          <div className="flex items-center gap-1.5 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></div>
            <span>LIVE</span>
            {matchDetails.elapsed && <span>{matchDetails.elapsed}'</span>}
          </div>
        );
      case 'finished':
        return (
          <div className="flex items-center gap-1.5 bg-slate-700/50 text-slate-300 px-3 py-1 rounded-full text-xs font-medium">
            <FiCheckCircle size={12} />
            <span>FINISHED</span>
          </div>
        );
      case 'upcoming':
        return (
          <div className="flex items-center gap-1.5 bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-xs font-medium">
            <FiClock size={12} />
            <span>UPCOMING</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 bg-slate-700/50 text-slate-300 px-3 py-1 rounded-full text-xs font-medium">
            <FiInfo size={12} />
            <span>{(matchDetails.status as string).toUpperCase()}</span>
          </div>
        );
    }
  };
  
  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      {/* Back button at the top of the page - always visible */}
      <div className="mb-4">
        <button 
          onClick={navigateToDashboard}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          aria-label="Go back to dashboard"
        >
          <FiArrowLeft size={16} />
          <span>Go Back to Dashboard</span>
        </button>
      </div>
      
      {loading || isLoadingMatches ? (
        <MatchDetailSkeleton />
      ) : error || !matchDetails ? (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 shadow-lg border border-slate-700/50 text-center">
          <FiAlertTriangle size={48} className="text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Match Not Found</h2>
          <p className="text-slate-400 max-w-md mx-auto mb-6">
            {error || "We couldn't find the match you're looking for. It may have been removed or the ID is incorrect."}
          </p>
          <button
            onClick={navigateToDashboard}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <FiArrowLeft size={16} />
            <span>Go Back to Dashboard</span>
          </button>
        </div>
      ) : (
        <>
          {/* Match Header */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 sm:p-6 shadow-lg border border-slate-700/50 mb-6">
            {/* Navigation and actions */}
            <div className="flex justify-between items-center mb-6">
              {/* Removed the small back button from here since we have a dedicated one at the top */}
              <div className="w-10"></div> {/* Empty space for alignment */}
              
              <div className="flex space-x-3">
                <Tooltip text={isFavorite ? "Remove from favorites" : "Add to favorites"}>
                  <button 
                    onClick={toggleFavorite}
                    className={`p-2 rounded-full transition-colors ${
                      isFavorite 
                        ? 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/20' 
                        : 'text-slate-400 hover:text-rose-400 hover:bg-slate-700/50'
                    }`}
                    aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <FiHeart size={20} />
                  </button>
                </Tooltip>
                
                {matchDetails.status === 'upcoming' && (
                  <Tooltip text={hasReminder ? "Remove reminder" : "Set reminder"}>
                    <button 
                      onClick={toggleReminder}
                      className={`p-2 rounded-full transition-colors ${
                        hasReminder 
                          ? 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20' 
                          : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-700/50'
                      }`}
                      aria-label={hasReminder ? "Remove reminder" : "Set reminder"}
                    >
                      {hasReminder ? <FiBellOff size={20} /> : <FiBell size={20} />}
                    </button>
                  </Tooltip>
                )}
                
                <Tooltip text="Share match">
                  <button 
                    onClick={shareMatch}
                    className="p-2 text-slate-400 hover:text-sky-400 hover:bg-slate-700/50 rounded-full transition-colors"
                    aria-label="Share match"
                  >
                    <FiShare2 size={20} />
                  </button>
                </Tooltip>
                
                {matchDetails.status === 'live' && (
                  <Tooltip text="Refresh match data">
                    <button 
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="p-2 text-slate-400 hover:text-green-400 hover:bg-slate-700/50 rounded-full transition-colors disabled:opacity-50"
                      aria-label="Refresh match data"
                    >
                      <FiRefreshCw className={refreshing ? 'animate-spin' : ''} size={20} />
                    </button>
                  </Tooltip>
                )}
              </div>
            </div>
            
            {/* League info */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {matchDetails.league.logo ? (
                <img 
                  src={matchDetails.league.logo}
                  alt={matchDetails.league.name}
                  className="w-5 h-5 rounded-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = PLACEHOLDER_LEAGUE_IMG;
                  }}
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[8px]">
                  <span>{matchDetails.league.name.substring(0, 2)}</span>
                </div>
              )}
              <span className="text-indigo-400 text-sm font-medium">{matchDetails.league.name}</span>
              {matchDetails.league.round && (
                <>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400 text-sm">{matchDetails.league.round}</span>
                </>
              )}
            </div>
            
            {/* Teams and score */}
            <div className="flex justify-between items-center mb-8">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-800/60 p-2 flex items-center justify-center mb-3 shadow-lg">
                  {matchDetails.homeTeam.logo ? (
                    <img 
                      src={matchDetails.homeTeam.logo}
                      alt={matchDetails.homeTeam.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = PLACEHOLDER_TEAM_IMG;
                      }}
                    />
                  ) : (
                    <span className="text-2xl font-bold text-slate-400">
                      {matchDetails.homeTeam.name.substring(0, 3)}
                    </span>
                  )}
                </div>
                <h2 className="text-white font-bold text-lg text-center">{matchDetails.homeTeam.name}</h2>
              </div>
              
              <div className="text-center">
                {matchDetails.status === 'upcoming' ? (
                  <div className="text-center">
                    <div className="text-white text-lg sm:text-2xl font-bold mb-1">VS</div>
                    <div className="flex flex-col items-center">
                      <p className="text-slate-300 text-sm">{formatDateToDisplay(matchDetails.date)}</p>
                      <p className="text-slate-400 text-xs">{matchDetails.time}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-800 px-5 py-3 rounded-xl border border-slate-700/50 shadow-inner">
                    <div className="text-white text-3xl sm:text-4xl font-bold flex items-center gap-6">
                      <span>{matchDetails.score?.home || 0}</span>
                      <span className="text-slate-500 text-xl">-</span>
                      <span>{matchDetails.score?.away || 0}</span>
                    </div>
                  </div>
                )}
                
                <div className="mt-3">
                  {getMatchStatusDisplay()}
                </div>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-800/60 p-2 flex items-center justify-center mb-3 shadow-lg">
                  {matchDetails.awayTeam.logo ? (
                    <img 
                      src={matchDetails.awayTeam.logo}
                      alt={matchDetails.awayTeam.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = PLACEHOLDER_TEAM_IMG;
                      }}
                    />
                  ) : (
                    <span className="text-2xl font-bold text-slate-400">
                      {matchDetails.awayTeam.name.substring(0, 3)}
                    </span>
                  )}
                </div>
                <h2 className="text-white font-bold text-lg text-center">{matchDetails.awayTeam.name}</h2>
              </div>
            </div>
            
            {/* Match venue */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm text-slate-400">
              {matchDetails.venue && (
                <div className="flex items-center gap-1.5">
                  <FiMapPin size={14} />
                  <span>{matchDetails.venue}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <FiCalendar size={14} />
                <span>{formatDateToDisplay(matchDetails.date)}</span>
              </div>
              {matchDetails.referee && (
                <div className="flex items-center gap-1.5">
                  <FiUsers size={14} />
                  <span>Referee: {matchDetails.referee}</span>
                </div>
              )}
            </div>
            
            {/* Tabs */}
            <div className="mt-8 flex justify-center gap-2 sm:gap-4 flex-wrap">
              <TabButton 
                active={activeTab === 'summary'} 
                onClick={() => changeTab('summary')}
                icon={<FiInfo size={16} />}
              >
                Summary
              </TabButton>
              <TabButton 
                active={activeTab === 'stats'} 
                onClick={() => changeTab('stats')}
                icon={<FiBarChart2 size={16} />}
              >
                Statistics
              </TabButton>
              <TabButton 
                active={activeTab === 'lineups'} 
                onClick={() => changeTab('lineups')}
                icon={<FiUsers size={16} />}
              >
                Lineups
              </TabButton>
              <TabButton 
                active={activeTab === 'h2h'} 
                onClick={() => changeTab('h2h')}
                icon={<FiActivity size={16} />}
              >
                H2H
              </TabButton>
            </div>
          </div>
          
          {/* Tab Content */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 sm:p-6 shadow-lg border border-slate-700/50">
            {/* Summary Tab */}
            {activeTab === 'summary' && (
              <div className="animate-fadeIn">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <FiInfo className="text-indigo-400" />
                  <span>Match Summary</span>
                </h3>
                
                {matchDetails.status === 'upcoming' ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400 bg-slate-800/30 rounded-xl">
                    <FiInfo size={32} className="mb-3 text-slate-500" />
                    <p className="text-center max-w-md">
                      This match hasn't started yet. Check back later for match events and updates.
                    </p>
                  </div>
                ) : !matchDetails.events || matchDetails.events.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400 bg-slate-800/30 rounded-xl">
                    <FiInfo size={32} className="mb-3 text-slate-500" />
                    <p className="text-center max-w-md">
                      No events have been recorded for this match yet.
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-[21px] top-0 bottom-0 w-0.5 bg-slate-700/50"></div>
                    
                    {/* Events */}
                    <div className="space-y-4">
                      {matchDetails.events.map((event: MatchEvent, index) => {
                        const isHomeTeam = event.team.id.toString() === matchDetails.homeTeam.id;
                        
                        return (
                          <div key={index} className="relative flex">
                            {/* Event time */}
                            <div className="min-w-[42px] flex flex-col items-center">
                              <div className="text-xs font-bold text-indigo-400 mb-1">
                                {event.time.elapsed}'{event.time.extra ? `+${event.time.extra}` : ''}
                              </div>
                              <div className="z-10 w-7 h-7 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center">
                                <EventIcon type={event.type} />
                              </div>
                            </div>
                            
                            {/* Event content */}
                            <div className={`flex-1 ml-4 p-3 rounded-lg ${
                              isHomeTeam ? 'bg-slate-700/20' : 'bg-slate-700/30'
                            }`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-white">{event.player.name}</span>
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300">
                                    {isHomeTeam ? matchDetails.homeTeam.name : matchDetails.awayTeam.name}
                                  </span>
                                </div>
                                <div className="text-sm text-slate-400">
                                  {event.type === 'Goal' && '⚽ Goal'}
                                  {event.detail === 'Yellow Card' && '🟨 Yellow Card'}
                                  {event.detail === 'Red Card' && '🟥 Red Card'}
                                  {event.type === 'subst' && '🔄 Substitution'}
                                  {event.type === 'Var' && '📺 VAR Decision'}
                                  {event.detail === 'Penalty' && '⚽ Penalty'}
                                </div>
                              </div>
                              
                              {event.detail && event.detail !== 'Yellow Card' && event.detail !== 'Red Card' && (
                                <p className="text-sm text-slate-400 mt-1">{event.detail}</p>
                              )}
                              
                              {event.assist && event.assist.name && (
                                <p className="text-xs text-slate-400 mt-1">
                                  Assist: <span className="text-indigo-400">{event.assist.name}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Statistics Tab */}
            {activeTab === 'stats' && (
              <div className="animate-fadeIn">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <FiBarChart2 className="text-indigo-400" />
                  <span>Match Statistics</span>
                </h3>
                
                {matchDetails.status === 'upcoming' ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400 bg-slate-800/30 rounded-xl">
                    <FiBarChart2 size={32} className="mb-3 text-slate-500" />
                    <p className="text-center max-w-md">
                      Match statistics will be available once the match begins.
                    </p>
                  </div>
                ) : !matchDetails.stats ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400 bg-slate-800/30 rounded-xl">
                    <FiBarChart2 size={32} className="mb-3 text-slate-500" />
                    <p className="text-center max-w-md">
                      No statistics are available for this match yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-md font-semibold text-white mb-3">Possession & Shots</h4>
                      
                      {/* Possession */}
                      {matchDetails.stats.possession && (
                        <StatBar 
                          home={matchDetails.stats.possession.home}
                          away={matchDetails.stats.possession.away}
                          label="Possession (%)"
                        />
                      )}
                      
                      {/* Total Shots */}
                      {matchDetails.stats.shots && (
                        <>
                          <StatBar 
                            home={matchDetails.stats.shots.home.total}
                            away={matchDetails.stats.shots.away.total}
                            label="Total Shots"
                          />
                          
                          <StatBar 
                            home={matchDetails.stats.shots.home.onTarget}
                            away={matchDetails.stats.shots.away.onTarget}
                            label="Shots on Target"
                          />
                        </>
                      )}
                      
                      {/* Corners */}
                      {matchDetails.stats.corners && (
                        <StatBar 
                          home={matchDetails.stats.corners.home}
                          away={matchDetails.stats.corners.away}
                          label="Corners"
                        />
                      )}
                    </div>
                    
                    <div>
                      <h4 className="text-md font-semibold text-white mb-3">Fouls & Cards</h4>
                      
                      {/* Fouls */}
                      {matchDetails.stats.fouls && (
                        <StatBar 
                          home={matchDetails.stats.fouls.home}
                          away={matchDetails.stats.fouls.away}
                          label="Fouls"
                        />
                      )}
                      
                      {/* Cards */}
                      {matchDetails.stats.cards && (
                        <>
                          <StatBar 
                            home={matchDetails.stats.cards.yellow.home}
                            away={matchDetails.stats.cards.yellow.away}
                            label="Yellow Cards"
                          />
                          
                          <StatBar 
                            home={matchDetails.stats.cards.red.home}
                            away={matchDetails.stats.cards.red.away}
                            label="Red Cards"
                          />
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Lineups Tab */}
            {activeTab === 'lineups' && (
              <div className="animate-fadeIn">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <FiUsers className="text-indigo-400" />
                  <span>Lineups & Formations</span>
                </h3>
                
                {!matchDetails.lineups || matchDetails.lineups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400 bg-slate-800/30 rounded-xl">
                    <FiUsers size={32} className="mb-3 text-slate-500" />
                    <p className="text-center max-w-md">
                      {matchDetails.status === 'upcoming' 
                        ? "Lineups will be available closer to match kickoff."
                        : "No lineup information is available for this match."}
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Formation display */}
                    <div className="flex justify-between mb-6">
                      <div className="text-center">
                        <div className="text-white font-semibold mb-1">{matchDetails.homeTeam.name}</div>
                        <div className="text-indigo-400 text-sm font-medium">{matchDetails.lineups[0]?.formation || "TBD"}</div>
                        <div className="text-slate-400 text-xs mt-1">Coach: {matchDetails.lineups[0]?.coach?.name || "Unknown"}</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-white font-semibold mb-1">{matchDetails.awayTeam.name}</div>
                        <div className="text-indigo-400 text-sm font-medium">{matchDetails.lineups[1]?.formation || "TBD"}</div>
                        <div className="text-slate-400 text-xs mt-1">Coach: {matchDetails.lineups[1]?.coach?.name || "Unknown"}</div>
                      </div>
                    </div>
                    
                    {/* Starting XI */}
                    <h4 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
                      <FiStar className="text-yellow-400" size={16} />
                      <span>Starting XI</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      <div className="bg-slate-800/30 rounded-xl p-4">
                        <h5 className="text-sm font-medium text-indigo-400 mb-3">{matchDetails.homeTeam.name}</h5>
                        {matchDetails.lineups[0]?.startXI?.length > 0 ? (
                          <div className="space-y-1">
                            {matchDetails.lineups[0].startXI.map((player: { player: any; }, index: any) => (
                              <PlayerCard key={player.player.id || index} player={player} isHome={true} />
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-400 text-sm py-2">Starting lineup not available yet</p>
                        )}
                      </div>
                      
                      <div className="bg-slate-800/30 rounded-xl p-4">
                        <h5 className="text-sm font-medium text-indigo-400 mb-3">{matchDetails.awayTeam.name}</h5>
                        {matchDetails.lineups[1]?.startXI?.length > 0 ? (
                          <div className="space-y-1">
                            {matchDetails.lineups[1].startXI.map((player: { player: any; }, index: any) => (
                              <PlayerCard key={player.player.id || index} player={player} isHome={false} />
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-400 text-sm py-2">Starting lineup not available yet</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Substitutes */}
                    <h4 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
                      <FiUsers className="text-indigo-400" size={16} />
                      <span>Substitutes</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-800/20 rounded-xl p-4">
                        <h5 className="text-sm font-medium text-indigo-400 mb-3">{matchDetails.homeTeam.name}</h5>
                        {matchDetails.lineups[0]?.substitutes?.length > 0 ? (
                          <div className="space-y-1">
                            {matchDetails.lineups[0].substitutes.map((player: { player: any; }, index: any) => (
                              <PlayerCard key={player.player.id || index} player={player} isHome={true} />
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-400 text-sm py-2">Substitutes not available yet</p>
                        )}
                      </div>
                      
                      <div className="bg-slate-800/20 rounded-xl p-4">
                        <h5 className="text-sm font-medium text-indigo-400 mb-3">{matchDetails.awayTeam.name}</h5>
                        {matchDetails.lineups[1]?.substitutes?.length > 0 ? (
                          <div className="space-y-1">
                            {matchDetails.lineups[1].substitutes.map((player: { player: any; }, index: any) => (
                              <PlayerCard key={player.player.id || index} player={player} isHome={false} />
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-400 text-sm py-2">Substitutes not available yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Head-to-Head Tab */}
            {activeTab === 'h2h' && (
              <div className="animate-fadeIn">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <FiActivity className="text-indigo-400" />
                  <span>Head-to-Head</span>
                </h3>
                
                {/* This data isn't directly available in your API structure but could be implemented */}
                <div className="flex flex-col items-center justify-center py-8 text-slate-400 bg-slate-800/30 rounded-xl">
                  <FiActivity size={32} className="mb-3 text-slate-500" />
                  <p className="text-center max-w-md">
                    Head-to-head statistics between these teams will be available soon.
                  </p>
                  <p className="text-center text-xs mt-2 text-slate-500">
                    You can get this data by implementing a separate API call to get previous meetings.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Back button at the bottom of the page for easier navigation */}
          <div className="mt-6 flex justify-center">
            <button 
              onClick={navigateToDashboard}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              aria-label="Go back to dashboard"
            >
              <FiArrowLeft size={16} />
              <span>Go Back to Dashboard</span>
            </button>
          </div>
        </>
      )}
      
      {/* Add CSS for animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}