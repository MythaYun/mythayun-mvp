import footballDataApiClient from '../api/footballApiClient';
import cacheService, { createCacheKey } from './cacheService';

// Constants - updated with current information
const CURRENT_TIMESTAMP = "2025-05-20 13:30:46"; 
const CURRENT_USER = "Sdiabate1337";

// Types for football-data.org league data
export interface FootballDataLeague {
  id: number;
  name: string;
  code: string;
  type: string;
  emblem: string;
  currentSeason?: {
    id: number;
    startDate: string;
    endDate: string;
    currentMatchday: number;
    winner?: {
      id: number;
      name: string;
      shortName: string;
      crest: string;
    };
  };
  seasons?: Array<{
    id: number;
    startDate: string;
    endDate: string;
    currentMatchday: number;
    winner?: {
      id: number;
      name: string;
      shortName: string;
      crest: string;
    };
  }>;
  area: {
    id: number;
    name: string;
    code: string;
    flag: string;
  };
}

export interface LeaguesResponse {
  count: number;
  filters: Record<string, any>;
  competitions: FootballDataLeague[];
}

// Our app's league format
export interface FootballLeague {
  id: string;
  name: string;
  logo: string;
  country: string;
  flag: string;
  currentSeason: number | null;
  type: 'league' | 'cup';
  isFollowed: boolean;
}

