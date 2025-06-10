import apiFootballClient from '../api/footballApiClient';
import CacheService from './cacheService';

// Current system information
const CURRENT_TIMESTAMP = "2025-05-31 12:27:03";
const CURRENT_USER = "Sdiabate1337";

// Competition/League interface
export interface Competition {
  id: string;
  name: string;
  code?: string;
  emblem: string;
  type: string;
  country: string;
  currentSeason?: {
    id: number;
    startDate: string;
    endDate: string;
    currentMatchday?: number;
  };
}

// Standing interface
export interface Standing {
  position: number;
  team: {
    id: string;
    name: string;
    crest: string;
  };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form?: string;
}

// Top scorer interface
export interface TopScorer {
  player: {
    id: string;
    name: string;
    nationality: string;
    position: string;
    photo?: string;
  };
  team: {
    id: string;
    name: string;
    logo: string;
  };
  goals: number;
  assists: number;
  appearances: number;
}

// League service implementation for API-Football
export default class LeaguesService {
  private static CACHE_TTL = 30; // Cache for 30 minutes
  
  /**
   * Convert API-Football league format to our Competition format
   */
  private static convertToCompetition(apiLeague: any): Competition {
    return {
      id: apiLeague.league.id.toString(),
      name: apiLeague.league.name,
      code: apiLeague.league.code,
      emblem: apiLeague.league.logo,
      type: apiLeague.league.type,
      country: apiLeague.country.name,
      currentSeason: apiLeague.seasons && apiLeague.seasons.length > 0 ? {
        id: apiLeague.seasons[0].year,
        startDate: apiLeague.seasons[0].start,
        endDate: apiLeague.seasons[0].end,
        currentMatchday: apiLeague.seasons[0].current ? 
          apiLeague.seasons[0].current_round?.replace('Regular Season - ', '') : undefined
      } : undefined
    };
  }

