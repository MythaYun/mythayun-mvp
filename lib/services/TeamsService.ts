import footballDataApiClient from '../api/footballApiClient';
import cacheService, { createCacheKey } from './cacheService';

// Updated constants with the latest values
const CURRENT_TIMESTAMP = "2025-05-20 16:09:19"; 
const CURRENT_USER = "Sdiabate1337";

// Types for football-data.org team data
export interface FootballDataTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
  address: string;
  website: string;
  founded: number;
  clubColors: string;
  venue: string;
  lastUpdated: string;
  runningCompetitions?: Array<{
    id: number;
    name: string;
    code: string;
    type: string;
    emblem: string;
  }>;
  coach?: {
    id: number;
    name: string;
    dateOfBirth?: string;
    nationality?: string;
    contract?: {
      start: string;
      until: string;
    };
  };
  squad?: FootballDataPlayer[];
  area: {
    id: number;
    name: string;
    code: string;
    flag: string;
  };
}

// Type definition for player data from football-data.org
export interface FootballDataPlayer {
  id: number;
  name: string;
  position: string;
  dateOfBirth: string;
  nationality: string;
  shirtNumber?: number;
  currentTeam?: {
    id: number;
    name: string;
    crest: string;
  };
}

// Processed player data for our app
export interface FootballPlayer {
  id: string;
  name: string;
  age: number;
  number: number | null;
  position: string;
  photo: string;
  teamId: string;
}

export interface TeamsResponse {
  count: number;
  filters: Record<string, any>;
  teams: FootballDataTeam[];
}

// Our app's team format
export interface FootballTeam {
  id: string;
  name: string;
  logo: string;
  country: string;
  founded: number;
  venue: {
    name: string;
    capacity: number;
    city: string;
    image: string;
  };
  isFollowed: boolean;
}

// Interface for team list response
export interface TeamListResponse {
  teams: FootballTeam[];
  total: number;
}

// Interface for squad response
export interface SquadResponse {
  players: FootballPlayer[];
  team: {
    id: string;
    name: string;
    logo: string;
  };
  total: number;
}

