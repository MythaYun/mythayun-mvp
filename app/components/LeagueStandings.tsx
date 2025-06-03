import React, { useState, useCallback } from 'react';
import { useStandings } from '../../lib/hooks/useFootBall';
import { useFootballData } from '../../lib/providers/FootballDataProvider';

// Current system information
const CURRENT_TIMESTAMP = "2025-06-01 20:46:03";
const CURRENT_USER = "Sdiabate1337";

interface LeagueStandingsProps {
  competitionCode: string;
}

// Define a type for the normalized team standings
interface NormalizedTeamStanding {
  team: {
    id: string | number;
    name: string;
    logo: string;
  };
  rank: number;
  position?: number;
  goalsDiff: number;
  goalDifference?: number;
  points: number;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  description?: string;
  form: string;
  stats?: Record<string, any>;
  playedGames?: number;
  won?: number;
  draw?: number;
  lost?: number;
  goalsFor?: number;
  goalsAgainst?: number;
}

// Helper function to safely access nested properties
const getNestedValue = <T,>(obj: any, path: string, defaultValue: T): T => {
  const keys = path.split('.');
  let value = obj;
  
  for (const key of keys) {
    if (value === undefined || value === null) return defaultValue;
    value = value[key];
  }
  
  return (value !== undefined && value !== null) ? value as T : defaultValue;
};

