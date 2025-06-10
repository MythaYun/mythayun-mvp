'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiFootballClient from '../api/footballApiClient';
import MatchesService, { FootballMatch } from '../services/MatchesService';

// Current system information
const CURRENT_TIMESTAMP = "2025-06-10 11:42:08";
const CURRENT_USER = "Sdiabate1337";

// Define types for our context
interface FootballDataContextProps {
  // Matches
  todayMatches: FootballMatch[];
  upcomingMatches: FootballMatch[];
  liveMatches: FootballMatch[];
  next15DaysMatches: FootballMatch[]; // New property for 15-day matches
  isLoadingMatches: boolean;
  matchError: string | null;
  
  // Leagues/Competitions
  leagues: {
    id: string;
    name: string;
    logo: string;
    country: string;
    code?: string;
  }[];
  favoriteLeagues: string[];
  isLoadingLeagues: boolean;
  leagueError: string | null;
  
  // Actions
  fetchMatches: (params?: { leagueId?: string, days?: number }) => Promise<void>;
  fetchNext15DaysMatches: (leagueId?: string) => Promise<void>; // New method
  fetchCompetitionMatches: (competitionCode: string) => Promise<FootballMatch[]>;
  toggleFavoriteLeague: (leagueId: string) => void;
  refreshData: () => Promise<void>;
  
  // Status
  lastUpdated: string;
  isRateLimited: boolean;
  
  // Cache management
  clearCache: () => void;
}

// Create context
const FootballDataContext = createContext<FootballDataContextProps | undefined>(undefined);

