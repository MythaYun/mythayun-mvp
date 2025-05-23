'use client';

import { useMatchesDebug } from '../../lib/hooks/useFootBallDataDebug';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useMatches } from '../../lib/hooks/useFootBallData';
import { FootballMatch } from '../../lib/services/MatchesService';
import { 
  FiCalendar, FiFilter, FiClock, FiMap, FiRefreshCw, 
  FiChevronDown, FiAlertCircle, FiBell, FiBellOff, 
  FiActivity, FiStar, FiBarChart2, FiShare2, FiInfo
} from 'react-icons/fi';
// Fix: Import useRouter correctly from navigation
import { useRouter } from 'next/navigation';

// Updated timestamp and username as requested
const CURRENT_TIMESTAMP = "2025-05-22 13:30:25";
const CURRENT_USER = "Sdiabate1337provide the updated and correct version";

// Base64 encoded placeholder images to avoid 502 errors
const PLACEHOLDER_LEAGUE_IMG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiMzNDNhNDAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPkw8L3RleHQ+PC9zdmc+";
const PLACEHOLDER_TEAM_IMG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiMzNDNhNDAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPlQ8L3RleHQ+PC9zdmc+";

// League interface
interface League {
  id: string;
  name: string;
  logo: string;
  country: string;
}

// Month map type
interface MonthMap {
  [key: string]: string;
}

// Status counts interface
interface StatusCounts {
  live: number;
  upcoming: number;
  followed: number;
}

// Helper to format dates
const formatDateToDisplay = (dateString: string): string => {
  try {
    // Parse different date formats - API-Football returns dates in various formats
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      // If direct parsing failed, try to handle custom format
      const dateRegex = /(\d{1,2}) ([A-Za-z]+) (\d{4})/;
      const match = dateString.match(dateRegex);
      
      if (!match) return dateString;
      
      const day = match[1];
      let month = match[2].toLowerCase();
      const year = match[3];
      
      // Map French month names to English
      const monthMap: MonthMap = {
        'janvier': 'January',
        'fevrier': 'February',
        'février': 'February',
        'mars': 'March',
        'avril': 'April',
        'mai': 'May',
        'juin': 'June',
        'juillet': 'July',
        'aout': 'August',
        'août': 'August',
        'septembre': 'September',
        'octobre': 'October',
        'novembre': 'November',
        'decembre': 'December',
        'décembre': 'December'
      };
      
      month = monthMap[month] || month;
      return `${month} ${day}, ${year}`;
    }
    
    return date.toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    console.error(`[${CURRENT_TIMESTAMP}] Date parsing error:`, e);
    return dateString; // Return original if parsing fails
  }
};

