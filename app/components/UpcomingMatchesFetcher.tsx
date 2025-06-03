'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useUpcomingMatches } from '../../lib/hooks/useFootBall';
import { useFootballData } from '../../lib/providers/FootballDataProvider';
import { FootballMatch as ServiceFootballMatch } from '../../lib/services/MatchesService';

// Current system information
const CURRENT_TIMESTAMP = "2025-06-01 20:37:41";
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
      long: typeof match.status === 'string' 
        ? match.status 
        : (typeof match.status === 'object' && match.status !== null && 'long' in match.status && typeof (match.status as any).long === 'string'
            ? (match.status as any).long
            : (match.status === 'upcoming' ? 'Not Started' : 
               match.status === 'live' ? 'In Play' : 
               match.status === 'finished' ? 'Finished' : 'Unknown')),
      short: typeof match.status === 'string' 
        ? match.status.substring(0, 2).toUpperCase() 
        : (typeof match.status === 'object' && match.status !== null && 'short' in match.status && typeof (match.status as any).short === 'string'
            ? (match.status as any).short
            : (match.status === 'upcoming' ? 'NS' : 
               match.status === 'live' ? 'LIVE' : 
               match.status === 'finished' ? 'FT' : 'UNK')),
      elapsed: typeof match.status === 'object' && match.status !== null && 'elapsed' in match.status && typeof (match.status as any).elapsed === 'number'
        ? (match.status as any).elapsed
        : null
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
  
  // Adapt service matches to component matches
  const matches = useMemo(() => {
    if (!serviceMatches) return [];
    return serviceMatches.map(adaptMatch);
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
    
    return {
      matchesByDate: matchesGrouped,
      dates: sortedDates,
      loadedDays: sortedDates.length,
      totalMatches: matches.length
    };
  }, [matches, maxMatchesPerDay]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
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
      } else {
        setSelectedDate(dates[0]);
      }
    }
  }, [dates, selectedDate]);

  // Get today's date in YYYY-MM-DD format
  const today = formatDate(new Date());

  return (
    <div className="upcoming-matches-fetcher">
      {/* Rest of the component remains the same */}
      {/* ... */}
    </div>
  );
}