export const FootballDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State for matches
  const [todayMatches, setTodayMatches] = useState<FootballMatch[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<FootballMatch[]>([]);
  const [liveMatches, setLiveMatches] = useState<FootballMatch[]>([]);
  const [next15DaysMatches, setNext15DaysMatches] = useState<FootballMatch[]>([]); // New state
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  
  // State for leagues
  const [leagues, setLeagues] = useState<any[]>([]);
  const [favoriteLeagues, setFavoriteLeagues] = useState<string[]>([]);
  const [isLoadingLeagues, setIsLoadingLeagues] = useState(false);
  const [leagueError, setLeagueError] = useState<string | null>(null);
  
  // API status
  const [lastUpdated, setLastUpdated] = useState<string>(CURRENT_TIMESTAMP);
  const [isRateLimited, setIsRateLimited] = useState(false);
  
  // Initialize favorite leagues from localStorage
  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem('mythayun-football-favorites');
      if (savedFavorites) {
        setFavoriteLeagues(JSON.parse(savedFavorites));
      } else {
        // Default favorites if none exist
        setFavoriteLeagues(['39', '140', '2', '78']); // Premier League, La Liga, Champions League, Bundesliga
      }
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error loading favorite leagues:`, error);
    }
  }, []);
  
  // Save favorite leagues to localStorage when they change
  useEffect(() => {
    if (favoriteLeagues.length > 0) {
      try {
        localStorage.setItem('mythayun-football-favorites', JSON.stringify(favoriteLeagues));
      } catch (error) {
        console.error(`[${CURRENT_TIMESTAMP}] Error saving favorite leagues:`, error);
      }
    }
  }, [favoriteLeagues]);
  
  // Clear cache function
  const clearCache = useCallback(() => {
    apiFootballClient.clearCache();
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} cleared cache`);
    setLastUpdated(CURRENT_TIMESTAMP);
  }, []);
  
  // Fetch leagues (competitions)
  const fetchLeagues = useCallback(async () => {
    setIsLoadingLeagues(true);
    setLeagueError(null);
    
    try {
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} is fetching leagues`);
      
      // Use your existing API client - getLeagues method
      const { data } = await apiFootballClient.getLeagues({ current: true });
      
      if (data && data.response) {
        // Map to your leagues format - API-Football format
        const mappedLeagues = data.response.map((item: any) => ({
          id: item.league.id.toString(),
          name: item.league.name,
          logo: item.league.logo || '',
          country: item.country.name || 'International',
          code: item.league.code || item.league.id.toString()
        }));
        
        console.log(`[${CURRENT_TIMESTAMP}] Fetched ${mappedLeagues.length} leagues`);
        
        setLeagues(mappedLeagues);
      } else {
        throw new Error('Invalid response format for leagues');
      }
    } catch (error: any) {
      console.error(`[${CURRENT_TIMESTAMP}] Error fetching leagues:`, error);
      setLeagueError(`Failed to load leagues: ${error.message}`);
    } finally {
      setIsLoadingLeagues(false);
    }
  }, []);
  
  // Fetch matches (today, upcoming, live)
  const fetchMatches = useCallback(async (params: { leagueId?: string, days?: number } = {}) => {
    const days = params.days || 7;
    const leagueId = params.leagueId;
    
    setIsLoadingMatches(true);
    setMatchError(null);
    
    try {
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} is fetching matches for next ${days} days${leagueId ? ` in league ${leagueId}` : ''}`);
      
      // Get today's date and format as YYYY-MM-DD
      const today = new Date(CURRENT_TIMESTAMP);
      const todayStr = today.toISOString().split('T')[0];
      
      // Calculate end date
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + days);
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Create params for upcoming matches
      const upcomingParams: any = {
        from: todayStr,
        to: endDateStr,
        status: 'NS' // Not Started
      };
      
      // Add league ID if provided
      if (leagueId && leagueId !== 'all') {
        upcomingParams.league = leagueId;
      }
      
      // Create params for live matches
      const liveParams: any = {
        live: 'all'
      };
      
      if (leagueId && leagueId !== 'all') {
        liveParams.league = leagueId;
      }
      
      // Create params for today's matches
      const todayParams: any = {
        date: todayStr
      };
      
      if (leagueId && leagueId !== 'all') {
        todayParams.league = leagueId;
      }
      
      // Make parallel requests for efficiency
      const [upcomingResponse, liveResponse, todayResponse] = await Promise.all([
        apiFootballClient.getFixtures(upcomingParams),
        apiFootballClient.getFixtures(liveParams),
        apiFootballClient.getFixtures(todayParams)
      ]);
      
      // Process upcoming matches
      if (upcomingResponse.data && upcomingResponse.data.response) {
        const mapped = convertApiResponseToFootballMatches(upcomingResponse.data.response);
        setUpcomingMatches(mapped);
      }
      
      // Process live matches
      if (liveResponse.data && liveResponse.data.response) {
        const mapped = convertApiResponseToFootballMatches(liveResponse.data.response);
        setLiveMatches(mapped);
      }
      
      // Process today's matches
      if (todayResponse.data && todayResponse.data.response) {
        const mapped = convertApiResponseToFootballMatches(todayResponse.data.response);
        setTodayMatches(mapped);
      }
      
      console.log(`[${CURRENT_TIMESTAMP}] Fetched ${upcomingResponse.data?.response?.length || 0} upcoming, ${liveResponse.data?.response?.length || 0} live, and ${todayResponse.data?.response?.length || 0} today matches`);
      
    } catch (error: any) {
      console.error(`[${CURRENT_TIMESTAMP}] Error fetching matches:`, error);
      setMatchError(`Failed to load matches: ${error.message}`);
      
      // Check for rate limiting
      if (error.status === 429) {
        setIsRateLimited(true);
        setTimeout(() => setIsRateLimited(false), (error.retryAfter || 60) * 1000);
      }
    } finally {
      setIsLoadingMatches(false);
    }
  }, []);
  
  // NEW METHOD: Fetch matches for next 15 days using MatchesService
  const fetchNext15DaysMatches = useCallback(async (leagueId?: string) => {
    setIsLoadingMatches(true);
    setMatchError(null);
    
    try {
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} is fetching matches for next 15 days${leagueId ? ` in league ${leagueId}` : ''}`);
      
      // Use the new MatchesService.getNext15DaysMatches method
      let matches: FootballMatch[];
      
      if (leagueId && leagueId !== 'all') {
        matches = await MatchesService.getNext15DaysMatches(leagueId);
      } else {
        matches = await MatchesService.getNext15DaysMatches();
      }
      
      console.log(`[${CURRENT_TIMESTAMP}] Fetched ${matches.length} matches for next 15 days`);
      setNext15DaysMatches(matches);
      
    } catch (error: any) {
      console.error(`[${CURRENT_TIMESTAMP}] Error fetching 15-day matches:`, error);
      setMatchError(`Failed to load 15-day matches: ${error.message}`);
      
      // Check for rate limiting
      if (error.status === 429) {
        setIsRateLimited(true);
        setTimeout(() => setIsRateLimited(false), (error.retryAfter || 60) * 1000);
      }
    } finally {
      setIsLoadingMatches(false);
    }
  }, []);
  
  // Fetch matches for a specific competition with 15-day range
  const fetchCompetitionMatches = useCallback(async (competitionCode: string): Promise<FootballMatch[]> => {
    setIsLoadingMatches(true);
    
    try {
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} is fetching matches for competition: ${competitionCode}`);
      
      // Get dates for next 15 days
      const today = new Date(CURRENT_TIMESTAMP);
      const end15Days = new Date(today);
      end15Days.setDate(today.getDate() + 14); // 15 days including today
      
      const dateFrom = today.toISOString().split('T')[0];
      const dateTo = end15Days.toISOString().split('T')[0];
      
      // Use the updated method with date range for competition matches
      const { data } = await apiFootballClient.getFixtures({
        league: competitionCode,
        from: dateFrom,
        to: dateTo
      });
      
      if (data && data.response) {
        // Convert to your FootballMatch format
        const mappedMatches = convertApiResponseToFootballMatches(data.response);
        
        console.log(`[${CURRENT_TIMESTAMP}] Fetched ${mappedMatches.length} matches for competition ${competitionCode}`);
        
        return mappedMatches;
      } else {
        throw new Error('Invalid response format for competition matches');
      }
    } catch (error: any) {
      console.error(`[${CURRENT_TIMESTAMP}] Error fetching competition matches:`, error);
      setMatchError(`Failed to load competition matches: ${error.message}`);
      return [];
    } finally {
      setIsLoadingMatches(false);
    }
  }, []);
  
  // Convert API response to FootballMatch format
  const convertApiResponseToFootballMatches = (matches: any[]): FootballMatch[] => {
    return matches.map(match => {
      const matchDate = new Date(match.fixture.date);
      
      // Ensure status is of type MatchStatus
      type MatchStatus = 'upcoming' | 'live' | 'finished';
      let status: MatchStatus = 'upcoming';
      if (match.fixture.status.short === 'LIVE' || match.fixture.status.short === '1H' || 
          match.fixture.status.short === '2H' || match.fixture.status.short === 'HT') {
        status = 'live';
      } else if (match.fixture.status.short === 'FT' || match.fixture.status.short === 'AET' || 
                match.fixture.status.short === 'PEN') {
        status = 'finished';
      }
      
      return {
        id: match.fixture.id.toString(),
        date: matchDate.toISOString().split('T')[0],
        time: matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        status: status,
        league: {
          id: match.league.id.toString(),
          name: match.league.name,
          logo: match.league.logo || '',
          round: match.league.round || '',
          country: match.league.country || '',
          flag: match.league.flag || undefined
        },
        homeTeam: {
          id: match.teams.home.id.toString(),
          name: match.teams.home.name,
          logo: match.teams.home.logo || ''
        },
        awayTeam: {
          id: match.teams.away.id.toString(),
          name: match.teams.away.name,
          logo: match.teams.away.logo || ''
        },
        score: {
          home: match.goals.home !== null ? match.goals.home : null,
          away: match.goals.away !== null ? match.goals.away : null
        },
        venue: match.fixture.venue?.name || 'TBD',
        elapsed: match.fixture.status.elapsed?.toString() || undefined,
        // Add missing FootballMatch properties with fallback/defaults
        followedByUser: false,
        matchday: match.league.round || '',
        season: match.league.season ? match.league.season.toString() : '',
        round: match.league.round || ''
      };
    });
  };
  
  // Toggle favorite league
  const toggleFavoriteLeague = useCallback((leagueId: string) => {
    setFavoriteLeagues(prev => {
      if (prev.includes(leagueId)) {
        console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} removed league ${leagueId} from favorites`);
        return prev.filter(id => id !== leagueId);
      } else {
        console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} added league ${leagueId} to favorites`);
        return [...prev, leagueId];
      }
    });
  }, []);
  
  // Refresh all data
  const refreshData = useCallback(async () => {
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} manually refreshed data`);
    clearCache();
    await Promise.all([
      fetchLeagues(),
      fetchMatches(),
      fetchNext15DaysMatches() // Add the new 15-day matches fetch
    ]);
  }, [clearCache, fetchLeagues, fetchMatches, fetchNext15DaysMatches]);
  
  // Initialize data on first load
  useEffect(() => {
    fetchLeagues();
    fetchMatches();
    fetchNext15DaysMatches(); // Add the new 15-day matches fetch
  }, [fetchLeagues, fetchMatches, fetchNext15DaysMatches]);
  
  const contextValue = {
    // Matches
    todayMatches,
    upcomingMatches,
    liveMatches,
    next15DaysMatches, // Add the new data
    isLoadingMatches,
    matchError,
    
    // Leagues/Competitions
    leagues,
    favoriteLeagues,
    isLoadingLeagues,
    leagueError,
    
    // Actions
    fetchMatches,
    fetchNext15DaysMatches, // Add the new method
    fetchCompetitionMatches,
    toggleFavoriteLeague,
    refreshData,
    
    // Status
    lastUpdated,
    isRateLimited,
    
    // Cache management
    clearCache
  };

  return (
    <FootballDataContext.Provider value={contextValue}>
      {children}
    </FootballDataContext.Provider>
  );
};

// Hook to use the context
export const useFootballData = () => {
  const context = useContext(FootballDataContext);
  if (!context) {
    throw new Error('useFootballData must be used within a FootballDataProvider');
  }
  return context;
};