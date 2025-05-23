import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import MatchesService, { FootballMatch, MatchListResponse } from '@/lib/services/MatchesService';

// Current system information - updated
const CURRENT_TIMESTAMP = "2025-05-21 16:15:34"; 
const CURRENT_USER = "Sdiabate1337";

interface UseMatchesOptions {
  live?: boolean;
  upcoming?: boolean;
  days?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useMatches(options: UseMatchesOptions = {}) {
  const { user } = useAuth();
  const [matches, setMatches] = useState<FootballMatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Store the favorites and options in refs to prevent unnecessary re-renders
  const favoritesRef = useRef<string[]>([]);
  const optionsRef = useRef(options);
  
  // Update refs when dependencies change
  useEffect(() => {
    favoritesRef.current = user?.preferences?.favoriteMatches || [];
  }, [user?.preferences?.favoriteMatches]);
  
  // Default options
  const {
    live = false,
    upcoming = false,
    days = 7,
    autoRefresh = true,
    refreshInterval = live ? 60000 : 300000 // 1 minute for live, 5 minutes for others
  } = options;
  
  // Update options ref when they change
  useEffect(() => {
    optionsRef.current = { 
      live, 
      upcoming, 
      days, 
      autoRefresh, 
      refreshInterval 
    };
  }, [live, upcoming, days, autoRefresh, refreshInterval]);
  
  // Define fetchData with no dependencies to make it stable
  const fetchData = useCallback(async () => {
    if (!loading) setLoading(true);
    
    try {
      let matchesData: MatchListResponse = { matches: [], total: 0 };
      
      // Track attempts and connection issues
      let attemptCount = 0;
      const maxAttempts = 3;
      
      const attemptFetch = async (): Promise<MatchListResponse> => {
        try {
          attemptCount++;
          
          // Access options via the ref
          const currentOptions = optionsRef.current;
          const favorites = favoritesRef.current;
          
          if (currentOptions.live) {
            return await MatchesService.getLiveMatches(favorites);
          } else if (currentOptions.upcoming) {
            return await MatchesService.getUpcomingMatches(
              currentOptions.days || 7, 
              favorites
            );
          } else {
            return await MatchesService.getTodayMatches(favorites);
          }
        } catch (error: any) {
          console.error(`[${CURRENT_TIMESTAMP}] Attempt ${attemptCount} failed:`, error);
          
          // If it's a network error and we haven't exceeded max attempts, try again
          if (attemptCount < maxAttempts && 
              (error.message?.includes('Network error') || 
               error.message?.includes('Failed to fetch'))) {
            console.log(`[${CURRENT_TIMESTAMP}] Retrying fetch, attempt ${attemptCount + 1}/${maxAttempts}`);
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * attemptCount));
            return attemptFetch();
          }
          
          throw error;
        }
      };
      
      matchesData = await attemptFetch();
      
      setMatches(matchesData.matches);
      setLastUpdated(new Date());
      setError(null); // Only clear error on success
    } catch (error: any) {
      console.error(`[${CURRENT_TIMESTAMP}] Error in useMatches hook:`, error);
      
      let errorMessage = 'Failed to load matches. Please try again later.';
      
      // Provide more helpful error messages based on error type
      if (error.message?.includes('API key')) {
        errorMessage = 'API configuration error. Please check your API key settings.';
      } else if (error.message?.includes('rate limit')) {
        errorMessage = 'API usage limit reached. Please try again in a few minutes.';
      } else if (error.message?.includes('Network error') || error.message?.includes('Failed to fetch')) {
        errorMessage = 'Network connection issue. Please check your internet connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array makes fetchData stable
  
  // Initial data fetch - runs only once when component mounts
  useEffect(() => {
    fetchData();
  }, []); // Empty dependency array, only run on mount
  
  // Auto-refresh on interval
  useEffect(() => {
    if (!autoRefresh) return;
    
    const intervalId = setInterval(() => {
      console.log(`[${CURRENT_TIMESTAMP}] Auto-refreshing matches data...`);
      fetchData();
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval]); // Removed fetchData from dependencies
  
  // Refresh function for manual refreshes
  const refreshData = useCallback(() => {
    setLoading(true);
    return fetchData();
  }, [fetchData]);
  
  return { matches, loading, error, lastUpdated, refreshData };
}

// Additional hooks for other endpoints (leagues, teams, etc.)
export function useLeagues() {
  // Similar implementation for leagues
  const { user } = useAuth();
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Implement with the same pattern as useMatches
  
  return { leagues, loading, error };
}

export function useTeams() {
  // Similar implementation for teams
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Implement with the same pattern as useMatches
  
  return { teams, loading, error };
}