const LeagueStandings: React.FC<LeagueStandingsProps> = ({ competitionCode }) => {
  // Get the current football season based on timestamp
  const getCurrentSeason = useCallback(() => {
    // Parse the timestamp (2025-06-01)
    const year = parseInt(CURRENT_TIMESTAMP.split(' ')[0].split('-')[0], 10);
    const month = parseInt(CURRENT_TIMESTAMP.split(' ')[0].split('-')[1], 10);
    
    // For a 2025 timestamp in June, we should use the 2024/2025 season
    // Football seasons typically run from August to May
    return month >= 6 && month <= 7 ? year - 1 : month >= 8 ? year : year - 1;
  }, []);
  
  // Calculate current season
  const [season] = useState<number>(getCurrentSeason());
  
  // Use our enhanced hook that handles caching
  const { data: standingsData, loading, error, refetch } = useStandings(competitionCode, season);
  const { lastUpdated, isMatchHours } = useFootballData();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // Normalize the standings data to handle different API formats
  const standings = React.useMemo((): NormalizedTeamStanding[] => {
    if (!standingsData) return [];
    
    // Extract standings - handle both array of arrays and direct array
    let rawStandings = Array.isArray(standingsData) ? 
      (Array.isArray(standingsData[0]) ? standingsData[0] : standingsData) : 
      [];
    
    // Normalize the standings to ensure consistent structure
    return rawStandings.map((team: any): NormalizedTeamStanding => {
      // Determine if we have API-Football format or another format
      const hasAllStats = team.all && typeof team.all === 'object';
      const hasStats = team.stats && typeof team.stats === 'object';
      
      return {
        ...team,
        // Ensure these properties exist with correct structure
        rank: team.rank || team.position || 0,
        goalsDiff: team.goalsDiff || team.goalDifference || 0,
        points: team.points || 0,
        // Create 'all' structure if missing
        all: hasAllStats ? team.all : {
          played: hasStats ? team.stats.played : team.playedGames || 0,
          win: hasStats ? team.stats.won : team.won || 0,
          draw: hasStats ? team.stats.draw : team.draw || 0,
          lose: hasStats ? team.stats.lost : team.lost || 0,
          goals: {
            for: hasStats ? team.stats.goalsFor : team.goalsFor || 0,
            against: hasStats ? team.stats.goalsAgainst : team.goalsAgainst || 0
          }
        },
        // Ensure form exists
        form: team.form || ''
      };
    });
  }, [standingsData]);

  // Function to fetch fresh data
  const refreshData = async (): Promise<void> => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };
  
  return (
    <div className="league-standings">
      <div className="standings-header">
        <div className="standings-title">
          <h2>
            League Standings {season && `(${season}/${season + 1})`}
            {isMatchHours && <span className="live-indicator">●</span>}
          </h2>
          <div className="last-updated">
            Last updated: {lastUpdated}
          </div>
        </div>
        <div className="standings-actions">
          <button 
            className={`refresh-button ${isRefreshing ? 'refreshing' : ''}`} 
            onClick={refreshData}
            disabled={isRefreshing || loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="16" height="16">
              <path fill="currentColor" d="M105.1 202.6c7.7-21.8 20.2-42.3 37.8-59.8c62.5-62.5 163.8-62.5 226.3 0L386.3 160H336c-17.7 0-32 14.3-32 32s14.3 32 32 32H463.5c0 0 0 0 0 0h.4c17.7 0 32-14.3 32-32V64c0-17.7-14.3-32-32-32s-32 14.3-32 32v51.2L414.4 97.6c-87.5-87.5-229.3-87.5-316.8 0C73.2 122 55.6 150.7 44.8 181.4c-5.9 16.7 2.9 34.9 19.5 40.8s34.9-2.9 40.8-19.5zM39 289.3c-5 1.5-9.8 4.2-13.7 8.2c-4 4-6.7 8.8-8.1 14c-.3 1.2-.6 2.5-.8 3.8c-.3 1.7-.4 3.4-.4 5.1V448c0 17.7 14.3 32 32 32s32-14.3 32-32V396.9l17.6 17.5 0 0c87.5 87.4 229.3 87.4 316.7 0c24.4-24.4 42.1-53.1 52.9-83.7c5.9-16.7-2.9-34.9-19.5-40.8s-34.9 2.9-40.8 19.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.5 62.5-163.8 62.5-226.3 0l-.1-.1L125.6 352H176c17.7 0 32-14.3 32-32s-14.3-32-32-32H48.4c-1.6 0-3.2 .1-4.8 .3s-3.1 .5-4.6 1z"/>
            </svg>
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="standings-loading">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading standings from API-Football...</p>
          </div>
        </div>
      ) : error ? (
        <div className="standings-error">
          <div className="error-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="48" height="48">
              <path fill="currentColor" d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"/>
            </svg>
          </div>
          <h3>Error Loading Standings</h3>
          <p>{error.message || "An unknown error occurred"}</p>
          <button onClick={refreshData}>Retry with Fresh Data</button>
        </div>
      ) : standings.length === 0 ? (
        <div className="standings-empty">
          <p>No standings data available for this competition.</p>
        </div>
      ) : (
        <div className="standings-table-container">
          <table className="standings-table">
            <thead>
              <tr>
                <th className="position-column">#</th>
                <th className="team-column">Team</th>
                <th>MP</th>
                <th>W</th>
                <th>D</th>
                <th>L</th>
                <th>GF</th>
                <th>GA</th>
                <th>GD</th>
                <th>Pts</th>
                <th>Form</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((team) => (
                <tr key={team.team.id} className={`${getPositionClass(team)}`}>
                  <td className="position-column">
                    <span className="position">{team.rank}</span>
                  </td>
                  <td className="team-column">
                    <div className="team-info">
                      <img src={team.team.logo} alt={team.team.name} className="team-logo" loading="lazy" />
                      <span className="team-name">{team.team.name}</span>
                    </div>
                  </td>
                  <td>{getNestedValue<number>(team, 'all.played', 0)}</td>
                  <td>{getNestedValue<number>(team, 'all.win', 0)}</td>
                  <td>{getNestedValue<number>(team, 'all.draw', 0)}</td>
                  <td>{getNestedValue<number>(team, 'all.lose', 0)}</td>
                  <td>{getNestedValue<number>(team, 'all.goals.for', 0)}</td>
                  <td>{getNestedValue<number>(team, 'all.goals.against', 0)}</td>
                  <td className={team.goalsDiff > 0 ? 'positive' : team.goalsDiff < 0 ? 'negative' : ''}>
                    {team.goalsDiff > 0 ? `+${team.goalsDiff}` : team.goalsDiff}
                  </td>
                  <td className="points-column">{team.points}</td>
                  <td>
                    <div className="form">
                      {team.form && team.form.split('').map((result: string, index: number) => {
                        // Handle different languages (V for Victoire, W for Win, etc.)
                        const formClass = 
                          result.toLowerCase() === 'w' || result.toLowerCase() === 'v' ? 'w' : 
                          result.toLowerCase() === 'l' || result.toLowerCase() === 'd' ? 'l' : 
                          result.toLowerCase() === 'n' || result.toLowerCase() === 'd' ? 'd' : 'd';
                        
                        return (
                          <span key={index} className={`form-indicator ${formClass}`}>
                            {result}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <style jsx>{`
        .league-standings {
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        .standings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-bottom: 1px solid #f1f5f9;
          background-color: #f8fafc;
        }
        
        .standings-title h2 {
          margin: 0;
          font-size: 18px;
          color: #1f2937;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .live-indicator {
          color: #ef4444;
          animation: pulse 2s infinite;
          font-size: 12px;
        }
        
        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
        
        .last-updated {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }
        
        .standings-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .refresh-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border: none;
          background-color: #3b82f6;
          color: white;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .refresh-button:hover:not(:disabled) {
          background-color: #2563eb;
        }
        
        .refresh-button:disabled {
          background-color: #93c5fd;
          cursor: not-allowed;
        }
        
        .refresh-button.refreshing svg {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .standings-table-container {
          overflow-x: auto;
        }
        
        .standings-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        
        .standings-table th, .standings-table td {
          padding: 12px 16px;
          text-align: center;
          border-bottom: 1px solid #f1f5f9;
        }
        
        .standings-table th {
          background-color: #f8fafc;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 0.5px;
        }
        
        .standings-table tr:hover {
          background-color: #f8fafc;
        }
        
        .position-column {
          width: 50px;
        }
        
        .position {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 4px;
          font-weight: 600;
        }
        
        .team-column {
          text-align: left;
          min-width: 200px;
        }
        
        .team-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .team-logo {
          width: 24px;
          height: 24px;
          object-fit: contain;
        }
        
        .team-name {
          font-weight: 500;
        }
        
        .points-column {
          font-weight: 700;
        }
        
        .positive {
          color: #22c55e;
        }
        
        .negative {
          color: #ef4444;
        }
        
        .form {
          display: flex;
          gap: 4px;
          justify-content: center;
        }
        
        .form-indicator {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          font-size: 12px;
          font-weight: 600;
        }
        
        .form-indicator.w {
          background-color: #22c55e;
          color: white;
        }
        
        .form-indicator.l {
          background-color: #ef4444;
          color: white;
        }
        
        .form-indicator.d {
          background-color: #f59e0b;
          color: white;
        }
        
        /* Position highlighting */
        .champions-league {
          border-left: 4px solid #22c55e;
        }
        
        .europa-league {
          border-left: 4px solid #3b82f6;
        }
        
        .conference-league {
          border-left: 4px solid #8b5cf6;
        }
        
        .relegation {
          border-left: 4px solid #ef4444;
        }
        
        /* Loading & Error states */
        .standings-loading,
        .standings-error,
        .standings-empty {
          padding: 48px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #6b7280;
        }
        
        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(59, 130, 246, 0.2);
          border-radius: 50%;
          border-left-color: #3b82f6;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        .error-icon {
          color: #ef4444;
          margin-bottom: 16px;
        }
        
        .standings-error h3 {
          color: #1f2937;
          margin: 0 0 8px;
        }
        
        .standings-error button {
          margin-top: 16px;
          padding: 8px 16px;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
        }
        
        .standings-error button:hover {
          background-color: #2563eb;
        }
        
        @media (max-width: 768px) {
          .standings-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          
          .standings-actions {
            width: 100%;
          }
          
          .refresh-button {
            width: 100%;
          }
          
          .standings-table th, .standings-table td {
            padding: 8px 6px;
            font-size: 12px;
          }
          
          .team-info {
            gap: 6px;
          }
          
          .team-name {
            max-width: 80px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      `}</style>
    </div>
  );
};

// Helper function to determine position class
function getPositionClass(team: NormalizedTeamStanding): string {
  const rank = team.rank;
  const description = (team.description || '').toLowerCase();
  
  if (description.includes('champions league') || rank <= 4) {
    return 'champions-league';
  } else if (description.includes('europa league') || rank === 5 || rank === 6) {
    return 'europa-league';
  } else if (description.includes('conference') || rank === 7) {
    return 'conference-league';
  } else if (description.includes('relegation') || rank >= 18) {
    return 'relegation';
  }
  
  return '';
}

export default LeagueStandings;