import React, { createContext, useContext, useState, ReactNode } from 'react';

// Match interface
interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  status: string;
  score?: {
    home: number;
    away: number;
  };
}

interface MatchDataContextType {
  matches: Match[];
  loading: boolean;
  error: Error | null;
  refreshMatches: () => Promise<void>;
}

interface MatchDataProviderProps {
  children: ReactNode;
  initialState?: {
    matches: Match[];
    loading: boolean;
    error?: Error | null;
  };
}

// Create the context
const MatchDataContext = createContext<MatchDataContextType | undefined>(undefined);

export function MatchDataProvider({ children, initialState }: MatchDataProviderProps) {
  const [matches, setMatches] = useState<Match[]>(initialState?.matches || []);
  const [loading, setLoading] = useState(initialState?.loading || false);
  const [error, setError] = useState<Error | null>(initialState?.error || null);

  const refreshMatches = async () => {
    setLoading(true);
    try {
      // In a real app, this would fetch from an API
      const response = await fetch('/api/matches');
      if (!response.ok) throw new Error('Failed to fetch matches');
      const data = await response.json();
      setMatches(data.matches);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <MatchDataContext.Provider value={{ matches, loading, error, refreshMatches }}>
      {children}
    </MatchDataContext.Provider>
  );
}

export function useMatchData() {
  const context = useContext(MatchDataContext);
  if (context === undefined) {
    throw new Error('useMatchData must be used within a MatchDataProvider');
  }
  return context;
}

// Make sure there's a default export or named exports
export default MatchDataContext;