// Football Data API service with enhanced features for football fans

// Constants for logging
const CURRENT_TIMESTAMP = "2025-05-30 12:29:20"; 
const CURRENT_USER = "Sdiabate1337";

// Cache to reduce API calls and improve performance
const responseCache: { [key: string]: { data: any, timestamp: number } } = {};
const CACHE_DURATION = 5 * 60 * 1000; // Cache duration: 5 minutes

// Type definitions for API responses
export interface MatchesResponse {
  matches: any[];
  count: number;
  competition?: any;
  filters?: any;
}

export interface StandingsResponse {
  standings: any[];
  competition: any;
  season: any;
  filters?: any;
}

export interface TeamsResponse {
  teams: any[];
  count: number;
  competition?: any;
  season?: any;
  filters?: any;
}

export interface PlayerStatsResponse {
  players: any[];
  count: number;
}

export interface TopScorersResponse {
  scorers: any[];
}

export interface League {
  id: string;
  name: string;
  code: string;
  emblem: string;
  country: string;
  currentSeason: {
    startDate: string;
    endDate: string;
  };
}

export interface FootballMatch {
  id: string;
  date: string;
  time: string;
  status: 'upcoming' | 'live' | 'finished';
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
  score?: {
    home: number | null;
    away: number | null;
  };
  league: {
    id: string;
    name: string;
    logo: string;
    round: string;
  };
  venue: string;
}

class FootballDataService {
  private readonly API_PROXY_ROUTE = '/api/football';

  /**
   * Fetch data from the API using proxy
   */
  public async fetchFromApi<T>(endpoint: string, params: Record<string, string | number | boolean> = {}): Promise<T> {
    try {
      // Build query string
      const queryParams = new URLSearchParams(
        Object.entries(params)
          .filter(([_, value]) => value !== undefined && value !== null)
          .reduce<Record<string, string>>((acc, [key, value]) => {
            acc[key] = String(value);
            return acc;
          }, {})
      ).toString();

      // Generate cache key
      const cacheKey = `${endpoint}${queryParams ? `?${queryParams}` : ''}`;
      const now = Date.now();

      // Check cache
      if (responseCache[cacheKey] && (now - responseCache[cacheKey].timestamp) < CACHE_DURATION) {
        console.log(`[${CURRENT_TIMESTAMP}] [Cache] Using cached data for: ${endpoint}`);
        return responseCache[cacheKey].data as T;
      }

      // Log request
      console.log(`[${CURRENT_TIMESTAMP}] Football-Data API Request by ${CURRENT_USER}: GET ${endpoint}${queryParams ? `?${queryParams}` : ''}`);

      const proxyUrl = `${this.API_PROXY_ROUTE}?endpoint=${encodeURIComponent(endpoint)}${queryParams ? `&${queryParams}` : ''}`;
      const response = await fetch(proxyUrl, { method: 'GET', headers: { 'Accept': 'application/json' } });

      // Handle error responses
      if (!response.ok) {
        const errorDetails = await response.json().catch(() => ({ message: response.statusText }));
        if (response.status === 429) {
          console.error(`[${CURRENT_TIMESTAMP}] API rate limit exceeded for ${CURRENT_USER}`);
          throw new Error('API rate limit exceeded. Please try again later.');
        }
        console.error(`[${CURRENT_TIMESTAMP}] Football-Data API Error (${response.status}):`, errorDetails);
        throw new Error(errorDetails.message || `API error (${response.status}): ${response.statusText}`);
      }

      const data = await response.json();
      responseCache[cacheKey] = { data, timestamp: now }; // Cache the response
      return data as T;
    } catch (error: any) {
      console.error(`[${CURRENT_TIMESTAMP}] Football-Data API Request Error:`, error);
      throw new Error(error.message || 'An unknown error occurred while fetching data from the API.');
    }
  }

  /**
   * Format matches into FootballMatch interface
   */
  public formatMatches(apiMatches: any[]): FootballMatch[] {
    if (!apiMatches || !Array.isArray(apiMatches)) {
      return [];
    }

    return apiMatches.map(match => {
      const status: 'upcoming' | 'live' | 'finished' = 
        match.status === 'FINISHED' ? 'finished' : 
        ['LIVE', 'IN_PLAY', 'PAUSED'].includes(match.status) ? 'live' : 'upcoming';

      const scoreObj = status !== 'upcoming' ? {
        home: match.score?.fullTime?.home ?? null,
        away: match.score?.fullTime?.away ?? null
      } : undefined;

      const utcDate = new Date(match.utcDate);
      const date = utcDate.toISOString().split('T')[0];
      const time = utcDate.toTimeString().substring(0, 5);

      return {
        id: String(match.id),
        date,
        time,
        status,
        homeTeam: {
          id: String(match.homeTeam?.id),
          name: match.homeTeam?.name || 'Unknown',
          logo: match.homeTeam?.crest || ''
        },
        awayTeam: {
          id: String(match.awayTeam?.id),
          name: match.awayTeam?.name || 'Unknown',
          logo: match.awayTeam?.crest || ''
        },
        score: scoreObj,
        league: {
          id: String(match.competition?.id),
          name: match.competition?.name || 'Unknown',
          logo: match.competition?.emblem || '',
          round: match.matchday ? `Matchday ${match.matchday}` : ''
        },
        venue: match.venue || 'Unknown'
      };
    });
  }

  /**
   * Get competitions list
   */
  async getCompetitions(): Promise<League[]> {
    return this.fetchFromApi<{ competitions: League[] }>('/competitions').then(res => res.competitions);
  }

  /**
   * Get matches for a specific league or date range
   */
  async getMatchesInDateRange(fromDate: string, toDate: string): Promise<FootballMatch[]> {
    const response = await this.fetchFromApi<MatchesResponse>('/matches', { dateFrom: fromDate, dateTo: toDate });
    return this.formatMatches(response.matches);
  }

  /**
   * Get upcoming matches within a specific number of days
   */
  async getUpcomingMatches(days: number = 7): Promise<{ matches: FootballMatch[], total: number }> {
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + days);

    const fromDate = today.toISOString().split('T')[0];
    const toDate = endDate.toISOString().split('T')[0];

    const response = await this.fetchFromApi<MatchesResponse>('/matches', { dateFrom: fromDate, dateTo: toDate, status: 'SCHEDULED' });
    const formattedMatches = this.formatMatches(response.matches);
    return { matches: formattedMatches, total: response.count || formattedMatches.length };
  }

  /**
   * Get live matches
   */
  async getLiveMatches(): Promise<FootballMatch[]> {
    const response = await this.fetchFromApi<MatchesResponse>('/matches', { status: 'LIVE' });
    return this.formatMatches(response.matches);
  }

  /**
   * Get standings for a league
   */
  async getLeagueStandings(leagueId: string): Promise<StandingsResponse> {
    return this.fetchFromApi<StandingsResponse>(`/competitions/${leagueId}/standings`);
  }

  /**
   * Get top scorers for a league
   */
  async getTopScorers(leagueId: string): Promise<TopScorersResponse> {
    return this.fetchFromApi<TopScorersResponse>(`/competitions/${leagueId}/scorers`);
  }

  /**
   * Clear cached responses
   */
  clearCache() {
    Object.keys(responseCache).forEach(key => delete responseCache[key]);
    console.log(`[${CURRENT_TIMESTAMP}] Cache cleared by ${CURRENT_USER}`);
  }
}

// Export singleton instance
export const footballDataService = new FootballDataService();
export default footballDataService;