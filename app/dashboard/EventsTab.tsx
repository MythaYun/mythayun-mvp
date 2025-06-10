'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useFootballData } from '@/lib/contexts/FootballDataContext';
import { FootballMatch } from '@/lib/services/MatchesService';
import MatchesService from '@/lib/services/MatchesService';
import { 
  FiCalendar, FiFilter, FiClock, FiMap, FiRefreshCw, 
  FiChevronDown, FiAlertCircle, FiBell, FiBellOff, 
  FiActivity, FiStar, FiBarChart2, FiInfo, FiSearch,
  FiAward, FiX, FiSettings, FiCheck, FiHeart, FiList,
  FiGrid, FiLayers, FiChevronRight, FiGlobe, FiArrowRight,
  FiChevronUp, FiExternalLink, FiPlay, FiEye, FiMoreHorizontal
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';

// Current system information
const CURRENT_TIMESTAMP = "2025-06-10 16:05:04";
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
type DateRangePreset = 'today' | 'tomorrow' | 'week' | 'custom' | 'next15days' | null;

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

// Format match time
const formatMatchTime = (timeString: string): string => {
  try {
    // Parse time in 24-hour format (HH:MM)
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Create a date object with the parsed hours and minutes
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    // Format to 12-hour time with AM/PM
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  } catch (e) {
    return timeString; // Return original if parsing fails
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
  const [debugMode, setDebugMode] = useState<boolean>(false);
  
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

  // State for 15-day matches
  const [next15DaysMatches, setNext15DaysMatches] = useState<FootballMatch[]>([]);
  const [viewing15DayMatches, setViewing15DayMatches] = useState<boolean>(false);
  const [loading15DayMatches, setLoading15DayMatches] = useState<boolean>(false);

  // Track when filter modal was opened for animation purposes
  const [filterModalOpen, setFilterModalOpen] = useState<boolean>(false);
  const [dateFilterModalOpen, setDateFilterModalOpen] = useState<boolean>(false);
  
  // Use refs for values that shouldn't trigger re-renders
  const followedMatchIdsRef = useRef<string[]>([]);
  const [followedMatchIds, setFollowedMatchIds] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // State for grid/list view
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  // State for pagination
  const [displayLimit, setDisplayLimit] = useState<number>(10);
  const [visibleDates, setVisibleDates] = useState<string[]>([]);
  const [hasMoreMatches, setHasMoreMatches] = useState<boolean>(false);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);

  // Load followed matches from localStorage
  useEffect(() => {
    try {
      const savedFollowed = localStorage.getItem('followed-matches');
      if (savedFollowed) {
        const parsedIds = JSON.parse(savedFollowed);
        setFollowedMatchIds(parsedIds);
        followedMatchIdsRef.current = parsedIds;
      }
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error loading followed matches:`, error);
    }
  }, []);

  // Save followed matches to localStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem('followed-matches', JSON.stringify(followedMatchIds));
      followedMatchIdsRef.current = followedMatchIds;
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error saving followed matches:`, error);
    }
  }, [followedMatchIds]);

  // Check if mobile
  useEffect(() => {
    const checkIfMobile = () => {
      const isMobile = window.innerWidth < 768;
      setDeviceType(isMobile ? 'mobile' : 'desktop');
      
      // Change view mode based on screen size on initial load
      if (isInitialLoad) {
        setViewMode(isMobile ? 'grid' : 'list');
        setIsInitialLoad(false);
      }
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, [isInitialLoad]);

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

  // Clear match cache for debugging
  const clearMatchCache = useCallback(() => {
    MatchesService.clearCache();
    alert("Match cache cleared. Try refreshing data now.");
  }, []);

  // Toggle debug mode
  const toggleDebugMode = useCallback(() => {
    setDebugMode(prev => !prev);
  }, []);

  // Determine match status
  const getActualMatchStatus = useCallback((match: FootballMatch): 'live' | 'upcoming' | 'finished' => {
    try {
      // First, trust the API if it says a match is live
      if (match.status === 'live') {
        return 'live';
      }
      
      // For others, check the date against current time
      const now = new Date(CURRENT_TIMESTAMP);
      const matchDateTime = new Date(`${match.date} ${match.time}`);
      
      // If match time is in the future, it's upcoming regardless of API status
      if (matchDateTime > now) {
        return 'upcoming';
      } 
      // If match time is in the past, it's finished regardless of API status
      else {
        return 'finished';
      }
    } catch (e) {
      console.error(`[${CURRENT_TIMESTAMP}] Error calculating match status:`, e);
      return match.status as 'live' | 'upcoming' | 'finished'; // Fallback to API status
    }
  }, []);

  // Fetch 15-day matches
  const fetchNext15DaysMatches = useCallback(async (leagueId?: string) => {
    setLoading15DayMatches(true);
    try {
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} is fetching matches for next 15 days`);
      
      // Calculate date range for filtering
      const today = new Date(CURRENT_TIMESTAMP);
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 14); // 14 more days after today = 15 days total
      
      const fromDate = today.toISOString().split('T')[0];
      const toDate = endDate.toISOString().split('T')[0];
      
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Date range: ${fromDate} to ${toDate}`);
      
      let matches: FootballMatch[] = [];
      
      // If a specific league is selected, fetch just that league
      if (leagueId && leagueId !== 'all') {
        // Try to fetch matches for this specific league
        try {
          matches = await MatchesService.getNext15DaysMatches(leagueId);
        } catch (e) {
          console.error(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Error fetching 15-day matches for league:`, e);
          matches = [];
        }
      } else {
        // No specific league - fetch from popular leagues
        matches = await MatchesService.getFixturesByMultipleLeagues(15);
      }
      
      // Filter out finished matches
      matches = matches.filter(match => getActualMatchStatus(match) !== 'finished');
      
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Found ${matches.length} non-finished matches for next 15 days`);
      
      setNext15DaysMatches(matches);
      
      // Set high display limit to show all matches
      setDisplayLimit(Math.max(100, matches.length));
      
      return matches;
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error fetching 15-day matches:`, error);
      return [];
    } finally {
      setLoading15DayMatches(false);
    }
  }, [getActualMatchStatus]);
  
  // Fetch competition matches
  const loadCompetitionMatches = useCallback(async (competitionCode: string) => {
    setLoadingCompetitionMatches(true);
    setCompetitionError(null);
    
    try {
      console.log(`[${CURRENT_TIMESTAMP}] Fetching matches for competition: ${competitionCode}`);
      
      const matches = await fetchCompetitionMatches(competitionCode);
      
      // Filter out finished matches
      const activeMatches = matches.filter(match => getActualMatchStatus(match) !== 'finished');
      
      setCompetitionMatches(activeMatches);
      
      // Automatically set filter to upcoming if matches found
      if (activeMatches.length > 0) {
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
  }, [fetchCompetitionMatches, getActualMatchStatus]);
  
  // Combine all matches from context into our allMatches state
  useEffect(() => {
    // Create a Set of unique match IDs to avoid duplicates
    const uniqueIds = new Set<string>();
    const combined: FootballMatch[] = [];

    // Process each match source, avoiding duplicates
    const processMatches = (matches: FootballMatch[]) => {
      matches.forEach(match => {
        // Skip finished matches
        if (getActualMatchStatus(match) === 'finished') return;
        
        if (!uniqueIds.has(match.id)) {
          uniqueIds.add(match.id);
          combined.push(match);
        }
      });
    };

    // Process each source in priority order
    processMatches(liveMatches);
    processMatches(todayMatches);
    
    // Use 15-day matches if viewing, otherwise use regular upcoming matches
    if (viewing15DayMatches) {
      processMatches(next15DaysMatches);
    } else {
      processMatches(upcomingMatches);
    }
    
    processMatches(competitionMatches);
    
    setAllMatches(combined);
    
    // Update status counts
    setStatusCounts({
      live: liveMatches.length,
      upcoming: combined.filter(match => getActualMatchStatus(match) === 'upcoming').length,
      followed: combined.filter(match => followedMatchIdsRef.current.includes(match.id)).length
    });
    
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Combined ${combined.length} non-finished matches from sources`);
  }, [liveMatches, todayMatches, upcomingMatches, next15DaysMatches, competitionMatches, viewing15DayMatches, getActualMatchStatus]);
  
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
    } else if (preset === 'next15days') {
      // Set start to today and end to 15 days from now
      const todayStr = today.toISOString().split('T')[0];
      const next15Days = new Date(today);
      next15Days.setDate(next15Days.getDate() + 14); // 14 days after today = 15 days total
      const next15DaysStr = next15Days.toISOString().split('T')[0];
      setStartDate(todayStr);
      setEndDate(next15DaysStr);
    }
    // For 'custom', we don't set dates here, we let the user select them
  }, []);

  // Apply date filter
  const applyDateFilter = useCallback(() => {
    // Update active filters
    setActiveFilters(prev => ({
      ...prev,
      dateRange: {
        preset: dateRangePreset,
        start: startDate,
        end: endDate
      }
    }));
    
    // Check if date range is 15 days and fetch appropriate data
    if (dateRangePreset === 'next15days') {
      setViewing15DayMatches(true);
      fetchNext15DaysMatches(leagueFilter || undefined);
    } else {
      setViewing15DayMatches(false);
    }
    
    setDateFilterModalOpen(false);
    
    // Reset display limit when changing date filter
    setDisplayLimit(50);
  }, [dateRangePreset, startDate, endDate, fetchNext15DaysMatches, leagueFilter]);

  // Clear date filter
  const clearDateFilter = useCallback(() => {
    setDateRangePreset(null);
    setViewing15DayMatches(false);
    
    // Reset to default date range (today to next week)
    const today = new Date(CURRENT_TIMESTAMP);
    const todayStr = today.toISOString().split('T')[0];
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];
    
    setStartDate(todayStr);
    setEndDate(nextWeekStr);
    
    setActiveFilters(prev => ({
      ...prev,
      dateRange: null
    }));
    
    // Reset display limit
    setDisplayLimit(10);
  }, []);

  // Handle showing 15-day matches
  const handleShow15DayMatches = useCallback(() => {
    // Calculate date range for next 15 days
    const today = new Date(CURRENT_TIMESTAMP);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 14); // 14 more days after today = 15 days total
    
    const fromDate = today.toISOString().split('T')[0];
    const toDate = endDate.toISOString().split('T')[0];
    
    // Update date filter state
    setStartDate(fromDate);
    setEndDate(toDate);
    setDateRangePreset('next15days');
    
    // Apply the filter
    setActiveFilters(prev => ({
      ...prev,
      dateRange: {
        preset: 'next15days',
        start: fromDate,
        end: toDate
      }
    }));
    
    // Set viewing15DayMatches to true and fetch the data
    setViewing15DayMatches(true);
    fetchNext15DaysMatches(leagueFilter || undefined);
    
    // Ensure we're showing all matches with the new date range
    setFilter('all');
    
    // Close the date filter modal if it's open
    setDateFilterModalOpen(false);
    
    // Set high display limit to show all matches
    setDisplayLimit(1000);
  }, [fetchNext15DaysMatches, leagueFilter]);

  // Apply filters to matches
  const applyFilters = useCallback((
    activeFilter: string,
    leagueId: string | null,
    dateRange: {preset: DateRangePreset; start: string; end: string} | null
  ) => {
    // Start with all matches
    let filtered = [...allMatches];
    
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Applying filters:`, {
      activeFilter,
      leagueId,
      dateRange,
      viewing15DayMatches,
      totalMatches: allMatches.length,
      next15DaysMatches: next15DaysMatches.length
    });
    
    // FIRST: Filter out all finished matches, regardless of active filter
    filtered = filtered.filter(match => getActualMatchStatus(match) !== 'finished');
    
    // Then apply the normal status filters
    if (activeFilter === 'upcoming') {
      filtered = filtered.filter(match => getActualMatchStatus(match) === 'upcoming');
    } else if (activeFilter === 'followed') {
      filtered = filtered.filter(match => followedMatchIdsRef.current.includes(match.id));
    } else if (activeFilter === 'live') {
      filtered = filtered.filter(match => match.status === 'live');
    }

    // Filter by league if a league filter is selected
    if (leagueId) {
      filtered = filtered.filter(match => match.league.id === leagueId);
    }
    
    // Filter by date range if it's set
    if (dateRange && dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59); // Include the entire end day
      
      filtered = filtered.filter(match => {
        try {
          const matchDate = new Date(match.date);
          return matchDate >= startDate && matchDate <= endDate;
        } catch (e) {
          console.error(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Date parsing error:`, e, match.date);
          return true; // If date parsing fails, include the match
        }
      });
    }
    
    // When sorting, use the actual status for priority
    filtered.sort((a, b) => {
      const statusPriority: Record<string, number> = { 'live': 0, 'upcoming': 1 };
      const priorityA = statusPriority[getActualMatchStatus(a)] ?? 2;
      const priorityB = statusPriority[getActualMatchStatus(b)] ?? 2;
      
      if (priorityA !== priorityB) return priorityA - priorityB;
      
      // For same status, sort by date/time
      const dateTimeA = new Date(`${a.date} ${a.time}`).getTime();
      const dateTimeB = new Date(`${b.date} ${b.time}`).getTime();
      return dateTimeA - dateTimeB;
    });
    
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Filter results:`, {
      filteredCount: filtered.length,
      dates: [...new Set(filtered.map(m => m.date))].sort()
    });
    
    setFilteredMatches(filtered);
    
    // Update status counts with actual counts (excluding finished matches)
    setStatusCounts({
      live: allMatches.filter(match => match.status === 'live').length,
      upcoming: allMatches.filter(match => getActualMatchStatus(match) === 'upcoming').length,
      followed: allMatches.filter(match => 
        followedMatchIdsRef.current.includes(match.id) && 
        getActualMatchStatus(match) !== 'finished'
      ).length
    });
    
  }, [allMatches, getActualMatchStatus, next15DaysMatches.length, viewing15DayMatches]);
  
  // Group matches by date
  const getMatchesGroupedByDate = useCallback(() => {
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
  
  // Update visible dates based on display limit
  useEffect(() => {
    const matchesGrouped = getMatchesGroupedByDate();
    const allDates = Object.keys(matchesGrouped).sort();
    
    let matchCount = 0;
    let datesToShow: string[] = [];
    
    for (const date of allDates) {
      const dateMatches = matchesGrouped[date];
      
      if (matchCount + dateMatches.length <= displayLimit) {
        // Include the entire date group if it fits within the limit
        datesToShow.push(date);
        matchCount += dateMatches.length;
      } else if (matchCount < displayLimit) {
        // Include the date with partial matches
        datesToShow.push(date);
        matchCount = displayLimit;
        break;
      } else {
        // We've reached the display limit
        break;
      }
    }
    
    setVisibleDates(datesToShow);
    setHasMoreMatches(datesToShow.length < allDates.length || 
                     (datesToShow.length > 0 && 
                      matchCount < allDates.reduce((sum, date) => sum + matchesGrouped[date].length, 0)));
    
  }, [getMatchesGroupedByDate, displayLimit]);
  
  // Apply filters whenever filter settings change
  useEffect(() => {
    if (allMatches.length === 0) return;
    
    // Apply the current filter settings
    applyFilters(filter, leagueFilter, activeFilters.dateRange);
    
  }, [filter, leagueFilter, activeFilters.dateRange, applyFilters, allMatches]);
  
  // Change filter
  const changeFilter = useCallback((newFilter: 'all' | 'followed' | 'upcoming' | 'live') => {
    setFilter(newFilter);
    setExpandedMatch(null);
    
    // Update active filters
    setActiveFilters(prev => ({...prev, status: newFilter}));
    
    // Reset display limit
    setDisplayLimit(10);
  }, []);

  // Navigate to the match detail page
  const handleMatchDetailsClick = useCallback((matchId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    // Navigate to the match detail page using Next.js router
    router.push(`/match/${matchId}`);
  }, [router]);
  
  // Change league filter and fetch competition matches
  const changeLeagueFilter = useCallback((leagueId: string | null) => {
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
        // If we're viewing 15-day matches, refetch them with the new league filter
        if (viewing15DayMatches) {
          fetchNext15DaysMatches(selectedLeague.code);
        } else {
          loadCompetitionMatches(selectedLeague.code);
        }
      }
    }
    
    // Reset display limit
    setDisplayLimit(10);
  }, [leagueFilter, leagues, loadCompetitionMatches, fetchNext15DaysMatches, viewing15DayMatches]);
  
  // Toggle following a match
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
      
      return updated;
    });
  }, []);
  
  // Handle match expansion
  const toggleExpandMatch = useCallback((matchId: string) => {
    setExpandedMatch(prev => prev === matchId ? null : matchId);
  }, []);
  
  // Handle refresh
  const handleRefresh = useCallback(async () => {
    // Refresh the regular matches
    await refreshData();
    
    // If viewing 15-day matches, refresh those too
    if (viewing15DayMatches) {
      await fetchNext15DaysMatches(leagueFilter || undefined);
    }
    
    // Also refresh competition matches if a competition is selected
    if (leagueFilter) {
      const selectedLeague = leagues.find(l => l.id === leagueFilter);
      if (selectedLeague?.code) {
        loadCompetitionMatches(selectedLeague.code);
      }
    }
    
    // Reset display limit
    setDisplayLimit(10);
  }, [refreshData, leagueFilter, leagues, loadCompetitionMatches, viewing15DayMatches, fetchNext15DaysMatches]);
  
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
    if (dateRange.preset === 'next15days') return 'Next 15 Days';
    
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
    setViewing15DayMatches(false);
    setActiveFilters({status: 'all', league: null, dateRange: null});
    
    // Reset display limit
    setDisplayLimit(10);
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
  
  // Load more matches
  const loadMoreMatches = useCallback(() => {
    setDisplayLimit(prev => prev + 10);
  }, []);
  
  // Get popular leagues
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
  
  // Group leagues by region
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
  
  // Open date filter
  const openDateFilter = useCallback(() => {
    setDateFilterModalOpen(true);
    setFilterView('date');
  }, []);
  
  // Calculate total match count
  const matchesGrouped = getMatchesGroupedByDate();
  const groupedLeagues = groupLeaguesByRegion();
  const totalMatchCount = Object.values(matchesGrouped).reduce((sum, matches) => sum + matches.length, 0);

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-700/50" ref={containerRef}>
      {/* Component header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <FiCalendar className="text-indigo-400" />
            <span>Match Calendar</span>
          </h2>
          <p className="text-sm text-slate-400">Find and follow upcoming and live matches</p>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="hidden sm:flex items-center gap-1">
            <FiClock size={12} /> 
            <span>Current Time: {currentTime}</span>
          </div>
          
          {/* Debug buttons */}
          <div className="flex gap-1">
            <button 
              onClick={toggleDebugMode}
              className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-400 hover:bg-slate-600"
            >
              {debugMode ? "Hide Debug" : "Debug"}
            </button>
            
            {debugMode && (
              <button 
                onClick={clearMatchCache}
                className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-400 hover:bg-slate-600"
              >
                Clear Cache
              </button>
            )}
          </div>
          
          <button 
            onClick={handleRefresh}
            disabled={isLoadingMatches || loadingCompetitionMatches || loading15DayMatches}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
            aria-label="Refresh matches"
          >
            <FiRefreshCw className={(isLoadingMatches || loadingCompetitionMatches || loading15DayMatches) ? 'animate-spin' : ''} size={14} />
            <span className="hidden sm:inline">{(isLoadingMatches || loadingCompetitionMatches || loading15DayMatches) ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>
      
      {/* Debug information */}
      {debugMode && (
        <div className="mt-4 mb-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <h4 className="text-white font-semibold mb-2">Debug Information</h4>
          <div className="text-xs text-slate-400 space-y-2">
            <div>Current timestamp: {CURRENT_TIMESTAMP}</div>
            <div>Viewing 15-day mode: {viewing15DayMatches ? 'Yes' : 'No'}</div>
            <div>Filter mode: {filter}</div>
            <div>League filter: {leagueFilter || 'None'}</div>
            <div>Date range: {activeFilters.dateRange ? 
              `${activeFilters.dateRange.start} to ${activeFilters.dateRange.end}` : 
              'None'
            }</div>
            <div>Match counts: 
              All: {allMatches.length}, 
              Filtered: {filteredMatches.length}, 
              15-day: {next15DaysMatches.length},
              Live: {liveMatches.length},
              Today: {todayMatches.length},
              Upcoming: {upcomingMatches.length}
            </div>
            <div>Visible dates: {visibleDates.join(", ")}</div>
            <div>Display limit: {displayLimit}</div>
            <button 
              onClick={() => {
                console.log('Current state:', {
                  allMatches,
                  filteredMatches,
                  next15DaysMatches,
                  liveMatches,
                  todayMatches,
                  upcomingMatches,
                  viewing15DayMatches,
                  filter,
                  leagueFilter,
                  activeFilters,
                  visibleDates
                });
              }}
              className="px-2 py-1 bg-slate-700 rounded hover:bg-slate-600"
            >
              Log State to Console
            </button>
          </div>
        </div>
      )}
      
      {/* Filter Bar */}
      <div className="mb-4 sm:mb-6">
        {/* Primary filters */}
        <div className="mb-3">
          <div className="bg-slate-800/50 p-1 rounded-xl shadow-inner grid grid-cols-4 gap-1">
            <button 
              className={`py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                filter === 'all' 
                  ? 'bg-indigo-600 text-white shadow' 
                  : 'text-slate-300 hover:bg-slate-700/70'
              }`}
              onClick={() => changeFilter('all')}
            >
              <FiGrid size={14} className={filter === 'all' ? 'text-indigo-200' : 'text-slate-400'} />
              <span>All Active</span>
              <span className="text-xs opacity-70 ml-1">({allMatches.length})</span>
            </button>
            
            <button 
              className={`py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1 ${
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
              className={`py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                filter === 'upcoming' 
                  ? 'bg-indigo-600 text-white shadow' 
                  : 'text-slate-300 hover:bg-slate-700/70'
              }`}
              onClick={() => changeFilter('upcoming')}
            >
              <FiClock size={14} className={filter === 'upcoming' ? 'text-indigo-200' : 'text-slate-400'} />
              <span className="hidden sm:inline">Upcoming</span>
              <span className="sm:hidden">Soon</span>
              <span className="text-xs opacity-70 ml-1">({statusCounts.upcoming})</span>
            </button>
            
            <button 
              className={`py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                filter === 'followed' 
                  ? 'bg-indigo-600 text-white shadow' 
                  : 'text-slate-300 hover:bg-slate-700/70'
              }`}
              onClick={() => changeFilter('followed')}
            >
              <FiBell size={14} className={filter === 'followed' ? 'text-indigo-200' : 'text-slate-400'} />
              <span>Follow</span>
              <span className="text-xs opacity-70 ml-1">({statusCounts.followed})</span>
            </button>
          </div>
        </div>
        
        {/* 15-day matches button */}
        <div className="mb-3">
          <button
            onClick={handleShow15DayMatches}
            className={`w-full py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              viewing15DayMatches
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'bg-slate-700/50 hover:bg-slate-700 text-white hover:from-purple-700 hover:to-indigo-700'
            }`}
            disabled={loading15DayMatches}
          >
            {loading15DayMatches ? (
              <>
                <FiRefreshCw className="animate-spin" size={16} />
                <span>Loading 15-Day Matches...</span>
              </>
            ) : (
              <>
                <FiCalendar size={16} />
                <span>{viewing15DayMatches ? 'Viewing Next 15 Days' : 'Show Next 15 Days of Matches'}</span>
              </>
            )}
          </button>
        </div>
        
        {/* Match count indicator with note about finished matches */}
        <div className="mb-3 text-xs text-slate-400 px-1 flex flex-wrap items-center gap-1">
          {viewing15DayMatches ? 'Showing upcoming matches for the next 15 days' : 'Showing live and upcoming matches'} 
          {totalMatchCount > 0 && ` • ${totalMatchCount} matches in ${Object.keys(matchesGrouped).length} days`}
          <span className="text-yellow-400 ml-1">
            <FiInfo size={12} className="inline mr-1" /> 
            Finished matches are not displayed
          </span>
        </div>
        
        {/* Active filters and filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Active filter tags */}
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {/* Status filter tag */}
            <div className={`py-1 px-2 rounded-full text-xs font-medium inline-flex items-center gap-1 ${
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
              <div className="bg-indigo-500/20 text-indigo-300 border border-indigo-600/30 py-1 px-2 rounded-full text-xs font-medium inline-flex items-center gap-1">
                <FiAward size={10} className="text-yellow-400" />
                <span className="truncate max-w-[100px] sm:max-w-none">
                  {leagues.find(l => l.id === activeFilters.league)?.name || 'League'}
                </span>
                <button 
                  onClick={() => changeLeagueFilter(null)}
                  className="ml-1 p-0.5 rounded-full hover:bg-indigo-700/50"
                  aria-label="Remove league filter"
                >
                  <FiX size={10} />
                </button>
              </div>
            )}
            
            {/* Date range filter tag - only if a date range is set */}
            {activeFilters.dateRange && (
              <div className="bg-blue-500/20 text-blue-300 border border-blue-600/30 py-1 px-2 rounded-full text-xs font-medium inline-flex items-center gap-1">
                <FiCalendar size={10} className="text-blue-400" />
                <span>{formatDateRangeForDisplay(activeFilters.dateRange)}</span>
                <button 
                  onClick={clearDateFilter}
                  className="ml-1 p-0.5 rounded-full hover:bg-blue-700/50"
                  aria-label="Clear date filter"
                >
                  <FiX size={10} />
                </button>
              </div>
            )}
            
            {/* 15-day view tag - only if viewing 15-day matches */}
            {viewing15DayMatches && !activeFilters.dateRange && (
              <div className="bg-purple-500/20 text-purple-300 border border-purple-600/30 py-1 px-2 rounded-full text-xs font-medium inline-flex items-center gap-1">
                <FiCalendar size={10} className="text-purple-400" />
                <span>Next 15 Days</span>
                <button 
                  onClick={() => {
                    setViewing15DayMatches(false);
                    setDisplayLimit(10);
                  }}
                  className="ml-1 p-0.5 rounded-full hover:bg-purple-700/50"
                  aria-label="Exit 15-day view"
                >
                  <FiX size={10} />
                </button>
              </div>
            )}
            
            {/* Reset filters button - only shown if filters are applied */}
            {(activeFilters.status !== 'all' || activeFilters.league || activeFilters.dateRange || viewing15DayMatches) && (
              <button 
                onClick={resetFilters}
                className="bg-slate-700/30 hover:bg-slate-700/70 py-1 px-2 rounded-full text-xs font-medium text-slate-300 inline-flex items-center gap-1"
                aria-label="Reset all filters"
              >
                <FiX size={10} />
                <span>Reset</span>
              </button>
            )}
          </div>
          
          {/* Filter and View Mode buttons */}
          <div className="flex gap-1 sm:gap-2">
            {/* View mode toggle */}
            <div className="flex rounded-lg overflow-hidden border border-slate-600 bg-slate-700/50">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 flex items-center ${
                  viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-300'
                }`}
                title="List View"
                aria-label="Switch to list view"
              >
                <FiList size={14} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 flex items-center ${
                  viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-300'
                }`}
                title="Grid View"
                aria-label="Switch to grid view"
              >
                <FiGrid size={14} />
              </button>
            </div>
            
            {/* Date filter button */}
            <button 
              onClick={openDateFilter}
              className={`p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 sm:gap-2 ${
                activeFilters.dateRange || viewing15DayMatches
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-700/60 hover:bg-slate-700 text-slate-300'
              }`}
              aria-label="Filter by date"
            >
              <FiCalendar size={14} />
              <span className="hidden sm:inline">Date</span>
            </button>
            
            {/* League filter button */}
            <button 
              onClick={() => setFilterModalOpen(true)}
              className={`p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 sm:gap-2 ${
                activeFilters.league
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-700/60 hover:bg-slate-700 text-slate-300'
              }`}
              aria-label="Filter by league"
            >
              <FiFilter size={14} />
              <span className="hidden sm:inline">League</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Match Display Section */}
      {isLoadingMatches || loadingCompetitionMatches || loading15DayMatches ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-300 font-medium">Loading matches...</p>
          {viewing15DayMatches && (
            <p className="mt-2 text-sm text-slate-400">Fetching matches for the next 15 days</p>
          )}
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="bg-slate-800/50 rounded-xl p-5 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-700/50 flex items-center justify-center">
            <FiCalendar size={22} className="text-slate-400" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-white mb-2">No matches found</h3>
          <p className="text-sm text-slate-400 mb-4">
            {viewing15DayMatches 
              ? "No upcoming matches found for the next 15 days with your current filters."
              : "Try adjusting your filters or viewing a wider date range."}
          </p>
          <div className="space-y-2">
            {!viewing15DayMatches && (
              <button
                className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all text-sm font-medium"
                onClick={handleShow15DayMatches}
              >
                Show Next 15 Days of Matches
              </button>
            )}
            <button
              className="w-full py-2 px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-all text-sm"
              onClick={resetFilters}
            >
                            Reset All Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* Group matches by date and display them */}
          {Object.keys(matchesGrouped)
            .sort()
            .filter(date => visibleDates.includes(date))
            .map(date => (
              <div key={date} className="space-y-2">
                {/* Date header */}
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className="flex-shrink-0 w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-slate-700/50 flex items-center justify-center">
                    <FiCalendar className="text-indigo-400" size={deviceType === 'mobile' ? 14 : 16} />
                  </div>
                  <h3 className="text-white font-bold text-sm sm:text-base">{formatDateHeader(date)}</h3>
                  <div className="h-[1px] bg-slate-700 flex-grow"></div>
                  <span className="text-xs text-slate-400 py-1 px-2 rounded bg-slate-800/70">
                    {matchesGrouped[date].length} {matchesGrouped[date].length === 1 ? 'match' : 'matches'}
                  </span>
                </div>
                
                {/* Matches */}
                {viewMode === 'list' ? (
                  <div className="space-y-2">
                    {matchesGrouped[date].map(match => (
                      <div 
                        key={match.id} 
                        className={`bg-slate-800/70 rounded-xl overflow-hidden transition-all ${
                          expandedMatch === match.id ? 'shadow-lg ring-1 ring-indigo-500/30' : 'hover:bg-slate-800'
                        }`}
                      >
                        {/* Match summary row - always visible */}
                        <div 
                          className="p-3 flex flex-wrap sm:flex-nowrap gap-2 sm:items-center cursor-pointer relative"
                          onClick={() => toggleExpandMatch(match.id)}
                        >
                          {/* Live indicator or match time */}
                          <div className="w-16 sm:w-20 text-center">
                            {match.status === 'live' ? (
                              <div className="flex flex-col items-center">
                                <div className="w-2 h-2 rounded-full bg-red-500 mb-1 animate-pulse"></div>
                                <span className="text-red-400 text-sm font-medium">LIVE</span>
                                {match.elapsed && <span className="text-red-300 text-xs">{match.elapsed}'</span>}
                              </div>
                            ) : match.status === 'finished' ? (
                              <div className="text-slate-400 text-sm">FT</div>
                            ) : (
                              <div className="text-slate-300 text-sm">{formatMatchTime(match.time)}</div>
                            )}
                          </div>
                          
                          {/* Competition info */}
                          <div className="flex-shrink-0 w-8">
                            {match.league.logo ? (
                              <img 
                                src={match.league.logo} 
                                alt={match.league.name} 
                                className="h-6 w-6 sm:h-7 sm:w-7 object-contain rounded-md"
                                onError={e => {
                                  (e.target as HTMLImageElement).src = PLACEHOLDER_LEAGUE_IMG;
                                }}
                              />
                            ) : (
                              <div className="h-6 w-6 sm:h-7 sm:w-7 bg-slate-700 rounded-md flex items-center justify-center text-xs text-slate-300">
                                {match.league.name.substring(0, 2)}
                              </div>
                            )}
                          </div>
                          
                          {/* Match teams and score */}
                          <div className="flex-grow grid grid-cols-[auto_auto_auto] gap-2 items-center">
                            {/* Home team */}
                            <div className="flex items-center gap-2 justify-end text-right">
                              <div className="text-white font-medium text-sm sm:text-base truncate max-w-[100px] sm:max-w-none">{match.homeTeam.name}</div>
                              <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7">
                                <img 
                                  src={match.homeTeam.logo} 
                                  alt={match.homeTeam.name} 
                                  className="h-6 w-6 sm:h-7 sm:w-7 object-contain"
                                  onError={e => {
                                    (e.target as HTMLImageElement).src = PLACEHOLDER_TEAM_IMG;
                                  }}
                                />
                              </div>
                            </div>
                            
                            {/* Score */}
                            <div className={`text-center px-2 py-1 rounded-md font-medium text-sm sm:text-base ${
                              match.status === 'live' 
                                ? 'bg-red-600/20 text-red-300' 
                                : match.status === 'finished'
                                  ? 'bg-slate-700/80 text-white'
                                  : 'bg-slate-700/30 text-slate-400'
                            }`}>
                              {match.score.home !== null && match.score.away !== null 
                                ? `${match.score.home} - ${match.score.away}` 
                                : 'vs'}
                            </div>
                            
                            {/* Away team */}
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7">
                                <img 
                                  src={match.awayTeam.logo} 
                                  alt={match.awayTeam.name} 
                                  className="h-6 w-6 sm:h-7 sm:w-7 object-contain"
                                  onError={e => {
                                    (e.target as HTMLImageElement).src = PLACEHOLDER_TEAM_IMG;
                                  }}
                                />
                              </div>
                              <div className="text-white font-medium text-sm sm:text-base truncate max-w-[100px] sm:max-w-none">{match.awayTeam.name}</div>
                            </div>
                          </div>
                          
                          {/* Action buttons */}
                          <div className="flex items-center gap-1.5 ml-auto mr-6 sm:mr-8">
                            <button 
                              onClick={(e) => toggleFollowMatch(match.id, e)}
                              className={`p-1.5 rounded-full ${
                                followedMatchIds.includes(match.id) 
                                  ? 'bg-purple-600/30 text-purple-400 hover:bg-purple-600/50'
                                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700/70 hover:text-slate-300'
                              }`}
                              title={followedMatchIds.includes(match.id) ? "Unfollow match" : "Follow match"}
                              aria-label={followedMatchIds.includes(match.id) ? "Unfollow match" : "Follow match"}
                            >
                              {followedMatchIds.includes(match.id) ? <FiBellOff size={16} /> : <FiBell size={16} />}
                            </button>
                            
                            <button 
                              onClick={(e) => handleMatchDetailsClick(match.id, e)}
                              className="p-1.5 rounded-full bg-slate-700/50 text-slate-400 hover:bg-slate-700/70 hover:text-slate-300"
                              title="View match details"
                              aria-label="View match details"
                            >
                              <FiExternalLink size={16} />
                            </button>
                          </div>
                          
                          {/* Expand/collapse indicator */}
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {expandedMatch === match.id ? (
                              <FiChevronUp className="text-slate-400" />
                            ) : (
                              <FiChevronDown className="text-slate-400" />
                            )}
                          </div>
                        </div>
                        
                        {/* Expanded match details */}
                        {expandedMatch === match.id && (
                          <div className="bg-slate-700/30 p-3 border-t border-slate-700/70">
                            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                              {/* Competition */}
                              <div className="flex items-center gap-1.5">
                                <FiAward className="text-yellow-400" size={14} />
                                <span className="text-slate-300">{match.league.name}</span>
                              </div>
                              
                              {/* Matchday/Round */}
                              {match.round && (
                                <div className="flex items-center gap-1.5">
                                  <FiBarChart2 className="text-blue-400" size={14} />
                                  <span className="text-slate-300">{match.round}</span>
                                </div>
                              )}
                              
                              {/* Stadium */}
                              {match.venue && (
                                <div className="flex items-center gap-1.5">
                                  <FiMap className="text-green-400" size={14} />
                                  <span className="text-slate-300">{match.venue}</span>
                                </div>
                              )}
                              
                              {/* Status and other details specific to live matches */}
                              {match.status === 'live' && (
                                <div className="flex items-center gap-1.5">
                                  <FiActivity className="text-red-400" size={14} />
                                  <span className="text-red-300">Live Match</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Actions Row */}
                            <div className="mt-3 flex items-center justify-between">
                              <div className="text-xs text-slate-400">
                                {match.status === 'upcoming' ? 'Match starts at ' : 'Match started at '} 
                                {formatMatchTime(match.time)}
                              </div>
                              
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleMatchDetailsClick(match.id)}
                                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm flex items-center gap-1.5"
                                >
                                  <FiEye size={14} />
                                  <span>Details</span>
                                </button>
                                
                                {match.status === 'live' && (
                                  <button
                                    onClick={() => handleMatchDetailsClick(match.id)}
                                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm flex items-center gap-1.5"
                                  >
                                    <FiPlay size={14} />
                                    <span>Watch</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  // Grid view
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                    {matchesGrouped[date].map(match => (
                      <div 
                        key={match.id} 
                        className="bg-slate-800/70 rounded-lg overflow-hidden hover:bg-slate-800 transition-all shadow-sm"
                        onClick={() => handleMatchDetailsClick(match.id)}
                      >
                        <div className="p-3 flex flex-col gap-2 h-full">
                          {/* Header with league and time */}
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5">
                              {match.league.logo ? (
                                <img 
                                  src={match.league.logo} 
                                  alt={match.league.name} 
                                  className="h-5 w-5 object-contain"
                                  onError={e => {
                                    (e.target as HTMLImageElement).src = PLACEHOLDER_LEAGUE_IMG;
                                  }}
                                />
                              ) : (
                                <div className="h-5 w-5 bg-slate-700 rounded-sm flex items-center justify-center text-[10px] text-slate-300">
                                  {match.league.name.substring(0, 2)}
                                </div>
                              )}
                              <span className="text-xs text-slate-400 truncate max-w-[80px] sm:max-w-[120px]">{match.league.name}</span>
                            </div>
                            
                            <div className="flex items-center">
                              {match.status === 'live' ? (
                                <div className="flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                                  <span className="text-red-400 text-xs font-medium">LIVE</span>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">{formatMatchTime(match.time)}</span>
                              )}
                            </div>
                          </div>
                          
                          {/* Teams and score */}
                          <div className="flex-1 flex flex-col justify-center py-1">
                            <div className="flex items-center gap-2 mb-2.5">
                              <div className="w-7 h-7 sm:w-8 sm:h-8">
                                <img 
                                  src={match.homeTeam.logo} 
                                  alt={match.homeTeam.name} 
                                  className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                                  onError={e => {
                                    (e.target as HTMLImageElement).src = PLACEHOLDER_TEAM_IMG;
                                  }}
                                />
                              </div>
                              <div className="flex-1 text-white font-medium text-sm truncate">{match.homeTeam.name}</div>
                              <div className={`min-w-[28px] text-center px-2 py-0.5 rounded font-medium text-sm ${
                                match.status === 'live' 
                                  ? 'bg-red-600/20 text-red-300' 
                                  : 'bg-slate-700/50 text-slate-300'
                              }`}>
                                {match.score.home !== null ? match.score.home : '-'}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 sm:w-8 sm:h-8">
                                <img 
                                  src={match.awayTeam.logo} 
                                  alt={match.awayTeam.name} 
                                  className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                                  onError={e => {
                                    (e.target as HTMLImageElement).src = PLACEHOLDER_TEAM_IMG;
                                  }}
                                />
                              </div>
                              <div className="flex-1 text-white font-medium text-sm truncate">{match.awayTeam.name}</div>
                              <div className={`min-w-[28px] text-center px-2 py-0.5 rounded font-medium text-sm ${
                                match.status === 'live' 
                                  ? 'bg-red-600/20 text-red-300' 
                                  : 'bg-slate-700/50 text-slate-300'
                              }`}>
                                {match.score.away !== null ? match.score.away : '-'}
                              </div>
                            </div>
                          </div>
                          
                          {/* Footer with actions */}
                          <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
                            <div className="text-xs text-slate-500">
                              {match.status === 'live' && match.elapsed && `${match.elapsed}' Elapsed`}
                              {match.status === 'finished' && 'Full Time'}
                              {match.status === 'upcoming' && match.venue && (
                                <span className="flex items-center gap-1 truncate max-w-[80px] sm:max-w-[120px]">
                                  <FiMap size={10} />
                                  <span>{match.venue}</span>
                                </span>
                              )}
                            </div>
                            
                            <div className="flex gap-1">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFollowMatch(match.id);
                                }}
                                className={`p-1 rounded-full ${
                                  followedMatchIds.includes(match.id) 
                                    ? 'bg-purple-600/30 text-purple-400 hover:bg-purple-600/50'
                                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700/70 hover:text-slate-300'
                                }`}
                                title={followedMatchIds.includes(match.id) ? "Unfollow match" : "Follow match"}
                                aria-label={followedMatchIds.includes(match.id) ? "Unfollow match" : "Follow match"}
                              >
                                {followedMatchIds.includes(match.id) ? <FiBellOff size={14} /> : <FiBell size={14} />}
                              </button>
                              
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMatchDetailsClick(match.id);
                                }}
                                className="p-1 rounded-full bg-slate-700/50 text-slate-400 hover:bg-slate-700/70 hover:text-slate-300"
                                title="View match details"
                                aria-label="View match details"
                              >
                                <FiExternalLink size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          
          {/* "See More" button - only show if there are more matches to load */}
          {hasMoreMatches && (
            <div className="flex justify-center pt-2">
              <button 
                onClick={loadMoreMatches} 
                className="px-4 py-2 bg-slate-700/70 hover:bg-slate-700 text-slate-300 rounded-full text-sm font-medium flex items-center gap-2 transition-all hover:shadow-md"
              >
                <FiMoreHorizontal size={16} />
                <span>See More Matches</span>
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Modals - Date Filter Modal */}
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
                aria-label="Close modal"
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
                  
                  {/* Next 15 Days button */}
                  <button 
                    className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${
                      dateRangePreset === 'next15days'
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'
                    }`}
                    onClick={() => setDateRange('next15days')}
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <FiArrowRight size={20} className="text-purple-400" />
                    </div>
                    <span className="font-medium">Next 15 Days</span>
                  </button>
                  
                  <button 
                    className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all col-span-2 ${
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
                aria-label="Close modal"
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
                    aria-label="Clear search"
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
                  aria-label="Show popular leagues"
                >
                  <FiStar size={14} className={filterView === 'popular' ? 'text-yellow-300' : 'text-slate-400'} />
                  <span className="hidden sm:inline">Popular</span>
                </button>
                <button 
                  onClick={() => setFilterView('regions')}
                  className={`px-3 py-2 flex items-center gap-1 text-sm ${
                    filterView === 'regions' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                  }`}
                  aria-label="Show leagues by region"
                >
                  <FiGlobe size={14} className={filterView === 'regions' ? 'text-indigo-200' : 'text-slate-400'} />
                  <span className="hidden sm:inline">Regions</span>
                </button>
                <button 
                  onClick={() => setFilterView('all')}
                  className={`px-3 py-2 flex items-center gap-1 text-sm ${
                    filterView === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                  }`}
                  aria-label="Show all leagues"
                >
                  <FiList size={14} className={filterView === 'all' ? 'text-indigo-200' : 'text-slate-400'} />
                  <span className="hidden sm:inline">All</span>
                </button>
              </div>
            </div>
            
            {/* League list content */}
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
              
              {/* League list based on selected view */}
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
                          aria-label={favoriteLeagues.includes(league.id) ? "Remove from favorites" : "Add to favorites"}
                        >
                          <FiStar size={16} fill={favoriteLeagues.includes(league.id) ? 'currentColor' : 'none'} />
                        </button>
                        
                        {leagueFilter === league.id && (
                          <FiCheck size={18} className="absolute right-4 text-indigo-300" />
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              {filterView === 'all' && (
                <>
                  <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                    <FiList className="text-slate-400" size={14} />
                    <span>All Leagues</span>
                  </h4>
                  
                  <div className="space-y-2">
                    {getFilteredLeagues().map(league => (
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
                          aria-label={favoriteLeagues.includes(league.id) ? "Remove from favorites" : "Add to favorites"}
                        >
                          <FiStar size={16} fill={favoriteLeagues.includes(league.id) ? 'currentColor' : 'none'} />
                        </button>
                        
                        {leagueFilter === league.id && (
                          <FiCheck size={18} className="absolute right-4 text-indigo-300" />
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              {filterView === 'regions' && (
                <div className="space-y-6">
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
                                aria-label={favoriteLeagues.includes(league.id) ? "Remove from favorites" : "Add to favorites"}
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
                  
                  {/* International competitions */}
                  {groupedLeagues.international.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-3 pl-1 flex items-center gap-2">
                        <FiGlobe className="text-green-400" size={14} />
                        <span>International Competitions</span>
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
                              {/* League logo/icon */}
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
                                aria-label={favoriteLeagues.includes(league.id) ? "Remove from favorites" : "Add to favorites"}
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
                  
                  {/* Other leagues */}
                  {groupedLeagues.other.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-3 pl-1 flex items-center gap-2">
                        <FiGlobe className="text-amber-400" size={14} />
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
                              {/* League logo/icon */}
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
                                <div className="text-xs opacity-80 mt-0.5">{league.country || 'International'}</div>
                              </div>
                              
                              {/* Favorite button */}
                              <button 
                                className={`absolute right-10 p-1 rounded-md ${
                                  favoriteLeagues.includes(league.id)
                                    ? 'text-yellow-400 hover:bg-slate-600/50'
                                    : 'text-slate-500 opacity-0 group-hover:opacity-100 hover:text-yellow-400 hover:bg-slate-600/50'
                                }`}
                                onClick={(e) => toggleFavoriteLeague(league.id, e)}
                                aria-label={favoriteLeagues.includes(league.id) ? "Remove from favorites" : "Add to favorites"}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}