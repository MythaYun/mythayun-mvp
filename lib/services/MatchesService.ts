import { ReactNode } from 'react';
import apiFootballClient from '../api/footballApiClient';
import CacheService from './cacheService';

// Current system information
const CURRENT_TIMESTAMP = "2025-06-10 15:09:42";
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

// Map of league codes to API-Football IDs - add more as needed
export const LEAGUE_ID_MAPPING: Record<string, number> = {
  'PL': 39,    // Premier League
  'BL1': 78,   // Bundesliga
  'SA': 135,   // Serie A
  'PD': 140,   // La Liga
  'FL1': 61,   // Ligue 1
  'PPL': 94,   // Primeira Liga
  'CL': 2,     // Champions League
  'EC': 4,     // Euro Championship
  'WC': 1,     // World Cup
  'ELC': 40,   // Championship
  'DED': 88,   // Eredivisie
  'CLI': 3,    // Copa Libertadores
};

// Get current season based on date
export function getCurrentSeason(): number {
  const now = new Date(CURRENT_TIMESTAMP);
  return now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
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
        flag: fixture.league.flag
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
      round: fixture.league.round || '',
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
        const today = new Date(CURRENT_TIMESTAMP);
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + days);
        
        const fromDate = today.toISOString().split('T')[0];
        const toDate = endDate.toISOString().split('T')[0];
        
        console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Date range: ${fromDate} to ${toDate}`);
        
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
   * ENHANCED: Get matches for the next 15 days (including today)
   * Uses a chunked approach to fetch data in smaller date ranges
   */
  static async getNext15DaysMatches(leagueId?: string): Promise<FootballMatch[]> {
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} is fetching matches for next 15 days${leagueId ? ` in league ${leagueId}` : ''}`);
    
    const cacheKey = `next15Days:${leagueId || 'all'}`;
    
    // Use a shorter cache time to ensure fresh data
    return CacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          // Try first using getFixtures with league and season
          if (leagueId) {
            console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Attempting to fetch by league ID directly: ${leagueId}`);
            
            // Get current season
            const season = getCurrentSeason();
            
            // Try to fetch all fixtures for this league and season
            try {
              const { data } = await apiFootballClient.getFixtures({
                league: leagueId,
                season: season,
                next: 20 // Get next 20 fixtures for this league
              });
              
              if (data.response && Array.isArray(data.response) && data.response.length > 0) {
                console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Successfully fetched ${data.response.length} matches for league ${leagueId}`);
                
                // Convert fixtures to our format
                const allMatches = data.response.map(this.convertFixtureToMatch);
                
                // Now filter to just get the next 15 days
                const today = new Date(CURRENT_TIMESTAMP);
                const endDate = new Date(today);
                endDate.setDate(today.getDate() + 14); // 14 more days after today = 15 days
                
                const fromDate = today.toISOString().split('T')[0];
                const toDate = endDate.toISOString().split('T')[0];
                
                // Filter by date on the client side
                const filteredMatches = allMatches.filter((match: { date: string | number | Date; }) => {
                  const matchDate = new Date(match.date);
                  return matchDate >= today && matchDate <= endDate;
                });
                
                console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Filtered to ${filteredMatches.length} matches for next 15 days`);
                
                // Sort by date and time
                filteredMatches.sort((a: { date: string; time: string; }, b: { date: any; time: any; }) => {
                  const dateComparison = a.date.localeCompare(b.date);
                  if (dateComparison !== 0) return dateComparison;
                  return a.time.localeCompare(b.time);
                });
                
                return filteredMatches;
              }
            } catch (error) {
              console.error(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Error fetching by league ID:`, error);
              // Fall back to the chunked approach
            }
          }
          
          // If we get here, either there's no league ID or the league ID fetch failed
          // Fall back to chunked approach
          console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Using chunked approach for 15-day matches`);
          return this.getMatchesPaginated(15, 50, leagueId);
          
        } catch (error) {
          console.error(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Error in getNext15DaysMatches:`, error);
          throw error;
        }
      },
      'SHORT' // Use a shorter cache time for 15-day view
    );
  }

  /**
   * Get matches by specific league and season
   * Uses the season fixtures approach instead of date range
   */
  static async getFixturesByLeagueSeason(leagueId: string | number, season?: number): Promise<FootballMatch[]> {
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} is fetching fixtures for league ${leagueId} and season ${season || 'current'}`);
    
    const currentSeason = season || getCurrentSeason();
    const cacheKey = `leagueFixtures:${leagueId}:${currentSeason}`;
    
    return CacheService.getOrSet(
      cacheKey,
      async () => {
        // Instead of using a non-existent method, use the getFixtures method with league and season parameters
        const { data } = await apiFootballClient.getFixtures({
          league: leagueId,
          season: currentSeason
        });
        
        if (!data.response || !Array.isArray(data.response)) {
          return [];
        }
        
        console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Fetched ${data.response.length} fixtures for league ${leagueId}`);
        
        return data.response.map(this.convertFixtureToMatch);
      },
      'MEDIUM' // Medium cache for league fixtures
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
        const today = new Date(CURRENT_TIMESTAMP);
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
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} is fetching details for match ${matchId}`);
    
    // First determine if match is live to set appropriate cache
    const cacheKey = `matchDetails:${matchId}`;

    // Fetch fixture data first to determine live status
    const { data: fixtureData } = await apiFootballClient.getFixtures({ id: parseInt(matchId) });

    if (!fixtureData.response || !fixtureData.response.length) {
      console.error(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Match ${matchId} not found`);
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
        
        try {
          // Get statistics - Pass fixture ID as number directly
          const fixtureId = parseInt(matchId);
          const { data: statsData } = await apiFootballClient.getFixtureStatistics(fixtureId);
          
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
        } catch (error) {
          console.error(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Error fetching statistics:`, error);
          // Continue without statistics
        }
        
        try {
          // Get events - Pass fixture ID as number directly
          const fixtureId = parseInt(matchId);
          const { data: eventsData } = await apiFootballClient.getFixtureEvents(fixtureId);
          if (eventsData.response) {
            match.events = eventsData.response;
          }
        } catch (error) {
          console.error(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Error fetching events:`, error);
          // Continue without events
        }
        
        try {
          // Get lineups - Pass fixture ID as number directly
          const fixtureId = parseInt(matchId);
          const { data: lineupData } = await apiFootballClient.getFixtureLineups(fixtureId);
          if (lineupData.response) {
            match.lineups = lineupData.response;
            
            // Extract referee if available
            if (lineupData.response.length > 0 && lineupData.response[0].coach) {
              match.referee = fixtureData.response[0].fixture.referee;
            }
          }
        } catch (error) {
          console.error(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Error fetching lineups:`, error);
          // Continue without lineups
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
  static async searchMatchesByTeam(teamName: string, season: number = 2025): Promise<FootballMatch[]> {
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
        
        // Get team's fixtures using the proper method
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
    const today = new Date(CURRENT_TIMESTAMP).toISOString().split('T')[0];
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
  
  /**
   * Get matches grouped by date for the next N days
   * Returns an object with dates as keys and match arrays as values
   */
  static async getMatchesGroupedByDate(days: number = 15, leagueId?: string): Promise<Record<string, FootballMatch[]>> {
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} is fetching matches grouped by date for next ${days} days`);
    
    // First get all matches for the period
    const allMatches = days === 15 
      ? await this.getNext15DaysMatches(leagueId) // Use optimized method for 15 days
      : await this.getUpcomingMatches(days, leagueId);
    
    // Group by date
    const groupedMatches: Record<string, FootballMatch[]> = {};
    
    allMatches.forEach(match => {
      if (!groupedMatches[match.date]) {
        groupedMatches[match.date] = [];
      }
      groupedMatches[match.date].push(match);
    });
    
    // Sort matches within each date by time
    Object.keys(groupedMatches).forEach(date => {
      groupedMatches[date].sort((a, b) => a.time.localeCompare(b.time));
    });
    
    return groupedMatches;
  }
  
  /**
   * IMPROVED: Handle paginated fetching for large data sets (like 15+ days of matches)
   * Handles chunking of date ranges to avoid API limits
   */
  static async getMatchesPaginated(days: number = 15, pageSize: number = 50, leagueId?: string): Promise<FootballMatch[]> {
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} is fetching paginated matches for ${days} days`);
    
    // Try a different approach for getting matches - using seasons and leagues
    if (leagueId) {
      try {
        console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Attempting to fetch using 'next' parameter for league ${leagueId}`);
        const season = getCurrentSeason();
        
        // Try using the 'next' parameter first - this often works better than date ranges
        const { data } = await apiFootballClient.getFixtures({
          league: leagueId,
          season: season,
          next: 30 // Get next 30 fixtures for this league
        });
        
        if (data.response && Array.isArray(data.response) && data.response.length > 0) {
          console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Fetched ${data.response.length} fixtures for league ${leagueId}`);
          
          // Convert and filter to get only matches in the next N days
          const matches = data.response.map(this.convertFixtureToMatch);
          
          // Calculate date range
          const today = new Date(CURRENT_TIMESTAMP);
          const endDate = new Date(today);
          endDate.setDate(today.getDate() + days - 1);
          
          // Filter to get only matches in our date range
          const filteredMatches = matches.filter((match: { date: string | number | Date; }) => {
            const matchDate = new Date(match.date);
            return matchDate >= today && matchDate <= endDate;
          });
          
          console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Filtered to ${filteredMatches.length} matches in next ${days} days`);
          
          // Sort by date and time
          filteredMatches.sort((a: { date: string; time: string; }, b: { date: any; time: any; }) => {
            const dateComparison = a.date.localeCompare(b.date);
            if (dateComparison !== 0) return dateComparison;
            return a.time.localeCompare(b.time);
          });
          
          return filteredMatches;
        }
      } catch (error) {
        console.error(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Error fetching using 'next' parameter:`, error);
        // Fall back to chunked approach
      }
    }
    
    // Calculate date range
    const today = new Date(CURRENT_TIMESTAMP);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + days - 1);
    
    const fromDate = today.toISOString().split('T')[0];
    const toDate = endDate.toISOString().split('T')[0];
    
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Date range: ${fromDate} to ${toDate}`);
    
    // Calculate how many days to fetch at a time (e.g., 3-day chunks to stay within API limits)
    const chunkSize = 3; // days per chunk (API-Football often limits to 3-day ranges)
    const chunks = Math.ceil(days / chunkSize);
    
    let allMatches: FootballMatch[] = [];
    
    for (let i = 0; i < chunks; i++) {
      const chunkStart = new Date(today);
      chunkStart.setDate(today.getDate() + (i * chunkSize));
      
      const chunkEnd = new Date(chunkStart);
      chunkEnd.setDate(chunkStart.getDate() + chunkSize - 1);
      
      // Don't go beyond our original end date
      if (chunkEnd > endDate) {
        chunkEnd.setTime(endDate.getTime());
      }
      
      const chunkFromDate = chunkStart.toISOString().split('T')[0];
      const chunkToDate = chunkEnd.toISOString().split('T')[0];
      
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Fetching chunk ${i + 1}/${chunks}: ${chunkFromDate} to ${chunkToDate}`);
      
      // Prepare params for this chunk
      const params: any = {
        from: chunkFromDate,
        to: chunkToDate
      };
      
      if (leagueId) {
        params.league = leagueId;
      }
      
      try {
        // Add a small delay between chunks to avoid rate limits
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        const { data } = await apiFootballClient.getFixtures(params);
        
        if (data.response && Array.isArray(data.response)) {
          const chunkMatches = data.response.map(this.convertFixtureToMatch);
          allMatches = [...allMatches, ...chunkMatches];
          
          console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Chunk ${i + 1} fetched ${chunkMatches.length} matches`);
        }
      } catch (error) {
        console.error(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Error fetching chunk ${i + 1}:`, error);
        // Continue with other chunks even if one fails
      }
    }
    
    // Sort all matches by date and time
    allMatches.sort((a, b) => {
      const dateComparison = a.date.localeCompare(b.date);
      if (dateComparison !== 0) return dateComparison;
      return a.time.localeCompare(b.time);
    });
    
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Fetched total of ${allMatches.length} matches for ${days} days`);
    
    return allMatches;
  }
  
  /**
   * NEW: Get fixtures from multiple major leagues
   * This approach fetches fixtures from major leagues, then filters by date
   */
  static async getFixturesByMultipleLeagues(days: number = 15): Promise<FootballMatch[]> {
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} is fetching fixtures from major leagues for next ${days} days`);
    
    const cacheKey = `majorLeaguesFixtures:${days}`;
    
    return CacheService.getOrSet(
      cacheKey,
      async () => {
        // Define major leagues to fetch
        const majorLeagues = [
          { id: 39, name: 'Premier League' },      // Premier League
          { id: 140, name: 'La Liga' },            // La Liga
          { id: 135, name: 'Serie A' },            // Serie A
          { id: 78, name: 'Bundesliga' },          // Bundesliga
          { id: 61, name: 'Ligue 1' },             // Ligue 1
          { id: 2, name: 'Champions League' }      // Champions League
        ];
        
        const season = getCurrentSeason();
        console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Fetching matches for season ${season}`);
        
        // Fetch fixtures for each league in parallel
        const leaguePromises = majorLeagues.map(league => {
          return new Promise<FootballMatch[]>(async (resolve) => {
            try {
              console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Fetching ${league.name} (${league.id}) fixtures`);
              
              // Use the 'next' parameter to get upcoming fixtures
              const { data } = await apiFootballClient.getFixtures({
                league: league.id,
                season,
                next: 20
              });
              
              if (data.response && Array.isArray(data.response)) {
                console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Fetched ${data.response.length} ${league.name} fixtures`);
                
                // Convert to our match format
                const matches = data.response.map(this.convertFixtureToMatch);
                resolve(matches);
              } else {
                console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - No fixtures found for ${league.name}`);
                resolve([]);
              }
            } catch (error) {
              console.error(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Error fetching ${league.name} fixtures:`, error);
              resolve([]);
            }
          });
        });
        
        // Wait for all league requests to complete
        const leagueResults = await Promise.all(leaguePromises);
        
        // Combine all fixtures
        let allFixtures: FootballMatch[] = [];
        leagueResults.forEach(leagueFixtures => {
          allFixtures = [...allFixtures, ...leagueFixtures];
        });
        
        console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Combined ${allFixtures.length} fixtures from all leagues`);
        
        // Filter to get only fixtures in the next N days
        const today = new Date(CURRENT_TIMESTAMP);
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + days - 1);
        
        const filteredFixtures = allFixtures.filter(match => {
          const matchDate = new Date(match.date);
          return matchDate >= today && matchDate <= endDate;
        });
        
        console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Filtered to ${filteredFixtures.length} fixtures in next ${days} days`);
        
        // Sort by date and time
        filteredFixtures.sort((a, b) => {
          const dateComparison = a.date.localeCompare(b.date);
          if (dateComparison !== 0) return dateComparison;
          return a.time.localeCompare(b.time);
        });
        
        return filteredFixtures;
      },
      'MEDIUM' // Use medium cache since this is a large dataset
    );
  }
  
  /**
   * Clear cache for debugging purposes
   */
  static clearCache(): void {
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} is clearing match cache`);
    CacheService.clear();
  }
}