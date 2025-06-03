'use client';

import React, { useState, useEffect } from 'react';
import FootballApiTest from '../components/FootballApiTest';
import CompetitionsList from '../components/CompetitionsList';
import LeagueStandings from '../components/LeagueStandings';
import UpcomingMatchesFetcher from '../components/UpcomingMatchesFetcher';
import '../../styles/football.css';
import ApiKeyChecker from '../components/ApiKeyChecker';
import apiFootballClient from '../../lib/api/footballApiClient';

// Current system information
const CURRENT_TIMESTAMP = "2025-06-01 14:23:09";
const CURRENT_USER = "Sdiabate1337";

// League interface for the fetched leagues
interface League {
  id: string;
  name: string;
  country: string;
  logo: string;
  oldCode?: string; // For compatibility
}

export default function FootballDashboard() {
  const [activeTab, setActiveTab] = useState<'home' | 'competitions' | 'standings' | 'matches' | 'test'>('home');
  const [selectedCompetition, setSelectedCompetition] = useState<string>('39'); // Default to Premier League
  const [apiProvider, setApiProvider] = useState<string>('API-Football');
  const [isApiConnected, setIsApiConnected] = useState<boolean | null>(null);
  const [allLeagues, setAllLeagues] = useState<League[]>([]);
  const [loadingLeagues, setLoadingLeagues] = useState<boolean>(true);
  const [leagueError, setLeagueError] = useState<string | null>(null);
  const [favoriteLeagues, setFavoriteLeagues] = useState<string[]>(['39', '140', '2', '78']); // Default favorites
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Legacy code mapping for popular leagues
  const legacyCodeMap: Record<string, string> = {
    '39': 'PL',     // Premier League
    '78': 'BL1',    // Bundesliga
    '135': 'SA',    // Serie A
    '140': 'PD',    // La Liga
    '61': 'FL1',    // Ligue 1
    '2': 'CL',      // Champions League
    '3': 'UCL',     // Champions League (alias)
    '45': 'FAC',    // FA Cup
    '48': 'EC',     // European Championship
    '1': 'WC',      // World Cup
  };

  // Test API connection on page load
  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} is testing API connection...`);
        const isConnected = await apiFootballClient.testConnection();
        setIsApiConnected(isConnected);
        console.log(`[${CURRENT_TIMESTAMP}] API connection test result: ${isConnected}`);
      } catch (error) {
        console.error(`[${CURRENT_TIMESTAMP}] API connection test error:`, error);
        setIsApiConnected(false);
      }
    };

    checkApiConnection();
  }, []);

  // Fetch all available leagues
  useEffect(() => {
    const fetchLeagues = async () => {
      setLoadingLeagues(true);
      setLeagueError(null);
      
      try {
        console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} is fetching all available leagues...`);
        
        const { data } = await apiFootballClient.getLeagues({ current: true });
        
        if (!data.response || !Array.isArray(data.response)) {
          throw new Error('Failed to get leagues data');
        }
        
        // Process leagues into our format
        const processedLeagues: League[] = data.response.map((league: { league: { id: { toString: () => string | number; }; name: any; logo: any; }; country: { name: any; }; }) => ({
          id: league.league.id.toString(),
          name: league.league.name,
          country: league.country.name,
          logo: league.league.logo,
          oldCode: legacyCodeMap[league.league.id.toString()] || undefined
        }));
        
        // Sort leagues by name
        processedLeagues.sort((a, b) => {
          // Sort popular leagues first (those with old codes)
          if (a.oldCode && !b.oldCode) return -1;
          if (!a.oldCode && b.oldCode) return 1;
          
          // Then sort by country and name
          if (a.country !== b.country) {
            return a.country.localeCompare(b.country);
          }
          return a.name.localeCompare(b.name);
        });
        
        console.log(`[${CURRENT_TIMESTAMP}] Fetched ${processedLeagues.length} leagues`);
        setAllLeagues(processedLeagues);
      } catch (error) {
        console.error(`[${CURRENT_TIMESTAMP}] Error fetching leagues:`, error);
        setLeagueError('Failed to load leagues data');
        
        // Set default leagues as fallback
        const defaultLeagues: League[] = [
          { id: '39', name: 'Premier League', country: 'England', logo: 'https://media.api-sports.io/football/leagues/39.png', oldCode: 'PL' },
          { id: '78', name: 'Bundesliga', country: 'Germany', logo: 'https://media.api-sports.io/football/leagues/78.png', oldCode: 'BL1' },
          { id: '135', name: 'Serie A', country: 'Italy', logo: 'https://media.api-sports.io/football/leagues/135.png', oldCode: 'SA' },
          { id: '140', name: 'La Liga', country: 'Spain', logo: 'https://media.api-sports.io/football/leagues/140.png', oldCode: 'PD' },
          { id: '61', name: 'Ligue 1', country: 'France', logo: 'https://media.api-sports.io/football/leagues/61.png', oldCode: 'FL1' },
          { id: '2', name: 'Champions League', country: 'World', logo: 'https://media.api-sports.io/football/leagues/2.png', oldCode: 'CL' }
        ];
        
        setAllLeagues(defaultLeagues);
      } finally {
        setLoadingLeagues(false);
      }
    };
    
    if (isApiConnected) {
      fetchLeagues();
    }
  }, [isApiConnected]);

  // Group leagues by country
  const leaguesByCountry = allLeagues.reduce((acc, league) => {
    if (!acc[league.country]) {
      acc[league.country] = [];
    }
    acc[league.country].push(league);
    return acc;
  }, {} as Record<string, League[]>);

  // Sort countries by name
  const sortedCountries = Object.keys(leaguesByCountry).sort();
  
  // Get favorite leagues data
  const favoriteLeaguesData = allLeagues.filter(league => favoriteLeagues.includes(league.id));
  
  // Function to toggle a league as favorite
  const toggleFavorite = (leagueId: string) => {
    if (favoriteLeagues.includes(leagueId)) {
      setFavoriteLeagues(favoriteLeagues.filter(id => id !== leagueId));
    } else {
      setFavoriteLeagues([...favoriteLeagues, leagueId]);
    }
  };
  
  // Filter leagues by search query
  const filteredLeagues = searchQuery 
    ? allLeagues.filter(league => 
        league.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        league.country.toLowerCase().includes(searchQuery.toLowerCase()))
    : allLeagues;

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Find the selected league for display
  const selectedLeagueData = allLeagues.find(league => league.id === selectedCompetition);

  return (
    <div className="football-dashboard">
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="32" height="32">
              <path fill="currentColor" d="M177.1 228.6L207.9 320h96.5l29.62-91.38L256 172.1L177.1 228.6zM255.1 0C114.6 0 .0001 114.6 .0001 256S114.6 512 256 512s255.1-114.6 255.1-255.1S397.4 0 255.1 0zM416.6 360.9l-85.4-1.297l-25.15 81.93C290.1 445.5 273.4 448 256 448s-34.09-2.523-50.09-6.438L180.8 359.6l-85.4 1.297c-18.12-27.66-29.15-60.27-30.88-95.31L137.3 233.3L97.97 142.6c20.25-25.64 46.59-45.61 76.59-58.09l60.47 75.52h42.1l60.47-75.52c30 12.48 56.34 32.44 76.59 58.09L375.7 233.3l72.78 32.4C447 300.6 435.1 333.2 416.6 360.9z"/>
            </svg>
            <span>FOOTBALL PRO</span>
          </div>
          <div className={`connection-indicator ${isApiConnected ? 'connected' : 'disconnected'}`}>
            {isApiConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={activeTab === 'home' ? 'active' : ''} 
            onClick={() => setActiveTab('home')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
              <path fill="currentColor" d="M575.8 255.5c0 18-15 32.1-32 32.1h-32l.7 160.2c0 2.7-.2 5.4-.5 8.1V472c0 22.1-17.9 40-40 40H456c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1H416 392c-22.1 0-40-17.9-40-40V448 384c0-17.7-14.3-32-32-32H256c-17.7 0-32 14.3-32 32v64 24c0 22.1-17.9 40-40 40H160 128.1c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2H104c-22.1 0-40-17.9-40-40V360c0-.9 0-1.9 .1-2.8V287.6H32c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z"/>
            </svg>
            <span>Home</span>
          </button>
          <button 
            className={activeTab === 'competitions' ? 'active' : ''} 
            onClick={() => setActiveTab('competitions')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
              <path fill="currentColor" d="M400 0H176c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8H24C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9H192c-17.7 0-32 14.3-32 32s14.3 32 32 32H384c17.7 0 32-14.3 32-32s-14.3-32-32-32H357.9C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24H446.4c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112h84.4c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6h84.4c-5.1 66.3-31.1 111.2-63 142.3z"/>
            </svg>
            <span>Competitions</span>
          </button>
          <button 
            className={activeTab === 'standings' ? 'active' : ''} 
            onClick={() => setActiveTab('standings')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
              <path fill="currentColor" d="M160 80c0-26.5 21.5-48 48-48h32c26.5 0 48 21.5 48 48v352c0 26.5-21.5 48-48 48H208c-26.5 0-48-21.5-48-48V80zM0 272c0-26.5 21.5-48 48-48H80c26.5 0 48 21.5 48 48V432c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V272zM368 96h32c26.5 0 48 21.5 48 48V432c0 26.5-21.5 48-48 48H368c-26.5 0-48-21.5-48-48V144c0-26.5 21.5-48 48-48z"/>
            </svg>
            <span>Standings</span>
          </button>
          <button 
            className={activeTab === 'matches' ? 'active' : ''} 
            onClick={() => setActiveTab('matches')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
              <path fill="currentColor" d="M353.8 54.1L330.2 6.3c-3.9-8.3-16.1-8.6-20.4 0L286.2 54.1l-52.3 7.5c-9.3 1.4-13.3 12.9-6.4 19.8l38 37-9 52.1c-1.4 9.3 8.2 16.5 16.8 12.2l46.9-24.8 46.6 24.4c8.6 4.3 18.3-2.9 16.8-12.2l-9-52.1 38-36.6c6.8-6.8 2.9-18.3-6.4-19.8l-52.3-7.5zM256 256c-17.7 0-32 14.3-32 32V480c0 17.7 14.3 32 32 32H384c17.7 0 32-14.3 32-32V288c0-17.7-14.3-32-32-32H256zM32 320c0 17.7 14.3 32 32 32H224c17.7 0 32-14.3 32-32V224 96c0-17.7-14.3-32-32-32H64c-17.7 0-32 14.3-32 32V320zM448 224v96c0 17.7 14.3 32 32 32H608c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32H480c-17.7 0-32 14.3-32 32z"/>
            </svg>
            <span>Matches</span>
          </button>
          <button 
            className={activeTab === 'test' ? 'active' : ''} 
            onClick={() => setActiveTab('test')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
              <path fill="currentColor" d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"/>
            </svg>
            <span>API Test</span>
          </button>
        </nav>
        
        <div className="sidebar-user">
          <div className="user-avatar">
            {CURRENT_USER.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <div className="user-name">{CURRENT_USER}</div>
            <div className="user-time">{CURRENT_TIMESTAMP}</div>
          </div>
        </div>
      </div>
      
      <div className="dashboard-main">
        <div className="dashboard-header">
          <div className="header-search">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="16" height="16">
              <path fill="currentColor" d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search leagues, teams, countries..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {selectedLeagueData && (activeTab === 'standings' || activeTab === 'matches') && (
            <div className="selected-league">
              <img src={selectedLeagueData.logo} alt={selectedLeagueData.name} />
              <div>
                <h3>{selectedLeagueData.name}</h3>
                <span>{selectedLeagueData.country}</span>
              </div>
            </div>
          )}
          
          <div className="api-status-badge">
            <span className="provider">{apiProvider}</span>
            <span className={`status ${isApiConnected ? 'connected' : 'disconnected'}`}>
              {isApiConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
        </div>
        
        <div className="dashboard-content">
          <div className={`tab-content ${activeTab}`}>
            {activeTab === 'home' && (
              <div className="home-dashboard">
                <div className="welcome-banner">
                  <div className="welcome-text">
                    <h1>Welcome to Football Pro</h1>
                    <p>Your professional football data platform with real-time stats, standings, and match information from across the globe.</p>
                  </div>
                  <div className="welcome-image">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="120" height="120">
                      <path fill="currentColor" d="M177.1 228.6L207.9 320h96.5l29.62-91.38L256 172.1L177.1 228.6zM255.1 0C114.6 0 .0001 114.6 .0001 256S114.6 512 256 512s255.1-114.6 255.1-255.1S397.4 0 255.1 0zM416.6 360.9l-85.4-1.297l-25.15 81.93C290.1 445.5 273.4 448 256 448s-34.09-2.523-50.09-6.438L180.8 359.6l-85.4 1.297c-18.12-27.66-29.15-60.27-30.88-95.31L137.3 233.3L97.97 142.6c20.25-25.64 46.59-45.61 76.59-58.09l60.47 75.52h42.1l60.47-75.52c30 12.48 56.34 32.44 76.59 58.09L375.7 233.3l72.78 32.4C447 300.6 435.1 333.2 416.6 360.9z"/>
                    </svg>
                  </div>
                </div>
                
                <div className="dashboard-grid">
                  <div className="dashboard-card">
                    <h3>Favorite Competitions</h3>
                    <div className="favorite-leagues">
                      {favoriteLeaguesData.length > 0 ? (
                        favoriteLeaguesData.map(league => (
                          <div key={league.id} className="favorite-league-item" onClick={() => {
                            setSelectedCompetition(league.id);
                            setActiveTab('standings');
                          }}>
                            <img src={league.logo} alt={league.name} />
                            <div>
                              <h4>{league.name}</h4>
                              <span>{league.country}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p>No favorite competitions yet. Add some from the Competitions tab.</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="dashboard-card">
                    <h3>Today's Matches</h3>
                    <div className="today-matches">
                      <UpcomingMatchesFetcher leagueId="all" />
                    </div>
                  </div>
                  
                  <div className="dashboard-card">
                    <h3>API Status</h3>
                    <ApiKeyChecker />
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'test' && (
              <div className="api-test">
                <h2>API Integration Tests</h2>
                <FootballApiTest />
              </div>
            )}
            
            {activeTab === 'competitions' && (
              <div className="competitions-tab">
                <h2>Football Competitions</h2>
                
                {loadingLeagues ? (
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading competitions...</p>
                  </div>
                ) : (
                  <>
                    <div className="search-results">
                      {searchQuery && (
                        <h3>Search Results for "{searchQuery}"</h3>
                      )}
                      
                      <div className="leagues-grid">
                        {(searchQuery ? filteredLeagues : favoriteLeaguesData).map(league => (
                          <div key={league.id} className="league-card">
                            <div className="league-card-header">
                              <img src={league.logo} alt={league.name} />
                              <button 
                                className={`favorite-toggle ${favoriteLeagues.includes(league.id) ? 'active' : ''}`}
                                onClick={() => toggleFavorite(league.id)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                                  <path fill="currentColor" d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/>
                                </svg>
                              </button>
                            </div>
                            <div className="league-card-body">
                              <h3>{league.name}</h3>
                              <span className="league-country">{league.country}</span>
                              <div className="league-card-actions">
                                <button onClick={() => {
                                  setSelectedCompetition(league.id);
                                  setActiveTab('standings');
                                }}>
                                  View Standings
                                </button>
                                <button onClick={() => {
                                  setSelectedCompetition(league.id);
                                  setActiveTab('matches');
                                }}>
                                  View Matches
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {!searchQuery && (
                      <div className="all-competitions">
                        <h3>All Competitions</h3>
                        
                        <div className="competitions-accordion">
                          {sortedCountries.map(country => (
                            <details key={country} className="country-accordion">
                              <summary>
                                <span className="country-name">{country}</span>
                                <span className="league-count">{leaguesByCountry[country].length}</span>
                              </summary>
                              <div className="country-leagues">
                                {leaguesByCountry[country].map(league => (
                                  <div key={league.id} className="league-item">
                                    <img src={league.logo} alt={league.name} className="league-logo" />
                                    <div className="league-details">
                                      <span className="league-name">{league.name}</span>
                                      {league.oldCode && (
                                        <span className="league-code">{league.oldCode}</span>
                                      )}
                                    </div>
                                    <div className="league-actions">
                                      <button 
                                        className={`favorite-toggle ${favoriteLeagues.includes(league.id) ? 'active' : ''}`}
                                        onClick={() => toggleFavorite(league.id)}
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                                          <path fill="currentColor" d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/>
                                        </svg>
                                      </button>
                                      <button onClick={() => {
                                        setSelectedCompetition(league.id);
                                        setActiveTab('standings');
                                      }}>
                                        Standings
                                      </button>
                                      <button onClick={() => {
                                        setSelectedCompetition(league.id);
                                        setActiveTab('matches');
                                      }}>
                                        Matches
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </details>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            
            {activeTab === 'standings' && (
              <div className="standings-tab">
                <div className="league-selector">
                  <label htmlFor="league-select">Select Competition:</label>
                  {loadingLeagues ? (
                    <div className="loading-spinner small">
                      <div className="spinner"></div>
                    </div>
                  ) : (
                    <select 
                      id="league-select"
                      value={selectedCompetition} 
                      onChange={(e) => setSelectedCompetition(e.target.value)}
                    >
                      <option value="">-- Select a league --</option>
                      
                      <optgroup label="Favorite Leagues">
                        {favoriteLeaguesData.map(league => (
                          <option key={`fav-${league.id}`} value={league.id}>
                            {league.name} ({league.country})
                          </option>
                        ))}
                      </optgroup>
                      
                      <optgroup label="Popular Leagues">
                        {allLeagues
                          .filter(league => league.oldCode && !favoriteLeagues.includes(league.id))
                          .map(league => (
                            <option key={league.id} value={league.id}>
                              {league.name} ({league.country})
                            </option>
                          ))
                        }
                      </optgroup>
                      
                      {sortedCountries.map(country => (
                        leaguesByCountry[country].filter(league => !league.oldCode && !favoriteLeagues.includes(league.id)).length > 0 && (
                          <optgroup key={country} label={country}>
                            {leaguesByCountry[country]
                              .filter(league => !league.oldCode && !favoriteLeagues.includes(league.id))
                              .map(league => (
                                <option key={league.id} value={league.id}>
                                  {league.name}
                                </option>
                              ))
                            }
                          </optgroup>
                        )
                      ))}
                    </select>
                  )}
                </div>
                
                {selectedCompetition ? (
                  <LeagueStandings competitionCode={selectedCompetition} />
                ) : (
                  <div className="no-selection">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="64" height="64">
                      <path fill="currentColor" d="M160 80c0-26.5 21.5-48 48-48h32c26.5 0 48 21.5 48 48v352c0 26.5-21.5 48-48 48H208c-26.5 0-48-21.5-48-48V80zM0 272c0-26.5 21.5-48 48-48H80c26.5 0 48 21.5 48 48V432c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V272zM368 96h32c26.5 0 48 21.5 48 48V432c0 26.5-21.5 48-48 48H368c-26.5 0-48-21.5-48-48V144c0-26.5 21.5-48 48-48z"/>
                    </svg>
                    <p>Please select a competition to view standings</p>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'matches' && (
              <div className="matches-tab">
                <div className="matches-header">
                  <div className="league-selector">
                    <label htmlFor="match-league-select">Select Competition:</label>
                    {loadingLeagues ? (
                      <div className="loading-spinner small">
                        <div className="spinner"></div>
                      </div>
                    ) : (
                      <select 
                        id="match-league-select"
                        value={selectedCompetition} 
                        onChange={(e) => setSelectedCompetition(e.target.value)}
                      >
                        <option value="all">All Competitions</option>
                        
                        <optgroup label="Favorite Leagues">
                          {favoriteLeaguesData.map(league => (
                            <option key={`fav-${league.id}`} value={league.id}>
                              {league.name} ({league.country})
                            </option>
                          ))}
                        </optgroup>
                        
                        <optgroup label="Popular Leagues">
                          {allLeagues
                            .filter(league => league.oldCode && !favoriteLeagues.includes(league.id))
                            .map(league => (
                              <option key={league.id} value={league.id}>
                                {league.name} ({league.country})
                              </option>
                            ))
                          }
                        </optgroup>
                        
                        {sortedCountries.map(country => (
                          leaguesByCountry[country].filter(league => !league.oldCode && !favoriteLeagues.includes(league.id)).length > 0 && (
                            <optgroup key={country} label={country}>
                              {leaguesByCountry[country]
                                .filter(league => !league.oldCode && !favoriteLeagues.includes(league.id))
                                .map(league => (
                                  <option key={league.id} value={league.id}>
                                    {league.name}
                                  </option>
                                ))
                              }
                            </optgroup>
                          )
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                
                <UpcomingMatchesFetcher leagueId={selectedCompetition} />
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .football-dashboard {
          display: flex;
          min-height: 100vh;
          background-color: #f6f8fa;
          color: #1f2937;
          font-family: 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        /* Sidebar Styles */
        .dashboard-sidebar {
          width: 260px;
          background-color: #0f172a;
          color: white;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        
        .sidebar-header {
          padding: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #f8fafc;
          font-weight: bold;
          font-size: 18px;
        }
        
        .connection-indicator {
          margin-top: 10px;
          padding: 6px 12px;
          border-radius: 12px;
          font-size: 14px;
          text-align: center;
          font-weight: 500;
        }
        
        .connection-indicator.connected {
          background-color: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }
        
        .connection-indicator.disconnected {
          background-color: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
        
        .sidebar-nav {
          padding: 20px 0;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }
        
        .sidebar-nav button {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          background: none;
          border: none;
          color: #94a3b8;
          text-align: left;
          font-size: 16px;
          transition: all 0.2s;
          cursor: pointer;
        }
        
        .sidebar-nav button svg {
          width: 20px;
          height: 20px;
        }
        
        .sidebar-nav button:hover {
          background-color: rgba(255, 255, 255, 0.05);
          color: #e2e8f0;
        }
        
        .sidebar-nav button.active {
          background-color: #1e40af;
          color: white;
        }
        
        .sidebar-user {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .user-avatar {
          width: 40px;
          height: 40px;
          background-color: #3b82f6;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 18px;
        }
        
        .user-info {
          overflow: hidden;
        }
        
        .user-name {
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .user-time {
          font-size: 12px;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        /* Main Content Styles */
        .dashboard-main {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .dashboard-header {
          background-color: white;
          padding: 16px 24px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }
        
        .header-search {
          display: flex;
          align-items: center;
          background-color: #f3f4f6;
          border-radius: 8px;
          padding: 8px 16px;
          width: 400px;
          gap: 12px;
        }
        
        .header-search input {
          border: none;
          background: none;
          outline: none;
          width: 100%;
          font-size: 16px;
          color: #1f2937;
        }
        
        .header-search svg {
          color: #6b7280;
        }
        
        .api-status-badge {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        
        .api-status-badge .provider {
          background-color: #3b82f6;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .api-status-badge .status {
          font-size: 12px;
          font-weight: 500;
          display: flex;
          align-items: center;
          padding: 4px 8px;
          border-radius: 4px;
        }
        
        .api-status-badge .status.connected {
          background-color: rgba(34, 197, 94, 0.1);
          color: #16a34a;
        }
        
        .api-status-badge .status.disconnected {
          background-color: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }
        
        .api-status-badge .status::before {
          content: "";
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 6px;
        }
        
        .api-status-badge .status.connected::before {
          background-color: #16a34a;
        }
        
        .api-status-badge .status.disconnected::before {
          background-color: #dc2626;
        }
        
        .selected-league {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .selected-league img {
          width: 36px;
          height: 36px;
          object-fit: contain;
        }
        
        .selected-league h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }
        
        .selected-league span {
          font-size: 14px;
          color: #6b7280;
        }
        
        .dashboard-content {
          flex-grow: 1;
          padding: 24px;
          overflow-y: auto;
        }
        
        /* Tab content transitions */
        .tab-content {
          height: 100%;
          opacity: 0;
          transform: translateY(10px);
          animation: fadeIn 0.3s forwards;
        }
        
        @keyframes fadeIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Home Dashboard */
        .home-dashboard {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        .welcome-banner {
          background: linear-gradient(to right, #1e40af, #3b82f6);
          border-radius: 12px;
          padding: 32px;
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .welcome-text h1 {
          font-size: 28px;
          margin: 0 0 16px 0;
        }
        
        .welcome-text p {
          font-size: 16px;
          opacity: 0.9;
          max-width: 600px;
          margin: 0;
        }
        
        .welcome-image svg {
          color: rgba(255, 255, 255, 0.2);
        }
        
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }
        
        .dashboard-card {
          background-color: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .dashboard-card h3 {
          margin-top: 0;
          margin-bottom: 16px;
          font-size: 18px;
          color: #1f2937;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 12px;
        }
        
        .favorite-leagues {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .favorite-league-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          border-radius: 8px;
          transition: background-color 0.2s;
          cursor: pointer;
        }
        
        .favorite-league-item:hover {
          background-color: #f3f4f6;
        }
        
        .favorite-league-item img {
          width: 32px;
          height: 32px;
          object-fit: contain;
        }
        
        .favorite-league-item h4 {
          margin: 0;
          font-size: 16px;
        }
        
        .favorite-league-item span {
          font-size: 14px;
          color: #6b7280;
        }
        
        /* Competitions Tab */
        .competitions-tab {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        .leagues-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 24px;
          margin-top: 16px;
        }
        
        .league-card {
          background-color: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .league-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .league-card-header {
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background-color: #f8fafc;
          position: relative;
        }
        
        .league-card-header img {
          max-width: 80%;
          max-height: 80px;
          object-fit: contain;
        }
        
        .favorite-toggle {
          position: absolute;
          top: 12px;
          right: 12px;
          background: none;
          border: none;
          color: #cbd5e1;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s, transform 0.2s;
        }
        
        .favorite-toggle svg {
          width: 20px;
          height: 20px;
        }
        
        .favorite-toggle.active {
          color: #f59e0b;
        }
        
        .favorite-toggle:hover {
          transform: scale(1.1);
        }
        
        .league-card-body {
          padding: 16px;
        }
        
        .league-card-body h3 {
          margin: 0 0 4px 0;
          font-size: 16px;
        }
        
        .league-country {
          color: #6b7280;
          font-size: 14px;
          display: block;
          margin-bottom: 16px;
        }
        
        .league-card-actions {
          display: flex;
          gap: 8px;
        }
        
        .league-card-actions button {
          flex: 1;
          padding: 8px 0;
          border: none;
          background-color: #f1f5f9;
          color: #0f172a;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .league-card-actions button:hover {
          background-color: #e2e8f0;
        }
        
        .competitions-accordion {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .country-accordion {
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .country-accordion summary {
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          background-color: #f8fafc;
          user-select: none;
        }
        
        .country-accordion summary::-webkit-details-marker {
          display: none;
        }
        
        .country-name {
          font-weight: 600;
        }
        
        .league-count {
          background-color: #e2e8f0;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 14px;
        }
        
        .country-leagues {
          display: flex;
          flex-direction: column;
        }
        
        .league-item {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid #f1f5f9;
        }
        
        .league-item:last-child {
          border-bottom: none;
        }
        
        .league-logo {
          width: 24px;
          height: 24px;
          object-fit: contain;
          margin-right: 12px;
        }
        
        .league-details {
          flex-grow: 1;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .league-name {
          font-size: 14px;
        }
        
        .league-code {
          background-color: #e2e8f0;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
        }
        
        .league-actions {
          display: flex;
          gap: 8px;
        }
        
        .league-actions button {
          background-color: #f1f5f9;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .league-actions button:hover {
          background-color: #e2e8f0;
        }
        
        /* Standings & Matches Tabs */
        .standings-tab,
        .matches-tab {
          display: flex;
          flex-direction: column;
          gap: 24px;
          height: 100%;
        }
        
        .league-selector {
          display: flex;
          align-items: center;
          gap: 16px;
          background-color: white;
          padding: 16px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .league-selector label {
          font-weight: 500;
          white-space: nowrap;
        }
        
        .league-selector select {
          flex-grow: 1;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 16px;
          max-width: 400px;
          background-color: white;
        }
        
        .no-selection {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          gap: 16px;
          background-color: white;
          padding: 48px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .matches-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        /* Loading Spinner */
        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px;
        }
        
        .loading-spinner.small {
          padding: 0;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(59, 130, 246, 0.2);
          border-left-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .loading-spinner.small .spinner {
          width: 24px;
          height: 24px;
          border-width: 2px;
        }
        
        .loading-spinner p {
          margin-top: 16px;
          color: #6b7280;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* Responsive Design */
        @media (max-width: 1024px) {
          .dashboard-sidebar {
            width: 220px;
          }
          
          .header-search {
            width: 300px;
          }
        }
        
        @media (max-width: 768px) {
          .football-dashboard {
            flex-direction: column;
          }
          
          .dashboard-sidebar {
            width: 100%;
          }
          
          .sidebar-nav {
            flex-direction: row;
            overflow-x: auto;
            padding: 12px;
          }
          
          .sidebar-nav button {
            padding: 10px 16px;
            white-space: nowrap;
          }
          
          .dashboard-header {
            flex-wrap: wrap;
          }
          
          .header-search {
            width: 100%;
            order: 1;
          }
          
          .leagues-grid {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          }
        }
      `}</style>
    </div>
  );
}