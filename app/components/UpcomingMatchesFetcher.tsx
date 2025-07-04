'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useUpcomingMatches } from '../../lib/hooks/useFootBall';
import { useFootballData } from '../../lib/providers/FootballDataProvider';
import { FootballMatch as ServiceFootballMatch } from '../../lib/services/MatchesService';

// Current system information
const CURRENT_TIMESTAMP = "2025-07-04 15:06:17";
const CURRENT_USER = "Sdiabate1337";

// Define types for the component's match data (extends the service type with additional fields)
interface Team {
  id: string | number;
  name: string;
  logo: string;
}

interface League {
  id: string | number;
  name: string;
  logo: string;
  country: string;
  flag?: string;
}

interface Score {
  home: number | null;
  away: number | null;
}

interface MatchStatus {
  long: string;
  short: string;
  elapsed?: number | null;
}

interface FootballMatch {
  id: string | number;
  date: string;
  time: string;
  timestamp: number;
  status: MatchStatus;
  league: League;
  homeTeam: Team;
  awayTeam: Team;
  score: Score;
  venue: string;
  referee?: string;
}

interface UpcomingMatchesFetcherProps {
  leagueId?: string;
  daysPeriod?: number;
  maxMatchesPerDay?: number;
}

// Helper function to safely check if an object has a property
function hasProperty<T extends Record<string, any>, K extends string>(
  obj: T,
  prop: K
): obj is T & Record<K, any> {
  return obj != null && typeof obj === 'object' && prop in obj;
}

// Helper function to safely get elapsed time from status
function getElapsedTime(status: any): number | null {
  if (typeof status === 'object' && status !== null) {
    if (hasProperty(status, 'elapsed') && typeof status.elapsed === 'number') {
      return status.elapsed;
    }
  }
  return null;
}

// Helper function to safely get status string values
function getStatusString(status: any, field: 'long' | 'short'): string {
  if (typeof status === 'string') {
    return field === 'short' ? status.substring(0, 2).toUpperCase() : status;
  }
  
  if (typeof status === 'object' && status !== null) {
    if (hasProperty(status, field) && typeof status[field] === 'string') {
      return status[field];
    }
  }
  
  // Fallback based on status type
  if (status === 'upcoming') {
    return field === 'short' ? 'NS' : 'Not Started';
  } else if (status === 'live') {
    return field === 'short' ? 'LIVE' : 'In Play';
  } else if (status === 'finished') {
    return field === 'short' ? 'FT' : 'Finished';
  }
  
  return field === 'short' ? 'UNK' : 'Unknown';
}

// Adapter function to convert service match type to component match type
function adaptMatch(match: ServiceFootballMatch): FootballMatch {
  // Calculate timestamp from date and time
  const dateTime = new Date(`${match.date}T${match.time}`);
  const timestamp = Math.floor(dateTime.getTime() / 1000);
  
  return {
    id: match.id,
    date: match.date,
    time: match.time,
    timestamp: timestamp,
    status: {
      long: getStatusString(match.status, 'long'),
      short: getStatusString(match.status, 'short'),
      elapsed: getElapsedTime(match.status)
    },
    league: {
      id: match.league.id,
      name: match.league.name,
      logo: match.league.logo,
      country: match.league.country,
      flag: match.league.flag
    },
    homeTeam: {
      id: match.homeTeam.id,
      name: match.homeTeam.name,
      logo: match.homeTeam.logo
    },
    awayTeam: {
      id: match.awayTeam.id,
      name: match.awayTeam.name,
      logo: match.awayTeam.logo
    },
    score: {
      home: match.score.home,
      away: match.score.away
    },
    venue: match.venue || 'TBD',
    referee: match.referee
  };
}

