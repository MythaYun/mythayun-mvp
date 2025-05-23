import footballDataApiClient from '../api/footballApiClient';
import cacheService, { createCacheKey } from './cacheService';

// Updated constants with current values
const CURRENT_TIMESTAMP = "2025-05-21 13:12:22"; 
const CURRENT_USER = "Sdiabate1337";

// Types based on football-data.org's response structure
export interface FootballDataMatch {
  id: number;
  utcDate: string;
  status: string;
  minute: number | null;
  injuryTime: number | null;
  attendance: number | null;
  venue: string;
  matchday: number;
  stage: string;
  group: string | null;
  lastUpdated: string;
  homeTeam: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string;
  };
  awayTeam: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string;
  };
  score: {
    winner: string | null;
    duration: string;
    fullTime: {
      home: number | null;
      away: number | null;
    };
    halfTime: {
      home: number | null;
      away: number | null;
    };
  };
  competition: {
    id: number;
    name: string;
    code: string;
    type: string;
    emblem: string;
    area: {
      name: string;
      code: string;
      flag: string;
    }
  };
  season: {
    id: number;
    startDate: string;
    endDate: string;
    currentMatchday: number;
  };
}

export interface MatchesResponse {
  count: number;
  filters: Record<string, any>;
  matches: FootballDataMatch[];
  resultSet?: {
    count: number;
    first: string;
    last: string;
    played: number;
  };
}

// Our app's match format
export interface FootballMatch {
  matchday: any;
  matchday: ReactNode;
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
  league: {
    id: string;
    name: string;
    logo: string;
    country: string;
  };
  date: string;
  time: string;
  venue: string;
  status: 'live' | 'finished' | 'upcoming';
  score?: {
    home: number | null;
    away: number | null;
  };
  round?: string;
  season?: string;
  followedByUser: boolean;
  elapsed?: number | null;
}

// Interface for match list response
export interface MatchListResponse {
  matches: FootballMatch[];
  total: number;
}

