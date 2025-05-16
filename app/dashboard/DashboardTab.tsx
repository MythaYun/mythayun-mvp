'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { FiCalendar, FiClock, FiRefreshCw, FiTrendingUp } from 'react-icons/fi';

// Sample match data - this would come from the football API
interface Match {
  id: string;
  homeTeam: {
    name: string;
    logo: string;
  };
  awayTeam: {
    name: string;
    logo: string;
  };
  league: {
    name: string;
    logo: string;
    country: string;
  };
  date: string;
  time: string;
  venue: string;
}

export default function DashboardTab() {
  const { user } = useAuth();
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // This would be replaced with actual API calls to a football data service
  useEffect(() => {
    const fetchFootballData = async () => {
      try {
        setLoading(true);
        
        // Example of how you would fetch data from a football API
        // const response = await fetch('/api/football/matches?date=upcoming');
        // const data = await response.json();
        // setUpcomingMatches(data.matches);
        
        // For now, we'll use sample data
        setUpcomingMatches([
          {
            id: 'match-1',
            homeTeam: { name: 'Paris Saint-Germain', logo: '/teams/psg.png' },
            awayTeam: { name: 'Real Madrid', logo: '/teams/real.png' },
            league: { 
              name: 'UEFA Champions League', 
              logo: '/leagues/ucl.png',
              country: 'Europe' 
            },
            date: '20 Mai 2025',
            time: '20:45',
            venue: 'Parc des Princes'
          },
          {
            id: 'match-2',
            homeTeam: { name: 'Manchester City', logo: '/teams/city.png' },
            awayTeam: { name: 'Liverpool', logo: '/teams/liverpool.png' },
            league: { 
              name: 'Premier League', 
              logo: '/leagues/premier-league.png',
              country: 'Angleterre' 
            },
            date: '21 Mai 2025',
            time: '16:00',
            venue: 'Etihad Stadium'
          }
        ]);
        
        setLiveMatches([
          {
            id: 'match-3',
            homeTeam: { name: 'Bayern Munich', logo: '/teams/bayern.png' },
            awayTeam: { name: 'Dortmund', logo: '/teams/dortmund.png' },
            league: { 
              name: 'Bundesliga', 
              logo: '/leagues/bundesliga.png',
              country: 'Allemagne' 
            },
            date: 'Aujourd\'hui',
            time: 'En cours - 32\'',
            venue: 'Allianz Arena'
          }
        ]);
        
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Failed to fetch football data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFootballData();
    
    // Set up auto-refresh every 5 minutes for live data
    const refreshInterval = setInterval(fetchFootballData, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, []);
  
  // Get user's favorite teams and leagues
  const favoriteTeams = user?.preferences?.favoriteTeams || [];
  const favoriteLeagues = user?.preferences?.favoriteLeagues || [];
  
  const refreshData = () => {
    setLoading(true);
    // Here you would call the actual API again
    // For now just simulate a refresh
    setTimeout(() => {
      setLastUpdated(new Date());
      setLoading(false);
    }, 1000);
  };
  
  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <div className="bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-white">Tableau de bord</h2>
          <button 
            onClick={refreshData} 
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm"
            disabled={loading}
          >
            <FiRefreshCw className={`${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
        
        <p className="text-slate-400 mb-5">
          Bienvenue dans votre espace football personnalisé. Suivez vos équipes et matchs préférés.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-indigo-400">Équipes suivies</h3>
              <span className="text-slate-300 font-bold text-xl">{favoriteTeams.length}</span>
            </div>
            <p className="text-sm text-slate-400">
              {favoriteTeams.length > 0 
                ? `Incluant ${favoriteTeams.slice(0, 2).join(', ')}${favoriteTeams.length > 2 ? '...' : ''}`
                : 'Aucune équipe suivie'
              }
            </p>
          </div>
          <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-indigo-400">Matchs à venir</h3>
              <span className="text-slate-300 font-bold text-xl">{upcomingMatches.length}</span>
            </div>
            <p className="text-sm text-slate-400">
              {upcomingMatches.length > 0
                ? `Prochain dans ${Math.floor(Math.random() * 3) + 1} jours`
                : 'Aucun match à venir'
              }
            </p>
          </div>
        </div>
        
        {/* Last updated timestamp */}
        <div className="text-xs text-slate-500 mb-4 flex items-center gap-1">
          <FiClock size={12} />
          <span>
            Dernière mise à jour: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>
      
      {/* Live matches */}
      <div className="bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          <h2 className="text-xl font-bold text-white">Matchs en direct</h2>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin h-8 w-8 border-t-2 border-indigo-500 rounded-full"></div>
          </div>
        ) : liveMatches.length > 0 ? (
          <div className="space-y-4">
            {liveMatches.map(match => (
              <div key={match.id} className="bg-gradient-to-r from-slate-700/60 to-slate-700/30 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center text-xs">
                      {/* This would be the league logo */}
                    </div>
                    <span className="text-slate-300 text-sm">{match.league.name}</span>
                  </div>
                  <div className="bg-red-600/20 text-red-400 px-2 py-0.5 rounded text-xs font-medium">
                    LIVE
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                      {/* Home team logo */}
                      <span className="text-xs">{match.homeTeam.name.slice(0, 2)}</span>
                    </div>
                    <span className="font-medium text-white">{match.homeTeam.name}</span>
                  </div>
                  <div className="px-3 py-1 bg-slate-700 rounded-lg font-medium">
                    <span className="text-lg text-white">2 - 1</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-white">{match.awayTeam.name}</span>
                    <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                      {/* Away team logo */}
                      <span className="text-xs">{match.awayTeam.name.slice(0, 2)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 text-center">
                  <span className="text-red-400 text-sm font-medium">{match.time}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-700/30 rounded-xl p-6 text-center">
            <p className="text-slate-400">Aucun match en direct en ce moment</p>
            <p className="text-sm text-slate-500 mt-1">Revenez plus tard pour suivre les scores en direct</p>
          </div>
        )}
      </div>
      
      {/* Upcoming matches */}
      <div className="bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-5 text-white">Matchs à venir</h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin h-8 w-8 border-t-2 border-indigo-500 rounded-full"></div>
          </div>
        ) : upcomingMatches.length > 0 ? (
          <div className="space-y-4">
            {upcomingMatches.map(match => (
              <div key={match.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400">
                  <FiCalendar size={20} />
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-xs text-indigo-400">{match.league.name}</span>
                    <span className="text-xs text-slate-500">• {match.venue}</span>
                  </div>
                  <h4 className="font-medium text-white">{match.homeTeam.name} vs {match.awayTeam.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 text-slate-400 text-sm">
                      <FiCalendar size={14} />
                      <span>{match.date}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 text-sm">
                      <FiClock size={14} />
                      <span>{match.time}</span>
                    </div>
                  </div>
                </div>
                <button className="px-3 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm">
                  Rappel
                </button>
              </div>
            ))}
            
            <button className="w-full py-3 text-indigo-400 font-medium hover:text-indigo-300 transition-colors">
              Voir tous les matchs à venir
            </button>
          </div>
        ) : (
          <div className="bg-slate-700/30 rounded-xl p-6 text-center">
            <p className="text-slate-400">Aucun match à venir</p>
            <p className="text-sm text-slate-500 mt-1">Ajoutez des équipes favorites pour suivre leurs prochains matchs</p>
          </div>
        )}
      </div>
      
      {/* Statistics */}
      <div className="bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
          <FiTrendingUp size={20} className="text-indigo-400" />
          <span>Statistiques d'utilisation</span>
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-xl bg-slate-700/30 text-center">
            <h3 className="text-3xl font-bold text-indigo-400">12</h3>
            <p className="text-sm text-slate-400">Visites</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-700/30 text-center">
            <h3 className="text-3xl font-bold text-indigo-400">5</h3>
            <p className="text-sm text-slate-400">Matchs suivis</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-700/30 text-center">
            <h3 className="text-3xl font-bold text-indigo-400">3</h3>
            <p className="text-sm text-slate-400">Commentaires</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-700/30 text-center">
            <h3 className="text-3xl font-bold text-indigo-400">8</h3>
            <p className="text-sm text-slate-400">Favoris</p>
          </div>
        </div>
      </div>
    </div>
  );
}