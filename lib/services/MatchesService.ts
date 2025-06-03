import { ReactNode } from 'react';
import apiFootballClient from '../api/footballApiClient';
import CacheService from './cacheService';

// Current system information
const CURRENT_TIMESTAMP = "2025-05-31 12:27:03";
const CURRENT_USER = "Sdiabate1337";

// Match status type
export type MatchStatus = 'upcoming' | 'live' | 'finished';

// Football match interface
export interface FootballMatch {
  followedByUser: boolean;
  matchday: ReactNode;
  season: ReactNode;
  round: string;
  referee?: string;
  id: string;
  date: string;
  time: string;
  status: MatchStatus;
  league: {
    flag: string | undefined;
    id: string;
    name: string;
    logo: string;
    round: string;
    country: string;
  };
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
  score: {
    home: number | null;
    away: number | null;
  };
  venue?: string;
  elapsed?: string;
}

// Match details interface (extended info)
export interface MatchDetails extends FootballMatch {
  referee?: string;
  stats?: {
    possession?: {
      home: number;
      away: number;
    };
    shots?: {
      home: {
        total: number;
        onTarget: number;
      };
      away: {
        total: number;
        onTarget: number;
      };
    };
    corners?: {
      home: number;
      away: number;
    };
    fouls?: {
      home: number;
      away: number;
    };
    cards?: {
      yellow: {
        home: number;
        away: number;
      };
      red: {
        home: number;
        away: number;
      };
    };
  };
  lineups?: any[];
  events?: any[];
}

// Match service implementation for API-Football
export default class MatchesService {
  /**
   * Convert API-Football fixture format to our FootballMatch format
   */
  private static convertFixtureToMatch(fixture: any): FootballMatch {
    // Map API-Football status to our status format
    let status: MatchStatus = 'upcoming';
    if (['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'].includes(fixture.fixture.status.short)) {
      status = 'live';
    } else if (['FT', 'AET', 'PEN', 'WO', 'AWD', 'CANC', 'ABD', 'INT', 'PST', 'SUSP'].includes(fixture.fixture.status.short)) {
      status = 'finished';
    }

    // Parse date
    const date = new Date(fixture.fixture.date);
    
    return {
  id: fixture.fixture.id.toString(),
  date: date.toISOString().split('T')[0],
  time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
  status,
  league: {
    id: fixture.league.id.toString(),
    name: fixture.league.name,
    logo: fixture.league.logo,
    round: fixture.league.round,
    country: fixture.league.country,
    flag: undefined
  },
  homeTeam: {
    id: fixture.teams.home.id.toString(),
    name: fixture.teams.home.name,
    logo: fixture.teams.home.logo
  },
  awayTeam: {
    id: fixture.teams.away.id.toString(),
    name: fixture.teams.away.name,
    logo: fixture.teams.away.logo
  },
  score: {
    home: fixture.goals.home,
    away: fixture.goals.away
  },
  venue: fixture.fixture.venue?.name,
  elapsed: fixture.fixture.status.elapsed?.toString(),
  followedByUser: false,
  matchday: undefined,
  season: undefined,
  round: '',
};
  }

