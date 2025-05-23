// Football-Data API service for real API integration
import { FootballMatch } from './MatchesService';

// Constants
const API_BASE_URL = 'https://api.football-data.org/v4';
const API_KEY = process.env.NEXT_PUBLIC_FOOTBALL_DATA_API_KEY || '';

// Cache to reduce API calls and improve performance
const responseCache: { [key: string]: { data: any, timestamp: number } } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Validation and error handling
interface ApiError {
  message: string;
  code?: number;
}

// Football-Data API Service
class FootballDataService {
  private headers: HeadersInit;
  
  constructor() {
    this.headers = {
      'X-Auth-Token': API_KEY,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Generic fetch method with caching and error handling
   */
  private async fetchFromApi<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    try {
      // Build URL with parameters
      const queryString = new URLSearchParams(params).toString();
      const url = `${API_BASE_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;
      
      // Check cache first
      const cacheKey = url;
      const now = Date.now();
      
      if (responseCache[cacheKey] && (now - responseCache[cacheKey].timestamp) < CACHE_DURATION) {
        console.log(`[Cache] Using cached data for: ${endpoint}`);
        return responseCache[cacheKey].data as T;
      }
      
      // If not in cache or expired, make real API call
      console.log(`[API] Fetching: ${endpoint}`);
      
      if (!API_KEY) {
        throw new Error('API key not configured. Please set NEXT_PUBLIC_FOOTBALL_DATA_API_KEY in your environment.');
      }
      
      const response = await fetch(url, { headers: this.headers });
      
      // Handle HTTP errors
      if (!response.ok) {
        const errorData = await response.json();
        
        // Check rate limiting
        if (response.status === 429) {
          throw new Error('API rate limit exceeded. Please try again later.');
        }
        
        throw new Error(errorData.message || `API Error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Cache the result
      responseCache[cacheKey] = {
        data,
        timestamp: now
      };
      
      return data as T;
    } catch (error) {
      console.error('Football-Data API error:', error);
      throw error;
    }
  }

  /**
   * Get matches for a specific date range
   */
  async getMatches(options: {
    dateFrom?: string;
    dateTo?: string;
    competitions?: string[];
    status?: 'SCHEDULED' | 'LIVE' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED' | 'SUSPENDED' | 'CANCELLED';
  }) {
    const params: Record<string, string> = {};
    
    if (options.dateFrom) params.dateFrom = options.dateFrom;
    if (options.dateTo) params.dateTo = options.dateTo;
    if (options.status) params.status = options.status;
    if (options.competitions?.length) params.competitions = options.competitions.join(',');
    
    return this.fetchFromApi<any>('/matches', params);
  }
  
  /**
   * Get live matches
   */
  async getLiveMatches() {
    return this.fetchFromApi<any>('/matches', { status: 'LIVE,IN_PLAY,PAUSED' });
  }
  
  /**
   * Get matches for a specific league/competition
   */
  async getCompetitionMatches(competitionId: string, options: {
    dateFrom?: string;
    dateTo?: string;
    status?: string;
  } = {}) {
    const params: Record<string, string> = {};
    
    if (options.dateFrom) params.dateFrom = options.dateFrom;
    if (options.dateTo) params.dateTo = options.dateTo;
    if (options.status) params.status = options.status;
    
    return this.fetchFromApi<any>(`/competitions/${competitionId}/matches`, params);
  }
  
  /**
   * Get competitions list
   */
  async getCompetitions() {
    return this.fetchFromApi<any>('/competitions');
  }
  
  /**
   * Get specific match details
   */
  async getMatch(matchId: string) {
    return this.fetchFromApi<any>(`/matches/${matchId}`);
  }
  
  /**
   * Clear the API response cache
   */
  clearCache() {
    Object.keys(responseCache).forEach(key => delete responseCache[key]);
    console.log('API cache cleared');
  }
}

// Singleton instance
export const footballDataService = new FootballDataService();