export default function EventsTab() {
  // Fix: Use the hook correctly
  const router = useRouter();
  
  const { user } = useAuth();
  const username = CURRENT_USER; // Use the constant username
  
  const [filteredMatches, setFilteredMatches] = useState<FootballMatch[]>([]);
  const [filter, setFilter] = useState<'all' | 'followed' | 'upcoming' | 'live'>('all');
  const [leagueFilter, setLeagueFilter] = useState<string | null>(null);
  const [expandedFilters, setExpandedFilters] = useState<boolean>(false);
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop'>('desktop');
  const [leagues, setLeagues] = useState<League[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    live: 0,
    upcoming: 0,
    followed: 0
  });
  
  // Use refs for values that shouldn't trigger re-renders
  const followedMatchIdsRef = useRef<string[]>([]);
  const [followedMatchIds, setFollowedMatchIds] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use our custom hook for fetching matches
 const { matches, loading, error, refreshData, debugInfo } = useMatchesDebug({ 
  live: true,
  upcoming: true,
  days: 7,
  useMockData: true // Set to true to force mock data
});
  
  // Check if mobile - memoize the handler
  useEffect(() => {
    const checkIfMobile = () => {
      setDeviceType(window.innerWidth < 768 ? 'mobile' : 'desktop');
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // Extract unique leagues from matches for filtering
  useEffect(() => {
    if (matches && matches.length > 0) {
      // Extract unique leagues
      const uniqueLeagues: League[] = Array.from(
        new Map(matches.map(match => [match.league.id, {
          id: match.league.id,
          name: match.league.name,
          logo: match.league.logo,
          country: match.league.country || 'Unknown'
        }])).values()
      );
      
      setLeagues(uniqueLeagues);
    }
  }, [matches]);
  
  // Memoize the applyFilters function to prevent recreating it on each render
  const applyFilters = useCallback((matchData: FootballMatch[], activeFilter: string, leagueId: string | null) => {
    let filtered: FootballMatch[] = [...matchData];
    
    // Apply status filter
    if (activeFilter === 'followed') {
      filtered = filtered.filter(match => followedMatchIdsRef.current.includes(match.id));
    } else if (activeFilter === 'upcoming') {
      filtered = filtered.filter(match => match.status === 'upcoming');
    } else if (activeFilter === 'live') {
      filtered = filtered.filter(match => match.status === 'live');
    }
    
    // Apply league filter
    if (leagueId) {
      filtered = filtered.filter(match => match.league.id === leagueId);
    }
    
    // Sort by status priority: live > upcoming > finished
    filtered.sort((a, b) => {
      const statusPriority: Record<string, number> = { 'live': 0, 'upcoming': 1, 'finished': 2 };
      const priorityA = statusPriority[a.status] || 3;
      const priorityB = statusPriority[b.status] || 3;
      
      if (priorityA !== priorityB) return priorityA - priorityB;
      
      // For same status, sort by date/time
      const dateTimeA = new Date(`${a.date} ${a.time}`).getTime();
      const dateTimeB = new Date(`${b.date} ${b.time}`).getTime();
      return dateTimeA - dateTimeB;
    });
    
    setFilteredMatches(filtered);
    
    // Update the status counts for display
    setStatusCounts({
      live: filtered.filter(match => match.status === 'live').length,
      upcoming: filtered.filter(match => match.status === 'upcoming').length,
      followed: filtered.filter(match => followedMatchIdsRef.current.includes(match.id)).length
    });
  }, []);
  
  // Apply filters whenever matches or filter settings change
  useEffect(() => {
    if (!matches || matches.length === 0) return;
      
    // Create a copy of matches with updated follow status
    const matchesWithFollowStatus: FootballMatch[] = matches.map(match => ({
      ...match,
      followedByUser: followedMatchIdsRef.current.includes(match.id)
    }));
    
    applyFilters(matchesWithFollowStatus, filter, leagueFilter);
    
    console.log(`[${CURRENT_TIMESTAMP}] ${username} applied filters: ${filter}, league: ${leagueFilter || 'all'}`);
  }, [matches, filter, leagueFilter, applyFilters, username]);
  
  // Update followedMatchIds ref when the state changes
  useEffect(() => {
    followedMatchIdsRef.current = followedMatchIds;
  }, [followedMatchIds]);
  
  // Change filter - memoize this function
  const changeFilter = useCallback((newFilter: 'all' | 'followed' | 'upcoming' | 'live') => {
    setFilter(newFilter);
    setExpandedMatch(null);
  }, []);

  // Fixed: Now properly navigates to the match detail page
  const handleMatchDetailsClick = useCallback((matchId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    // Log the navigation attempt
    console.log(`[${CURRENT_TIMESTAMP}] ${username} is viewing details for match ${matchId}`);
    
    // Navigate to the match detail page using Next.js router
    router.push(`/match/${matchId}`);
  }, [router, username]);
  
  // Change league filter - memoize this function
  const changeLeagueFilter = useCallback((leagueId: string | null) => {
    setLeagueFilter(leagueId);
    setExpandedMatch(null);
  }, []);
  
  // Toggle following a match - memoize this function
  const toggleFollowMatch = useCallback((matchId: string, event?: React.MouseEvent) => {
    // Stop event propagation if provided
    if (event) {
      event.stopPropagation();
    }
    
    // Update followedMatchIds state
    setFollowedMatchIds(prev => {
      const isCurrentlyFollowed = prev.includes(matchId);
      const updated = isCurrentlyFollowed 
        ? prev.filter(id => id !== matchId) 
        : [...prev, matchId];
      
      // Log action
      console.log(`[${CURRENT_TIMESTAMP}] ${username} ${isCurrentlyFollowed ? 'unfollowed' : 'followed'} match ${matchId} (local state only)`);
      
      return updated;
    });
  }, [username]);
  
  // Handle match expansion
  const toggleExpandMatch = useCallback((matchId: string) => {
    setExpandedMatch(prev => prev === matchId ? null : matchId);
  }, []);
  
  // Handle refresh - uses our hook's refreshData function
  const handleRefresh = useCallback(async () => {
    console.log(`[${CURRENT_TIMESTAMP}] ${username} manually refreshed match data`);
    await refreshData();
  }, [refreshData, username]);
  
  // Group matches by date for better organization
  const getMatchesGroupedByDate = useCallback((): Record<string, FootballMatch[]> => {
    const groups: Record<string, FootballMatch[]> = {};
    
    filteredMatches.forEach(match => {
      const dateKey = match.date;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push({
        ...match, 
        followedByUser: followedMatchIdsRef.current.includes(match.id)
      });
    });
    
    return groups;
  }, [filteredMatches]);
  
  // Format date headers
  const formatDateHeader = useCallback((dateStr: string): string => {
    try {
      const today = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
      
      const formattedDate = formatDateToDisplay(dateStr);
      
      if (formattedDate === today) return 'Today';
      if (formattedDate === tomorrowStr) return 'Tomorrow';
      return formattedDate;
    } catch (e) {
      return dateStr; // Return original if parsing fails
    }
  }, []);
  
  // Current time - using the specified timestamp
  const currentTime = new Date(CURRENT_TIMESTAMP).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  
  // Get league icon by ID - memoize this function
  const getLeagueIcon = useCallback((leagueId: string): string => {
    const league = leagues.find(l => l.id === leagueId);
    return league?.logo || PLACEHOLDER_LEAGUE_IMG;
  }, [leagues]);
  
  // Reset all filters function
  const resetFilters = useCallback(() => {
    setFilter('all');
    setLeagueFilter(null);
  }, []);
  
  // Memoize the matchesGrouped value to prevent recalculations
  const matchesGrouped = getMatchesGroupedByDate();

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 sm:p-6 shadow-lg border border-slate-700/50" ref={containerRef}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiCalendar className="text-indigo-400" />
            <span>Match Calendar</span>
          </h2>
          <p className="text-slate-400">Find and follow upcoming and live matches</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center text-xs text-slate-400 sm:ml-auto">
          <div className="flex items-center gap-1">
            <FiClock size={12} /> 
            <span>Current Time: {currentTime}</span>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed ml-auto sm:ml-0"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            onClick={() => changeFilter('all')}
          >
            All Matches
          </button>
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'followed' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            onClick={() => changeFilter('followed')}
          >
            Followed Matches
          </button>
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'upcoming' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            onClick={() => changeFilter('upcoming')}
          >
            Upcoming
          </button>
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'live' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            onClick={() => changeFilter('live')}
          >
            Live
          </button>
          
          <button 
            className={`ml-auto px-4 py-2 rounded-lg text-sm font-medium transition-all ${expandedFilters ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'} flex items-center gap-1`}
            onClick={() => setExpandedFilters(!expandedFilters)}
          >
            <FiFilter size={16} />
            <span>Filters</span>
            <FiChevronDown className={`transition-transform ${expandedFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        {/* Extended filters with League Categories */}
        {expandedFilters && (
          <div className="mt-3 p-4 bg-slate-700/40 backdrop-blur-sm rounded-lg border border-slate-600/50 shadow-lg animate-fadeIn">
            <h3 className="text-sm text-slate-300 mb-3 font-medium">Filter by Competition</h3>
            
            {/* All leagues button - always visible */}
            <div className="flex flex-wrap gap-2 mb-3">
              <button 
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${leagueFilter === null ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                onClick={() => changeLeagueFilter(null)}
              >
                All Competitions
              </button>
            </div>
            
            {/* Group leagues by region/type for better organization */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* European Leagues */}
              <div className="bg-slate-800/40 p-2 rounded-lg">
                <h4 className="text-xs text-slate-400 mb-2 pl-1">European Leagues</h4>
                <div className="flex flex-wrap gap-2">
                  {leagues
                    .filter(league => ['England', 'Spain', 'Germany', 'Italy', 'France'].includes(league.country))
                    .map(league => (
                      <button 
                        key={league.id}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${leagueFilter === league.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                        onClick={() => changeLeagueFilter(league.id)}
                      >
                        {league.logo ? (
                          <img 
                            src={league.logo} 
                            alt={league.name} 
                            className="w-4 h-4 rounded-sm object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = PLACEHOLDER_LEAGUE_IMG;
                            }} 
                          />
                        ) : null}
                        {league.name}
                      </button>
                    ))}
                </div>
              </div>
              
              {/* International Competitions */}
              <div className="bg-slate-800/40 p-2 rounded-lg">
                <h4 className="text-xs text-slate-400 mb-2 pl-1">International & Cup Competitions</h4>
                <div className="flex flex-wrap gap-2">
                  {leagues
                    .filter(league => ['World', 'Africa', 'Europe'].includes(league.country) || league.name.includes('Cup'))
                    .map(league => (
                      <button 
                        key={league.id}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${leagueFilter === league.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                        onClick={() => changeLeagueFilter(league.id)}
                      >
                        {league.logo ? (
                          <img 
                            src={league.logo} 
                            alt={league.name} 
                            className="w-4 h-4 rounded-sm object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = PLACEHOLDER_LEAGUE_IMG;
                            }} 
                          />
                        ) : null}
                        {league.name}
                      </button>
                    ))}
                </div>
              </div>
              
              {/* Other Leagues */}
              <div className="bg-slate-800/40 p-2 rounded-lg">
                <h4 className="text-xs text-slate-400 mb-2 pl-1">Other Leagues</h4>
                <div className="flex flex-wrap gap-2">
                  {leagues
                    .filter(league => ['USA', 'Saudi Arabia', 'Brazil', 'Argentina', 'Mexico', 'Japan'].includes(league.country))
                    .map(league => (
                      <button 
                        key={league.id}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${leagueFilter === league.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                        onClick={() => changeLeagueFilter(league.id)}
                      >
                        {league.logo ? (
                          <img 
                            src={league.logo} 
                            alt={league.name} 
                            className="w-4 h-4 rounded-sm object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = PLACEHOLDER_LEAGUE_IMG;
                            }} 
                          />
                        ) : null}
                        {league.name}
                      </button>
                    ))}
                </div>
              </div>
              
              {/* Show remaining leagues if any don't fit into categories */}
              {leagues.filter(league => 
                !['England', 'Spain', 'Germany', 'Italy', 'France', 'World', 'Africa', 'Europe', 'USA', 'Saudi Arabia', 'Brazil', 'Argentina', 'Mexico', 'Japan'].includes(league.country) && 
                !league.name.includes('Cup')
              ).length > 0 && (
                <div className="bg-slate-800/40 p-2 rounded-lg">
                  <h4 className="text-xs text-slate-400 mb-2 pl-1">Other Competitions</h4>
                  <div className="flex flex-wrap gap-2">
                    {leagues
                      .filter(league => 
                        !['England', 'Spain', 'Germany', 'Italy', 'France', 'World', 'Africa', 'Europe', 'USA', 'Saudi Arabia', 'Brazil', 'Argentina', 'Mexico', 'Japan'].includes(league.country) && 
                        !league.name.includes('Cup')
                      )
                      .map(league => (
                        <button 
                          key={league.id}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${leagueFilter === league.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                          onClick={() => changeLeagueFilter(league.id)}
                        >
                          {league.logo ? (
                            <img 
                              src={league.logo} 
                              alt={league.name} 
                              className="w-4 h-4 rounded-sm object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = PLACEHOLDER_LEAGUE_IMG;
                              }} 
                            />
                          ) : null}
                          {league.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Error display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-400">
            <FiAlertCircle />
            <p>{error}</p>
          </div>
        </div>
      )}
      
      {/* Match counts */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-slate-400">
          Showing {filteredMatches.length} matches
          {leagueFilter && ` in ${leagues.find(l => l.id === leagueFilter)?.name}`}
          {filter !== 'all' && ` (${filter} filter)`}
        </div>
        
        {/* Match count by type */}
        <div className="flex gap-3">
          <div className="flex items-center gap-1 text-xs">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-slate-300">
              {statusCounts.live} Live
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
            <span className="text-slate-300">
              {statusCounts.upcoming} Upcoming
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div className="w-2 h-2 rounded-full bg-slate-500"></div>
            <span className="text-slate-300">
              {statusCounts.followed} Followed
            </span>
          </div>
        </div>
      </div>
      
      {/* Matches list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-slate-700/20 rounded-xl">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-indigo-500 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <FiActivity className="text-indigo-500" size={24} />
            </div>
          </div>
          <p className="mt-4 text-slate-400">Loading matches...</p>
        </div>
      ) : filteredMatches.length > 0 ? (
        <div className="space-y-6">
          {Object.keys(matchesGrouped).map(date => (
            <div key={date} className="animate-fadeIn">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-grow bg-slate-700/70"></div>
                <h3 className="text-sm font-medium text-slate-300 px-3 py-1 bg-slate-700/50 rounded-full">
                  {formatDateHeader(date)}
                </h3>
                <div className="h-px flex-grow bg-slate-700/70"></div>
              </div>
              
              <div className="space-y-4">
                {matchesGrouped[date].map(match => {
                  // Check if match is followed using the ref for consistency
                  const isFollowed = followedMatchIdsRef.current.includes(match.id);
                  
                  return (
                    <div 
                      key={match.id} 
                      className={`bg-slate-700/30 hover:bg-slate-700/40 transition-all rounded-xl overflow-hidden cursor-pointer border ${
                        match.status === 'live' 
                          ? 'border-red-600/30' 
                          : isFollowed 
                            ? 'border-indigo-600/30'
                            : 'border-slate-600/30'
                      } ${
                        expandedMatch === match.id ? 'shadow-lg' : 'shadow'
                      }`}
                      onClick={() => toggleExpandMatch(match.id)}
                    >
                      <div className="p-4">
                        {/* League info */}
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
                              <div className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center text-xs">
                                <span className="text-[8px] uppercase">{match.league.name.substring(0, 2)}</span>
                              </div>
                            )}
                            <span className="text-slate-300 text-sm font-medium">{match.league.name}</span>
                            <span className="text-xs text-slate-400">• {match.round || 'Regular Season'}</span>
                          </div>
                          
                          {/* Status badge */}
                          {match.status === 'live' ? (
                            <div className="bg-red-600/20 text-red-400 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></div>
                              <span>LIVE</span>
                              {match.elapsed && <span>{match.elapsed}'</span>}
                            </div>
                          ) : match.status === 'upcoming' ? (
                            <div className="bg-indigo-600/20 text-indigo-400 px-2 py-0.5 rounded text-xs font-medium">
                              UPCOMING
                            </div>
                          ) : (
                            <div className="bg-slate-600/20 text-slate-400 px-2 py-0.5 rounded text-xs font-medium">
                              FINISHED
                            </div>
                          )}
                        </div>
                        
                        {/* Teams */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {match.homeTeam.logo ? (
                              <img 
                                src={match.homeTeam.logo} 
                                alt={match.homeTeam.name} 
                                className="w-10 h-10 rounded-full object-contain bg-slate-800/50 p-1"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = PLACEHOLDER_TEAM_IMG;
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center shadow">
                                <span className="text-xs font-medium">{match.homeTeam.name.slice(0, 2)}</span>
                              </div>
                            )}
                            <span className="font-medium text-white">{match.homeTeam.name}</span>
                          </div>
                          
                          {/* Score or vs */}
                          {match.status === 'live' || match.status === 'finished' ? (
                            <div className={`px-4 py-2 rounded-lg font-medium shadow-inner border ${
                              match.status === 'live' ? 'bg-red-900/20 border-red-900/30' : 'bg-slate-800 border-slate-700'
                            }`}>
                              <span className="text-lg text-white">
                                {match.score?.home} - {match.score?.away}
                              </span>
                            </div>
                          ) : (
                            <div className="px-3 py-1 rounded font-medium text-slate-300">
                              VS
                            </div>
                          )}
                          
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-white">{match.awayTeam.name}</span>
                            {match.awayTeam.logo ? (
                              <img 
                                src={match.awayTeam.logo} 
                                alt={match.awayTeam.name} 
                                className="w-10 h-10 rounded-full object-contain bg-slate-800/50 p-1"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = PLACEHOLDER_TEAM_IMG;
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center shadow">
                                <span className="text-xs font-medium">{match.awayTeam.name.slice(0, 2)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Match details */}
                        <div className="mt-4 pt-3 border-t border-slate-600/30 flex items-center justify-between">
                          <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-1 text-slate-400 text-sm">
                              <FiCalendar size={14} />
                              <span>{formatDateToDisplay(match.date)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-400 text-sm">
                              <FiClock size={14} />
                              <span>{match.time}</span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-400 text-sm">
                              <FiMap size={14} />
                              <span>{match.venue}</span>
                            </div>
                          </div>
                          
                          <button 
                            onClick={(e) => toggleFollowMatch(match.id, e)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1
                              ${isFollowed 
                                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30' 
                                : 'bg-slate-600/20 text-slate-300 border border-slate-500/30 hover:bg-indigo-600/10 hover:border-indigo-500/20 hover:text-indigo-400'
                              }`}
                          >
                            {isFollowed ? (
                              <>
                                <FiBellOff size={12} />
                                <span>Unfollow</span>
                              </>
                            ) : (
                              <>
                                <FiBell size={12} />
                                <span>Follow</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {/* Expanded content */}
                      {expandedMatch === match.id && (
                        <div className="bg-slate-800/80 p-4 border-t border-slate-600/30 animate-fadeIn">
                          <div className="mb-3 flex items-center justify-between">
                            <h4 className="text-sm font-medium text-white">Match Details</h4>
                            
                            <div className="flex gap-2">
                              <button className="p-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300">
                                <FiBarChart2 size={16} />
                              </button>
                              <button className="p-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300">
                                <FiShare2 size={16} />
                              </button>
                              <button className="p-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300">
                                <FiInfo size={16} />
                              </button>
                            </div>
                          </div>
                          
                          {match.status === 'live' && (
                            <div className="grid grid-cols-3 gap-3 mb-4">
                              <div className="col-span-1 text-center">
                                <div className="text-2xl font-bold text-white">-</div>
                                <div className="text-xs text-slate-400 mt-1">Possession</div>
                              </div>
                              <div className="col-span-1 text-center">
                                <div className="text-2xl font-bold text-white">-</div>
                                <div className="text-xs text-slate-400 mt-1">Shots</div>
                              </div>
                              <div className="col-span-1 text-center">
                                <div className="text-2xl font-bold text-white">-</div>
                                <div className="text-xs text-slate-400 mt-1">On Target</div>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex justify-center gap-3">
                            <button 
                              onClick={(e) => handleMatchDetailsClick(match.id, e)}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm transition-all shadow"
                            >
                              <FiStar size={16} className="text-yellow-300" />
                              <span>Match Details</span>
                            </button>
                            
                            {match.status === 'upcoming' && (
                              <button 
                                onClick={(e) => toggleFollowMatch(match.id, e)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition-all"
                              >
                                {isFollowed ? <FiBellOff size={16} /> : <FiBell size={16} />}
                                <span>{isFollowed ? "Unfollow" : "Follow"}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-14 bg-slate-700/20 rounded-xl border border-slate-700/50">
          <FiAlertCircle size={40} className="text-slate-500 mb-3" />
          <p className="text-slate-300 font-medium">No matches match your criteria</p>
          <p className="text-sm text-slate-400 mt-1">Try modifying your filters</p>
          
          <button 
            onClick={resetFilters}
            className="mt-5 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all text-sm"
          >
            Reset Filters
          </button>
        </div>
      )}

      {process.env.NODE_ENV !== 'production' && (
      <div className="mt-8 p-4 bg-slate-800/60 rounded-lg text-xs border border-slate-700">
        <div className="flex justify-between items-center">
          <h3 className="text-white font-medium mb-2">Debug Panel</h3>
          <div className="text-slate-400">
            Current Time: {CURRENT_TIMESTAMP}
          </div>
        </div>
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => debugInfo.toggleMockData()}
            className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Toggle Mock Data
          </button>
          <button
            onClick={() => debugInfo.clearCache()}
            className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Clear Cache
          </button>
          <button
            onClick={() => refreshData()}
            className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Force Refresh
          </button>
        </div>
        <div className="mb-2 flex gap-2 text-sm">
          <span className={`px-2 py-0.5 rounded ${filteredMatches.length > 0 ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
            {filteredMatches.length} filtered matches
          </span>
          <span className={`px-2 py-0.5 rounded ${matches.length > 0 ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
            {matches.length} total matches
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-600/20 text-slate-400">
            User: {CURRENT_USER}
          </span>
        </div>
        <div className="text-xs text-slate-400">
          <details>
            <summary className="cursor-pointer hover:text-slate-300">API Response Details</summary>
            <pre className="mt-2 p-2 bg-slate-900 rounded text-green-400 overflow-auto max-h-60 text-[10px]">
              {JSON.stringify(debugInfo.apiResponse, null, 2)}
            </pre>
          </details>
        </div>
      </div>
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