// Calculate age from date of birth
const getAge = (dateOfBirth: string): number => {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Map API team to our format
const mapApiTeamToAppTeam = (apiTeam: FootballDataTeam, favoriteTeams: string[] = []): FootballTeam => {
  console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} mapping team data: ${apiTeam.id}`);
  
  return {
    id: apiTeam.id.toString(),
    name: apiTeam.name,
    logo: apiTeam.crest || '/placeholder-team.png',
    country: apiTeam.area?.name || 'Unknown',
    founded: apiTeam.founded || 0,
    venue: {
      name: apiTeam.venue || 'Unknown',
      capacity: 0, // football-data.org doesn't provide capacity directly
      city: apiTeam.address || 'Unknown',
      image: '/placeholder-stadium.jpg'
    },
    isFollowed: favoriteTeams.includes(apiTeam.id.toString())
  };
};

// Map API player to our format
const mapApiPlayerToAppPlayer = (player: FootballDataPlayer, teamId: string): FootballPlayer => {
  return {
    id: player.id.toString(),
    name: player.name,
    age: getAge(player.dateOfBirth),
    number: player.shirtNumber || null,
    position: player.position,
    photo: '/placeholder-player.png', // football-data.org doesn't provide player photos
    teamId: teamId
  };
};

// Update teams with user favorites
const updateTeamsWithUserFavorites = (teams: FootballTeam[], favoriteTeams: string[]): FootballTeam[] => {
  if (!favoriteTeams.length) return teams;
  
  return teams.map((team: FootballTeam) => ({
    ...team,
    isFollowed: favoriteTeams.includes(team.id)
  }));
};

// Team service functions
const TeamsService = {
  // Get a single team by ID
  getTeam: async (teamId: string, favoriteTeams: string[] = []): Promise<FootballTeam> => {
    try {
      // Use standardized cache key
      const cacheKey = createCacheKey.team(teamId);
      const cachedData = cacheService.get<FootballTeam>(cacheKey);
      
      if (cachedData) {
        // Update with latest user preferences
        return {
          ...cachedData,
          isFollowed: favoriteTeams.includes(cachedData.id)
        };
      }
      
      const response = await footballDataApiClient.get(`/teams/${encodeURIComponent(teamId)}`);
      
      if (!response.data) {
        throw new Error(`Team with ID ${teamId} not found`);
      }
      
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} fetched team: ${teamId}`);
      
      const team = mapApiTeamToAppTeam(response.data, favoriteTeams);
      
      // Cache for 1 hour with category label - team data doesn't change often
      cacheService.set(cacheKey, team, 60, 'team');
      return team;
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error fetching team ${teamId} for ${CURRENT_USER}:`, error);
      throw error;
    }
  },
  
  // Search for teams
  searchTeams: async (query: string, favoriteTeams: string[] = []): Promise<TeamListResponse> => {
    try {
      // Input validation
      if (!query || query.length < 3) {
        return { teams: [], total: 0 };
      }
      
      // Use standardized cache key
      const cacheKey = createCacheKey.search('teams', query);
      const cachedData = cacheService.get<TeamListResponse>(cacheKey);
      
      if (cachedData) {
        // Update with latest user preferences
        return {
          ...cachedData,
          teams: updateTeamsWithUserFavorites(cachedData.teams, favoriteTeams)
        };
      }
      
      // football-data.org doesn't have a direct search endpoint
      // We'll get a list of teams from top competitions and filter them client-side
      const response = await footballDataApiClient.get('/teams');
      
      // Filter teams by name or location (case-insensitive)
      const normalizedQuery = query.toLowerCase();
      const filteredTeams = response.data.teams.filter((team: FootballDataTeam) => {
        return team.name.toLowerCase().includes(normalizedQuery) || 
               (team.shortName && team.shortName.toLowerCase().includes(normalizedQuery)) ||
               (team.area && team.area.name.toLowerCase().includes(normalizedQuery));
      });
      
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} searched for teams: "${query}" - ${filteredTeams.length} results`);
      
      const result: TeamListResponse = {
        teams: filteredTeams.map((team: FootballDataTeam) => mapApiTeamToAppTeam(team, favoriteTeams)),
        total: filteredTeams.length
      };
      
      // Cache for 30 minutes with category label
      cacheService.set(cacheKey, result, 30, 'search');
      return result;
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error searching teams for ${CURRENT_USER}:`, error);
      throw error;
    }
  },
  
  // Get a team's squad
  getTeamSquad: async (teamId: string): Promise<SquadResponse> => {
    try {
      // Use standardized cache key
      const cacheKey = createCacheKey.teamSquad(teamId);
      const cachedData = cacheService.get<SquadResponse>(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }
      
      // football-data.org includes squad with team details
      const response = await footballDataApiClient.get(`/teams/${encodeURIComponent(teamId)}`);
      
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} fetched squad for team: ${teamId}`);
      
      // Process squad data
      const teamData = response.data as FootballDataTeam;
      const squad = teamData.squad || [];
      
      const result: SquadResponse = {
        players: squad.map((player: FootballDataPlayer) => mapApiPlayerToAppPlayer(player, teamId)),
        team: {
          id: teamData.id.toString(),
          name: teamData.name,
          logo: teamData.crest || '/placeholder-team.png'
        },
        total: squad.length
      };
      
      // Cache for 24 hours with category label - squad data changes infrequently
      cacheService.set(cacheKey, result, 60 * 24, 'squad');
      return result;
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error fetching team squad for ${CURRENT_USER}:`, error);
      throw error;
    }
  },
  
  // Get teams from a specific league
  getLeagueTeams: async (leagueId: string, season: number, favoriteTeams: string[] = []): Promise<TeamListResponse> => {
    try {
      // Use standardized cache key
      const cacheKey = createCacheKey.leagueTeams(leagueId, season);
      const cachedData = cacheService.get<TeamListResponse>(cacheKey);
      
      if (cachedData) {
        // Update with latest user preferences
        return {
          ...cachedData,
          teams: updateTeamsWithUserFavorites(cachedData.teams, favoriteTeams)
        };
      }
      
      // football-data.org uses 'competitions' instead of 'league'
      const response = await footballDataApiClient.get(
        `/competitions/${encodeURIComponent(leagueId)}/teams?season=${season}`
      );
      
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} fetched teams for league: ${leagueId} season: ${season}`);
      
      const result: TeamListResponse = {
        teams: response.data.teams.map((team: FootballDataTeam) => mapApiTeamToAppTeam(team, favoriteTeams)),
        total: response.data.count
      };
      
      // Cache for 24 hours with category label - team affiliations don't change often
      cacheService.set(cacheKey, result, 60 * 24, 'league-teams');
      return result;
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error fetching league teams for ${CURRENT_USER}:`, error);
      throw error;
    }
  },
  
  // Get top-scoring teams in a league
  getTopScoringTeams: async (leagueId: string, season: number): Promise<any> => {
    try {
      // Use standardized cache key
      const cacheKey = createCacheKey.search(`league-${leagueId}-stats`, `top-scoring-${season}`);
      const cachedData = cacheService.get(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }
      
      // football-data.org uses standings for team statistics
      const response = await footballDataApiClient.get(
        `/competitions/${encodeURIComponent(leagueId)}/standings?season=${season}`
      );
      
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} fetched standings for league: ${leagueId}`);
      
      // Get the team standings and sort by goals scored
      const standings = response.data.standings[0]?.table || [];
      const sortedByGoals = [...standings].sort((a: any, b: any) => b.goalsFor - a.goalsFor);
      
      const result = {
        stats: sortedByGoals.slice(0, 10).map((entry: any) => ({
          team: {
            id: entry.team.id,
            name: entry.team.name,
            logo: entry.team.crest
          },
          goalsFor: entry.goalsFor,
          goalsAgainst: entry.goalsAgainst,
          goalDifference: entry.goalDifference,
          position: entry.position
        })),
        timestamp: CURRENT_TIMESTAMP
      };
      
      // Cache for 12 hours with category label - stats update after matches
      cacheService.set(cacheKey, result, 60 * 12, 'statistics');
      return result;
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error fetching team statistics for ${CURRENT_USER}:`, error);
      throw error;
    }
  },
  
  // Get team standings in league
  getTeamStanding: async (teamId: string, leagueId: string, season: number): Promise<any> => {
    try {
      // Use standardized cache key
      const cacheKey = createCacheKey.search(`team-${teamId}-standing`, `${leagueId}-${season}`);
      const cachedData = cacheService.get(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }
      
      // Get standings from football-data.org
      const response = await footballDataApiClient.get(
        `/competitions/${encodeURIComponent(leagueId)}/standings?season=${season}`
      );
      
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} fetched standings for team ${teamId} in league ${leagueId}`);
      
      // Find the team in the standings
      const standings = response.data.standings[0]?.table || [];
      const teamStanding = standings.find((entry: any) => entry.team.id.toString() === teamId);
      
      const result = {
        standing: teamStanding || null,
        totalTeams: standings.length,
        timestamp: CURRENT_TIMESTAMP
      };
      
      // Cache for 6 hours with category label - standings update after matches
      cacheService.set(cacheKey, result, 60 * 6, 'standings');
      return result;
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error fetching team standing for ${CURRENT_USER}:`, error);
      throw error;
    }
  },
  
  // Clear team cache
  clearTeamCache: (teamId: string): void => {
    // Clear all caches related to this team
    const teamKey = createCacheKey.team(teamId);
    const squadKey = createCacheKey.teamSquad(teamId);
    
    cacheService.remove(teamKey);
    cacheService.remove(squadKey);
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} cleared cache for team ${teamId}`);
  },
  
  // Clear all teams cache
  clearAllTeamsCache: (): void => {
    cacheService.clearByCategory('team');
    cacheService.clearByCategory('squad');
    cacheService.clearByCategory('league-teams');
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} cleared all teams cache`);
  },
  
  // Get cache statistics
  getCacheStats: (): { size: number, categories: Record<string, number> } => {
    return cacheService.getStats();
  }
};

export default TeamsService;