// Convert API Match to our app's FootballMatch format
export const mapApiMatchToAppMatch = (apiMatch: FootballDataMatch, favoriteMatches: string[] = []): FootballMatch => {
  console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} mapping match data: ${apiMatch.id}`);
  
  // Determine match status
  let status: 'live' | 'finished' | 'upcoming' = 'upcoming';
  
  switch (apiMatch.status) {
    case 'IN_PLAY':
    case 'PAUSED':
      status = 'live';
      break;
    case 'FINISHED':
    case 'AWARDED':
    case 'SUSPENDED':
    case 'POSTPONED':
    case 'CANCELLED':
      status = 'finished';
      break;
    default:
      status = 'upcoming';
  }
  
  // Format date and time
  const matchDate = new Date(apiMatch.utcDate);
  const date = matchDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  return {
    id: apiMatch.id.toString(),
    homeTeam: {
      id: apiMatch.homeTeam?.id?.toString() || '0',
      name: apiMatch.homeTeam?.name || 'Unknown Team',
      logo: apiMatch.homeTeam?.crest || '/placeholder-team.png',
    },
    awayTeam: {
      id: apiMatch.awayTeam?.id?.toString() || '0',
      name: apiMatch.awayTeam?.name || 'Unknown Team',
      logo: apiMatch.awayTeam?.crest || '/placeholder-team.png',
    },
    league: {
      id: apiMatch.competition?.id?.toString() || '0',
      name: apiMatch.competition?.name || 'Unknown Competition',
      logo: apiMatch.competition?.emblem || '/placeholder-league.png',
      country: apiMatch.competition?.area?.name || 'International'
    },
    date,
    time,
    venue: apiMatch.venue || 'TBD',
    status,
    score: {
      home: apiMatch.score?.fullTime?.home, 
      away: apiMatch.score?.fullTime?.away
    },
    round: apiMatch.matchday ? `Matchday ${apiMatch.matchday}` : undefined,
    season: apiMatch.season ? `${new Date(apiMatch.season.startDate).getFullYear()}/${new Date(apiMatch.season.endDate).getFullYear()}` : undefined,
    followedByUser: favoriteMatches.includes(apiMatch.id.toString()),
    elapsed: apiMatch.minute
  };
};

// Update match with user favorites
const updateMatchesWithUserFavorites = (matches: FootballMatch[], favoriteMatches: string[]): FootballMatch[] => {
  if (!favoriteMatches.length) return matches;
  
  return matches.map((match: FootballMatch) => ({
    ...match,
    followedByUser: favoriteMatches.includes(match.id)
  }));
};

// Service functions
const MatchesService = {
  // Get matches for today
  getTodayMatches: async (favoriteMatches: string[] = []): Promise<MatchListResponse> => {
    try {
      // Use standardized cache key
      const cacheKey = createCacheKey.todayMatches();
      const cachedData = cacheService.get<MatchListResponse>(cacheKey);
      
      if (cachedData) {
        // Update with latest user preferences
        return {
          ...cachedData,
          matches: updateMatchesWithUserFavorites(cachedData.matches, favoriteMatches)
        };
      }
      
      // Format date as YYYY-MM-DD for football-data.org
      const today = new Date().toISOString().split('T')[0];
      
      const response = await footballDataApiClient.get(
        `/matches?dateFrom=${today}&dateTo=${today}`
      );
      
      // Check if matches exists in the response and provide a fallback if not
      const matchesData = response.data?.matches || [];
      const matchCount = response.data?.count || 0;
      
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} fetched ${matchCount} matches for today`);
      
      const result: MatchListResponse = {
        // Safely handle the case where matches might be undefined
        matches: Array.isArray(matchesData) 
          ? matchesData.map((match: FootballDataMatch) => 
              mapApiMatchToAppMatch(match, favoriteMatches)
            )
          : [],
        total: matchCount
      };
      
      // Cache for 2 minutes with category label
      cacheService.set(cacheKey, result, 2, 'matches');
      return result;
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error fetching today's matches for ${CURRENT_USER}:`, error);
      // Return an empty result instead of throwing when there's an error
      return {
        matches: [],
        total: 0
      };
    }
  },
  
  // Get live matches - optimized for frequent refreshes
  getLiveMatches: async (favoriteMatches: string[] = []): Promise<MatchListResponse> => {
    try {
      // Still use the cache but with very short expiry (30 seconds)
      const cacheKey = createCacheKey.liveMatches();
      const cachedData = cacheService.get<MatchListResponse>(cacheKey);
      
      // For extremely fresh data, we can use a very short cache time
      // This still prevents multiple components from making the same request simultaneously
      if (cachedData) {
        // Update with latest user preferences
        return {
          ...cachedData,
          matches: updateMatchesWithUserFavorites(cachedData.matches, favoriteMatches)
        };
      }
      
      // football-data.org uses status=IN_PLAY,PAUSED for live matches
      const response = await footballDataApiClient.get(
        '/matches?status=IN_PLAY,PAUSED'
      );
      
      // Check if matches exists in the response and provide a fallback if not
      const matchesData = response.data?.matches || [];
      const matchCount = response.data?.count || 0;
      
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} fetched ${matchCount} live matches`);
      
      const result: MatchListResponse = {
        // Safely handle the case where matches might be undefined
        matches: Array.isArray(matchesData) 
          ? matchesData.map((match: FootballDataMatch) => 
              mapApiMatchToAppMatch(match, favoriteMatches)
            )
          : [],
        total: matchCount
      };
      
      // Cache for just 30 seconds with category label
      cacheService.set(cacheKey, result, 0.5, 'live');
      return result;
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error fetching live matches for ${CURRENT_USER}:`, error);
      
      // Return an empty result instead of throwing when there's an error
      // This ensures the UI doesn't crash and can show a more graceful error state
      return {
        matches: [],
        total: 0
      };
    }
  },
  
  // Get upcoming matches with date range
  getUpcomingMatches: async (days: number = 7, favoriteMatches: string[] = []): Promise<MatchListResponse> => {
    try {
      // Use standardized cache key
      const cacheKey = createCacheKey.upcomingMatches(days);
      const cachedData = cacheService.get<MatchListResponse>(cacheKey);
      
      if (cachedData) {
        // Update with latest user preferences
        return {
          ...cachedData,
          matches: updateMatchesWithUserFavorites(cachedData.matches, favoriteMatches)
        };
      }
      
      // Calculate date range
      const from = new Date().toISOString().split('T')[0];
      const to = new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
      
      // football-data.org uses status=SCHEDULED for upcoming matches
      const response = await footballDataApiClient.get(
        `/matches?dateFrom=${from}&dateTo=${to}&status=SCHEDULED`
      );
      
      // Check if matches exists in the response and provide a fallback if not
      const matchesData = response.data?.matches || [];
      const matchCount = response.data?.count || 0;
      
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} fetched ${matchCount} upcoming matches for next ${days} days`);
      
      const result: MatchListResponse = {
        // Safely handle the case where matches might be undefined
        matches: Array.isArray(matchesData) 
          ? matchesData.map((match: FootballDataMatch) => 
              mapApiMatchToAppMatch(match, favoriteMatches)
            )
          : [],
        total: matchCount
      };
      
      // Cache for 15 minutes with category label (upcoming matches don't change often)
      cacheService.set(cacheKey, result, 15, 'matches');
      return result;
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error fetching upcoming matches for ${CURRENT_USER}:`, error);
      // Return an empty result instead of throwing
      return {
        matches: [],
        total: 0
      };
    }
  },
  
  // Get matches for a specific team
  getTeamMatches: async (teamId: string, limit: number = 10, favoriteMatches: string[] = []): Promise<MatchListResponse> => {
    try {
      // Use standardized cache key
      const cacheKey = createCacheKey.teamMatches(teamId);
      const cachedData = cacheService.get<MatchListResponse>(cacheKey);
      
      if (cachedData) {
        // Update with latest user preferences
        return {
          ...cachedData,
          matches: updateMatchesWithUserFavorites(cachedData.matches, favoriteMatches)
        };
      }
      
      // football-data.org allows filtering by teamId
      const response = await footballDataApiClient.get(
        `/matches?teamId=${encodeURIComponent(teamId)}&limit=${limit}`
      );
      
      // Check if matches exists in the response and provide a fallback if not
      const matchesData = response.data?.matches || [];
      const matchCount = response.data?.count || 0;
      
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} fetched ${matchCount} matches for team ${teamId}`);
      
      const result: MatchListResponse = {
        // Safely handle the case where matches might be undefined
        matches: Array.isArray(matchesData) 
          ? matchesData.map((match: FootballDataMatch) => 
              mapApiMatchToAppMatch(match, favoriteMatches)
            )
          : [],
        total: matchCount
      };
      
      // Cache for 10 minutes with category label
      cacheService.set(cacheKey, result, 10, 'team-matches');
      return result;
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error fetching team matches for ${CURRENT_USER}:`, error);
      // Return an empty result instead of throwing
      return {
        matches: [],
        total: 0
      };
    }
  },
  
  // Get match details
  getMatchDetails: async (matchId: string, favoriteMatches: string[] = []): Promise<FootballMatch | null> => {
    try {
      // Use standardized cache key
      const cacheKey = createCacheKey.match(matchId);
      const cachedData = cacheService.get<FootballMatch>(cacheKey);
      
      // Use cache for non-live matches, but always fetch fresh data for live matches
      if (cachedData && cachedData.status !== 'live') {
        // Update followed status with latest preferences
        return {
          ...cachedData,
          followedByUser: favoriteMatches.includes(cachedData.id)
        };
      }
      
      // football-data.org provides direct access to a match by its ID
      const response = await footballDataApiClient.get(`/matches/${encodeURIComponent(matchId)}`);
      
      if (!response.data) {
        console.warn(`[${CURRENT_TIMESTAMP}] Match with ID ${matchId} not found`);
        return null;
      }
      
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} fetched details for match ${matchId}`);
      
      const match = mapApiMatchToAppMatch(response.data, favoriteMatches);
      
      // Cache strategy based on match status
      if (match.status === 'finished') {
        // Finished matches won't change - cache for longer
        cacheService.set(cacheKey, match, 60, 'match');
      } else if (match.status === 'upcoming') {
        // Upcoming matches might have minor updates (odds, lineups) - cache for moderate time
        cacheService.set(cacheKey, match, 15, 'match');
      } else {
        // Live matches - cache for very short time or not at all
        // We'll cache for 30 seconds just to handle multiple components requesting the same match
        cacheService.set(cacheKey, match, 0.5, 'live-match');
      }
      
      return match;
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error fetching match details for ${CURRENT_USER}:`, error);
      // Return null instead of throwing
      return null;
    }
  },
  
  // Get matches for specific date
  getMatchesByDate: async (date: string, favoriteMatches: string[] = []): Promise<MatchListResponse> => {
    try {
      // Validate and standardize date format (YYYY-MM-DD)
      const dateParts = date.split('-');
      if (dateParts.length !== 3) {
        console.error(`[${CURRENT_TIMESTAMP}] Invalid date format: ${date}`);
        return {
          matches: [],
          total: 0
        };
      }
      
      // Use standardized cache key
      const cacheKey = createCacheKey.search('matches-date', date);
      const cachedData = cacheService.get<MatchListResponse>(cacheKey);
      
      if (cachedData) {
        // Update with latest user preferences
        return {
          ...cachedData,
          matches: updateMatchesWithUserFavorites(cachedData.matches, favoriteMatches)
        };
      }
      
      // football-data.org uses dateFrom and dateTo parameters
      const response = await footballDataApiClient.get(
        `/matches?dateFrom=${encodeURIComponent(date)}&dateTo=${encodeURIComponent(date)}`
      );
      
      // Check if matches exists in the response and provide a fallback if not
      const matchesData = response.data?.matches || [];
      const matchCount = response.data?.count || 0;
      
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} fetched ${matchCount} matches for date ${date}`);
      
      const result: MatchListResponse = {
        // Safely handle the case where matches might be undefined
        matches: Array.isArray(matchesData) 
          ? matchesData.map((match: FootballDataMatch) => 
              mapApiMatchToAppMatch(match, favoriteMatches)
            )
          : [],
        total: matchCount
      };
      
      // Cache duration depends on whether date is past, present or future
      const today = new Date().toISOString().split('T')[0];
      const dateObj = new Date(date);
      const todayObj = new Date(today);
      
      if (dateObj < todayObj) {
        // Past dates - results won't change, cache longer
        cacheService.set(cacheKey, result, 60 * 24, 'matches-history');
      } else if (date === today) {
        // Today's matches - cache briefly
        cacheService.set(cacheKey, result, 5, 'matches');
      } else {
        // Future matches - cache for moderate time
        cacheService.set(cacheKey, result, 30, 'matches-future');
      }
      
      return result;
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error fetching matches by date for ${CURRENT_USER}:`, error);
      // Return an empty result instead of throwing
      return {
        matches: [],
        total: 0
      };
    }
  },
  
  // Get matches by league and season
  getLeagueMatches: async (leagueId: string, season: number, favoriteMatches: string[] = []): Promise<MatchListResponse> => {
    try {
      // Use standardized cache key
      const cacheKey = createCacheKey.search(`league-${leagueId}-matches`, season.toString());
      const cachedData = cacheService.get<MatchListResponse>(cacheKey);
      
      if (cachedData) {
        // Update with latest user preferences
        return {
          ...cachedData,
          matches: updateMatchesWithUserFavorites(cachedData.matches, favoriteMatches)
        };
      }
      
      // football-data.org uses 'competitions' instead of 'league'
      const response = await footballDataApiClient.get(
        `/competitions/${encodeURIComponent(leagueId)}/matches?season=${season}`
      );
      
      // Check if matches exists in the response and provide a fallback if not
      const matchesData = response.data?.matches || [];
      const matchCount = response.data?.count || 0;
      
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} fetched ${matchCount} matches for league ${leagueId}, season ${season}`);
      
      const result: MatchListResponse = {
        // Safely handle the case where matches might be undefined
        matches: Array.isArray(matchesData) 
          ? matchesData.map((match: FootballDataMatch) => 
              mapApiMatchToAppMatch(match, favoriteMatches)
            )
          : [],
        total: matchCount
      };
      
      // Cache for 30 minutes - league data is substantial so we want to avoid refetching
      cacheService.set(cacheKey, result, 30, 'league-matches');
      return result;
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error fetching league matches for ${CURRENT_USER}:`, error);
      // Return an empty result instead of throwing
      return {
        matches: [],
        total: 0
      };
    }
  },
  
  // Clear specific match cache
  clearMatchCache: (matchId: string): void => {
    try {
      const cacheKey = createCacheKey.match(matchId);
      cacheService.remove(cacheKey);
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} cleared cache for match ${matchId}`);
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error clearing cache for match ${matchId}:`, error);
    }
  },
  
  // Clear live matches cache to force refresh
  clearLiveMatchesCache: (): void => {
    try {
      cacheService.clearByCategory('live');
      cacheService.clearByCategory('live-match');
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} cleared all live matches cache`);
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error clearing live matches cache:`, error);
    }
  },
  
  // Clear all matches cache
  clearAllMatchesCache: (): void => {
    try {
      cacheService.clearByCategory('match');
      cacheService.clearByCategory('matches');
      cacheService.clearByCategory('live');
      cacheService.clearByCategory('team-matches');
      cacheService.clearByCategory('league-matches');
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} cleared all matches cache`);
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error clearing matches cache:`, error);
    }
  },
  
  // Get cache statistics
  getCacheStats: () => {
    try {
      return cacheService.getStats();
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error getting cache stats:`, error);
      return { size: 0, categories: {} };
    }
  }
};

export default MatchesService;