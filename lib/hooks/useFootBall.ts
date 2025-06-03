import { useState, useEffect, useCallback } from 'react';
import LeaguesService from '../services/LeaguesService';
import MatchesService from '../services/MatchesService';
import TeamService from '../services/TeamsService';
import CacheService from '../services/cacheService';

// Current system information
const CURRENT_TIMESTAMP = "2025-06-01 19:45:56";
const CURRENT_USER = "Sdiabate1337";

// Hook factory with auto-refresh capability
function createDataHook<T, P extends any[]>(
  fetchFn: (...args: P) => Promise<T>,
  defaultRefreshInterval?: number
) {
  return (...args: P) => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<any>(null);
    const [refreshInterval, setRefreshInterval] = useState<number | null>(defaultRefreshInterval || null);

    // Fetch function that can be called manually
    const fetchData = useCallback(async () => {
      try {
        setLoading(true);
        const result = await fetchFn(...args);
        setData(result);
        setError(null);
      } catch (err) {
        console.error(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Hook error:`, err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }, [fetchFn, ...args]);

    // Initial fetch and refresh setup
    useEffect(() => {
      let isMounted = true;
      let intervalId: NodeJS.Timeout | null = null;
      
      const doFetch = async () => {
        try {
          if (!isMounted) return;
          setLoading(true);
          const result = await fetchFn(...args);
          if (isMounted) {
            setData(result);
            setError(null);
          }
        } catch (err) {
          if (isMounted) {
            console.error(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Hook error:`, err);
            setError(err);
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };
      
      // Initial fetch
      doFetch();
      
      // Set up refresh interval if needed
      if (refreshInterval) {
        intervalId = setInterval(doFetch, refreshInterval * 1000);
      }
      
      // Cleanup
      return () => {
        isMounted = false;
        if (intervalId) clearInterval(intervalId);
      };
    }, [fetchData, refreshInterval, ...args]);

    // Function to change refresh interval
    const setRefresh = useCallback((seconds: number | null) => {
      setRefreshInterval(seconds);
    }, []);

    return {
      data,
      loading,
      error,
      refetch: fetchData,
      setRefreshInterval: setRefresh
    };
  };
}

// Specific hooks
export const useCompetitions = createDataHook(
  (country?: string) => LeaguesService.getCompetitions(country)
);

export const useStandings = createDataHook(
  (leagueId: string, season: number = 2023) => LeaguesService.getStandings(leagueId, season)
);

// Live matches with auto-refresh
export const useLiveMatches = createDataHook(
  (leagueId?: string) => MatchesService.getLiveMatches(leagueId),
  60 // Auto-refresh every 60 seconds
);

export const useUpcomingMatches = createDataHook(
  (days: number = 7, leagueId?: string) => MatchesService.getUpcomingMatches(days, leagueId)
);

export const useMatchDetails = (matchId: string) => {
  const result = createDataHook(
    (id: string) => MatchesService.getMatchDetails(id)
  )(matchId);
  
  // Dynamically set refresh interval based on match status
  useEffect(() => {
    if (result.data) {
      const isLive = result.data.status === 'live';
      result.setRefreshInterval(isLive ? 30 : null); // Refresh every 30 seconds for live matches
    }
  }, [result.data]);
  
  return result;
};

export const useTeamInfo = createDataHook(
  (teamId: string) => TeamService.getTeam(teamId)
);

export const useTeamPlayers = createDataHook(
  (teamId: string, season: number = 2023) => TeamService.getTeamPlayers(teamId, season)
);

// Utility function to prefetch common data on app startup
export function prefetchCommonData() {
  console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Prefetching common football data`);
  
  // Prefetch popular leagues
  LeaguesService.getCompetitions();
  
  // Top 5 European leagues
  const topLeagueIds = ['39', '140', '135', '78', '61']; // Premier League, La Liga, Serie A, Bundesliga, Ligue 1
  
  // Prefetch today's matches
  const today = new Date().toISOString().split('T')[0];
  MatchesService.getMatchesByDate(today);
}