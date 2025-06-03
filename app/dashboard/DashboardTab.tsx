'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useFootballData } from '@/lib/contexts/FootballDataContext';
import { FootballMatch } from '@/lib/services/MatchesService';
import { 
  FiCalendar, FiClock, FiRefreshCw, FiTrendingUp, FiActivity,
  FiUsers, FiMessageCircle, FiHeart, FiAlertTriangle, FiMap,
  FiStar, FiShield, FiBarChart2, FiShare2, FiBell, FiBellOff
} from 'react-icons/fi';

// Updated timestamp and user
const CURRENT_TIMESTAMP = "2025-06-02 11:50:50";
const CURRENT_USER = "Sdiabate1337";

// Base64 encoded placeholder images to avoid 502 errors
const PLACEHOLDER_LEAGUE_IMG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiMzNDNhNDAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPkw8L3RleHQ+PC9zdmc+";
const PLACEHOLDER_TEAM_IMG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiMzNDNhNDAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPlQ8L3RleHQ+PC9zdmc+";

// Helper to format dates - same as in other components
const formatDateToDisplay = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    return date.toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    console.error(`[${CURRENT_TIMESTAMP}] Date parsing error:`, e);
    return dateString;
  }
};

export default function DashboardTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date(CURRENT_TIMESTAMP));
  const [refreshing, setRefreshing] = useState(false);
  const [followedMatchIds, setFollowedMatchIds] = useState<string[]>([]);
  const [favoriteTeams, setFavoriteTeams] = useState<string[]>(['Manchester United', 'Barcelona', 'Bayern Munich']);
  const [favoriteLeagues, setFavoriteLeagues] = useState<string[]>(['Premier League', 'Champions League']);
  
  // Use the FootballDataContext for real data
  const { 
    liveMatches, 
    upcomingMatches, 
    todayMatches, 
    isLoadingMatches, 
    refreshData, 
    lastUpdated: contextLastUpdated,
    matchError
  } = useFootballData();
  
  // Track the previous contextLastUpdated value to avoid unnecessary updates
  const prevContextLastUpdatedRef = useRef(contextLastUpdated);
  
  // Derive finished matches from today's matches that aren't live or upcoming
  const finishedMatches = todayMatches.filter(match => match.status === 'finished');
  
  // Format time from timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };
  
  // Toggle following a match
  const toggleFollowMatch = useCallback((matchId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    setFollowedMatchIds(prev => {
      const isCurrentlyFollowed = prev.includes(matchId);
      const updated = isCurrentlyFollowed 
        ? prev.filter(id => id !== matchId) 
        : [...prev, matchId];
      
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} ${isCurrentlyFollowed ? 'unfollowed' : 'followed'} match ${matchId}`);
      
      return updated;
    });
  }, []);
  
  // Refresh data
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} manually refreshed dashboard data`);
    
    try {
      await refreshData();
      setLastUpdated(new Date(CURRENT_TIMESTAMP));
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshData]);
  
  // FIXED: Split the effects to prevent infinite loop
  
  // First effect: Handle loading state only
  useEffect(() => {
    // Only consider loaded when we're not loading AND we have some data to display
    if (!isLoadingMatches && (
        (upcomingMatches && upcomingMatches.length > 0) || 
        (liveMatches && liveMatches.length > 0) ||
        (finishedMatches && finishedMatches.length > 0) ||
        matchError
      )) {
      setLoading(false);
    }
    
    // Also, if loading is complete but it's been 3 seconds, consider it loaded even without data
    const timeoutId = setTimeout(() => {
      if (!isLoadingMatches) {
        setLoading(false);
      }
    }, 3000);
    
    return () => clearTimeout(timeoutId);
  }, [isLoadingMatches, upcomingMatches, liveMatches, finishedMatches, matchError]);
  
  // Second effect: Update lastUpdated state from context
  useEffect(() => {
    // Only update if the value has actually changed and is not null
    if (contextLastUpdated && contextLastUpdated !== prevContextLastUpdatedRef.current) {
      prevContextLastUpdatedRef.current = contextLastUpdated;
      setLastUpdated(new Date(contextLastUpdated));
    }
  }, [contextLastUpdated]);
  
  // Load user preferences from localStorage on mount
  useEffect(() => {
    try {
      // Load followed matches
      const savedFollowed = localStorage.getItem('followed-matches');
      if (savedFollowed) {
        setFollowedMatchIds(JSON.parse(savedFollowed));
      }
      
      // Load favorite teams
      const savedTeams = localStorage.getItem('favorite-teams');
      if (savedTeams) {
        setFavoriteTeams(JSON.parse(savedTeams));
      }
      
      // Load favorite leagues
      const savedLeagues = localStorage.getItem('favorite-leagues');
      if (savedLeagues) {
        setFavoriteLeagues(JSON.parse(savedLeagues));
      }
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error loading user preferences:`, error);
    }
  }, []);
  
  // Save followed matches to localStorage when changed
  useEffect(() => {
    if (followedMatchIds.length > 0) {
      try {
        localStorage.setItem('followed-matches', JSON.stringify(followedMatchIds));
      } catch (error) {
        console.error(`[${CURRENT_TIMESTAMP}] Error saving followed matches:`, error);
      }
    }
  }, [followedMatchIds]);
  
  // For debugging purposes, log data availability
  useEffect(() => {
    console.log(`[${CURRENT_TIMESTAMP}] Dashboard data state:`, {
      liveMatches: liveMatches?.length || 0,
      upcomingMatches: upcomingMatches?.length || 0,
      todayMatches: todayMatches?.length || 0,
      finishedMatches: finishedMatches?.length || 0,
      isLoading: isLoadingMatches,
      componentLoading: loading,
      error: matchError
    });
  }, [liveMatches, upcomingMatches, todayMatches, finishedMatches, isLoadingMatches, loading, matchError]);
  
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Live Matches Section - High priority for sports fans */}
      <div 
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 sm:p-6 shadow-lg border border-slate-700/50 opacity-0 animate-fadeIn mb-4 sm:mb-6"
        style={{animationDelay: '0.2s', animationFillMode: 'forwards'}}
      >
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-red-500 absolute inset-0 animate-ping opacity-75"></div>
          </div>
          <h2 className="text-xl font-bold text-white">Live Matches</h2>
          <div className="flex ml-auto items-center gap-2">
            <span className="bg-red-500/20 text-red-400 px-2 py-1 text-xs rounded-full flex items-center gap-1">
              <FiActivity size={12} />
              <span>{liveMatches?.length || 0} live</span>
            </span>
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 text-white transition-all"
            >
              <FiRefreshCw className={`${refreshing ? 'animate-spin' : ''}`} size={16} />
            </button>
          </div>
        </div>
        
        <div className="text-xs flex items-center justify-between sm:hidden mb-3">
          <div className="text-indigo-300 font-medium">{new Date(CURRENT_TIMESTAMP).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
          <div className="text-slate-400 flex items-center gap-1">
            <FiClock size={12} />
            <span>Updated: {formatTime(lastUpdated)}</span>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-10 sm:py-16">
            <div className="relative">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full border-t-4 border-b-4 border-indigo-500 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <FiActivity className="text-indigo-500" size={24} />
              </div>
            </div>
          </div>
        ) : liveMatches && liveMatches.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {liveMatches.map(match => (
              <div 
                key={match.id} 
                className="bg-gradient-to-br from-slate-700/40 to-slate-800/40 hover:from-slate-700/60 hover:to-slate-800/60 backdrop-blur rounded-xl p-5 border border-red-500/20 shadow-lg transition-all cursor-pointer relative overflow-hidden transform hover:scale-[1.02]"
                onClick={() => window.location.href = `/match/${match.id}`}
              >
                {/* Pulsing effect at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-red-400"></div>
                
                {/* League name and live badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {match.league.logo ? (
                      <img 
                        src={match.league.logo} 
                        alt={match.league.name}
                        className="w-6 h-6 rounded-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER_LEAGUE_IMG;
                        }}
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-700 p-0.5 flex items-center justify-center text-xs shadow-md">
                        <span className="text-[8px] uppercase">{match.league.name.substring(0, 3)}</span>
                      </div>
                    )}
                    <span className="text-slate-300 text-sm font-medium">{match.league.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/20 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-red-400 text-xs font-medium">LIVE</span>
                    {match.elapsed && <span className="text-red-400 text-xs font-medium">{match.elapsed}'</span>}
                  </div>
                </div>
                
                {/* Score display */}
                <div className="flex items-center justify-between mb-4 sm:mb-5">
                  <div className="flex items-center gap-3">
                    {match.homeTeam.logo ? (
                      <img 
                        src={match.homeTeam.logo} 
                        alt={match.homeTeam.name}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-contain bg-slate-800/50 p-1"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER_TEAM_IMG;
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 shadow-inner border border-slate-700/80 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">{match.homeTeam.name.substring(0, 3)}</span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-white">{match.homeTeam.name}</p>
                      <p className="text-xs text-slate-400">{match.score?.home} goals</p>
                    </div>
                  </div>
                  
                  <div className="px-4 py-2 bg-slate-800 rounded-lg border border-slate-700 shadow-inner">
                    <div className="text-lg sm:text-2xl font-bold text-white flex items-center gap-3">
                      <span className="w-5 sm:w-7 text-center">{match.score?.home}</span>
                      <span className="text-slate-500">-</span>
                      <span className="w-5 sm:w-7 text-center">{match.score?.away}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-semibold text-white text-right">{match.awayTeam.name}</p>
                      <p className="text-xs text-slate-400 text-right">{match.score?.away} goals</p>
                    </div>
                    {match.awayTeam.logo ? (
                      <img 
                        src={match.awayTeam.logo} 
                        alt={match.awayTeam.name}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-contain bg-slate-800/50 p-1"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER_TEAM_IMG;
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 shadow-inner border border-slate-700/80 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">{match.awayTeam.name.substring(0, 3)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Match details */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-red-400">
                    <FiActivity size={16} />
                    <span className="font-medium">{match.elapsed}′</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-slate-400">
                    <FiMap size={14} />
                    <span>{match.venue}</span>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-600/30">
                  <button 
                    onClick={(e) => toggleFollowMatch(match.id, e)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                      followedMatchIds.includes(match.id) 
                        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' 
                        : 'bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white'
                    }`}
                  >
                    {followedMatchIds.includes(match.id) ? <FiBellOff size={14} /> : <FiBell size={14} />}
                    <span>{followedMatchIds.includes(match.id) ? "Unfollow" : "Follow"}</span>
                  </button>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/match/${match.id}?tab=stats`;
                      }}
                      className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                    >
                      <FiBarChart2 size={14} className="text-indigo-400" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (navigator.share) {
                          navigator.share({
                            title: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
                            text: `Check out this live match between ${match.homeTeam.name} and ${match.awayTeam.name}!`,
                            url: window.location.href
                          });
                        }
                      }}
                      className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                    >
                      <FiShare2 size={14} className="text-sky-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div 
            className="bg-slate-800/50 rounded-xl p-6 sm:p-8 text-center border border-slate-700/50 opacity-0 animate-fadeIn"
            style={{animationFillMode: 'forwards'}}
          >
            <div className="inline-block p-4 mb-3 rounded-full bg-slate-700/50">
              <FiAlertTriangle size={32} className="text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">No live matches</h3>
            <p className="text-slate-400 max-w-md mx-auto">
              There are no live matches at the moment. Check back later to follow real-time scores.
            </p>
          </div>
        )}
      </div>

      {/* Welcome Hero Section - MOVED BELOW LIVE MATCHES ON MOBILE*/}
      <div 
        className="bg-gradient-to-br from-indigo-900 via-slate-800 to-slate-900 rounded-2xl p-5 sm:p-6 shadow-lg overflow-hidden relative transform transition-all duration-300 hover:shadow-xl hidden sm:block"
      >
        {/* Abstract shapes in background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full filter blur-3xl opacity-10 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500 rounded-full filter blur-3xl opacity-10 translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Hello, {user?.name?.split(' ')[0] || CURRENT_USER.split(' ')[0] || "User"}
              </h1>
              <p className="text-indigo-200 max-w-lg">
                Welcome to your personalized dashboard. Follow live matches and discover upcoming sporting events.
              </p>
            </div>
            
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm transition-all shadow-lg disabled:opacity-70 transform hover:scale-105 active:scale-95"
            >
              <FiRefreshCw className={`${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
          
          <div className="text-xs text-indigo-200/70 mt-4 flex items-center gap-1">
            <FiClock size={12} />
            <span>Last updated: {formatTime(lastUpdated)}</span>
          </div>
        </div>
      </div>
      
      {/* Upcoming matches - PLACED SECOND FOR MOBILE PRIORITY */}
      <div 
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 sm:p-6 shadow-lg border border-slate-700/50 opacity-0 animate-fadeIn"
        style={{animationDelay: '0.3s', animationFillMode: 'forwards'}}
      >
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <FiCalendar size={20} className="text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Upcoming Matches</h2>
          </div>
          <span className="bg-indigo-500/20 text-indigo-400 px-3 py-1 text-xs rounded-full">
            {upcomingMatches?.length || 0} matches
          </span>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-10 sm:py-16">
            <div className="relative">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full border-t-4 border-b-4 border-indigo-500 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <FiActivity className="text-indigo-500" size={24} />
              </div>
            </div>
          </div>
        ) : upcomingMatches && upcomingMatches.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {upcomingMatches.slice(0, 3).map(match => (
              <div 
                key={match.id} 
                className="p-4 rounded-xl bg-slate-700/20 hover:bg-slate-700/30 border border-slate-700/50 transition-all cursor-pointer transform hover:scale-[1.01]"
                onClick={() => window.location.href = `/match/${match.id}`}
              >
                {/* League and date */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {match.league.logo ? (
                      <img 
                        src={match.league.logo} 
                        alt={match.league.name}
                        className="w-5 h-5 rounded-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER_LEAGUE_IMG;
                        }}
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-700 p-0.5 flex items-center justify-center text-[8px]">
                        <span>{match.league.name.substring(0, 2)}</span>
                      </div>
                    )}
                    <span className="text-indigo-400 text-sm">{match.league.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <FiCalendar size={12} />
                    <span>{formatDateToDisplay(match.date)}</span>
                  </div>
                </div>
                
                {/* Teams */}
                <div className="flex items-center justify-between my-3">
                  <div className="flex items-center gap-3">
                    {match.homeTeam.logo ? (
                      <img 
                        src={match.homeTeam.logo} 
                        alt={match.homeTeam.name}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-contain bg-slate-800/50 p-1"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER_TEAM_IMG;
                        }}
                      />
                    ) : (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                        <span className="text-xs font-medium">{match.homeTeam.name.substring(0, 2)}</span>
                      </div>
                    )}
                    <span className="font-medium text-white">{match.homeTeam.name}</span>
                  </div>
                  
                  <div className="px-3 py-1 rounded text-sm font-medium text-slate-300">
                    VS
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-white">{match.awayTeam.name}</span>
                    {match.awayTeam.logo ? (
                      <img 
                        src={match.awayTeam.logo} 
                        alt={match.awayTeam.name}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-contain bg-slate-800/50 p-1"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER_TEAM_IMG;
                        }}
                      />
                    ) : (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                        <span className="text-xs font-medium">{match.awayTeam.name.substring(0, 2)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Match details */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <FiClock size={14} />
                    <span>{match.time}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <FiMap size={14} />
                    <span>{match.venue}</span>
                  </div>
                  
                  <button 
                    onClick={(e) => toggleFollowMatch(match.id, e)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                      followedMatchIds.includes(match.id) 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                    }`}
                  >
                    {followedMatchIds.includes(match.id) ? <FiBellOff size={12} /> : <FiBell size={12} />}
                    <span>{followedMatchIds.includes(match.id) ? "Unfollow" : "Follow"}</span>
                  </button>
                </div>
              </div>
            ))}
            
            <button 
              onClick={() => window.location.href = '/matches?filter=upcoming'}
              className="w-full py-3 mt-2 text-indigo-400 font-medium hover:text-indigo-300 transition-all border border-indigo-500/20 rounded-xl hover:border-indigo-500/40 bg-slate-800/30 hover:bg-slate-800/50 transform hover:translate-y-[-2px]"
            >
              View all upcoming matches
            </button>
          </div>
        ) : (
          <div 
            className="bg-slate-800/50 rounded-xl p-6 sm:p-8 text-center border border-slate-700/50"
          >
            <div className="inline-block p-4 mb-3 rounded-full bg-slate-700/50">
              <FiCalendar size={28} className="text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">No scheduled matches</h3>
            <p className="text-slate-400 max-w-md mx-auto">
              There are no upcoming matches scheduled at the moment. Add teams to your favorites to receive notifications.
            </p>
            <button className="mt-4 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors">
              Add favorites
            </button>
          </div>
        )}
      </div>
      
      {/* Recently Finished Matches */}
      <div 
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 sm:p-6 shadow-lg border border-slate-700/50 opacity-0 animate-fadeIn"
        style={{animationDelay: '0.4s', animationFillMode: 'forwards'}}
      >
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <FiBarChart2 size={20} className="text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Recent Results</h2>
          </div>
          <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 text-xs rounded-full">
            {finishedMatches?.length || 0} matches
          </span>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="relative">
              <div className="h-12 w-12 rounded-full border-t-4 border-b-4 border-emerald-500 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <FiActivity className="text-emerald-500" />
              </div>
            </div>
          </div>
        ) : finishedMatches && finishedMatches.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {finishedMatches.slice(0, 2).map(match => (
              <div 
                key={match.id} 
                className="p-4 rounded-xl bg-slate-700/20 hover:bg-slate-700/30 border border-slate-700/50 transition-all cursor-pointer transform hover:scale-[1.01]"
                onClick={() => window.location.href = `/match/${match.id}`}
              >
                {/* League and date */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {match.league.logo ? (
                      <img 
                        src={match.league.logo} 
                        alt={match.league.name}
                        className="w-5 h-5 rounded-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER_LEAGUE_IMG;
                        }}
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-700 p-0.5 flex items-center justify-center text-[8px]">
                        <span>{match.league.name.substring(0, 2)}</span>
                      </div>
                    )}
                    <span className="text-emerald-400 text-sm">{match.league.name}</span>
                  </div>
                  
                  <div className="px-2 py-0.5 rounded bg-slate-700/50 text-xs text-slate-400">
                    FINISHED
                  </div>
                </div>
                
                {/* Teams */}
                <div className="flex items-center justify-between my-3">
                  <div className="flex items-center gap-3">
                    {match.homeTeam.logo ? (
                      <img 
                        src={match.homeTeam.logo} 
                        alt={match.homeTeam.name}
                        className="w-9 h-9 rounded-full object-contain bg-slate-800/50 p-1"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER_TEAM_IMG;
                        }}
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                        <span className="text-xs font-medium">{match.homeTeam.name.substring(0, 2)}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-white">{match.homeTeam.name}</span>
                      {match.score && 
                        match.score.home != null && 
                        match.score.away != null && 
                        match.score.home > match.score.away && (
                        <div className="text-xs text-emerald-400 font-medium">Winner</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="px-3 py-1 rounded text-sm font-medium text-white bg-slate-800/80">
                    {match.score?.home} - {match.score?.away}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-medium text-white">{match.awayTeam.name}</span>
                      {match.score && 
                        match.score.home != null && 
                        match.score.away != null && 
                        match.score.away > match.score.home && (
                        <div className="text-xs text-emerald-400 font-medium">Winner</div>
                      )}
                    </div>
                    {match.awayTeam.logo ? (
                      <img 
                        src={match.awayTeam.logo} 
                        alt={match.awayTeam.name}
                        className="w-9 h-9 rounded-full object-contain bg-slate-800/50 p-1"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER_TEAM_IMG;
                        }}
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                        <span className="text-xs font-medium">{match.awayTeam.name.substring(0, 2)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Match details */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <FiCalendar size={14} />
                    <span>{formatDateToDisplay(match.date)}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <FiMap size={14} />
                    <span>{match.venue}</span>
                  </div>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/match/${match.id}?tab=stats`;
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-700 hover:bg-slate-600 text-white transition-all"
                  >
                    <FiBarChart2 size={12} />
                    <span>Statistics</span>
                  </button>
                </div>
              </div>
            ))}
            
            <button 
              onClick={() => window.location.href = '/matches?filter=finished'}
              className="w-full py-3 mt-2 text-emerald-400 font-medium hover:text-emerald-300 transition-all border border-emerald-500/20 rounded-xl hover:border-emerald-500/40 bg-slate-800/30 hover:bg-slate-800/50 transform hover:translate-y-[-2px]"
            >
              View all results
            </button>
          </div>
        ) : (
          <div 
            className="bg-slate-800/50 rounded-xl p-6 text-center border border-slate-700/50"
          >
            <div className="inline-block p-4 mb-3 rounded-full bg-slate-700/50">
              <FiBarChart2 size={28} className="text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">No recent results</h3>
            <p className="text-slate-400 max-w-md mx-auto">
              There are no recently finished matches to display.
            </p>
          </div>
        )}
      </div>
      
      {/* Stats Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-3">
        <div 
          className="bg-gradient-to-br from-indigo-900/90 to-slate-800 rounded-xl p-4 sm:p-5 shadow-lg border border-indigo-800/50 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] opacity-0 animate-fadeIn"
          style={{animationDelay: '0.5s', animationFillMode: 'forwards'}}
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-indigo-500/20 rounded-lg">
              <FiUsers className="text-indigo-400" size={20} />
            </div>
            <div>
              <p className="text-sm sm:text-base text-slate-300">Teams</p>
              <p className="text-xl sm:text-3xl font-bold text-white">{favoriteTeams.length}</p>
            </div>
          </div>
        </div>
        
        <div 
          className="bg-gradient-to-br from-sky-900/80 to-slate-800 rounded-xl p-4 sm:p-5 shadow-lg border border-sky-800/50 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] opacity-0 animate-fadeIn"
          style={{animationDelay: '0.55s', animationFillMode: 'forwards'}}
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-sky-500/20 rounded-lg">
              <FiCalendar className="text-sky-400" size={20} />
            </div>
            <div>
              <p className="text-sm sm:text-base text-slate-300">Matches</p>
              <p className="text-xl sm:text-3xl font-bold text-white">{(upcomingMatches?.length || 0) + (liveMatches?.length || 0)}</p>
            </div>
          </div>
        </div>
        
        <div 
          className="bg-gradient-to-br from-emerald-900/80 to-slate-800 rounded-xl p-4 sm:p-5 shadow-lg border border-emerald-800/50 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] opacity-0 animate-fadeIn"
          style={{animationDelay: '0.6s', animationFillMode: 'forwards'}}
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-emerald-500/20 rounded-lg">
              <FiMessageCircle className="text-emerald-400" size={20} />
            </div>
            <div>
              <p className="text-sm sm:text-base text-slate-300">Live</p>
              <p className="text-xl sm:text-3xl font-bold text-white">{liveMatches?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div 
          className="bg-gradient-to-br from-rose-900/80 to-slate-800 rounded-xl p-4 sm:p-5 shadow-lg border border-rose-800/50 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] opacity-0 animate-fadeIn"
          style={{animationDelay: '0.65s', animationFillMode: 'forwards'}}
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-rose-500/20 rounded-lg">
              <FiHeart className="text-rose-400" size={20} />
            </div>
            <div>
              <p className="text-sm sm:text-base text-slate-300">Followed</p>
              <p className="text-xl sm:text-3xl font-bold text-white">{followedMatchIds.length}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add CSS for custom animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}