  /**
   * Get all available competitions/leagues
   */
  static async getCompetitions(country?: string): Promise<Competition[]> {
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} is fetching competitions${country ? ` for country ${country}` : ''}`);
    
    const cacheKey = `competitions:${country || 'all'}`;
    
    return CacheService.getOrSet(cacheKey, async () => {
      try {
        const params: any = { current: true };
        
        if (country) {
          params.country = country;
        }
        
        const { data } = await apiFootballClient.getLeagues(params);
        
        if (!data.response || !Array.isArray(data.response)) {
          return [];
        }
        
        return data.response.map(this.convertToCompetition);
      } catch (error) {
        console.error(`[${CURRENT_TIMESTAMP}] Error fetching competitions:`, error);
        throw error;
      }
    }, this.CACHE_TTL);
  }

  /**
   * Get a specific competition by code or ID
   */
  static async getCompetition(codeOrId: string): Promise<Competition | null> {
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} is fetching competition: ${codeOrId}`);
    
    const cacheKey = `competition:${codeOrId}`;
    
    return CacheService.getOrSet(cacheKey, async () => {
      try {
        // Try to fetch by code first
        let params: any = { code: codeOrId, current: true };
        
        let { data } = await apiFootballClient.getLeagues(params);
        
        // If not found by code, try by ID
        if (!data.response || data.response.length === 0) {
          params = { id: parseInt(codeOrId), current: true };
          data = (await apiFootballClient.getLeagues(params)).data;
        }
        
        if (!data.response || data.response.length === 0) {
          console.log(`[${CURRENT_TIMESTAMP}] Competition not found: ${codeOrId}`);
          return null;
        }
        
        return this.convertToCompetition(data.response[0]);
      } catch (error) {
        console.error(`[${CURRENT_TIMESTAMP}] Error fetching competition:`, error);
        throw error;
      }
    }, this.CACHE_TTL);
  }

  /**
   * Get standings for a competition
   */
  static async getStandings(leagueId: string, season: number = 2023): Promise<Standing[]> {
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} is fetching standings for league: ${leagueId}, season: ${season}`);
    
    const cacheKey = `standings:${leagueId}:${season}`;
    
    return CacheService.getOrSet(cacheKey, async () => {
      try {
        const { data } = await apiFootballClient.getStandings({
          league: parseInt(leagueId),
          season
        });
        
        if (!data.response || data.response.length === 0 || !data.response[0].league.standings) {
          return [];
        }
        
        // Use the first standings array (usually the main league table)
        const standingsData = data.response[0].league.standings[0];
        
        return standingsData.map((standing: any) => ({
          position: standing.rank,
          team: {
            id: standing.team.id.toString(),
            name: standing.team.name,
            crest: standing.team.logo
          },
          playedGames: standing.all.played,
          won: standing.all.win,
          draw: standing.all.draw,
          lost: standing.all.lose,
          points: standing.points,
          goalsFor: standing.all.goals.for,
          goalsAgainst: standing.all.goals.against,
          goalDifference: standing.goalsDiff,
          form: standing.form
        }));
      } catch (error) {
        console.error(`[${CURRENT_TIMESTAMP}] Error fetching standings:`, error);
        throw error;
      }
    }, 15); // Shorter TTL for standings (15 minutes)
  }

  /**
   * Get top scorers for a competition
   */
  static async getTopScorers(leagueId: string, season: number = 2023, limit: number = 10): Promise<TopScorer[]> {
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} is fetching top scorers for league: ${leagueId}, season: ${season}`);
    
    const cacheKey = `topScorers:${leagueId}:${season}:${limit}`;
    
    return CacheService.getOrSet(cacheKey, async () => {
      try {
        const { data } = await apiFootballClient.getTopScorers({
          league: parseInt(leagueId),
          season
        });
        
        if (!data.response || !Array.isArray(data.response)) {
          return [];
        }
        
        // Map and sort by goals
        const scorers = data.response.map((item: any) => ({
          player: {
            id: item.player.id.toString(),
            name: item.player.name,
            nationality: item.player.nationality,
            position: item.statistics[0].games.position,
            photo: item.player.photo
          },
          team: {
            id: item.statistics[0].team.id.toString(),
            name: item.statistics[0].team.name,
            logo: item.statistics[0].team.logo
          },
          goals: item.statistics[0].goals.total || 0,
          assists: item.statistics[0].goals.assists || 0,
          appearances: item.statistics[0].games.appearences || 0
        }));
        
        // Sort by goals scored (descending)
        scorers.sort((a: { goals: number; }, b: { goals: number; }) => b.goals - a.goals);
        
        // Return only the requested number of scorers
        return scorers.slice(0, limit);
      } catch (error) {
        console.error(`[${CURRENT_TIMESTAMP}] Error fetching top scorers:`, error);
        throw error;
      }
    }, this.CACHE_TTL);
  }

  /**
   * Search for competitions by name
   */
  static async searchCompetitions(query: string): Promise<Competition[]> {
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} is searching for competitions: ${query}`);
    
    try {
      const { data } = await apiFootballClient.getLeagues({ search: query, current: true });
      
      if (!data.response || !Array.isArray(data.response)) {
        return [];
      }
      
      return data.response.map(this.convertToCompetition);
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error searching competitions:`, error);
      throw error;
    }
  }

  /**
   * Get available countries with leagues
   */
  static async getCountries(): Promise<{ name: string, code: string, flag?: string }[]> {
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} is fetching countries with leagues`);
    
    const cacheKey = 'countries:withLeagues';
    
    return CacheService.getOrSet(cacheKey, async () => {
      try {
        const { data } = await apiFootballClient.getCountries();
        
        if (!data.response || !Array.isArray(data.response)) {
          return [];
        }
        
        return data.response.map((country: any) => ({
          name: country.name,
          code: country.code,
          flag: country.flag
        }));
      } catch (error) {
        console.error(`[${CURRENT_TIMESTAMP}] Error fetching countries:`, error);
        throw error;
      }
    }, 60 * 24); // Cache for 24 hours
  }
}