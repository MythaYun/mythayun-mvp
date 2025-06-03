import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { prefetchCommonData } from '../hooks/useFootBall';
import CacheService from '../services/cacheService';

// Current system information
const CURRENT_TIMESTAMP = "2025-06-01 19:45:56";
const CURRENT_USER = "Sdiabate1337";

// Context setup
interface FootballContextType {
  prefetchData: () => void;
  clearCache: (pattern?: string) => void;
  lastUpdated: string;
  isMatchHours: boolean;
}

const FootballContext = createContext<FootballContextType>({
  prefetchData: () => {},
  clearCache: () => {},
  lastUpdated: CURRENT_TIMESTAMP,
  isMatchHours: false
});

// Provider component
export const FootballDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lastUpdated, setLastUpdated] = useState<string>(CURRENT_TIMESTAMP);
  const [isMatchHours, setIsMatchHours] = useState<boolean>(CacheService.isMatchHours());
  
  // Prefetch data on initial mount
  useEffect(() => {
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Football Data Provider initialized`);
    
    const fetchData = () => {
      prefetchCommonData();
      setLastUpdated(new Date().toISOString().replace('T', ' ').substring(0, 19));
      setIsMatchHours(CacheService.isMatchHours());
    };
    
    fetchData();
    
    // Set up online/offline listener
    const handleOnline = () => {
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - App is back online, refreshing data`);
      fetchData();
    };
    
    // Check match hours periodically
    const matchHoursInterval = setInterval(() => {
      const current = CacheService.isMatchHours();
      if (current !== isMatchHours) {
        setIsMatchHours(current);
        console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Match hours status changed to: ${current}`);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(matchHoursInterval);
    };
  }, []);
  
  // Cache clearing function
  const clearCache = useCallback((pattern?: string) => {
    if (pattern) {
      CacheService.invalidatePattern(pattern);
    } else {
      CacheService.clear();
    }
    setLastUpdated(new Date().toISOString().replace('T', ' ').substring(0, 19));
  }, []);
  
  // Context value
  const value = {
    prefetchData: () => {
      prefetchCommonData();
      setLastUpdated(new Date().toISOString().replace('T', ' ').substring(0, 19));
    },
    clearCache,
    lastUpdated,
    isMatchHours
  };
  
  return (
    <FootballContext.Provider value={value}>
      {children}
    </FootballContext.Provider>
  );
};

// Hook to use the context
export const useFootballData = () => useContext(FootballContext);