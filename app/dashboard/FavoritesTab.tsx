'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useMatchesDebug } from '@/lib/hooks/useFootBallDataDebug';
import { FootballMatch } from '@/lib/services/MatchesService';
import { 
  FiHeart, FiSearch, FiFilter, FiTrash2, FiPlus, FiCalendar, 
  FiAlertCircle, FiX, FiCheckCircle, FiInfo, FiBell, FiShare2, FiStar,
  FiClock, FiMap, FiUsers, FiMessageCircle, FiActivity, FiBellOff,
  FiBarChart2, FiChevronDown, FiRefreshCw, FiArrowDown, FiArrowLeft, FiCheck,
  FiAlertTriangle, FiShield, FiEye
} from 'react-icons/fi';
import React from 'react';
import { useRouter } from 'next/navigation';

// Updated timestamp and username based on requirements
const CURRENT_TIMESTAMP = "2025-05-22 15:20:41";
const CURRENT_USER = "Sdiabate1337";

// Base64 encoded placeholder images to avoid 502 errors - same as in other components
const PLACEHOLDER_LEAGUE_IMG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiMzNDNhNDAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPkw8L3RleHQ+PC9zdmc+";
const PLACEHOLDER_TEAM_IMG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiMzNDNhNDAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPlQ8L3RleHQ+PC9zdmc+";

// Define proper preference types to match AuthContext
interface NotificationPreferences {
  matchReminders: boolean;
  scoreUpdates: boolean;
  newsAlerts: boolean;
}

interface DisplayPreferences {
  darkMode: boolean;
  compactView: boolean;
}

interface UserPreferences {
  notificationPreferences: NotificationPreferences;
  displayPreferences: DisplayPreferences;
  favoriteLeagues: string[];
  favoriteTeams: string[];
  favoriteMatches: string[];
}

interface Notification {
  id: string; // Added ID for better management
  message: string;
  type: 'success' | 'error' | 'info';
}

// Interfaces for delete confirmation
interface DeleteConfirmation {
  isOpen: boolean;
  type: 'team' | 'match';
  id: string;
  name: string; // Team name or match description
}

// Helper to format dates - same as in other components
const formatDateToDisplay = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // If direct parsing failed, try to handle custom format
      const dateRegex = /(\d{1,2}) ([A-Za-z]+) (\d{4})/;
      const match = dateString.match(dateRegex);
      
      if (!match) return dateString;
      
      const day = match[1];
      let month = match[2].toLowerCase();
      const year = match[3];
      
      // Map French month names to English
      const monthMap: Record<string, string> = {
        'janvier': 'January',
        'février': 'February',
        'fevrier': 'February',
        'mars': 'March',
        'avril': 'April',
        'mai': 'May',
        'juin': 'June',
        'juillet': 'July',
        'août': 'August',
        'aout': 'August',
        'septembre': 'September',
        'octobre': 'October',
        'novembre': 'November',
        'décembre': 'December',
        'decembre': 'December'
      };
      
      month = monthMap[month] || month;
      return `${month} ${day}, ${year}`;
    }
    
    return date.toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    console.error(`[${CURRENT_TIMESTAMP}] Date parsing error:`, e);
    return dateString;
  }
};

// Team skeleton loader
const TeamSkeletonLoader = () => (
  <div className="bg-slate-700/30 rounded-xl p-5 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-slate-600"></div>
        <div>
          <div className="h-5 w-28 bg-slate-600 rounded-md mb-2"></div>
          <div className="h-3 w-16 bg-slate-600/70 rounded-md"></div>
        </div>
      </div>
      <div className="w-8 h-8 bg-slate-600 rounded-full"></div>
    </div>
  </div>
);

// Match skeleton loader
const MatchSkeletonLoader = () => (
  <div className="bg-slate-700/30 rounded-xl p-4 animate-pulse">
    <div className="flex justify-between items-center mb-3">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-slate-600"></div>
        <div className="h-4 w-28 bg-slate-600 rounded-md"></div>
      </div>
      <div className="h-4 w-20 bg-slate-600 rounded-md"></div>
    </div>
    <div className="flex items-center justify-between my-3">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-slate-600"></div>
        <div className="h-5 w-20 bg-slate-600 rounded-md"></div>
      </div>
      <div className="w-10 h-6 bg-slate-600 rounded-md"></div>
      <div className="flex items-center gap-2">
        <div className="h-5 w-20 bg-slate-600 rounded-md"></div>
        <div className="w-10 h-10 rounded-full bg-slate-600"></div>
      </div>
    </div>
    <div className="flex justify-between mt-3">
      <div className="h-3 w-24 bg-slate-600/70 rounded-md"></div>
      <div className="h-3 w-16 bg-slate-600/70 rounded-md"></div>
    </div>
  </div>
);

// Custom tooltip component for improved UX
const Tooltip = ({ children, text }: { children: React.ReactNode; text: string }) => {
  return (
    <div className="relative group">
      {children}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {text}
      </div>
    </div>
  );
};

// Custom notification component with enhanced animations
const NotificationToast = ({ notification, onClose, onUndo }: { 
  notification: Notification; 
  onClose: () => void; 
  onUndo?: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // Longer time to allow for undo actions
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div 
      className={`fixed top-4 right-4 z-50 flex items-center gap-2 p-3 pr-12 rounded-lg shadow-lg transform transition-all duration-300 animate-slideIn ${
        notification.type === 'success' 
          ? 'bg-green-600/95 text-white' 
          : notification.type === 'error'
            ? 'bg-red-600/95 text-white'
            : 'bg-indigo-600/95 text-white'
      }`}
    >
      {notification.type === 'success' ? (
        <FiCheckCircle size={20} className="animate-scaleIn" />
      ) : notification.type === 'error' ? (
        <FiAlertCircle size={20} className="animate-pulse" />
      ) : (
        <FiInfo size={20} />
      )}
      <div>
        <p className="pr-6">{notification.message}</p>
        {onUndo && (
          <button 
            onClick={onUndo}
            className="text-sm underline mt-1 opacity-90 hover:opacity-100"
          >
            Undo
          </button>
        )}
      </div>
      <button 
        onClick={onClose} 
        className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
        aria-label="Close notification"
      >
        <FiX size={16} />
      </button>
    </div>
  );
};

// Delete confirmation modal component
const DeleteConfirmationModal = ({
  deleteInfo,
  onCancel,
  onConfirm,
}: {
  deleteInfo: DeleteConfirmation;
  onCancel: () => void;
  onConfirm: () => void;
}) => (
  <div 
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-fadeIn"
    onClick={onCancel}
  >
    <div 
      className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-xl border border-slate-700 max-w-md w-full animate-scaleIn"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="bg-red-600/20 p-3 rounded-full">
          <FiAlertTriangle size={24} className="text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-white">Confirm Removal</h3>
      </div>
      
      <p className="text-slate-300 mb-6">
        {deleteInfo.type === 'team' 
          ? `Are you sure you want to remove "${deleteInfo.name}" from your favorite teams?` 
          : `Are you sure you want to remove "${deleteInfo.name}" from your favorite matches?`
        }
      </p>
      
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-1.5"
          autoFocus
        >
          <FiTrash2 size={16} />
          <span>Remove</span>
        </button>
      </div>
    </div>
  </div>
);

