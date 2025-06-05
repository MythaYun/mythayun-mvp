'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useFootballData } from '@/lib/contexts/FootballDataContext';
import { FootballMatch } from '@/lib/services/MatchesService';
import { 
  FiCalendar, FiFilter, FiClock, FiMap, FiRefreshCw, 
  FiChevronDown, FiAlertCircle, FiBell, FiBellOff, 
  FiActivity, FiStar, FiBarChart2, FiInfo, FiSearch,
  FiAward, FiX, FiSettings, FiCheck, FiHeart, FiList,
  FiGrid, FiLayers, FiChevronRight, FiGlobe, FiArrowRight
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';

// Current system information
const CURRENT_TIMESTAMP = "2025-06-05 18:24:08";
const CURRENT_USER = "Sdiabate1337";

// Base64 encoded placeholder images
const PLACEHOLDER_LEAGUE_IMG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiMzNDNhNDAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPkw8L3RleHQ+PC9zdmc+";
const PLACEHOLDER_TEAM_IMG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiMzNDNhNDAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPlQ8L3RleHQ+PC9zdmc+";

// Status counts interface
interface StatusCounts {
  live: number;
  upcoming: number;
  followed: number;
}

// Date range preset type
type DateRangePreset = 'today' | 'tomorrow' | 'week' | 'custom' | null;

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
      
      // Map month names if needed
      const monthMap: {[key: string]: string} = {
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
  // Use the router for navigation
  const router = useRouter();
  
  const { user } = useAuth();
  const username = CURRENT_USER;
  
  // Use our FootballDataContext
  const {
    leagues,
    todayMatches,
    upcomingMatches,
    liveMatches,
    isLoadingMatches,
    matchError,
    fetchCompetitionMatches,
    refreshData,
    favoriteLeagues: favLeagueIds
  } = useFootballData();
  
  // State for UI
  const [filteredMatches, setFilteredMatches] = useState<FootballMatch[]>([]);
  const [filter, setFilter] = useState<'all' | 'followed' | 'upcoming' | 'live'>('upcoming');
  const [leagueFilter, setLeagueFilter] = useState<string | null>(null);
  const [expandedFilters, setExpandedFilters] = useState<boolean>(false);
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop'>('desktop');
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    live: 0,
    upcoming: 0,
    followed: 0
  });
  const [loadingCompetitionMatches, setLoadingCompetitionMatches] = useState<boolean>(false);
  const [competitionMatches, setCompetitionMatches] = useState<FootballMatch[]>([]);
  const [competitionError, setCompetitionError] = useState<string | null>(null);
  const [allMatches, setAllMatches] = useState<FootballMatch[]>([]);
  
  // New state for improved filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterView, setFilterView] = useState<'popular' | 'all' | 'regions' | 'date'>('popular');
  const [favoriteLeagues, setFavoriteLeagues] = useState<string[]>([]);
  const [recentLeagues, setRecentLeagues] = useState<string[]>([]);
  
  // Date filter states
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Active filters
  const [activeFilters, setActiveFilters] = useState<{
    status: string; 
    league: string | null;
    dateRange: {
      preset: DateRangePreset;
      start: string;
      end: string;
    } | null;
  }>({
    status: 'upcoming',
    league: null,
    dateRange: null
  });

  // Track when filter modal was opened for animation purposes
  const [filterModalOpen, setFilterModalOpen] = useState<boolean>(false);
  const [dateFilterModalOpen, setDateFilterModalOpen] = useState<boolean>(false);
  
  // Use refs for values that shouldn't trigger re-renders
  const followedMatchIdsRef = useRef<string[]>([]);
  const [followedMatchIds, setFollowedMatchIds] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Check if mobile - memoize the handler
  useEffect(() => {
    const checkIfMobile = () => {
      setDeviceType(window.innerWidth < 768 ? 'mobile' : 'desktop');
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Initialize date values on first load
  useEffect(() => {
    // Set today's date as start date default
    const today = new Date(CURRENT_TIMESTAMP);
    setStartDate(today.toISOString().split('T')[0]);
    
    // Set date 7 days from now as end date default
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    setEndDate(nextWeek.toISOString().split('T')[0]);
  }, []);

  // Load favorite leagues from localStorage
  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem('favorite-leagues');
      if (savedFavorites) {
        setFavoriteLeagues(JSON.parse(savedFavorites));
      }
      
      const savedRecent = localStorage.getItem('recent-leagues');
      if (savedRecent) {
        setRecentLeagues(JSON.parse(savedRecent));
      }
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error loading league preferences:`, error);
    }
  }, []);

  // Save favorite leagues to localStorage when changed
  useEffect(() => {
    if (favoriteLeagues.length > 0) {
      try {
        localStorage.setItem('favorite-leagues', JSON.stringify(favoriteLeagues));
      } catch (error) {
        console.error(`[${CURRENT_TIMESTAMP}] Error saving favorite leagues:`, error);
      }
    }
  }, [favoriteLeagues]);

  // Save recent leagues to localStorage when changed
  useEffect(() => {
    if (recentLeagues.length > 0) {
      try {
        localStorage.setItem('recent-leagues', JSON.stringify(recentLeagues));
      } catch (error) {
        console.error(`[${CURRENT_TIMESTAMP}] Error saving recent leagues:`, error);
      }
    }
  }, [recentLeagues]);

  // Combine all matches from context into our allMatches state
  useEffect(() => {
    // Create a Set of unique match IDs to avoid duplicates
    const uniqueIds = new Set<string>();
    const combined: FootballMatch[] = [];

    // Process each match source, avoiding duplicates
    const processMatches = (matches: FootballMatch[]) => {
      matches.forEach(match => {
        if (!uniqueIds.has(match.id)) {
          uniqueIds.add(match.id);
          combined.push(match);
        }
      });
    };

    // Process each source in priority order
    processMatches(liveMatches);
    processMatches(todayMatches);
    processMatches(upcomingMatches);
    processMatches(competitionMatches);
    
    setAllMatches(combined);
    
    // Update status counts
    setStatusCounts({
      live: liveMatches.length,
      upcoming: upcomingMatches.length,
      followed: combined.filter(match => followedMatchIdsRef.current.includes(match.id)).length
    });
  }, [liveMatches, todayMatches, upcomingMatches, competitionMatches]);
  
  // Fetch competition matches
  const loadCompetitionMatches = useCallback(async (competitionCode: string) => {
    setLoadingCompetitionMatches(true);
    setCompetitionError(null);
    
    try {
      console.log(`[${CURRENT_TIMESTAMP}] Fetching matches for competition: ${competitionCode}`);
      
      const matches = await fetchCompetitionMatches(competitionCode);
      setCompetitionMatches(matches);
      
      // Automatically set filter to upcoming if matches found
      if (matches.length > 0) {
        setFilter('upcoming');
        setActiveFilters(prev => ({...prev, status: 'upcoming'}));
      }
      
    } catch (err: any) {
      console.error(`[${CURRENT_TIMESTAMP}] Error fetching competition matches:`, err);
      setCompetitionError(`Failed to load matches: ${err.message}`);
      setCompetitionMatches([]);
    } finally {
      setLoadingCompetitionMatches(false);
    }
  }, [fetchCompetitionMatches]);
  
  // Set date range preset
  const setDateRange = useCallback((preset: DateRangePreset) => {
    setDateRangePreset(preset);
    
    const today = new Date(CURRENT_TIMESTAMP);
    
    if (preset === 'today') {
      // Set both start and end to today
      const todayStr = today.toISOString().split('T')[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'tomorrow') {
      // Set both start and end to tomorrow
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      setStartDate(tomorrowStr);
      setEndDate(tomorrowStr);
    } else if (preset === 'week') {
      // Set start to today and end to 7 days from now
      const todayStr = today.toISOString().split('T')[0];
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];
      setStartDate(todayStr);
      setEndDate(nextWeekStr);
    }
    // For 'custom', we don't set dates here, we let the user select them
  }, []);

  // Apply date filter
  const applyDateFilter = useCallback(() => {
    setActiveFilters(prev => ({
      ...prev,
      dateRange: {
        preset: dateRangePreset,
        start: startDate,
        end: endDate
      }
    }));
    
    setDateFilterModalOpen(false);
  }, [dateRangePreset, startDate, endDate]);

  // Clear date filter
  const clearDateFilter = useCallback(() => {
    setDateRangePreset(null);
    
    // Reset to default date range (today to next week)
    const today = new Date(CURRENT_TIMESTAMP);
    const todayStr = today.toISOString().split('T')[0];
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];
    
    setStartDate(todayStr);
    setEndDate(nextWeekStr);
    
    setActiveFilters(prev => ({
      ...prev,
      dateRange: null
    }));
  }, []);
  
// Add this helper function near the top of your component
const getTrueMatchStatus = useCallback((match: FootballMatch): 'live' | 'upcoming' | 'finished' => {
  try {
    const now = new Date(CURRENT_TIMESTAMP);
    const matchDateTime = new Date(`${match.date} ${match.time}`);
    
    // Add a buffer of 2 hours to consider a match as "live"
    const matchEndTime = new Date(matchDateTime);
    matchEndTime.setHours(matchEndTime.getHours() + 2);
    
    if (matchDateTime > now) {
      return 'upcoming';
    } else if (now >= matchDateTime && now <= matchEndTime) {
      return 'live';
    } else {
      return 'finished';
    }
  } catch (e) {
    // If date parsing fails, fall back to API-provided status
    console.error(`[${CURRENT_TIMESTAMP}] Error calculating match status:`, e);
    return match.status as 'live' | 'upcoming' | 'finished';
  }
}, []);

// Then update your applyFilters function
const applyFilters = useCallback((
  activeFilter: string,
  leagueId: string | null,
  dateRange: {preset: DateRangePreset; start: string; end: string} | null
) => {
  // Start with all matches
  let filtered = [...allMatches];
  
  // Filter by date-aware status
  if (activeFilter === 'upcoming') {
    filtered = filtered.filter(match => getTrueMatchStatus(match) === 'upcoming');
  } else if (activeFilter === 'followed') {
    filtered = filtered.filter(match => followedMatchIdsRef.current.includes(match.id));
  } else if (activeFilter === 'live') {
    filtered = filtered.filter(match => getTrueMatchStatus(match) === 'live');
  }
  
  // League filter remains unchanged
  if (leagueId) {
    // ... existing league filter code ...
  }
  
  // Date range filter remains unchanged
  if (dateRange && (dateRange.start || dateRange.end)) {
    // ... existing date range filter code ...
  }
  
  // Sort by status priority, but use our calculated status
  filtered.sort((a, b) => {
    const statusPriority: Record<string, number> = { 'live': 0, 'upcoming': 1, 'finished': 2 };
    const statusA = getTrueMatchStatus(a);
    const statusB = getTrueMatchStatus(b);
    const priorityA = statusPriority[statusA] ?? 3;
    const priorityB = statusPriority[statusB] ?? 3;
    
    if (priorityA !== priorityB) return priorityA - priorityB;
    
    // For same status, sort by date/time
    const dateTimeA = new Date(`${a.date} ${a.time}`).getTime();
    const dateTimeB = new Date(`${b.date} ${b.time}`).getTime();
    return dateTimeA - dateTimeB;
  });
  
  setFilteredMatches(filtered);
  
  // Update the status counts for display - use our calculated status
  setStatusCounts({
    live: allMatches.filter(match => getTrueMatchStatus(match) === 'live').length,
    upcoming: allMatches.filter(match => getTrueMatchStatus(match) === 'upcoming').length,
    followed: allMatches.filter(match => followedMatchIdsRef.current.includes(match.id)).length
  });
}, [allMatches, leagues, getTrueMatchStatus]);
  
  // Apply filters whenever filter settings change
  useEffect(() => {
    if (allMatches.length === 0) return;
    
    // Apply the current filter settings
    applyFilters(filter, leagueFilter, activeFilters.dateRange);
    
    console.log(`[${CURRENT_TIMESTAMP}] ${username} applied filters: ${filter}, league: ${leagueFilter || 'all'}, date range: ${activeFilters.dateRange?.preset || 'all'}`);
  }, [filter, leagueFilter, activeFilters.dateRange, applyFilters, username, allMatches]);
  
  // Update followedMatchIds ref when the state changes
  useEffect(() => {
    followedMatchIdsRef.current = followedMatchIds;
  }, [followedMatchIds]);
  
  // Change filter - memoize this function
  const changeFilter = useCallback((newFilter: 'all' | 'followed' | 'upcoming' | 'live') => {
    setFilter(newFilter);
    setExpandedMatch(null);
    
    // Update active filters
    setActiveFilters(prev => ({...prev, status: newFilter}));
  }, []);

  // Navigate to the match detail page
  const handleMatchDetailsClick = useCallback((matchId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    // Log the navigation attempt
    console.log(`[${CURRENT_TIMESTAMP}] ${username} is viewing details for match ${matchId}`);
    
    // Navigate to the match detail page using Next.js router
    router.push(`/match/${matchId}`);
  }, [router, username]);
  
  // Change league filter and fetch competition matches
  const changeLeagueFilter = useCallback((leagueId: string | null) => {
    console.log(`[${CURRENT_TIMESTAMP}] ${username} changing league filter to: ${leagueId || 'all'}`);
    
    // If the same league is clicked again, clear the filter
    if (leagueId === leagueFilter) {
      setLeagueFilter(null);
      setActiveFilters(prev => ({...prev, league: null}));
      return;
    }
    
    setLeagueFilter(leagueId);
    setExpandedMatch(null);
    setActiveFilters(prev => ({...prev, league: leagueId}));
    
    // Close the filter modal after selection
    setFilterModalOpen(false);
    
    // If we have a league ID, fetch its matches
    if (leagueId) {
      const selectedLeague = leagues.find(l => l.id === leagueId);
      if (selectedLeague?.code) {
        console.log(`[${CURRENT_TIMESTAMP}] Fetching matches for league: ${selectedLeague.name} (${selectedLeague.code})`);
        loadCompetitionMatches(selectedLeague.code);
      }
    }
  }, [leagueFilter, username, leagues, loadCompetitionMatches]);
  
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
  
  // Handle refresh - uses context's refreshData function
  const handleRefresh = useCallback(async () => {
    console.log(`[${CURRENT_TIMESTAMP}] ${username} manually refreshed match data`);
    
    // Refresh the regular matches
    await refreshData();
    
    // Also refresh competition matches if a competition is selected
    if (leagueFilter) {
      const selectedLeague = leagues.find(l => l.id === leagueFilter);
      if (selectedLeague?.code) {
        loadCompetitionMatches(selectedLeague.code);
      }
    }
  }, [refreshData, username, leagueFilter, leagues, loadCompetitionMatches]);
  
  // Toggle favorite league
  const toggleFavoriteLeague = useCallback((leagueId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    setFavoriteLeagues(prev => {
      if (prev.includes(leagueId)) {
        return prev.filter(id => id !== leagueId);
      } else {
        return [...prev, leagueId];
      }
    });
  }, []);
  
  // Group matches by date for better organization
  const getMatchesGroupedByDate = useCallback((): Record<string, FootballMatch[]> => {
    const groups: Record<string, FootballMatch[]> = {};
    
    filteredMatches.forEach(match => {
      const dateKey = match.date;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(match);
    });
    
    return groups;
  }, [filteredMatches]);
  
  // Format date headers
  const formatDateHeader = useCallback((dateStr: string): string => {
    try {
      // Get current date based on our timestamp
      const currentDate = new Date(CURRENT_TIMESTAMP);
      const today = currentDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
      
      // Calculate tomorrow
      const tomorrow = new Date(currentDate);
      tomorrow.setDate(currentDate.getDate() + 1);
      const tomorrowStr = tomorrow.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
      
      const formattedDate = formatDateToDisplay(dateStr);
      
      if (formattedDate === today) return 'Today';
      if (formattedDate === tomorrowStr) return 'Tomorrow';
      return formattedDate;
    } catch (e) {
      return dateStr; // Return original if parsing fails
    }
  }, []);
  
  // Format date range for display
  const formatDateRangeForDisplay = useCallback((dateRange: {preset: DateRangePreset; start: string; end: string} | null): string => {
    if (!dateRange) return 'All Dates';
    
    if (dateRange.preset === 'today') return 'Today';
    if (dateRange.preset === 'tomorrow') return 'Tomorrow';
    if (dateRange.preset === 'week') return 'This Week';
    
    // For custom date range
    if (dateRange.start && dateRange.end) {
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      
      // If start and end are the same day
      if (dateRange.start === dateRange.end) {
        return formatDateToDisplay(dateRange.start);
      }
      
      return `${formatDateToDisplay(dateRange.start)} - ${formatDateToDisplay(dateRange.end)}`;
    }
    
    return 'Custom Range';
  }, []);
  
  // Current time based on our timestamp
  const currentTime = new Date(CURRENT_TIMESTAMP).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  
  // Reset all filters function
  const resetFilters = useCallback(() => {
    setFilter('all');
    setLeagueFilter(null);
    clearDateFilter();
    setActiveFilters({status: 'all', league: null, dateRange: null});
  }, [clearDateFilter]);
  
  // Filter leagues by search query
  const getFilteredLeagues = useCallback(() => {
    if (!searchQuery.trim()) {
      return leagues;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return leagues.filter(league => 
      league.name.toLowerCase().includes(query) || 
      (league.country && league.country.toLowerCase().includes(query))
    );
  }, [leagues, searchQuery]);
  
  // Focus search input when opening filter modal
  useEffect(() => {
    if (filterModalOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
    }
  }, [filterModalOpen]);
  
  // Memoize the matchesGrouped value to prevent recalculations
  const matchesGrouped = getMatchesGroupedByDate();

  // Group leagues by region for easier filtering
  const groupLeaguesByRegion = useCallback(() => {
    // Define popular regions by competition code
    const europeanLeagues = ['PL', 'BL1', 'SA', 'PD', 'FL1', 'PPL', 'DED', 'ELC'];
    const internationalLeagues = ['CL', 'EC', 'CLI', 'WC'];
    
    // Group leagues - safely check for code property
    const grouped = {
      european: leagues.filter(league => europeanLeagues.includes(league.code || '')),
      international: leagues.filter(league => internationalLeagues.includes(league.code || '')),
      other: leagues.filter(league => {
        const leagueCode = league.code || '';
        return !europeanLeagues.includes(leagueCode) && !internationalLeagues.includes(leagueCode);
      })
    };
    
    return grouped;
  }, [leagues]);

  const groupedLeagues = groupLeaguesByRegion();
  
  // Get popular leagues - union of favorites, recents, and top competitions
  const getPopularLeagues = useCallback(() => {
    // Start with favorite and recent leagues
    const popularLeagueIds = new Set([...favoriteLeagues, ...recentLeagues]);
    
    // Add major competitions if we have less than 10 popular leagues
    const majorLeagueCodes = ['PL', 'BL1', 'SA', 'PD', 'FL1', 'CL', 'EC', 'PPL']; 
    
    if (popularLeagueIds.size < 10) {
      leagues.forEach(league => {
        if (majorLeagueCodes.includes(league.code || '') && !popularLeagueIds.has(league.id)) {
          popularLeagueIds.add(league.id);
        }
      });
    }
    
    // Get full league objects
    return Array.from(popularLeagueIds)
      .map(id => leagues.find(l => l.id === id))
      .filter(Boolean) as typeof leagues;
  }, [favoriteLeagues, recentLeagues, leagues]);
  
  // Open date filter
  const openDateFilter = useCallback(() => {
    setDateFilterModalOpen(true);
    setFilterView('date');
  }, []);

  // Create a mock debugInfo object to maintain compatibility
  const debugInfo = {
    apiResponse: allMatches.slice(0, 2), // Just show a couple matches in debug
    toggleMockData: () => console.log(`[${CURRENT_TIMESTAMP}] Mock data toggle requested - using real data`),
    clearCache: () => console.log(`[${CURRENT_TIMESTAMP}] Cache clear requested`)
  };

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
            disabled={isLoadingMatches || loadingCompetitionMatches}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed ml-auto sm:ml-0"
          >
            <FiRefreshCw className={(isLoadingMatches || loadingCompetitionMatches) ? 'animate-spin' : ''} />
            <span>{(isLoadingMatches || loadingCompetitionMatches) ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>
      
      {/* Enhanced Filter Bar */}
      <div className="mb-6">
        {/* Primary filters with visual enhancements */}
        <div className="mb-3">
          <div className="bg-slate-800/50 p-1 rounded-xl shadow-inner grid grid-cols-4 gap-1">
            <button 
              className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                filter === 'all' 
                  ? 'bg-indigo-600 text-white shadow' 
                  : 'text-slate-300 hover:bg-slate-700/70'
              }`}
              onClick={() => changeFilter('all')}
            >
              <FiGrid size={14} className={filter === 'all' ? 'text-indigo-200' : 'text-slate-400'} />
              <span>All</span>
              <span className="text-xs opacity-70 ml-1">({allMatches.length})</span>
            </button>
            
            <button 
              className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                filter === 'live' 
                  ? 'bg-red-600 text-white shadow' 
                  : 'text-slate-300 hover:bg-slate-700/70'
              }`}
              onClick={() => changeFilter('live')}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${filter === 'live' ? 'bg-red-300 animate-pulse' : 'bg-slate-400'}`}></div>
              <span>Live</span>
              <span className="text-xs opacity-70 ml-1">({statusCounts.live})</span>
            </button>
            
            <button 
              className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                filter === 'upcoming' 
                  ? 'bg-indigo-600 text-white shadow' 
                  : 'text-slate-300 hover:bg-slate-700/70'
              }`}
              onClick={() => changeFilter('upcoming')}
            >
              <FiClock size={14} className={filter === 'upcoming' ? 'text-indigo-200' : 'text-slate-400'} />
              <span>Upcoming</span>
              <span className="text-xs opacity-70 ml-1">({statusCounts.upcoming})</span>
            </button>
            
            <button 
              className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                filter === 'followed' 
                  ? 'bg-indigo-600 text-white shadow' 
                  : 'text-slate-300 hover:bg-slate-700/70'
              }`}
              onClick={() => changeFilter('followed')}
            >
              <FiBell size={14} className={filter === 'followed' ? 'text-indigo-200' : 'text-slate-400'} />
              <span>Followed</span>
              <span className="text-xs opacity-70 ml-1">({statusCounts.followed})</span>
            </button>
          </div>
        </div>
        
        {/* Active filters and filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Active filter tags */}
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {/* Status filter tag */}
            <div className={`py-1 px-3 rounded-full text-xs font-medium inline-flex items-center gap-1.5 ${
              activeFilters.status === 'live' 
                ? 'bg-red-500/20 text-red-300 border border-red-600/30' 
                : activeFilters.status === 'followed' 
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-600/30' 
                  : activeFilters.status === 'upcoming'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-600/30'
                    : 'bg-slate-700/50 text-slate-300 border border-slate-600/30'
            }`}>
              {activeFilters.status === 'live' ? (
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></div>
              ) : activeFilters.status === 'followed' ? (
                <FiBell size={10} />
              ) : activeFilters.status === 'upcoming' ? (
                <FiClock size={10} />
              ) : (
                <FiGrid size={10} />
              )}
              <span className="capitalize">{activeFilters.status}</span>
            </div>
            
            {/* League filter tag - only if a league is selected */}
            {activeFilters.league && (
              <div className="bg-indigo-500/20 text-indigo-300 border border-indigo-600/30 py-1 px-3 rounded-full text-xs font-medium inline-flex items-center gap-1.5">
                <FiAward size={10} className="text-yellow-400" />
                <span>
                  {leagues.find(l => l.id === activeFilters.league)?.name || 'League'}
                </span>
                <button 
                  onClick={() => changeLeagueFilter(null)}
                  className="ml-1 p-0.5 rounded-full hover:bg-indigo-700/50"
                >
                  <FiX size={10} />
                </button>
              </div>
            )}
            
            {/* Date range filter tag - only if a date range is set */}
            {activeFilters.dateRange && (
              <div className="bg-blue-500/20 text-blue-300 border border-blue-600/30 py-1 px-3 rounded-full text-xs font-medium inline-flex items-center gap-1.5">
                <FiCalendar size={10} className="text-blue-400" />
                <span>{formatDateRangeForDisplay(activeFilters.dateRange)}</span>
                <button 
                  onClick={clearDateFilter}
                  className="ml-1 p-0.5 rounded-full hover:bg-blue-700/50"
                >
                  <FiX size={10} />
                </button>
              </div>
            )}
            
            {/* Reset filters button - only shown if filters are applied */}
            {(activeFilters.status !== 'all' || activeFilters.league || activeFilters.dateRange) && (
              <button 
                onClick={resetFilters}
                className="bg-slate-700/30 hover:bg-slate-700/70 py-1 px-3 rounded-full text-xs font-medium text-slate-300 inline-flex items-center gap-1.5"
              >
                <FiX size={10} />
                <span>Reset</span>
              </button>
            )}
          </div>
          
          {/* Filter buttons */}
          <div className="flex gap-2">
            {/* Date filter button */}
            <button 
              onClick={openDateFilter}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeFilters.dateRange
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-700/60 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <FiCalendar size={14} />
              <span className="hidden sm:inline">Date</span>
            </button>
            
            {/* League filter button */}
            <button 
              onClick={() => setFilterModalOpen(true)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeFilters.league
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-700/60 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <FiFilter size={14} />
              <span className="hidden sm:inline">League</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Date Filter Modal */}
      {dateFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
          <div 
            className="bg-slate-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-xl animate-slideUp border border-slate-700"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FiCalendar className="text-blue-400" />
                <span>Filter Matches by Date</span>
              </h3>
              
              <button 
                onClick={() => setDateFilterModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>
            
            {/* Date filter options */}
            <div className="p-4">
              <div className="space-y-3">
                {/* Quick selections */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <button 
                    className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${
                      dateRangePreset === 'today'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'
                    }`}
                    onClick={() => setDateRange('today')}
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <FiCalendar size={20} className="text-blue-400" />
                    </div>
                    <span className="font-medium">Today</span>
                  </button>
                  
                  <button 
                    className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${
                      dateRangePreset === 'tomorrow'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'
                    }`}
                    onClick={() => setDateRange('tomorrow')}
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <FiChevronRight size={20} className="text-blue-400" />
                    </div>
                    <span className="font-medium">Tomorrow</span>
                  </button>
                  
                  <button 
                    className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${
                      dateRangePreset === 'week'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'
                    }`}
                    onClick={() => setDateRange('week')}
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <FiLayers size={20} className="text-blue-400" />
                    </div>
                    <span className="font-medium">This Week</span>
                  </button>
                  
                  <button 
                    className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${
                      dateRangePreset === 'custom'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'
                    }`}
                    onClick={() => setDateRange('custom')}
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <FiSettings size={20} className="text-blue-400" />
                    </div>
                    <span className="font-medium">Custom</span>
                  </button>
                </div>
                
                {/* Custom date range selector */}
                {dateRangePreset === 'custom' && (
                  <div className="p-4 bg-slate-700/30 rounded-xl space-y-4">
                    <h4 className="text-sm font-medium text-slate-300">Custom Date Range</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="startDate" className="block text-xs text-slate-400 mb-1">Start Date</label>
                        <input 
                          type="date" 
                          id="startDate"
                          value={startDate}
                          onChange={e => setStartDate(e.target.value)}
                          className="w-full py-2 px-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="endDate" className="block text-xs text-slate-400 mb-1">End Date</label>
                        <input 
                          type="date" 
                          id="endDate"
                          value={endDate}
                          onChange={e => setEndDate(e.target.value)}
                          min={startDate} // Ensure end date isn't before start date
                          className="w-full py-2 px-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <FiInfo size={12} />
                      <span>Select both start and end dates for your custom range</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-slate-700 flex justify-between items-center">
              <button 
                onClick={clearDateFilter}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-all text-sm"
              >
                Clear
              </button>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setDateFilterModalOpen(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all text-sm"
                >
                  Cancel
                </button>
                
                <button 
                  onClick={applyDateFilter}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all text-sm"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* League Filter Modal */}
      {filterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
          <div 
            className="bg-slate-800 rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden shadow-xl animate-slideUp border border-slate-700"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FiFilter className="text-indigo-400" />
                <span>Filter Matches by League</span>
              </h3>
              
              <button 
                onClick={() => setFilterModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>
            
            {/* Search bar */}
            <div className="p-4 border-b border-slate-700 flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-slate-400" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search leagues by name or country..."
                  className="block w-full pl-10 pr-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {searchQuery && (
                  <button 
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setSearchQuery('')}
                  >
                    <FiX className="text-slate-400 hover:text-white" />
                  </button>
                )}
              </div>
              
              {/* View selector */}
              <div className="flex rounded-lg overflow-hidden border border-slate-600 bg-slate-700/50">
                <button 
                  onClick={() => setFilterView('popular')}
                  className={`px-3 py-2 flex items-center gap-1 text-sm ${
                    filterView === 'popular' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <FiStar size={14} className={filterView === 'popular' ? 'text-yellow-300' : 'text-slate-400'} />
                  <span className="hidden sm:inline">Popular</span>
                </button>
                <button 
                  onClick={() => setFilterView('regions')}
                  className={`px-3 py-2 flex items-center gap-1 text-sm ${
                    filterView === 'regions' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <FiGlobe size={14} className={filterView === 'regions' ? 'text-indigo-200' : 'text-slate-400'} />
                  <span className="hidden sm:inline">Regions</span>
                </button>
                <button 
                  onClick={() => setFilterView('all')}
                  className={`px-3 py-2 flex items-center gap-1 text-sm ${
                    filterView === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <FiList size={14} className={filterView === 'all' ? 'text-indigo-200' : 'text-slate-400'} />
                  <span className="hidden sm:inline">All</span>
                </button>
              </div>
            </div>
            
            {/* League list */}
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              {/* All Competitions button - always shown */}
              <div className="mb-4">
                <button 
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${
                    leagueFilter === null 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'bg-slate-700/70 text-slate-300 hover:bg-slate-700'
                  }`}
                  onClick={() => changeLeagueFilter(null)}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/30 flex items-center justify-center">
                    <FiLayers size={16} className="text-indigo-300" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">All Competitions</span>
                    <p className="text-xs opacity-80 mt-0.5">
                      Show matches from all available leagues
                    </p>
                  </div>
                  {leagueFilter === null && (
                    <FiCheck size={18} className="text-indigo-300" />
                  )}
                </button>
              </div>
              
              {/* Show appropriate view based on selection */}
              {filterView === 'popular' && (
                <>
                  <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                    <FiStar className="text-yellow-400" size={14} />
                    <span>Popular & Recent Leagues</span>
                  </h4>
                  
                  <div className="space-y-2">
                    {getPopularLeagues().map(league => (
                      <div 
                        key={league.id}
                        className={`group relative px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
                          leagueFilter === league.id 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-slate-700/40 text-slate-300 hover:bg-slate-700/80'
                        }`}
                        onClick={() => changeLeagueFilter(league.id)}
                      >
                        {league.logo ? (
                          <img 
                            src={league.logo} 
                            alt={league.name} 
                            className="w-8 h-8 rounded-md object-contain bg-slate-800/80 p-1"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = PLACEHOLDER_LEAGUE_IMG;
                            }} 
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-md bg-slate-600 flex items-center justify-center text-sm">
                            {league.name.slice(0, 2)}
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate pr-8">{league.name}</div>
                          <div className="text-xs opacity-80 mt-0.5">{league.country || 'International'}</div>
                        </div>
                        
                        {/* Favorite button */}
                        <button 
                          className={`absolute right-10 p-1.5 rounded-md ${
                            favoriteLeagues.includes(league.id)
                              ? 'text-yellow-400 hover:bg-slate-600/50'
                              : 'text-slate-500 opacity-0 group-hover:opacity-100 hover:text-yellow-400 hover:bg-slate-600/50'
                          }`}
                          onClick={(e) => toggleFavoriteLeague(league.id, e)}
                        >
                          <FiStar size={16} fill={favoriteLeagues.includes(league.id) ? 'currentColor' : 'none'} />
                        </button>
                        
                        {leagueFilter === league.id && (
                          <FiCheck size={18} className="absolute right-4 text-indigo-300" />
                        )}
                      </div>
                    ))}
                    
                    {getPopularLeagues().length === 0 && !searchQuery && (
                      <div className="text-center py-8 text-slate-400">
                        <p>No favorite or recent leagues found.</p>
                        <p className="text-sm mt-1">Try browsing all leagues or adding some favorites.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {filterView === 'regions' && (
                <div className="space-y-4">
                  {/* European Leagues */}
                  {groupedLeagues.european.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-3 pl-1 flex items-center gap-2">
                        <FiGlobe className="text-blue-400" size={14} />
                        <span>European Leagues</span>
                      </h4>
                      
                      <div className="space-y-2">
                        {groupedLeagues.european
                          .filter(league => !searchQuery || league.name.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map(league => (
                            <div 
                              key={league.id}
                              className={`group relative px-4 py-2.5 rounded-lg transition-all flex items-center gap-3 ${
                                leagueFilter === league.id 
                                  ? 'bg-indigo-600 text-white' 
                                  : 'bg-slate-700/40 text-slate-300 hover:bg-slate-700/80'
                              }`}
                              onClick={() => changeLeagueFilter(league.id)}
                            >
                              {league.logo ? (
                                <img 
                                  src={league.logo} 
                                  alt={league.name} 
                                  className="w-7 h-7 rounded-md object-contain bg-slate-800/80 p-1"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = PLACEHOLDER_LEAGUE_IMG;
                                  }} 
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-md bg-slate-600 flex items-center justify-center text-sm">
                                  {league.name.slice(0, 2)}
                                </div>
                              )}
                              
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate pr-8">{league.name}</div>
                              </div>
                              
                              {/* Favorite button */}
                              <button 
                                className={`absolute right-10 p-1 rounded-md ${
                                  favoriteLeagues.includes(league.id)
                                    ? 'text-yellow-400 hover:bg-slate-600/50'
                                    : 'text-slate-500 opacity-0 group-hover:opacity-100 hover:text-yellow-400 hover:bg-slate-600/50'
                                }`}
                                onClick={(e) => toggleFavoriteLeague(league.id, e)}
                              >
                                                                <FiStar size={14} fill={favoriteLeagues.includes(league.id) ? 'currentColor' : 'none'} />
                              </button>
                              
                              {leagueFilter === league.id && (
                                <FiCheck size={16} className="absolute right-4 text-indigo-300" />
                              )}
                            </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* International Competitions */}
                  {groupedLeagues.international.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-3 pl-1 flex items-center gap-2">
                        <FiAward className="text-yellow-400" size={14} />
                        <span>International & Cup Competitions</span>
                      </h4>
                      
                      <div className="space-y-2">
                        {groupedLeagues.international
                          .filter(league => !searchQuery || league.name.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map(league => (
                            <div 
                              key={league.id}
                              className={`group relative px-4 py-2.5 rounded-lg transition-all flex items-center gap-3 ${
                                leagueFilter === league.id 
                                  ? 'bg-indigo-600 text-white' 
                                  : 'bg-slate-700/40 text-slate-300 hover:bg-slate-700/80'
                              }`}
                              onClick={() => changeLeagueFilter(league.id)}
                            >
                              {league.logo ? (
                                <img 
                                  src={league.logo} 
                                  alt={league.name} 
                                  className="w-7 h-7 rounded-md object-contain bg-slate-800/80 p-1"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = PLACEHOLDER_LEAGUE_IMG;
                                  }} 
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-md bg-slate-600 flex items-center justify-center text-sm">
                                  {league.name.slice(0, 2)}
                                </div>
                              )}
                              
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate pr-8">{league.name}</div>
                              </div>
                              
                              {/* Favorite button */}
                              <button 
                                className={`absolute right-10 p-1 rounded-md ${
                                  favoriteLeagues.includes(league.id)
                                    ? 'text-yellow-400 hover:bg-slate-600/50'
                                    : 'text-slate-500 opacity-0 group-hover:opacity-100 hover:text-yellow-400 hover:bg-slate-600/50'
                                }`}
                                onClick={(e) => toggleFavoriteLeague(league.id, e)}
                              >
                                <FiStar size={14} fill={favoriteLeagues.includes(league.id) ? 'currentColor' : 'none'} />
                              </button>
                              
                              {leagueFilter === league.id && (
                                <FiCheck size={16} className="absolute right-4 text-indigo-300" />
                              )}
                            </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Other Leagues */}
                  {groupedLeagues.other.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-3 pl-1 flex items-center gap-2">
                        <FiLayers className="text-slate-400" size={14} />
                        <span>Other Leagues</span>
                      </h4>
                      
                      <div className="space-y-2">
                        {groupedLeagues.other
                          .filter(league => !searchQuery || league.name.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map(league => (
                            <div 
                              key={league.id}
                              className={`group relative px-4 py-2.5 rounded-lg transition-all flex items-center gap-3 ${
                                leagueFilter === league.id 
                                  ? 'bg-indigo-600 text-white' 
                                  : 'bg-slate-700/40 text-slate-300 hover:bg-slate-700/80'
                              }`}
                              onClick={() => changeLeagueFilter(league.id)}
                            >
                              {league.logo ? (
                                <img 
                                  src={league.logo} 
                                  alt={league.name} 
                                  className="w-7 h-7 rounded-md object-contain bg-slate-800/80 p-1"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = PLACEHOLDER_LEAGUE_IMG;
                                  }} 
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-md bg-slate-600 flex items-center justify-center text-sm">
                                  {league.name.slice(0, 2)}
                                </div>
                              )}
                              
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate pr-8">{league.name}</div>
                              </div>
                              
                              {/* Favorite button */}
                              <button 
                                className={`absolute right-10 p-1 rounded-md ${
                                  favoriteLeagues.includes(league.id)
                                    ? 'text-yellow-400 hover:bg-slate-600/50'
                                    : 'text-slate-500 opacity-0 group-hover:opacity-100 hover:text-yellow-400 hover:bg-slate-600/50'
                                }`}
                                onClick={(e) => toggleFavoriteLeague(league.id, e)}
                              >
                                <FiStar size={14} fill={favoriteLeagues.includes(league.id) ? 'currentColor' : 'none'} />
                              </button>
                              
                              {leagueFilter === league.id && (
                                <FiCheck size={16} className="absolute right-4 text-indigo-300" />
                              )}
                            </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {filterView === 'all' && (
                <div className="space-y-2">
                  {getFilteredLeagues().map(league => (
                    <div 
                      key={league.id}
                      className={`group relative px-4 py-2.5 rounded-lg transition-all flex items-center gap-3 ${
                        leagueFilter === league.id 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-slate-700/40 text-slate-300 hover:bg-slate-700/80'
                      }`}
                      onClick={() => changeLeagueFilter(league.id)}
                    >
                      {league.logo ? (
                        <img 
                          src={league.logo} 
                          alt={league.name} 
                          className="w-7 h-7 rounded-md object-contain bg-slate-800/80 p-1"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = PLACEHOLDER_LEAGUE_IMG;
                          }} 
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-md bg-slate-600 flex items-center justify-center text-sm">
                          {league.name.slice(0, 2)}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate pr-8">{league.name}</div>
                        {league.country && (
                          <div className="text-xs opacity-80 mt-0.5">{league.country}</div>
                        )}
                      </div>
                      
                      {/* Favorite button */}
                      <button 
                        className={`absolute right-10 p-1 rounded-md ${
                          favoriteLeagues.includes(league.id)
                            ? 'text-yellow-400 hover:bg-slate-600/50'
                            : 'text-slate-500 opacity-0 group-hover:opacity-100 hover:text-yellow-400 hover:bg-slate-600/50'
                        }`}
                        onClick={(e) => toggleFavoriteLeague(league.id, e)}
                      >
                        <FiStar size={14} fill={favoriteLeagues.includes(league.id) ? 'currentColor' : 'none'} />
                      </button>
                      
                      {leagueFilter === league.id && (
                        <FiCheck size={16} className="absolute right-4 text-indigo-300" />
                      )}
                    </div>
                  ))}
                  
                  {getFilteredLeagues().length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      <p>No leagues match your search.</p>
                      <p className="text-sm mt-1">Try a different search term or clear the search.</p>
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="mt-3 px-4 py-2 bg-slate-700 hover:bg-indigo-600 text-white rounded-lg transition-all text-sm"
                      >
                        Clear Search
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-slate-700 flex justify-between items-center">
              <div className="text-sm text-slate-400">
                {getFilteredLeagues().length} leagues available
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setFilterModalOpen(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all text-sm"
                >
                  Cancel
                </button>
                
                <button 
                  onClick={() => setFilterModalOpen(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all text-sm"
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Error display */}
      {(matchError || competitionError) && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-400">
            <FiAlertCircle />
            <p>{matchError || competitionError}</p>
          </div>
        </div>
      )}
      
      {/* Matches list */}
      {isLoadingMatches || loadingCompetitionMatches ? (
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
                            <span className="text-xs text-slate-400">• {match.league.round || 'Regular Season'}</span>
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
                              <span>{match.venue || 'TBD'}</span>
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

      {/* Debug panel for development mode */}
      {process.env.NODE_ENV !== 'production' && (
      <div className="mt-8 p-4 bg-slate-800/60 rounded-lg text-xs border border-slate-700">
        <div className="flex justify-between items-center">
          <h3 className="text-white font-medium mb-2">Debug Panel</h3>
          <div className="text-slate-400">
            Current Time: 2025-06-05 18:29:26
          </div>
        </div>
        <div className="flex gap-2 mb-3">
          <button
            onClick={refreshData}
            className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Force Refresh
          </button>
        </div>
        <div className="mb-2 flex gap-2 text-sm">
          <span className={`px-2 py-0.5 rounded ${filteredMatches.length > 0 ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
            {filteredMatches.length} filtered matches
          </span>
          <span className={`px-2 py-0.5 rounded ${allMatches.length > 0 ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
            {allMatches.length} total matches
          </span>
          {competitionMatches.length > 0 && (
            <span className={`px-2 py-0.5 rounded bg-blue-600/20 text-blue-400`}>
              {competitionMatches.length} competition matches
            </span>
          )}
          <span className="px-2 py-0.5 rounded bg-slate-600/20 text-slate-400">
            User: {username}
          </span>
        </div>
        <div className="text-xs text-slate-400">
          <details>
            <summary className="cursor-pointer hover:text-slate-300">Match Data Sample</summary>
            <pre className="mt-2 p-2 bg-slate-900 rounded text-green-400 overflow-auto max-h-60 text-[10px]">
              {JSON.stringify(allMatches.slice(0, 2), null, 2)}
            </pre>
          </details>
          {competitionMatches.length > 0 && (
            <details>
              <summary className="cursor-pointer hover:text-slate-300 mt-2">Competition Matches</summary>
              <pre className="mt-2 p-2 bg-slate-900 rounded text-green-400 overflow-auto max-h-60 text-[10px]">
                {JSON.stringify(competitionMatches, null, 2)}
              </pre>
            </details>
          )}
          {activeFilters.dateRange && (
            <details>
              <summary className="cursor-pointer hover:text-slate-300 mt-2">Date Filter Info</summary>
              <pre className="mt-2 p-2 bg-slate-900 rounded text-green-400 overflow-auto max-h-60 text-[10px]">
                {JSON.stringify(activeFilters.dateRange, null, 2)}
              </pre>
            </details>
          )}
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
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out forwards;
        }
        
        /* For the filter dropdown */
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}