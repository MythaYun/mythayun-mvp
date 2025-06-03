import { useState, useEffect } from 'react';
import footballDataApiClient from '../api/footballApiClient';
import { Competition, Standing, Match } from '../types/football';

// Hook for getting competitions
export function useCompetitions(params?: { areas?: string }) {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchCompetitions() {
      try {
        setLoading(true);
        const { data } = await footballDataApiClient.getCompetitions(params);
        setCompetitions(data.competitions || []);
        setError(null);
      } catch (err) {
        setError(footballDataApiClient.formatError(err));
      } finally {
        setLoading(false);
      }
    }

    fetchCompetitions();
  }, [params?.areas]);

  return { competitions, loading, error };
}

// Hook for getting competition standings
export function useStandings(competitionCode: string, params?: { standingType?: 'TOTAL' | 'HOME' | 'AWAY', season?: string }) {
  const [standings, setStandings] = useState<any[]>([]);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchStandings() {
      if (!competitionCode) return;
      
      try {
        setLoading(true);
        const { data } = await footballDataApiClient.getStandings(competitionCode, params);
        setStandings(data.standings || []);
        setCompetition(data.competition || null);
        setError(null);
      } catch (err) {
        setError(footballDataApiClient.formatError(err));
      } finally {
        setLoading(false);
      }
    }

    fetchStandings();
  }, [competitionCode, params?.standingType, params?.season]);

  return { standings, competition, loading, error };
}

// Hook for getting upcoming matches
export function useUpcomingMatches(competitionCode: string, days: number = 7) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchMatches() {
      if (!competitionCode) return;
      
      try {
        setLoading(true);
        
        // Calculate date range
        const today = new Date();
        const endDate = new Date();
        endDate.setDate(today.getDate() + days);
        
        // Format dates as YYYY-MM-DD
        const dateFrom = today.toISOString().split('T')[0];
        const dateTo = endDate.toISOString().split('T')[0];
        
        const { data } = await footballDataApiClient.getMatches(competitionCode, {
          dateFrom,
          dateTo,
          status: 'SCHEDULED'
        });
        
        setMatches(data.matches || []);
        setError(null);
      } catch (err) {
        setError(footballDataApiClient.formatError(err));
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();
  }, [competitionCode, days]);

  return { matches, loading, error };
}

// Hook for getting team information
export function useTeamInfo(teamId: number) {
  const [team, setTeam] = useState<any>(null);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchTeamInfo() {
      if (!teamId) return;
      
      try {
        setLoading(true);
        
        // Get team details
        const { data: teamData } = await footballDataApiClient.getTeam(teamId);
        setTeam(teamData);
        
        // Get upcoming matches
        const today = new Date().toISOString().split('T')[0];
        const { data: matchesData } = await footballDataApiClient.getTeamMatches(teamId, {
          dateFrom: today,
          status: 'SCHEDULED',
          limit: 10
        });
        
        setUpcomingMatches(matchesData.matches || []);
        setError(null);
      } catch (err) {
        setError(footballDataApiClient.formatError(err));
      } finally {
        setLoading(false);
      }
    }

    fetchTeamInfo();
  }, [teamId]);

  return { team, upcomingMatches, loading, error };
}