export default function UpcomingMatchesFetcher({
  leagueId = 'all',
  daysPeriod = 30,
  maxMatchesPerDay = 10
}: UpcomingMatchesFetcherProps) {
  // Use our enhanced hook with caching capabilities
  const { data: serviceMatches, loading, error, refetch } = useUpcomingMatches(daysPeriod, leagueId);
  const { lastUpdated, isMatchHours } = useFootballData();
  
  // Component state
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  // Adapt service matches to component matches with error handling
  const matches = useMemo(() => {
    if (!serviceMatches || !Array.isArray(serviceMatches)) {
      console.warn(`[${CURRENT_TIMESTAMP}] No service matches available or invalid data format`);
      return [];
    }
    
    try {
      return serviceMatches.map(adaptMatch);
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Error adapting matches:`, error);
      return [];
    }
  }, [serviceMatches]);
  
  // Format date for display (YYYY-MM-DD)
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Get elapsed time display
  const getElapsedDisplay = (status: MatchStatus): string => {
    if (status.short === 'NS') return 'Not Started';
    if (status.short === 'FT') return 'Full Time';
    if (status.short === 'HT') return 'Half Time';
    if (status.short === '1H' || status.short === '2H') {
      return `${status.elapsed || 0}'`;
    }
    return status.long;
  };

  // Process and group matches by date
  const { matchesByDate, dates, loadedDays, totalMatches } = useMemo(() => {
    if (!matches || matches.length === 0) {
      return { matchesByDate: {}, dates: [], loadedDays: 0, totalMatches: 0 };
    }
    
    // Group matches by date
    const matchesGrouped: Record<string, FootballMatch[]> = {};
    matches.forEach(match => {
      if (!matchesGrouped[match.date]) {
        matchesGrouped[match.date] = [];
      }
      
      // Apply max matches per day limit if specified
      if (maxMatchesPerDay <= 0 || matchesGrouped[match.date].length < maxMatchesPerDay) {
        matchesGrouped[match.date].push(match);
      }
    });
    
    // Get sorted dates
    const sortedDates = Object.keys(matchesGrouped).sort();
    
    console.log(`[${CURRENT_TIMESTAMP}] Processed ${matches.length} matches across ${sortedDates.length} days`);
    
    return {
      matchesByDate: matchesGrouped,
      dates: sortedDates,
      loadedDays: sortedDates.length,
      totalMatches: matches.length
    };
  }, [matches, maxMatchesPerDay]);

  // Handle manual refresh
  const handleRefresh = async () => {
    console.log(`[${CURRENT_TIMESTAMP}] Manual refresh initiated by ${CURRENT_USER}`);
    setIsRefreshing(true);
    try {
      await refetch();
      console.log(`[${CURRENT_TIMESTAMP}] Manual refresh completed successfully`);
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] Manual refresh failed:`, error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Set initial selected date when data loads
  useEffect(() => {
    if (dates.length > 0 && !selectedDate) {
      // Get today's date
      const today = formatDate(new Date());
      
      // Set today as the selected date if available, otherwise first date
      if (dates.includes(today)) {
        setSelectedDate(today);
        console.log(`[${CURRENT_TIMESTAMP}] Selected today's date: ${today}`);
      } else {
        setSelectedDate(dates[0]);
        console.log(`[${CURRENT_TIMESTAMP}] Selected first available date: ${dates[0]}`);
      }
    }
  }, [dates, selectedDate]);

  // Get today's date in YYYY-MM-DD format
  const today = formatDate(new Date());

  // Loading state
  if (loading && !matches.length) {
    return (
      <div className="upcoming-matches-fetcher">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading matches...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !matches.length) {
    return (
      <div className="upcoming-matches-fetcher">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-400">⚠️</div>
            <div className="ml-2">
              <h3 className="text-red-800 font-medium">Error loading matches</h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {isRefreshing ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  // No matches state
  if (!matches.length) {
    return (
      <div className="upcoming-matches-fetcher">
        <div className="text-center p-8">
          <div className="text-gray-400 text-6xl mb-4">⚽</div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No matches found</h3>
          <p className="text-gray-500 mb-4">
            No matches available for the selected criteria
          </p>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="upcoming-matches-fetcher">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Upcoming Matches</h2>
          <p className="text-gray-600 mt-1">
            {totalMatches} matches across {loadedDays} days
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Date selector */}
      {dates.length > 1 && (
        <div className="mb-6">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {dates.map(date => (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                  selectedDate === date
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${date === today ? 'ring-2 ring-blue-300' : ''}`}
              >
                {date === today ? 'Today' : new Date(date).toLocaleDateString()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Matches display */}
      <div className="space-y-4">
        {selectedDate && matchesByDate[selectedDate] ? (
          matchesByDate[selectedDate].map(match => (
            <div
              key={match.id}
              className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-500">{match.time}</div>
                    <div className="text-xs text-gray-400">
                      {getElapsedDisplay(match.status)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <img
                      src={match.homeTeam.logo}
                      alt={match.homeTeam.name}
                      className="w-8 h-8 object-contain"
                    />
                    <span className="font-medium">{match.homeTeam.name}</span>
                  </div>
                  <div className="text-lg font-bold">
                    {match.score.home ?? '-'} : {match.score.away ?? '-'}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-medium">{match.awayTeam.name}</span>
                    <img
                      src={match.awayTeam.logo}
                      alt={match.awayTeam.name}
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">{match.league.name}</div>
                  <div className="text-xs text-gray-500">{match.venue}</div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No matches available for the selected date</p>
          </div>
        )}
      </div>
    </div>
  );
}