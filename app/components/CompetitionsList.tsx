import React, { useState, useEffect } from 'react';
import { useCompetitions } from '../../lib/hooks/useFootBall';
import { useFootballData } from '../../lib/providers/FootballDataProvider';

// Current system information
const CURRENT_TIMESTAMP = "2025-06-01 20:26:31";
const CURRENT_USER = "Sdiabate1337";

const CompetitionsList: React.FC = () => {
  // Get competitions with our enhanced hook
  const { data: competitions, loading, error, refetch } = useCompetitions('Europe');
  const { lastUpdated, isMatchHours } = useFootballData();
  const [filter, setFilter] = useState<string>('');

  // Log component render
  useEffect(() => {
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} - Competitions component rendered`);
  }, []);

  // Filter competitions based on search input
  const filteredCompetitions = competitions?.filter(competition => 
    competition.name.toLowerCase().includes(filter.toLowerCase()) ||
    (competition.code && competition.code.toLowerCase().includes(filter.toLowerCase())) ||
    competition.country.toLowerCase().includes(filter.toLowerCase())
  ) || [];

  if (loading && !competitions) {
    return (
      <div className="competitions-loading">
        <div className="loading-spinner"></div>
        <p>Loading competitions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="competitions-error">
        <h3>Error loading competitions</h3>
        <p>{error.message}</p>
        <button onClick={refetch}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="competitions-container">
      <div className="competitions-header">
        <h2>Available Competitions {isMatchHours && '🔴'}</h2>
        <div className="competitions-actions">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search competitions..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="search-input"
            />
          </div>
          <button onClick={refetch} className="refresh-button">
            Refresh
          </button>
        </div>
        <p className="last-updated">Last updated: {lastUpdated}</p>
      </div>

      {filteredCompetitions.length === 0 ? (
        <div className="no-competitions">
          <p>No competitions found matching your search.</p>
        </div>
      ) : (
        <div className="competitions-grid">
          {filteredCompetitions.map(competition => (
            <div key={competition.id} className="competition-card">
              <div className="competition-logo">
                {competition.emblem ? (
                  <img 
                    src={competition.emblem} 
                    alt={`${competition.name} logo`} 
                    loading="lazy"
                  />
                ) : (
                  <div className="placeholder-logo">{competition.name.charAt(0)}</div>
                )}
              </div>
              <div className="competition-info">
                <h3>{competition.name}</h3>
                <div className="competition-meta">
                  {competition.code && <span className="competition-code">{competition.code}</span>}
                  <span className="competition-country">{competition.country}</span>
                </div>
                {competition.currentSeason && (
                  <div className="season-info">
                    <span>Season {competition.currentSeason.id}</span>
                    {competition.currentSeason.currentMatchday && (
                      <span>Matchday: {competition.currentSeason.currentMatchday}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .competitions-container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .competitions-header {
          margin-bottom: 20px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 15px;
        }
        
        .competitions-header h2 {
          margin-top: 0;
          margin-bottom: 10px;
          color: #1f2937;
          display: flex;
          align-items: center;
        }
        
        .competitions-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .search-container {
          flex-grow: 1;
          margin-right: 10px;
        }
        
        .search-input {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          width: 100%;
          font-size: 14px;
        }
        
        .refresh-button {
          padding: 8px 16px;
          background-color: #0366d6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .refresh-button:hover {
          background-color: #0254b5;
        }
        
        .last-updated {
          margin: 5px 0 0;
          font-size: 12px;
          color: #6b7280;
        }
        
        .competitions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        
        .competition-card {
          display: flex;
          align-items: center;
          padding: 15px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          transition: all 0.2s ease;
          background-color: white;
        }
        
        .competition-card:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border-color: #d1d5db;
        }
        
        .competition-logo {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
          flex-shrink: 0;
        }
        
        .competition-logo img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        
        .placeholder-logo {
          width: 100%;
          height: 100%;
          background-color: #f3f4f6;
          color: #4b5563;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
          border-radius: 50%;
        }
        
        .competition-info {
          flex-grow: 1;
        }
        
        .competition-info h3 {
          margin: 0 0 5px;
          font-size: 16px;
          color: #1f2937;
        }
        
        .competition-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .competition-code {
          font-size: 12px;
          background-color: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
          color: #374151;
        }
        
        .competition-country {
          font-size: 12px;
          color: #6b7280;
        }
        
        .season-info {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 12px;
          color: #6b7280;
        }
        
        .no-competitions {
          text-align: center;
          padding: 40px 0;
          color: #6b7280;
        }
        
        .competitions-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 0;
        }
        
        .loading-spinner {
          border: 4px solid #f3f4f6;
          border-top: 4px solid #0366d6;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin-bottom: 15px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .competitions-error {
          text-align: center;
          padding: 30px;
          color: #b91c1c;
          background-color: #fee2e2;
          border-radius: 8px;
          margin: 20px 0;
        }
        
        .competitions-error button {
          padding: 8px 16px;
          background-color: #b91c1c;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 10px;
        }
        
        @media (max-width: 768px) {
          .competitions-actions {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }
          
          .search-container {
            margin-right: 0;
            margin-bottom: 10px;
          }
          
          .competitions-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default CompetitionsList;