// Helper function to ensure complete preferences structure
const ensureCompletePreferences = (prefs: any): UserPreferences => {
  return {
    favoriteTeams: prefs?.favoriteTeams || [],
    favoriteMatches: prefs?.favoriteMatches || [],
    favoriteLeagues: prefs?.favoriteLeagues || [],
    notificationPreferences: {
      matchReminders: prefs?.notificationPreferences?.matchReminders ?? true,
      scoreUpdates: prefs?.notificationPreferences?.scoreUpdates ?? true,
      newsAlerts: prefs?.notificationPreferences?.newsAlerts ?? false
    },
    displayPreferences: {
      darkMode: prefs?.displayPreferences?.darkMode ?? true,
      compactView: prefs?.displayPreferences?.compactView ?? false
    }
  };
};

export default function FavoritesTab() {
  const { user, updateUserPreferences } = useAuth();
  const router = useRouter();
  
  // Local state
  const [favoriteTeamIds, setFavoriteTeamIds] = useState<string[]>([]);
  const [favoriteMatchIds, setFavoriteMatchIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'teams' | 'matches'>('teams');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filterLeague, setFilterLeague] = useState<string | null>(null);
  const [isPullingToRefresh, setIsPullingToRefresh] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [modalTab, setModalTab] = useState<'teams' | 'matches'>('teams');
  const contentRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Delete confirmation states
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({
    isOpen: false,
    type: 'team',
    id: '',
    name: ''
  });
  
  // Recently deleted item tracking (for undo functionality)
  const [lastDeletedItem, setLastDeletedItem] = useState<{
    type: 'team' | 'match';
    id: string;
    name: string;
  } | null>(null);
  
  // Use the consistent data source from the same hook used in other components
  const { matches, loading: matchesLoading, error, refreshData: refreshMatchData } = useMatchesDebug({ 
    live: true,
    upcoming: true,
    days: 7,
    useMockData: true
  });

  // Extract unique teams from matches for consistency
  const allTeams = useMemo(() => {
    if (!matches) return [];
    
    const teamsMap = new Map();
    
    matches.forEach(match => {
      // Add home team if not already in map
      if (!teamsMap.has(match.homeTeam.id)) {
        teamsMap.set(match.homeTeam.id, {
          id: match.homeTeam.id,
          name: match.homeTeam.name,
          logo: match.homeTeam.logo,
          country: match.league.country || 'Unknown',
          league: match.league.name || 'Unknown',
          nextMatch: null
        });
      }
      
      // Add away team if not already in map
      if (!teamsMap.has(match.awayTeam.id)) {
        teamsMap.set(match.awayTeam.id, {
          id: match.awayTeam.id,
          name: match.awayTeam.name,
          logo: match.awayTeam.logo,
          country: match.league.country || 'Unknown',
          league: match.league.name || 'Unknown',
          nextMatch: null
        });
      }
      
      // If the match is upcoming, add as next match for both teams
      if (match.status === 'upcoming') {
        const homeTeam = teamsMap.get(match.homeTeam.id);
        const awayTeam = teamsMap.get(match.awayTeam.id);
        
        // Only set if there's no nextMatch yet or if this match is sooner
        if (!homeTeam.nextMatch || new Date(`${match.date} ${match.time}`) < new Date(`${homeTeam.nextMatch.date} ${homeTeam.nextMatch.time}`)) {
          homeTeam.nextMatch = {
            opponent: match.awayTeam.name,
            date: match.date,
            time: match.time,
            competition: match.league.name,
            isHome: true,
            matchId: match.id
          };
        }
        
        if (!awayTeam.nextMatch || new Date(`${match.date} ${match.time}`) < new Date(`${awayTeam.nextMatch.date} ${awayTeam.nextMatch.time}`)) {
          awayTeam.nextMatch = {
            opponent: match.homeTeam.name,
            date: match.date,
            time: match.time,
            competition: match.league.name,
            isHome: false,
            matchId: match.id
          };
        }
      }
    });
    
    return Array.from(teamsMap.values());
  }, [matches]);
  
  // Load user's favorites on component mount
  useEffect(() => {
    if (user) {
      // Use our helper to ensure complete preferences
      const preferences = ensureCompletePreferences(user.preferences);
      setFavoriteTeamIds(preferences.favoriteTeams);
      setFavoriteMatchIds(preferences.favoriteMatches);
      setLoadingFavorites(false);
    }
  }, [user]);
  
  // Computed favorite teams based on IDs
  const favoriteTeams = useMemo(() => {
    return allTeams.filter(team => favoriteTeamIds.includes(team.id));
  }, [allTeams, favoriteTeamIds]);
  
  // Computed favorite matches based on IDs
  const favoriteMatches = useMemo(() => {
    if (!matches) return [];
    return matches.filter(match => favoriteMatchIds.includes(match.id));
  }, [matches, favoriteMatchIds]);
  
  // Mark when loading is complete
  useEffect(() => {
    if (!matchesLoading && matches) {
      setLoadingFavorites(false);
    }
  }, [matchesLoading, matches]);
  
  // Show notification
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Optional: Play a sound if supported
    if ('vibrate' in navigator && type === 'success') {
      // Short vibration for success feedback (if supported)
      navigator.vibrate(50);
    }
  };
  
  // Hide notification
  const hideNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  
  // Keyboard shortcut handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow keyboard navigation only when not in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }
      
      // Add keyboard shortcuts
      if (e.key === '/' && !showAddModal) {
        // Focus search input with / key
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        // Close modals with Escape key
        if (showAddModal) {
          setShowAddModal(false);
        } else if (deleteConfirmation.isOpen) {
          setDeleteConfirmation(prev => ({ ...prev, isOpen: false }));
        }
      } else if (e.key === 't' && e.altKey) {
        // Alt+T to switch to teams tab
        e.preventDefault();
        switchTab('teams');
      } else if (e.key === 'm' && e.altKey) {
        // Alt+M to switch to matches tab
        e.preventDefault();
        switchTab('matches');
      } else if (e.key === 'a' && e.altKey) {
        // Alt+A to open add modal
        e.preventDefault();
        openAddModal();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showAddModal, deleteConfirmation.isOpen]);
  
  // Add a team to favorites with enhanced feedback
  const addTeamToFavorites = async (teamId: string) => {
    try {
      // Find team name for notification
      const team = allTeams.find(t => t.id === teamId);
      if (!team) return;
      
      // Check if already in favorites
      if (favoriteTeamIds.includes(teamId)) {
        showNotification(`${team.name} is already in your favorites`, 'info');
        return;
      }
      
      // Get complete user preferences
      const currentPrefs = ensureCompletePreferences(user?.preferences);
      
      // Update local state with optimistic update
      setFavoriteTeamIds(prev => [...prev, teamId]);
      
      // Optional haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([15, 10, 15]);
      }
      
      // Update preferences in backend
      const updatedPrefs = {
        ...currentPrefs,
        favoriteTeams: [...currentPrefs.favoriteTeams, teamId]
      };
      
      await updateUserPreferences(updatedPrefs);
      showNotification(`${team.name} added to your favorites`, 'success');
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} added team ${teamId} to favorites`);
    } catch (error) {
      console.error('Error adding team to favorites:', error);
      showNotification('Error adding to favorites', 'error');
      // Revert local state change on error
      setFavoriteTeamIds(prev => prev.filter(id => id !== teamId));
    }
  };
  
  // Request confirmation to remove a team from favorites
  const confirmRemoveTeam = (teamId: string) => {
    const team = allTeams.find(t => t.id === teamId);
    if (!team) return;
    
    // Set up confirmation data
    setDeleteConfirmation({
      isOpen: true,
      type: 'team',
      id: teamId,
      name: team.name
    });
  };
  
  // Request confirmation to remove a match from favorites
  const confirmRemoveMatch = (matchId: string) => {
    const match = matches?.find(m => m.id === matchId);
    if (!match) return;
    
    const matchName = `${match.homeTeam.name} vs ${match.awayTeam.name}`;
    
    // Set up confirmation data
    setDeleteConfirmation({
      isOpen: true,
      type: 'match',
      id: matchId,
      name: matchName
    });
  };
  
  // Actually remove a team from favorites (after confirmation)
  const removeTeamFromFavorites = async () => {
    try {
      const teamId = deleteConfirmation.id;
      const teamName = deleteConfirmation.name;
      
      // Close the confirmation dialog first
      setDeleteConfirmation(prev => ({ ...prev, isOpen: false }));
      
      // Store for potential undo
      setLastDeletedItem({
        type: 'team',
        id: teamId,
        name: teamName
      });
      
      // Optimistic update for UI
      setFavoriteTeamIds(prev => prev.filter(id => id !== teamId));
      
      // Optional haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }
      
      // Update preferences in backend
      const currentPrefs = ensureCompletePreferences(user?.preferences);
      const updatedPrefs = {
        ...currentPrefs,
        favoriteTeams: currentPrefs.favoriteTeams.filter(id => id !== teamId)
      };
      
      await updateUserPreferences(updatedPrefs);
      
      // Show notification with undo option
      const notificationId = Date.now().toString();
      setNotifications(prev => [...prev, { 
        id: notificationId, 
        message: `${teamName} removed from favorites`, 
        type: 'success'
      }]);
      
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} removed team ${teamId} from favorites`);
    } catch (error) {
      console.error('Error removing team from favorites:', error);
      showNotification('Error removing from favorites', 'error');
      // Reload original favorites on error
      if (user && user.preferences) {
        setFavoriteTeamIds(user.preferences.favoriteTeams || []);
      }
    }
  };
  
  // Undo last team deletion
  const undoTeamRemoval = async () => {
    if (!lastDeletedItem || lastDeletedItem.type !== 'team') return;
    
    try {
      const teamId = lastDeletedItem.id;
      
      // Update local state
      setFavoriteTeamIds(prev => [...prev, teamId]);
      
      // Update preferences in backend
      const currentPrefs = ensureCompletePreferences(user?.preferences);
      const updatedPrefs = {
        ...currentPrefs,
        favoriteTeams: [...currentPrefs.favoriteTeams, teamId]
      };
      
      await updateUserPreferences(updatedPrefs);
      showNotification(`${lastDeletedItem.name} restored to favorites`, 'success');
      
      // Clear the undo data
      setLastDeletedItem(null);
    } catch (error) {
      console.error('Error restoring team:', error);
      showNotification('Error restoring team', 'error');
    }
  };
  
  // Add a match to favorites with enhanced feedback
  const addMatchToFavorites = async (matchId: string) => {
    try {
      // Find match for notification
      const match = matches?.find(m => m.id === matchId);
      if (!match) return;
      
      // Check if already in favorites
      if (favoriteMatchIds.includes(matchId)) {
        showNotification(`This match is already in your favorites`, 'info');
        return;
      }
      
      // Get complete user preferences
      const currentPrefs = ensureCompletePreferences(user?.preferences);
      
      // Optimistic update
      setFavoriteMatchIds(prev => [...prev, matchId]);
      
      // Optional haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([15, 10, 15]);
      }
      
      // Update preferences in backend
      const updatedPrefs = {
        ...currentPrefs,
        favoriteMatches: [...currentPrefs.favoriteMatches, matchId]
      };
      
      await updateUserPreferences(updatedPrefs);
      showNotification(`${match.homeTeam.name} vs ${match.awayTeam.name} added to favorites`, 'success');
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} added match ${matchId} to favorites`);
    } catch (error) {
      console.error('Error adding match to favorites:', error);
      showNotification('Error adding to favorites', 'error');
      // Revert local state change on error
      setFavoriteMatchIds(prev => prev.filter(id => id !== matchId));
    }
  };
  
  // Actually remove a match from favorites (after confirmation)
  const removeMatchFromFavorites = async () => {
    try {
      const matchId = deleteConfirmation.id;
      const matchName = deleteConfirmation.name;
      
      // Close the confirmation dialog first
      setDeleteConfirmation(prev => ({ ...prev, isOpen: false }));
      
      // Store for potential undo
      setLastDeletedItem({
        type: 'match',
        id: matchId,
        name: matchName
      });
      
      // Optimistic update
      setFavoriteMatchIds(prev => prev.filter(id => id !== matchId));
      
      // Optional haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }
      
      // Update preferences in backend
      const currentPrefs = ensureCompletePreferences(user?.preferences);
      const updatedPrefs = {
        ...currentPrefs,
        favoriteMatches: currentPrefs.favoriteMatches.filter(id => id !== matchId)
      };
      
      await updateUserPreferences(updatedPrefs);
      
      // Show notification with undo option
      const notificationId = Date.now().toString();
      setNotifications(prev => [...prev, { 
        id: notificationId, 
        message: `${matchName} removed from favorites`, 
        type: 'success'
      }]);
      
      console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} removed match ${matchId} from favorites`);
    } catch (error) {
      console.error('Error removing match from favorites:', error);
      showNotification('Error removing from favorites', 'error');
      // Reload original favorites on error
      if (user && user.preferences) {
        setFavoriteMatchIds(user.preferences.favoriteMatches || []);
      }
    }
  };
  
  // Undo last match deletion
  const undoMatchRemoval = async () => {
    if (!lastDeletedItem || lastDeletedItem.type !== 'match') return;
    
    try {
      const matchId = lastDeletedItem.id;
      
      // Update local state
      setFavoriteMatchIds(prev => [...prev, matchId]);
      
      // Update preferences in backend
      const currentPrefs = ensureCompletePreferences(user?.preferences);
      const updatedPrefs = {
        ...currentPrefs,
        favoriteMatches: [...currentPrefs.favoriteMatches, matchId]
      };
      
      await updateUserPreferences(updatedPrefs);
      showNotification(`${lastDeletedItem.name} restored to favorites`, 'success');
      
      // Clear the undo data
      setLastDeletedItem(null);
    } catch (error) {
      console.error('Error restoring match:', error);
      showNotification('Error restoring match', 'error');
    }
  };
  
  // Handle undo based on last deleted item
  const handleUndo = () => {
    if (!lastDeletedItem) return;
    
    if (lastDeletedItem.type === 'team') {
      undoTeamRemoval();
    } else {
      undoMatchRemoval();
    }
  };
  
  // Filter teams by search query with debounce
  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return allTeams;
    
    return allTeams.filter(team => 
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.league.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allTeams, searchQuery]);
  
  // Filter matches by search query with debounce
  const filteredMatches = useMemo(() => {
    if (!matches) return [];
    if (!searchQuery.trim()) return matches;
    
    return matches.filter(match => 
      match.homeTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.awayTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.league.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [matches, searchQuery]);
  
  // Get available leagues for filtering
  const availableLeagues = useMemo(() => {
    const leagueSet = new Set<string>();
    allTeams.forEach(team => {
      if (team.league) leagueSet.add(team.league);
    });
    return Array.from(leagueSet).sort();
  }, [allTeams]);
  
  // Filter teams by league if filter is set
  const teamsToShow = useMemo(() => {
    if (!filteredTeams) return [];
    return filterLeague 
      ? filteredTeams.filter(team => team.league === filterLeague)
      : filteredTeams;
  }, [filteredTeams, filterLeague]);
  
  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
  };
  
  // Handle pull-to-refresh on mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (contentRef.current && window.scrollY === 0) {
      setTouchStart(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStart && window.scrollY === 0 && contentRef.current) {
      const touchY = e.touches[0].clientY;
      const distance = touchY - touchStart;
      
      if (distance > 5) {
        e.preventDefault(); // Prevent default scrolling
        setIsPullingToRefresh(true);
        setPullDistance(Math.min(distance, 150));
      }
    }
  };

  const handleTouchEnd = async () => {
    if (isPullingToRefresh && pullDistance > 60) {
      setIsRefreshing(true);
      
      try {
        await refreshMatchData();
        showNotification('Favorites refreshed successfully', 'success');
      } catch (err) {
        console.error('Error refreshing data:', err);
        showNotification('Failed to refresh data', 'error');
      } finally {
        setIsRefreshing(false);
        setIsPullingToRefresh(false);
        setPullDistance(0);
        setTouchStart(null);
      }
    } else {
      setIsPullingToRefresh(false);
      setPullDistance(0);
      setTouchStart(null);
    }
  };
  
  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      await refreshMatchData();
      showNotification('Favorites refreshed successfully', 'success');
    } catch (err) {
      console.error('Error refreshing data:', err);
      showNotification('Failed to refresh data', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Tab switching with animation
  const switchTab = (tab: 'teams' | 'matches') => {
    if (tab === activeTab) return;
    
    // Apply transition class
    document.getElementById('favorites-content')?.classList.add('animate-tabTransition');
    
    // Change tab after a short delay for animation
    setTimeout(() => {
      setActiveTab(tab);
      // Remove transition class
      document.getElementById('favorites-content')?.classList.remove('animate-tabTransition');
    }, 150);
  };

  // Open modal with specified tab
  const openAddModal = (tab?: 'teams' | 'matches') => {
    if (tab) {
      setModalTab(tab);
    } else {
      setModalTab(activeTab);
    }
    setShowAddModal(true);
    
    // Focus search input when modal opens (after render)
    setTimeout(() => {
      const modalSearchInput = document.getElementById('modal-search-input');
      if (modalSearchInput) {
        (modalSearchInput as HTMLInputElement).focus();
      }
    }, 100);
  };
  
  // Navigate to match details
  const goToMatchDetails = useCallback((matchId: string, tab?: string) => {
    const url = tab ? `/match/${matchId}?tab=${tab}` : `/match/${matchId}`;
    router.push(url);
  }, [router]);
  
  // Set match reminder
  const setMatchReminder = useCallback((matchId: string) => {
    const match = matches?.find(m => m.id === matchId);
    if (!match) return;
    
    // Here you'd implement actual reminder logic
    
    // For demo purposes, just show a notification
    showNotification(`Reminder set for ${match.homeTeam.name} vs ${match.awayTeam.name}`, 'success');
  }, [matches]);
  
  return (
    <div 
      className="space-y-6" 
      ref={contentRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      {isPullingToRefresh && (
        <div 
          className="fixed top-0 left-0 right-0 z-50 flex justify-center items-start pointer-events-none"
          style={{ height: `${pullDistance}px` }}
        >
          <div className="mt-4 flex flex-col items-center">
            <FiRefreshCw 
              size={24} 
              className={`text-indigo-400 ${pullDistance > 60 ? 'animate-spin' : ''}`}
              style={{ transform: `rotate(${pullDistance * 2}deg)` }}
            />
            <span className="text-xs text-indigo-400 mt-1">
              {pullDistance > 60 ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </div>
        </div>
      )}
      
      {/* Stacked notifications with undo support */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {notifications.map(notification => (
          <div key={notification.id} className="pointer-events-auto">
            <NotificationToast 
              notification={notification}
              onClose={() => hideNotification(notification.id)}
              onUndo={lastDeletedItem ? handleUndo : undefined}
            />
          </div>
        ))}
      </div>
      
      {/* Keyboard shortcuts helper - visible on ? key press */}
      <div className="fixed bottom-4 right-4 z-40">
        <Tooltip text="Show keyboard shortcuts (Alt+/)">
          <button 
            onClick={() => showNotification("Keyboard shortcuts: '/' to search, Alt+T/M for tabs, Alt+A to add favorites, Esc to close dialogs", 'info')}
            className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-colors"
            aria-label="Show keyboard shortcuts"
          >
            <span className="text-sm font-mono">?</span>
          </button>
        </Tooltip>
      </div>
      
      {/* Favorites header with tabs */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 sm:p-6 shadow-lg border border-slate-700/50 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div className="animate-fadeIn">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FiHeart className="text-rose-500" />
              <span>My Favorites</span>
            </h2>
            <p className="text-slate-400 mt-1">Manage your favorite teams and matches</p>
          </div>
          
          <div className="flex space-x-2 relative">
            <button
              onClick={() => switchTab('teams')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'teams' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              aria-label="View favorite teams"
              aria-pressed={activeTab === 'teams'}
            >
              Teams
            </button>
            <button
              onClick={() => switchTab('matches')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'matches' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              aria-label="View favorite matches"
              aria-pressed={activeTab === 'matches'}
            >
              Matches
            </button>
          </div>
        </div>
        
        {/* Current date and refresh button */}
        <div className="flex justify-between items-center mb-4 text-xs">
          <span className="text-slate-400">
            {new Date(CURRENT_TIMESTAMP).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          <Tooltip text="Refresh data">
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors px-2 py-1 rounded hover:bg-slate-800/50"
              aria-label="Refresh favorites"
            >
              <FiRefreshCw className={`${isRefreshing ? 'animate-spin' : ''}`} size={14} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </Tooltip>
        </div>
        
        {/* Search and filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center mb-6 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <div className="relative w-full sm:max-w-xs group">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" size={18} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={activeTab === 'teams' ? "Search for a team... (Press '/')" : "Search for a match... (Press '/')"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              aria-label={activeTab === 'teams' ? "Search teams" : "Search matches"}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                aria-label="Clear search"
              >
                <FiX size={16} />
              </button>
            )}
          </div>
          
          {activeTab === 'teams' && (
            <div className="relative w-full sm:w-auto">
              <select
                value={filterLeague || ''}
                onChange={(e) => setFilterLeague(e.target.value || null)}
                className="w-full appearance-none pl-10 pr-10 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all cursor-pointer"
                aria-label="Filter by league"
              >
                <option value="">All leagues</option>
                {availableLeagues.map(league => (
                  <option key={league} value={league}>{league}</option>
                ))}
              </select>
              <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            </div>
          )}
          
          <button
            onClick={() => openAddModal()}
            className="sm:ml-auto w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all shadow hover:shadow-lg active:scale-95"
            disabled={isRefreshing}
            aria-label="Add favorites"
          >
            <FiPlus size={18} />
            <span>Add Favorites</span>
          </button>
        </div>
        
        {/* Main content area with optimized loading states */}
        <div id="favorites-content" className="min-h-[200px]" aria-live="polite">
          {loadingFavorites ? (
            // Skeleton loaders based on active tab
            <div className="space-y-4">
              {activeTab === 'teams' ? (
                <>
                  <TeamSkeletonLoader />
                  <TeamSkeletonLoader />
                </>
              ) : (
                <>
                  <MatchSkeletonLoader />
                  <MatchSkeletonLoader />
                  <MatchSkeletonLoader />
                </>
              )}
            </div>
          ) : (
            <>
              {/* Teams tab content */}
              {activeTab === 'teams' && (
                <>
                  {favoriteTeams.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 bg-slate-700/30 rounded-xl text-slate-400 border border-slate-700/50 animate-fadeIn">
                      <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center mb-4">
                        <FiHeart size={32} className="text-slate-500 animate-pulse" />
                      </div>
                      <p className="text-lg text-slate-300 font-medium">You don't have any favorite teams yet</p>
                      <p className="mt-2 text-slate-400 text-center px-4">Add teams to your favorites to follow their upcoming matches</p>
                      <button
                        onClick={() => openAddModal('teams')}
                        className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all flex items-center gap-2 shadow hover:shadow-lg active:scale-95"
                      >
                        <FiPlus size={16} />
                        <span>Add Teams</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {favoriteTeams.map((team, index) => (
                        <div 
                          key={team.id} 
                          className="bg-gradient-to-br from-slate-700/30 to-slate-800/30 rounded-xl p-5 hover:bg-slate-700/40 transition-all border border-slate-700/50 shadow hover:shadow-lg animate-fadeIn group"
                          style={{ animationDelay: `${index * 0.05}s` }}
                          tabIndex={0}
                          role="article"
                          aria-label={`${team.name} team card`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-slate-800 p-1 flex items-center justify-center overflow-hidden shadow-md group-hover:scale-105 transition-transform relative">
                                {team.logo ? (
                                  <img 
                                    src={team.logo}
                                    alt={team.name}
                                    className="w-10 h-10 object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = PLACEHOLDER_TEAM_IMG;
                                    }}
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-slate-700 flex items-center justify-center text-xs text-slate-300">
                                    {team.name.substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div>
                                <h3 className="font-medium text-white">{team.name}</h3>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                  <span>{team.league}</span>
                                  <span className="inline-block w-1 h-1 rounded-full bg-slate-600"></span>
                                  <span>{team.country}</span>
                                </div>
                              </div>
                            </div>
                            <Tooltip text="Remove from favorites">
                              <button
                                onClick={() => confirmRemoveTeam(team.id)}
                                className="text-slate-400 hover:text-red-500 transition-colors p-1.5 hover:bg-slate-800/60 rounded-full"
                                aria-label={`Remove ${team.name} from favorites`}
                              >
                                <FiTrash2 size={16} className="opacity-70 group-hover:opacity-100" />
                              </button>
                            </Tooltip>
                          </div>
                          
                          {team.nextMatch && (
                            <div className="mt-4 border-t border-slate-700/70 pt-4">
                              <p className="text-xs text-indigo-400 font-medium mb-2 flex items-center gap-1">
                                <FiCalendar size={12} />
                                <span>NEXT MATCH</span>
                              </p>
                              <div className="flex items-center">
                                <div className="flex-1 text-right mr-2">
                                  <p className="font-medium text-white">{team.nextMatch.isHome ? team.name : team.nextMatch.opponent}</p>
                                </div>
                                <div className="text-xs bg-slate-800 px-2 py-1 rounded-md text-slate-300">VS</div>
                                <div className="flex-1 ml-2">
                                  <p className="font-medium text-white">{team.nextMatch.isHome ? team.nextMatch.opponent : team.name}</p>
                                </div>
                              </div>
                              <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                                <span>{team.nextMatch.competition}</span>
                                <span>{formatDateToDisplay(team.nextMatch.date)} • {team.nextMatch.time}</span>
                              </div>
                              <div className="mt-3 flex items-center justify-end gap-2">
                                <Tooltip text="Add match to favorites">
                                  <button 
                                    className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-slate-700/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                    onClick={() => addMatchToFavorites(team.nextMatch.matchId)}
                                    aria-label="Add match to favorites"
                                  >
                                    <FiHeart size={12} className="text-rose-400" />
                                    <span>Favorite</span>
                                  </button>
                                </Tooltip>
                                <Tooltip text="View match details">
                                  <button 
                                    className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-indigo-600/90 hover:bg-indigo-600 text-white transition-colors"
                                    onClick={() => goToMatchDetails(team.nextMatch.matchId)}
                                    aria-label="View match details"
                                  >
                                    <FiEye size={12} />
                                    <span>Details</span>
                                  </button>
                                </Tooltip>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              
              {/* Matches tab content */}
              {activeTab === 'matches' && (
                <>
                  {favoriteMatches.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 bg-slate-700/30 rounded-xl text-slate-400 border border-slate-700/50 animate-fadeIn">
                      <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center mb-4">
                        <FiCalendar size={32} className="text-slate-500 animate-pulse" />
                      </div>
                      <p className="text-lg text-slate-300 font-medium">You don't have any favorite matches yet</p>
                      <p className="mt-2 text-slate-400 text-center px-4">Add matches to follow their scores and updates</p>
                      <button
                        onClick={() => openAddModal('matches')}
                        className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all flex items-center gap-2 shadow hover:shadow-lg active:scale-95"
                      >
                        <FiPlus size={16} />
                        <span>Add Matches</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {favoriteMatches.map((match, index) => (
                        <div 
                          key={match.id} 
                          className="p-4 rounded-xl bg-slate-700/20 hover:bg-slate-700/30 border border-slate-700/50 transition-all cursor-pointer transform hover:scale-[1.01] animate-fadeIn group"
                          onClick={() => goToMatchDetails(match.id)}
                          style={{ animationDelay: `${index * 0.05}s` }}
                          tabIndex={0}
                          role="article"
                          aria-label={`${match.homeTeam.name} versus ${match.awayTeam.name} match`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-grow">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {match.league.logo ? (
                                    <img 
                                      src={match.league.logo} 
                                      alt={match.league.name}
                                      className="w-5 h-5 rounded-full object-contain"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = PLACEHOLDER_LEAGUE_IMG;
                                      }}
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-slate-700 p-0.5 flex items-center justify-center text-[8px]">
                                      <span>{match.league.name.substring(0, 2)}</span>
                                    </div>
                                  )}
                                  <span className="text-indigo-400 text-sm">{match.league.name}</span>
                                </div>
                                <p className="text-xs text-slate-400 font-medium">{formatDateToDisplay(match.date)}</p>
                              </div>
                              <div className="flex items-center justify-between my-3">
                                <div className="flex items-center gap-3">
                                  {match.homeTeam.logo ? (
                                    <img 
                                      src={match.homeTeam.logo} 
                                      alt={match.homeTeam.name}
                                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-contain bg-slate-800/50 p-1 group-hover:scale-105 transition-transform"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = PLACEHOLDER_TEAM_IMG;
                                      }}
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                                      <span className="text-xs font-medium">{match.homeTeam.name.substring(0, 2)}</span>
                                    </div>
                                  )}
                                  <span className="font-medium text-white">{match.homeTeam.name}</span>
                                </div>
                                
                                {match.status === 'live' || match.status === 'finished' ? (
                                  <div className="px-3 py-1 rounded text-sm font-medium text-white bg-slate-800 border border-slate-700 shadow-inner">
                                    {match.score?.home} - {match.score?.away}
                                  </div>
                                ) : (
                                  <div className="px-3 py-1 rounded text-sm font-medium text-slate-300">
                                    VS
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-3">
                                  <span className="font-medium text-white">{match.awayTeam.name}</span>
                                  {match.awayTeam.logo ? (
                                    <img 
                                      src={match.awayTeam.logo} 
                                      alt={match.awayTeam.name}
                                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-contain bg-slate-800/50 p-1 group-hover:scale-105 transition-transform"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = PLACEHOLDER_TEAM_IMG;
                                      }}
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                                      <span className="text-xs font-medium">{match.awayTeam.name.substring(0, 2)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 text-xs text-slate-400">
                                  <FiMap size={12} />
                                  <span>{match.venue}</span>
                                </div>
                                                                <div className="flex items-center gap-1 text-xs text-slate-400">
                                  <FiClock size={12} />
                                  <span>{match.time}</span>
                                </div>
                              </div>
                            </div>
                            <Tooltip text="Remove from favorites">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  confirmRemoveMatch(match.id);
                                }}
                                className="text-slate-400 hover:text-red-500 transition-colors p-1.5 hover:bg-slate-800/60 rounded-full ml-3"
                                aria-label="Remove this match from favorites"
                              >
                                <FiTrash2 size={16} className="opacity-70 group-hover:opacity-100" />
                              </button>
                            </Tooltip>
                          </div>
                          
                          {/* Match status badges */}
                          {match.status === 'live' && (
                            <div className="mt-3 pt-3 border-t border-slate-600/30 flex items-center">
                              <div className="flex items-center gap-1.5 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></div>
                                <span>LIVE</span>
                                {match.elapsed && <span>{match.elapsed}'</span>}
                              </div>
                              <div className="ml-auto flex gap-2">
                                <Tooltip text="View match statistics">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      goToMatchDetails(match.id, 'stats');
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
                                  >
                                    <FiBarChart2 size={12} />
                                    <span>Stats</span>
                                  </button>
                                </Tooltip>
                              </div>
                            </div>
                          )}
                          
                          {match.status === 'upcoming' && (
                            <div className="mt-3 pt-3 border-t border-slate-600/30 flex justify-end">
                              <Tooltip text="Get notified before the match starts">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMatchReminder(match.id);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
                                  aria-label="Set reminder for this match"
                                >
                                  <FiBell size={12} />
                                  <span>Set Reminder</span>
                                </button>
                              </Tooltip>
                            </div>
                          )}
                          
                          {match.status === 'finished' && (
                            <div className="mt-3 pt-3 border-t border-slate-600/30 flex justify-between items-center">
                              <div className="flex items-center gap-1.5 bg-slate-700/50 text-slate-400 px-3 py-1 rounded-full text-xs">
                                <FiCheckCircle size={12} />
                                <span>FINISHED</span>
                              </div>
                              <Tooltip text="View match details">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    goToMatchDetails(match.id, 'summary');
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded transition-colors"
                                >
                                  <FiBarChart2 size={12} />
                                  <span>Summary</span>
                                </button>
                              </Tooltip>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Recommended section with improved animation */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 sm:p-6 shadow-lg border border-slate-700/50 overflow-hidden">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 animate-fadeIn">
          <FiStar className="text-yellow-500" />
          <span>Recommended for You</span>
          <div className="ml-auto hidden sm:block text-xs text-slate-400">
            {activeTab === 'teams' ? 'Popular teams you might like' : 'Upcoming matches you might enjoy'}
          </div>
        </h3>
        
        {loadingFavorites ? (
          <div className="space-y-3">
            {activeTab === 'teams' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 bg-slate-700/30 p-3 rounded-lg animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-slate-600"></div>
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-slate-600 rounded-md mb-2"></div>
                    <div className="h-3 w-16 bg-slate-600/70 rounded-md"></div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-600"></div>
                </div>
                <div className="flex items-center gap-3 bg-slate-700/30 p-3 rounded-lg animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-slate-600"></div>
                  <div className="flex-1">
                    <div className="h-4 w-28 bg-slate-600 rounded-md mb-2"></div>
                    <div className="h-3 w-20 bg-slate-600/70 rounded-md"></div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-600"></div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-slate-700/30 p-3 rounded-lg animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-slate-600"></div>
                  <div className="flex-1">
                    <div className="h-4 w-48 bg-slate-600 rounded-md mb-2"></div>
                    <div className="h-3 w-32 bg-slate-600/70 rounded-md"></div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-600"></div>
                </div>
                <div className="flex items-center gap-3 bg-slate-700/30 p-3 rounded-lg animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-slate-600"></div>
                  <div className="flex-1">
                    <div className="h-4 w-56 bg-slate-600 rounded-md mb-2"></div>
                    <div className="h-3 w-28 bg-slate-600/70 rounded-md"></div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-600"></div>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'teams' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {allTeams
              .filter(team => !favoriteTeamIds.includes(team.id))
              .slice(0, 4)
              .map((team, index) => (
                <div 
                  key={team.id} 
                  className="flex items-center justify-between p-3.5 bg-slate-700/30 rounded-lg border border-slate-700/50 hover:bg-slate-700/50 transition-all animate-fadeIn group" 
                  style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 p-1 flex items-center justify-center overflow-hidden shadow group-hover:scale-105 transition-all">
                      {team.logo ? (
                        <img 
                          src={team.logo}
                          alt={team.name}
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = PLACEHOLDER_TEAM_IMG;
                          }}
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-slate-700 flex items-center justify-center text-xs text-slate-300">
                          {team.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">{team.name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{team.league}</span>
                        <span className="inline-block w-1 h-1 rounded-full bg-slate-600"></span>
                        <span>{team.country}</span>
                      </div>
                    </div>
                  </div>
                  <Tooltip text="Add to favorites">
                    <button
                      onClick={() => addTeamToFavorites(team.id)}
                      className="text-indigo-400 hover:text-white hover:bg-indigo-500 p-1.5 rounded-full transition-all active:scale-95"
                      aria-label={`Add ${team.name} to favorites`}
                    >
                      <FiPlus size={18} />
                    </button>
                  </Tooltip>
                </div>
              ))}
          </div>
        ) : (
          <div className="space-y-3">
            {matches
              ?.filter(match => !favoriteMatchIds.includes(match.id) && match.status === 'upcoming')
              .slice(0, 3)
              .map((match, index) => (
                <div 
                  key={match.id} 
                  className="flex items-center justify-between p-3.5 bg-slate-700/30 rounded-lg border border-slate-700/50 hover:bg-slate-700/50 transition-all animate-fadeIn group"
                  style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 p-1 flex items-center justify-center overflow-hidden shadow group-hover:scale-105 transition-all">
                      {match.homeTeam.logo ? (
                        <img 
                          src={match.homeTeam.logo}
                          alt={match.homeTeam.name}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = PLACEHOLDER_TEAM_IMG;
                          }}
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-slate-700 flex items-center justify-center text-xs text-slate-300">
                          {match.homeTeam.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-medium">{match.homeTeam.name}</span>
                        <span className="text-slate-400 text-xs">vs</span>
                        <span className="text-white font-medium">{match.awayTeam.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span>{match.league.name}</span>
                        <span className="inline-block w-1 h-1 rounded-full bg-slate-600"></span>
                        <span>{formatDateToDisplay(match.date)}</span>
                      </div>
                    </div>
                  </div>
                  <Tooltip text="Add to favorites">
                    <button
                      onClick={() => addMatchToFavorites(match.id)}
                      className="text-indigo-400 hover:text-white hover:bg-indigo-500 p-1.5 rounded-full transition-all active:scale-95"
                      aria-label="Add match to favorites"
                    >
                      <FiPlus size={18} />
                    </button>
                  </Tooltip>
                </div>
              ))}
              
              {/* View more button */}
              <div className="flex justify-center mt-2">
                <button 
                  onClick={() => openAddModal()}
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 px-4 py-2 rounded-lg border border-indigo-500/40 hover:border-indigo-500/70 transition-all text-sm"
                >
                  <FiArrowDown size={16} />
                  <span>View more recommendations</span>
                </button>
              </div>
          </div>
        )}
      </div>
      
      {/* Add to favorites modal with improved UX */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div 
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-xl border border-slate-700/50 animate-scaleIn"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-slate-800/90 backdrop-blur-sm py-2 -mt-2 -mx-6 px-6 z-10">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FiStar className="text-yellow-500" />
                <span>Add to Favorites</span>
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-2 hover:bg-slate-700/50 rounded-full transition-colors"
                aria-label="Close dialog"
              >
                <FiX size={20} />
              </button>
            </div>
            
            {/* Modal tabs */}
            <div className="flex mb-4 bg-slate-800/60 p-1 rounded-lg">
              <button
                onClick={() => setModalTab('teams')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  modalTab === 'teams' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                Teams
              </button>
              <button
                onClick={() => setModalTab('matches')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  modalTab === 'matches' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                Matches
              </button>
            </div>
            
            <div className="mb-4 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                id="modal-search-input"
                type="text"
                placeholder={`Search for ${modalTab === 'teams' ? 'teams' : 'matches'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                autoFocus
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  aria-label="Clear search"
                >
                  <FiX size={16} />
                </button>
              )}
            </div>
            
            {/* Modal content based on selected tab */}
            {modalTab === 'teams' ? (
              <>
                {loadingFavorites ? (
                  <div className="space-y-3 py-4">
                    <div className="flex items-center gap-3 bg-slate-700/30 p-3 rounded-lg animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-slate-600"></div>
                      <div className="flex-1">
                        <div className="h-4 w-24 bg-slate-600 rounded-md mb-2"></div>
                        <div className="h-3 w-16 bg-slate-600/70 rounded-md"></div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-600"></div>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-700/30 p-3 rounded-lg animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-slate-600"></div>
                      <div className="flex-1">
                        <div className="h-4 w-28 bg-slate-600 rounded-md mb-2"></div>
                        <div className="h-3 w-20 bg-slate-600/70 rounded-md"></div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-600"></div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 max-h-[50vh] overflow-y-auto pr-1">
                    {teamsToShow.length > 0 ? (
                      teamsToShow.map(team => {
                        const isInFavorites = favoriteTeamIds.includes(team.id);
                        
                        return (
                          <div 
                            key={team.id} 
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              isInFavorites 
                                ? 'border-indigo-500 bg-indigo-500/10' 
                                : 'border-slate-700 bg-slate-700/30 hover:bg-slate-700/50'
                            } transition-all`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-800 p-1 flex items-center justify-center overflow-hidden shadow-md">
                                {team.logo ? (
                                  <img 
                                    src={team.logo}
                                    alt={team.name}
                                    className="w-8 h-8 object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = PLACEHOLDER_TEAM_IMG;
                                    }}
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-8 h-8 bg-slate-700 flex items-center justify-center text-xs text-slate-300">
                                    {team.name.substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-white">{team.name}</p>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                  <span>{team.league}</span>
                                  <span className="inline-block w-1 h-1 rounded-full bg-slate-600"></span>
                                  <span>{team.country}</span>
                                </div>
                              </div>
                            </div>
                            
                            <Tooltip text={isInFavorites ? "Remove from favorites" : "Add to favorites"}>
                              <button
                                onClick={() => isInFavorites ? confirmRemoveTeam(team.id) : addTeamToFavorites(team.id)}
                                className={`flex items-center justify-center h-8 w-8 rounded-full transition-all ${
                                  isInFavorites 
                                    ? 'bg-indigo-500 text-white hover:bg-red-500' 
                                    : 'bg-slate-700 text-slate-300 hover:bg-indigo-500 hover:text-white'
                                }`}
                                aria-label={isInFavorites ? `Remove ${team.name} from favorites` : `Add ${team.name} to favorites`}
                              >
                                {isInFavorites ? <FiCheck size={16} /> : <FiPlus size={16} />}
                              </button>
                            </Tooltip>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-2 flex flex-col items-center justify-center py-8 text-slate-400">
                        <FiSearch size={36} className="text-slate-500 mb-2" />
                        <p>No teams found matching your search</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                {loadingFavorites ? (
                  <div className="space-y-3 py-4">
                    <div className="flex items-center gap-3 bg-slate-700/30 p-3 rounded-lg animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-slate-600"></div>
                      <div className="flex-1">
                        <div className="h-4 w-48 bg-slate-600 rounded-md mb-2"></div>
                        <div className="h-3 w-32 bg-slate-600/70 rounded-md"></div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-600"></div>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-700/30 p-3 rounded-lg animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-slate-600"></div>
                      <div className="flex-1">
                        <div className="h-4 w-56 bg-slate-600 rounded-md mb-2"></div>
                        <div className="h-3 w-28 bg-slate-600/70 rounded-md"></div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-600"></div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 mt-4 max-h-[50vh] overflow-y-auto pr-1">
                    {filteredMatches.filter(m => m.status !== 'finished').length > 0 ? (
                      filteredMatches.filter(m => m.status !== 'finished').map(match => {
                        const isInFavorites = favoriteMatchIds.includes(match.id);
                        
                        return (
                          <div 
                            key={match.id} 
                            className={`p-4 rounded-lg border ${
                              isInFavorites 
                                ? 'border-indigo-500 bg-indigo-500/10' 
                                : 'border-slate-700 bg-slate-700/30 hover:bg-slate-700/50'
                            } transition-all`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-grow">
                                <div className="flex items-center gap-2">
                                  {match.league.logo ? (
                                    <img 
                                      src={match.league.logo} 
                                      alt={match.league.name}
                                      className="w-5 h-5 rounded-full object-contain"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = PLACEHOLDER_LEAGUE_IMG;
                                      }}
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[8px]">
                                      <span>{match.league.name.substring(0, 2)}</span>
                                    </div>
                                  )}
                                  <span className="text-xs text-indigo-400 font-medium">{match.league.name}</span>
                                </div>
                                <div className="flex items-center mt-2 mb-2">
                                  <div className="flex-1 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-800/70 p-1 flex items-center justify-center">
                                      {match.homeTeam.logo ? (
                                        <img 
                                          src={match.homeTeam.logo} 
                                          alt={match.homeTeam.name} 
                                          className="w-6 h-6 object-contain"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = PLACEHOLDER_TEAM_IMG;
                                          }}
                                          loading="lazy"
                                        />
                                      ) : (
                                        <span className="text-[10px]">{match.homeTeam.name.substring(0, 2)}</span>
                                      )}
                                    </div>
                                    <span className="text-white">{match.homeTeam.name}</span>
                                  </div>
                                  <div className="px-2 text-slate-400 text-sm">vs</div>
                                  <div className="flex-1 flex items-center gap-2 justify-end">
                                    <span className="text-white">{match.awayTeam.name}</span>
                                    <div className="w-8 h-8 rounded-full bg-slate-800/70 p-1 flex items-center justify-center">
                                      {match.awayTeam.logo ? (
                                        <img 
                                          src={match.awayTeam.logo} 
                                          alt={match.awayTeam.name} 
                                          className="w-6 h-6 object-contain"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = PLACEHOLDER_TEAM_IMG;
                                          }}
                                          loading="lazy"
                                        />
                                      ) : (
                                        <span className="text-[10px]">{match.awayTeam.name.substring(0, 2)}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between text-xs text-slate-400">
                                  <div className="flex items-center gap-1">
                                    <FiCalendar size={12} />
                                    <span>{formatDateToDisplay(match.date)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <FiClock size={12} />
                                    <span>{match.time}</span>
                                  </div>
                                </div>
                                {match.status === 'live' && (
                                  <div className="mt-2 flex items-center">
                                    <div className="flex items-center gap-1 text-red-400 text-xs">
                                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></div>
                                      <span>LIVE NOW</span>
                                      {match.elapsed && <span>{match.elapsed}'</span>}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <Tooltip text={isInFavorites ? "Remove from favorites" : "Add to favorites"}>
                                <button
                                  onClick={() => isInFavorites ? confirmRemoveMatch(match.id) : addMatchToFavorites(match.id)}
                                  className={`flex items-center justify-center h-8 w-8 rounded-full transition-all ml-2 ${
                                    isInFavorites 
                                      ? 'bg-indigo-500 text-white hover:bg-red-500' 
                                      : 'bg-slate-700 text-slate-300 hover:bg-indigo-500 hover:text-white'
                                  }`}
                                  aria-label={isInFavorites ? "Remove from favorites" : "Add to favorites"}
                                >
                                  {isInFavorites ? <FiCheck size={16} /> : <FiPlus size={16} />}
                                </button>
                              </Tooltip>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                        <FiSearch size={36} className="text-slate-500 mb-2" />
                        <p>No matches found matching your search</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowAddModal(false);
                }}
                className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-lg transition-colors shadow"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowAddModal(false);
                  showNotification('Favorites updated successfully', 'success');
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow hover:shadow-lg active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete confirmation modal */}
      {deleteConfirmation.isOpen && (
        <DeleteConfirmationModal 
          deleteInfo={deleteConfirmation}
          onCancel={() => setDeleteConfirmation(prev => ({ ...prev, isOpen: false }))}
          onConfirm={deleteConfirmation.type === 'team' ? removeTeamFromFavorites : removeMatchFromFavorites}
        />
      )}
      
      {/* Add CSS for animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes tabTransition {
          0% { opacity: 1; transform: translateY(0); }
          50% { opacity: 0.8; transform: translateY(5px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
        
        .animate-tabTransition {
          animation: tabTransition 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}