  /**
   * Get live matches
   */
 static async getLiveMatches(leagueId?: string): Promise<FootballMatch[]> {
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} is fetching live matches${leagueId ? ` for league ${leagueId}` : ''}`);
    
    const cacheKey = `liveMatches:${leagueId || 'all'}`;
    
    // Very short cache for live data
    return CacheService.getOrSet(
      cacheKey,
      async () => {
        const { data } = await apiFootballClient.getLiveFixtures(
          leagueId ? { league: leagueId } : undefined
        );
        
        if (!data.response || !Array.isArray(data.response)) {
          return [];
        }
        
        return data.response.map(this.convertFixtureToMatch);
      },
      'SHORT',
      true // Always adjust for match hours
    );
  }

  /**
   * Get upcoming matches for next N days
   */
  static async getUpcomingMatches(days: number = 7, leagueId?: string): Promise<FootballMatch[]> {
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} is fetching upcoming matches for next ${days} days${leagueId ? ` in league ${leagueId}` : ''}`);
    
    const cacheKey = `upcomingMatches:${days}:${leagueId || 'all'}`;
    
    return CacheService.getOrSet(
      cacheKey,
      async () => {
        // Calculate date range
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + days);
        
        const fromDate = today.toISOString().split('T')[0];
        const toDate = endDate.toISOString().split('T')[0];
        
        // Prepare params
        const params: any = {
          from: fromDate,
          to: toDate,
          status: 'NS' // Not started
        };
        
        if (leagueId) {
          params.league = leagueId;
        }
        
        const { data } = await apiFootballClient.getFixtures(params);
        
        if (!data.response || !Array.isArray(data.response)) {
          return [];
        }
        
        return data.response.map(this.convertFixtureToMatch);
      },
      'STANDARD'
    );
  }

  /**
   * Get completed matches for the last N days
   */
  static async getCompletedMatches(days: number = 7, leagueId?: string): Promise<FootballMatch[]> {
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} is fetching completed matches for last ${days} days${leagueId ? ` in league ${leagueId}` : ''}`);
    
    const cacheKey = `completedMatches:${days}:${leagueId || 'all'}`;
    
    return CacheService.getOrSet(
      cacheKey,
      async () => {
        // Calculate date range
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - days);
        
        const fromDate = startDate.toISOString().split('T')[0];
        const toDate = today.toISOString().split('T')[0];
        
        // Prepare params
        const params: any = {
          from: fromDate,
          to: toDate,
          status: 'FT-AET-PEN' // Finished matches
        };
        
        if (leagueId) {
          params.league = leagueId;
        }
        
        const { data } = await apiFootballClient.getFixtures(params);
        
        if (!data.response || !Array.isArray(data.response)) {
          return [];
        }
        
        return data.response.map(this.convertFixtureToMatch);
      },
      'MEDIUM' // Longer cache for historical data
    );
  }

  /**
   * Get details for a specific match
   */
static async getMatchDetails(matchId: string): Promise<MatchDetails | null> {
  console.log(`[2025-06-01 19:42:09] Sdiabate1337 is fetching details for match ${matchId}`);
  
  // First determine if match is live to set appropriate cache
  const cacheKey = `matchDetails:${matchId}`;

  // Fetch fixture data first to determine live status
  const { data: fixtureData } = await apiFootballClient.getFixtures({ id: parseInt(matchId) });

  if (!fixtureData.response || !fixtureData.response.length) {
    console.error(`[2025-06-01 19:42:09] Sdiabate1337 - Match ${matchId} not found`);
    return null;
  }

  // Check if match is live
  const status = fixtureData.response[0].fixture.status.short;
  const isLive = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'].includes(status);

  return CacheService.getOrSet(
    cacheKey,
    async () => {
      // Convert basic data
      const match = this.convertFixtureToMatch(fixtureData.response[0]) as MatchDetails;
      
      // Get statistics
      const { data: statsData } = await apiFootballClient.getFixtureStatistics(parseInt(matchId));
      
      if (statsData.response && statsData.response.length >= 2) {
        const homeStats = statsData.response[0].statistics;
        const awayStats = statsData.response[1].statistics;
        
        // Process statistics
        match.stats = {
          possession: {
            home: parseInt(homeStats.find((s: any) => s.type === 'Ball Possession')?.value || '0'),
            away: parseInt(awayStats.find((s: any) => s.type === 'Ball Possession')?.value || '0')
          },
          shots: {
            home: {
              total: parseInt(homeStats.find((s: any) => s.type === 'Total Shots')?.value || '0'),
              onTarget: parseInt(homeStats.find((s: any) => s.type === 'Shots on Goal')?.value || '0')
            },
            away: {
              total: parseInt(awayStats.find((s: any) => s.type === 'Total Shots')?.value || '0'),
              onTarget: parseInt(awayStats.find((s: any) => s.type === 'Shots on Goal')?.value || '0')
            }
          },
          corners: {
            home: parseInt(homeStats.find((s: any) => s.type === 'Corner Kicks')?.value || '0'),
            away: parseInt(awayStats.find((s: any) => s.type === 'Corner Kicks')?.value || '0')
          },
          fouls: {
            home: parseInt(homeStats.find((s: any) => s.type === 'Fouls')?.value || '0'),
            away: parseInt(awayStats.find((s: any) => s.type === 'Fouls')?.value || '0')
          },
          cards: {
            yellow: {
              home: parseInt(homeStats.find((s: any) => s.type === 'Yellow Cards')?.value || '0'),
              away: parseInt(awayStats.find((s: any) => s.type === 'Yellow Cards')?.value || '0')
            },
            red: {
              home: parseInt(homeStats.find((s: any) => s.type === 'Red Cards')?.value || '0'),
              away: parseInt(awayStats.find((s: any) => s.type === 'Red Cards')?.value || '0')
            }
          }
        };
      }
      
      // Get events
      const { data: eventsData } = await apiFootballClient.getFixtureEvents(parseInt(matchId));
      if (eventsData.response) {
        match.events = eventsData.response;
      }
      
      // Get lineups
      const { data: lineupData } = await apiFootballClient.getFixtureLineups(parseInt(matchId));
      if (lineupData.response) {
        match.lineups = lineupData.response;
        
        // Extract referee if available
        if (lineupData.response.length > 0 && lineupData.response[0].coach) {
          match.referee = fixtureData.response[0].fixture.referee;
        }
      }
      
      return match;
    },
    isLive ? 'SHORT' : 'STANDARD' // Short cache for live matches, standard for completed
  );
}

   /**
   * Helper method to check if match is live
   */
  private static async isMatchLive(matchId: string): Promise<boolean> {
    try {
      const { data } = await apiFootballClient.getFixtures({ id: parseInt(matchId) });
      
      if (!data.response || !data.response.length) {
        return false;
      }
      
      const status = data.response[0].fixture.status.short;
      return ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'].includes(status);
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error checking match status:`, error);
      return false;
    }
  }


  /**
 * Search for matches by team name
 */
