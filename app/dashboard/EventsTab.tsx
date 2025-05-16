'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { 
  FiCalendar, FiFilter, FiClock, FiMap, 
  FiRefreshCw, FiChevronDown, FiAlertCircle 
} from 'react-icons/fi';

interface FootballMatch {
  id: string;
  homeTeam: {
    id: string;
    name: string;
    logo: string;
  };
  awayTeam: {
    id: string;
    name: string;
    logo: string;
  };
  league: {
    id: string;
    name: string;
    logo: string;
    country: string;
  };
  date: string;
  time: string;
  venue: string;
  status: 'upcoming' | 'live' | 'finished';
  score?: {
    home: number;
    away: number;
  };
  round?: string;
  season?: string;
  followedByUser: boolean;
}

export default function EventsTab() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<FootballMatch[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<FootballMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'followed' | 'upcoming' | 'live'>('all');
  const [leagueFilter, setLeagueFilter] = useState<string | null>(null);
  const [expandedFilters, setExpandedFilters] = useState(false);
  
  // Available leagues for filtering
  const leagues = [
    { id: 'l1', name: 'Champions League' },
    { id: 'l2', name: 'Premier League' },
    { id: 'l3', name: 'La Liga' },
    { id: 'l4', name: 'Bundesliga' },
    { id: 'l5', name: 'Serie A' },
    { id: 'l6', name: 'Ligue 1' }
  ];
  
  // This would be integrated with your football API
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        
        // In reality, you would call your API here
        // const response = await fetch('/api/football/matches');
        // const data = await response.json();
        
        // For demo purposes, let's use dummy data
        const dummyMatches: FootballMatch[] = [
          {
            id: 'm1',
            homeTeam: {
              id: 't1',
              name: 'Paris Saint-Germain',
              logo: '/teams/psg.png'
            },
            awayTeam: {
              id: 't2',
              name: 'Real Madrid',
              logo: '/teams/real.png'
            },
            league: {
              id: 'l1',
              name: 'Champions League',
              logo: '/leagues/ucl.png',
              country: 'Europe'
            },
            date: '20 Mai 2025',
            time: '20:45',
            venue: 'Parc des Princes',
            status: 'upcoming',
            round: 'Final',
            season: '2024/2025',
            followedByUser: true
          },
          {
            id: 'm2',
            homeTeam: {
              id: 't3',
              name: 'Manchester City',
              logo: '/teams/city.png'
            },
            awayTeam: {
              id: 't4',
              name: 'Liverpool',
              logo: '/teams/liverpool.png'
            },
            league: {
              id: 'l2',
              name: 'Premier League',
              logo: '/leagues/pl.png',
              country: 'England'
            },
            date: '21 Mai 2025',
            time: '16:00',
            venue: 'Etihad Stadium',
            status: 'upcoming',
            round: 'Matchday 38',
            season: '2024/2025',
            followedByUser: true
          },
          {
            id: 'm3',
            homeTeam: {
              id: 't5',
              name: 'Bayern Munich',
              logo: '/teams/bayern.png'
            },
            awayTeam: {
              id: 't6',
              name: 'Dortmund',
              logo: '/teams/dortmund.png'
            },
            league: {
              id: 'l4',
              name: 'Bundesliga',
              logo: '/leagues/bundesliga.png',
              country: 'Germany'
            },
            date: '19 Mai 2025',
            time: '15:30',
            venue: 'Allianz Arena',
            status: 'live',
            score: { home: 2, away: 1 },
            round: 'Matchday 34',
            season: '2024/2025',
            followedByUser: false
          },
          {
            id: 'm4',
            homeTeam: {
              id: 't7',
              name: 'Barcelona',
              logo: '/teams/barcelona.png'
            },
            awayTeam: {
              id: 't8',
              name: 'Atletico Madrid',
              logo: '/teams/atletico.png'
            },
            league: {
              id: 'l3',
              name: 'La Liga',
              logo: '/leagues/laliga.png',
              country: 'Spain'
            },
            date: '18 Mai 2025',
            time: '19:00',
            venue: 'Camp Nou',
            status: 'finished',
            score: { home: 3, away: 1 },
            round: 'Matchday 37',
            season: '2024/2025',
            followedByUser: false
          }
        ];
        
        setMatches(dummyMatches);
        applyFilters(dummyMatches, filter, leagueFilter);
      } catch (error) {
        console.error('Failed to fetch matches:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMatches();
  }, []);
  
  // Apply filters to the matches
  const applyFilters = (matchData: FootballMatch[], activeFilter: string, leagueId: string | null) => {
    let filtered = [...matchData];
    
    // Apply status filter
    if (activeFilter === 'followed') {
      filtered = filtered.filter(match => match.followedByUser);
    } else if (activeFilter === 'upcoming') {
      filtered = filtered.filter(match => match.status === 'upcoming');
    } else if (activeFilter === 'live') {
      filtered = filtered.filter(match => match.status === 'live');
    }
    
    // Apply league filter
    if (leagueId) {
      filtered = filtered.filter(match => match.league.id === leagueId);
    }
    
    setFilteredMatches(filtered);
  };
  
  // Change filter
  const changeFilter = (newFilter: 'all' | 'followed' | 'upcoming' | 'live') => {
    setFilter(newFilter);
    applyFilters(matches, newFilter, leagueFilter);
  };
  
  // Change league filter
  const changeLeagueFilter = (leagueId: string | null) => {
    setLeagueFilter(leagueId);
    applyFilters(matches, filter, leagueId);
  };
  
  // Toggle following a match
  const toggleFollowMatch = (matchId: string) => {
    const updatedMatches = matches.map(match => {
      if (match.id === matchId) {
        return { ...match, followedByUser: !match.followedByUser };
      }
      return match;
    });
    
    setMatches(updatedMatches);
    applyFilters(updatedMatches, filter, leagueFilter);
    
    // Here you would make an API call to update user preferences
    // Something like: updateUserPreferences({ ...user.preferences, followedMatches: [...] })
  };
  
  return (
    <div className="bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Calendrier des Matchs</h2>
          <p className="text-slate-400">Trouvez et suivez les matchs à venir et en direct</p>
        </div>
        
        <button 
          onClick={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 1000);
          }} 
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          <span>Actualiser</span>
        </button>
      </div>
      
      {/* Filters */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}
            onClick={() => changeFilter('all')}
          >
            Tous les matchs
          </button>
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'followed' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}
            onClick={() => changeFilter('followed')}
          >
            Matchs suivis
          </button>
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'upcoming' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}
            onClick={() => changeFilter('upcoming')}
          >
            À venir
          </button>
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'live' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}
            onClick={() => changeFilter('live')}
          >
            En direct
          </button>
          
          <button 
            className="ml-auto px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-slate-300 flex items-center gap-1"
            onClick={() => setExpandedFilters(!expandedFilters)}
          >
            <FiFilter size={16} />
            <span>Filtres</span>
            <FiChevronDown className={`transition-transform ${expandedFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        {/* Extended filters */}
        {expandedFilters && (
          <div className="mt-3 p-4 bg-slate-700/40 rounded-lg">
            <h3 className="text-sm text-slate-300 mb-3">Filtrer par compétition</h3>
            <div className="flex flex-wrap gap-2">
              <button 
                className={`px-3 py-1 rounded-lg text-xs font-medium ${leagueFilter === null ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                onClick={() => changeLeagueFilter(null)}
              >
                Toutes
              </button>
              
              {leagues.map(league => (
                <button 
                  key={league.id}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${leagueFilter === league.id ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                  onClick={() => changeLeagueFilter(league.id)}
                >
                  {league.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Matches list */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-indigo-500 rounded-full"></div>
        </div>
      ) : filteredMatches.length > 0 ? (
        <div className="space-y-4">
          {filteredMatches.map(match => (
            <div key={match.id} className="bg-slate-700/30 hover:bg-slate-700/50 transition-colors rounded-xl p-4">
              {/* League info */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center text-xs">
                    {/* League logo would go here */}
                  </div>
                  <span className="text-slate-300 text-sm">{match.league.name}</span>
                </div>
                
                {/* Status badge */}
                {match.status === 'live' ? (
                  <div className="bg-red-600/20 text-red-400 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></div>
                    <span>EN DIRECT</span>
                  </div>
                ) : match.status === 'upcoming' ? (
                  <div className="bg-indigo-600/20 text-indigo-400 px-2 py-0.5 rounded text-xs font-medium">
                    À VENIR
                  </div>
                ) : (
                  <div className="bg-slate-600/20 text-slate-400 px-2 py-0.5 rounded text-xs font-medium">
                    TERMINÉ
                  </div>
                )}
              </div>
              
              {/* Teams */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                    <span className="text-xs">{match.homeTeam.name.slice(0, 2)}</span>
                  </div>
                  <span className="font-medium text-white">{match.homeTeam.name}</span>
                </div>
                
                {/* Score or vs */}
                {match.status === 'live' || match.status === 'finished' ? (
                  <div className="px-3 py-1 bg-slate-700 rounded-lg font-medium">
                    <span className="text-lg text-white">
                      {match.score?.home} - {match.score?.away}
                    </span>
                  </div>
                ) : (
                  <div className="px-3 py-1 rounded font-medium text-slate-300">
                    VS
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <span className="font-medium text-white">{match.awayTeam.name}</span>
                  <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                    <span className="text-xs">{match.awayTeam.name.slice(0, 2)}</span>
                  </div>
                </div>
              </div>
              
              {/* Match details */}
              <div className="mt-4 pt-3 border-t border-slate-600/30 flex items-center justify-between">
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-1 text-slate-400 text-sm">
                    <FiCalendar size={14} />
                    <span>{match.date}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 text-sm">
                    <FiClock size={14} />
                    <span>{match.time}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 text-sm">
                    <FiMap size={14} />
                    <span>{match.venue}</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => toggleFollowMatch(match.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium 
                    ${match.followedByUser 
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' 
                      : 'bg-slate-600/20 text-slate-300 border border-slate-500/30 hover:bg-indigo-600/10 hover:border-indigo-500/20 hover:text-indigo-400'
                    }`
                  }
                >
                  {match.followedByUser ? 'Suivi' : 'Suivre'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 bg-slate-700/20 rounded-xl">
          <FiAlertCircle size={40} className="text-slate-500 mb-3" />
          <p className="text-slate-400">Aucun match ne correspond à vos critères</p>
          <p className="text-sm text-slate-500 mt-1">Essayez de modifier vos filtres</p>
        </div>
      )}
    </div>
  );
}