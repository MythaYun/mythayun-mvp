import apiFootballClient from '../api/footballApiClient';
import CacheService from './cacheService';

// Current system information
const CURRENT_TIMESTAMP = "2025-05-31 12:27:03";
const CURRENT_USER = "Sdiabate1337";

// Team interface
export interface Team {
  id: string;
  name: string;
  code?: string;
  country: string;
  founded: number;
  logo: string;
  venue: {
    name: string;
    address?: string;
    city?: string;
    capacity?: number;
    surface?: string;
    image?: string;
  };
}

// Team stats interface
export interface TeamStats {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  form: string[];
  cleanSheets: number;
  failedToScore: number;
}

// Player interface
export interface Player {
  id: string;
  name: string;
  age: number;
  nationality: string;
  position: string;
  photo: string;
  stats?: {
    appearances: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    minutesPlayed: number;
  };
}

// Team service implementation for API-Football
export default class TeamService {
  /**
   * Convert API-Football team format to our Team format
   */
  private static convertToTeam(apiTeam: any): Team {
    return {
      id: apiTeam.team.id.toString(),
      name: apiTeam.team.name,
      code: apiTeam.team.code,
      country: apiTeam.team.country,
      founded: apiTeam.team.founded,
      logo: apiTeam.team.logo,
      venue: {
        name: apiTeam.venue?.name || 'Unknown',
        address: apiTeam.venue?.address,
        city: apiTeam.venue?.city,
        capacity: apiTeam.venue?.capacity,
        surface: apiTeam.venue?.surface,
        image: apiTeam.venue?.image
      }
    };
  }

/**
   * Get team by ID
   */
  static async getTeam(teamId: string): Promise<Team | null> {
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} is fetching team: ${teamId}`);
    
    const cacheKey = `team:${teamId}`;
    
    return CacheService.getOrSet(
      cacheKey,
      async () => {
        const { data } = await apiFootballClient.getTeams({ id: parseInt(teamId) });
        
        if (!data.response || data.response.length === 0) {
          console.log(`[${CURRENT_TIMESTAMP}] Team not found: ${teamId}`);
          return null;
        }
        
        return this.convertToTeam(data.response[0]);
      },
      'LONG' // Team data rarely changes
    );
  }

  /**
   * Search for teams by name
   */
  static async searchTeams(query: string): Promise<Team[]> {
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} is searching for teams: ${query}`);
    
    const cacheKey = `teamSearch:${query.toLowerCase()}`;
    
    return CacheService.getOrSet(
      cacheKey,
      async () => {
        const { data } = await apiFootballClient.getTeams({ search: query });
        
        if (!data.response || !Array.isArray(data.response)) {
          return [];
        }
        
        return data.response.map(this.convertToTeam);
      },
      'MEDIUM'
    );
  }

  /**
   * Get teams in a league
   */
  static async getTeamsInLeague(leagueId: string, season: number = 2023): Promise<Team[]> {
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} is fetching teams for league: ${leagueId}, season: ${season}`);
    
    const cacheKey = `teamsInLeague:${leagueId}:${season}`;
    
    return CacheService.getOrSet(
      cacheKey,
      async () => {
        const { data } = await apiFootballClient.getTeams({ 
          league: parseInt(leagueId), 
          season 
        });
        
        if (!data.response || !Array.isArray(data.response)) {
          return [];
        }
        
        return data.response.map(this.convertToTeam);
      },
      'DAY' // Team lists only change seasonally
    );
  }


/**
   * Get team statistics
   */
  static async getTeamStats(teamId: string, leagueId: string, season: number = 2023): Promise<TeamStats | null> {
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} is fetching stats for team ${teamId} in league ${leagueId}`);
    
    const cacheKey = `teamStats:${teamId}:${leagueId}:${season}`;
    
    return CacheService.getOrSet(
      cacheKey,
      async () => {
        const { data } = await apiFootballClient.getTeamStatistics({
          team: parseInt(teamId),
          league: parseInt(leagueId),
          season
        });
        
        if (!data.response) {
          console.log(`[${CURRENT_TIMESTAMP}] No stats found for team ${teamId}`);
          return null;
        }
        
        const stats = data.response;
        
        return {
          played: stats.fixtures?.played?.total || 0,
          wins: stats.fixtures?.wins?.total || 0,
          draws: stats.fixtures?.draws?.total || 0,
          losses: stats.fixtures?.loses?.total || 0,
          goalsFor: stats.goals?.for?.total || 0,
          goalsAgainst: stats.goals?.against?.total || 0,
          form: stats.form ? stats.form.split('').map((result: string) => result) : [],
          cleanSheets: stats.clean_sheet?.total || 0,
          failedToScore: stats.failed_to_score?.total || 0
        };
      },
      'STANDARD' // Updates after matches, so standard cache
    );
  }


  /**
   * Get team's players
   */
  static async getTeamPlayers(teamId: string, season: number = 2023): Promise<Player[]> {
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} is fetching players for team ${teamId}`);
    
    const cacheKey = `teamPlayers:${teamId}:${season}`;
    
    return CacheService.getOrSet(
      cacheKey,
      async () => {
        const { data } = await apiFootballClient.getPlayers({
          team: parseInt(teamId),
          season
        });
        
        if (!data.response || !Array.isArray(data.response)) {
          return [];
        }
        
        return data.response.map((player: any) => ({
          id: player.player.id.toString(),
          name: player.player.name,
          age: player.player.age,
          nationality: player.player.nationality,
          position: player.statistics[0]?.games?.position || 'Unknown',
          photo: player.player.photo,
          stats: {
            appearances: player.statistics[0]?.games?.appearences || 0,
            goals: player.statistics[0]?.goals?.total || 0,
            assists: player.statistics[0]?.goals?.assists || 0,
            yellowCards: player.statistics[0]?.cards?.yellow || 0,
            redCards: player.statistics[0]?.cards?.red || 0,
            minutesPlayed: player.statistics[0]?.games?.minutes || 0
          }
        }));
      },
      'DAY' // Roster changes are infrequent
    );
  }
}