static async searchMatchesByTeam(teamName: string, season: number = 2023): Promise<FootballMatch[]> {
  console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} is searching matches for team: ${teamName}`);
  
  const cacheKey = `teamMatches:${teamName.toLowerCase()}:${season}`;
  
  return CacheService.getOrSet(
    cacheKey,
    async () => {
      // First, search for the team
      const { data: teamData } = await apiFootballClient.getTeams({ name: teamName });
      
      if (!teamData.response || teamData.response.length === 0) {
        console.log(`[${CURRENT_TIMESTAMP}] No team found with name: ${teamName}`);
        return [];
      }
      
      const teamId = teamData.response[0].team.id;
      
      // Get team's fixtures
      const { data: fixturesData } = await apiFootballClient.getTeamFixtures(teamId, { season });
      
      if (!fixturesData.response || !Array.isArray(fixturesData.response)) {
        return [];
      }
      
      return fixturesData.response.map(this.convertFixtureToMatch);
    },
    'MEDIUM' // Cache for a medium time since team schedules don't change often
  );
}

/**
 * Get matches for a specific date
 */
static async getMatchesByDate(date: string, leagueId?: string): Promise<FootballMatch[]> {
  console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} is fetching matches for date: ${date}${leagueId ? ` in league ${leagueId}` : ''}`);
  
  const cacheKey = `matchesByDate:${date}:${leagueId || 'all'}`;
  
  // Use dynamic caching - shorter for today, longer for past dates
  const today = new Date().toISOString().split('T')[0];
  const isToday = date === today;
  
  return CacheService.getOrSet(
    cacheKey,
    async () => {
      const params: any = { date };
      
      if (leagueId) {
        params.league = leagueId;
      }
      
      const { data } = await apiFootballClient.getFixtures(params);
      
      if (!data.response || !Array.isArray(data.response)) {
        return [];
      }
      
      return data.response.map(this.convertFixtureToMatch);
    },
    isToday ? 'SHORT' : 'MEDIUM', // Shorter cache for today's matches
    isToday // Only adjust for match hours if it's today
  );
}
}