// Map API league to our format
const mapApiLeagueToAppLeague = (apiLeague: FootballDataLeague, favoriteLeagues: string[] = []): FootballLeague => {
  console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} mapping league data: ${apiLeague.id}`);
  
  // Extract current season or null if not available
  const currentSeason = apiLeague.currentSeason?.id || null;
  
  // Determine league type (cup or league)
  let leagueType: 'league' | 'cup' = 'league';
  if (apiLeague.type === 'CUP' || apiLeague.name.toLowerCase().includes('cup')) {
    leagueType = 'cup';
  }
  
  return {
    id: apiLeague.id.toString(),
    name: apiLeague.name,
    logo: apiLeague.emblem || '/placeholder-league.png',
    country: apiLeague.area?.name || 'International',
    flag: apiLeague.area?.flag || '/placeholder-flag.png',
    currentSeason,
    type: leagueType,
    isFollowed: favoriteLeagues.includes(apiLeague.id.toString())
  };
};

// League service functions
const LeaguesService = {
  // Get all leagues
  getLeagues: async (favoriteLeagues: string[] = []) => {
    try {
      // Use standardized cache key format
      const cacheKey = createCacheKey.search('leagues', 'all-current');
      const cachedData = cacheService.get<{leagues: FootballLeague[], total: number}>(cacheKey);
      
      if (cachedData) {
        // Update followed status with latest favorites even on cache hit
        if (favoriteLeagues.length > 0) {
          cachedData.leagues = cachedData.leagues.map(league => ({
            ...league,
            isFollowed: favoriteLeagues.includes(league.id)
          }));
        }
        return cachedData;
      }
      
      // football-data.org call for competitions (leagues)
      const response = await footballDataApiClient.get('/competitions');
      
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} fetched all leagues: ${response.data.count} results`);
      
      const result = {
        leagues: response.data.competitions.map((league: FootballDataLeague) => 
          mapApiLeagueToAppLeague(league, favoriteLeagues)
        ),
        total: response.data.count
      };
      
      // Cache for 24 hours with category label
      cacheService.set(cacheKey, result, 60 * 24, 'leagues');
      return result;
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error fetching leagues for ${CURRENT_USER}:`, error);
      throw error;
    }
  },
  
  // Get a single league by ID
  getLeague: async (leagueId: string, favoriteLeagues: string[] = []) => {
    try {
      // Use standardized cache key function
      const cacheKey = createCacheKey.league(leagueId);
      const cachedData = cacheService.get<FootballLeague>(cacheKey);
      
      if (cachedData) {
        // Update followed status with latest preference
        return {
          ...cachedData,
          isFollowed: favoriteLeagues.includes(cachedData.id)
        };
      }
      
      const response = await footballDataApiClient.get(`/competitions/${leagueId}`);
      
      if (!response.data) {
        throw new Error(`League with ID ${leagueId} not found`);
      }
      
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} fetched league: ${leagueId}`);
      
      const league = mapApiLeagueToAppLeague(response.data, favoriteLeagues);
      
      // Cache for 24 hours with category label
      cacheService.set(cacheKey, league, 60 * 24, 'league');
      return league;
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error fetching league ${leagueId} for ${CURRENT_USER}:`, error);
      throw error;
    }
  },
  
  // Search for leagues - Note: football-data.org doesn't support direct search, so we get all and filter
  searchLeagues: async (query: string, favoriteLeagues: string[] = []) => {
    try {
      if (!query || query.length < 3) {
        return { leagues: [], total: 0 };
      }
      
      // Use standardized cache key function
      const cacheKey = createCacheKey.search('leagues', query);
      const cachedData = cacheService.get<{leagues: FootballLeague[], total: number}>(cacheKey);
      
      if (cachedData) {
        // Update followed status with latest favorites even on cache hit
        if (favoriteLeagues.length > 0) {
          cachedData.leagues = cachedData.leagues.map(league => ({
            ...league,
            isFollowed: favoriteLeagues.includes(league.id)
          }));
        }
        return cachedData;
      }
      
      // First get all leagues since football-data.org doesn't have a search endpoint
      const allLeaguesResponse = await footballDataApiClient.get('/competitions');
      
      // Filter leagues by query (case-insensitive)
      const normalizedQuery = query.toLowerCase();
      const filteredLeagues = allLeaguesResponse.data.competitions.filter((league: FootballDataLeague) => {
        return league.name.toLowerCase().includes(normalizedQuery) || 
               league.area?.name.toLowerCase().includes(normalizedQuery);
      });
      
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} searched for leagues: "${query}" - ${filteredLeagues.length} results`);
      
      const result = {
        leagues: filteredLeagues.map((league: FootballDataLeague) => 
          mapApiLeagueToAppLeague(league, favoriteLeagues)
        ),
        total: filteredLeagues.length
      };
      
      // Cache for 30 minutes with category label
      cacheService.set(cacheKey, result, 30, 'search');
      return result;
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error searching leagues for ${CURRENT_USER}:`, error);
      throw error;
    }
  },
  
  // Get leagues by country
  getLeaguesByCountry: async (country: string, favoriteLeagues: string[] = []) => {
    try {
      // Use standardized cache key approach
      const cacheKey = createCacheKey.search('leagues-country', country);
      const cachedData = cacheService.get<{leagues: FootballLeague[], total: number}>(cacheKey);
      
      if (cachedData) {
        // Update followed status with latest favorites even on cache hit
        if (favoriteLeagues.length > 0) {
          cachedData.leagues = cachedData.leagues.map(league => ({
            ...league,
            isFollowed: favoriteLeagues.includes(league.id)
          }));
        }
        return cachedData;
      }
      
      // Get all leagues since football-data.org doesn't have a direct country filter
      const allLeaguesResponse = await footballDataApiClient.get('/competitions');
      
      // Filter leagues by country (case-insensitive)
      const normalizedCountry = country.toLowerCase();
      const filteredLeagues = allLeaguesResponse.data.competitions.filter((league: FootballDataLeague) => {
        return league.area?.name.toLowerCase() === normalizedCountry;
      });
      
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} fetched leagues for country: ${country} - ${filteredLeagues.length} results`);
      
      const result = {
        leagues: filteredLeagues.map((league: FootballDataLeague) => 
          mapApiLeagueToAppLeague(league, favoriteLeagues)
        ),
        total: filteredLeagues.length
      };
      
      // Cache for 24 hours with category label
      cacheService.set(cacheKey, result, 60 * 24, 'leagues');
      return result;
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error fetching country leagues for ${CURRENT_USER}:`, error);
      throw error;
    }
  },
  
  // Get top leagues (tier one competitions)
  getTopLeagues: async (favoriteLeagues: string[] = []) => {
    try {
      const cacheKey = createCacheKey.search('leagues', 'top-tier');
      const cachedData = cacheService.get<{leagues: FootballLeague[], total: number}>(cacheKey);
      
      if (cachedData) {
        if (favoriteLeagues.length > 0) {
          cachedData.leagues = cachedData.leagues.map(league => ({
            ...league,
            isFollowed: favoriteLeagues.includes(league.id)
          }));
        }
        return cachedData;
      }
      
      // football-data.org has a specific endpoint for tier one competitions
      const response = await footballDataApiClient.get('/competitions?plan=TIER_ONE');
      
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} fetched top tier leagues: ${response.data.count} results`);
      
      const result = {
        leagues: response.data.competitions.map((league: FootballDataLeague) => 
          mapApiLeagueToAppLeague(league, favoriteLeagues)
        ),
        total: response.data.count
      };
      
      // Cache for 24 hours with category label
      cacheService.set(cacheKey, result, 60 * 24, 'leagues');
      return result;
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error fetching top leagues for ${CURRENT_USER}:`, error);
      throw error;
    }
  },
  
  // Clear league caches - useful when refreshing data
  clearLeagueCache: () => {
    try {
      cacheService.clearByCategory('league');
      cacheService.clearByCategory('leagues');
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} cleared all league caches`);
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error clearing league cache:`, error);
    }
  },
  
  // Get cache statistics
  getCacheStats: () => {
    return cacheService.getStats();
  }
};

export default LeaguesService;