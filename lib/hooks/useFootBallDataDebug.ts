import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import MatchesService, { FootballMatch, MatchListResponse } from '@/lib/services/MatchesService';
import { mockMatches } from '../mocks/mockMatches';

// Updated timestamp to current
const CURRENT_TIMESTAMP = "2025-05-22 00:50:44"; 
const CURRENT_USER = "Sdiabate1337";

// Configuration for debug mode
const DEBUG = {
  ENABLED: true, // Set to true to enable debug features
  USE_MOCK_DATA: true, // Use mock data instead of API
  LOG_API_CALLS: true, // Log all API calls
  BYPASS_CACHE: false // Bypass the cache for testing
};

interface UseMatchesOptions {
  live?: boolean;
  upcoming?: boolean;
  days?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  useMockData?: boolean; // Override the global setting
}

export function useMatchesDebug(options: UseMatchesOptions = {}) {
  const { user } = useAuth();
  const [matches, setMatches] = useState<FootballMatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  
  // Store the favorites and options in refs to prevent unnecessary re-renders
  const favoritesRef = useRef<string[]>([]);
  const optionsRef = useRef(options);
  
  // Use mock data if specified in options or global setting
  const useMockData = options.useMockData !== undefined 
    ? options.useMockData 
    : DEBUG.USE_MOCK_DATA;
  
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
      refreshInterval,
      useMockData
    };
  }, [live, upcoming, days, autoRefresh, refreshInterval, useMockData]);
  
  // Define fetchData with no dependencies to make it stable
  const fetchData = useCallback(async () => {
    if (!loading) setLoading(true);
    
    try {
      // If using mock data, return it instead of making API calls
      if (useMockData) {
        console.log(`[${CURRENT_TIMESTAMP}] Using mock match data for testing`);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Return mock data
        const mockResponse: MatchListResponse = {
          matches: mockMatches,
          total: mockMatches.length
        };
        
        setMatches(mockResponse.matches);
        setLastUpdated(new Date());
        setError(null);
        setApiResponse(mockResponse);
        
        return;
      }
      
      console.log(`[${CURRENT_TIMESTAMP}] Fetching matches with options:`, {
        live: optionsRef.current.live,
        upcoming: optionsRef.current.upcoming,
        days: optionsRef.current.days,
        bypassCache: DEBUG.BYPASS_CACHE
      });
      
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
          
          // Enhanced error logging
          if (error.response) {
            console.error(`API Response Error: Status ${error.response.status}`, error.response.data);
          }
          
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
      
      // Save API response for debugging
      setApiResponse(matchesData);
      
      console.log(`[${CURRENT_TIMESTAMP}] API returned ${matchesData.total} matches:`, 
        matchesData.matches.length > 0 ? matchesData.matches[0] : 'No matches');
      
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
      } else if (error.response && error.response.status === 403) {
        errorMessage = 'API authentication failed. Invalid API key or insufficient permissions.';
      } else if (error.response && error.response.status === 429) {
        errorMessage = 'API rate limit exceeded. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setApiResponse(error.response?.data || error);
    } finally {
      setLoading(false);
    }
  }, [useMockData]); 
  
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
  }, [autoRefresh, refreshInterval, fetchData]);
  
  // Refresh function for manual refreshes
  const refreshData = useCallback(() => {
    setLoading(true);
    return fetchData();
  }, [fetchData]);
  
  // Debug functions
  const debugInfo = {
    toggleMockData: () => {
      optionsRef.current = { ...optionsRef.current, useMockData: !useMockData };
      refreshData();
    },
    apiResponse,
    clearCache: () => {
      MatchesService.clearAllMatchesCache();
      refreshData();
    }
  };
  
  return { matches, loading, error, lastUpdated, refreshData, debugInfo };
}