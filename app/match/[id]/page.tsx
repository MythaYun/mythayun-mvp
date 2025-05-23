'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useMatchesDebug } from '@/lib/hooks/useFootBallDataDebug';
import { FootballMatch } from '@/lib/services/MatchesService';
import { useAuth } from '@/lib/contexts/AuthContext';
import { 
  FiArrowLeft, FiCalendar, FiClock, FiMap, 
  FiActivity, FiUsers, FiBarChart2, FiShare2, 
  FiMessageCircle, FiBell, FiBellOff, FiInfo,
  FiChevronUp, FiChevronDown, FiChevronsLeft,
  FiChevronsRight, FiX, FiMaximize2, FiHeart,
  FiCheckCircle, FiAlertCircle, FiPenTool,
  FiShield, FiTarget, FiZap, 
  FiFlag, FiVideo, FiWifi, FiEye, FiEyeOff,
  FiRefreshCw, FiCamera, FiMoreHorizontal,
  FiExternalLink,
  FiPieChart,
  FiUser,
  FiHelpCircle
} from 'react-icons/fi';
import { FaFutbol } from "react-icons/fa";

// Updated time and user
const CURRENT_TIMESTAMP = "2025-05-22 16:15:49";
const CURRENT_USER = "Sdiabate1337";

// Base64 encoded placeholder images
const PLACEHOLDER_LEAGUE_IMG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiMzNDNhNDAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPkw8L3RleHQ+PC9zdmc+";
const PLACEHOLDER_TEAM_IMG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiMzNDNhNDAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPlQ8L3RleHQ+PC9zdmc+";

// Tooltip component
const Tooltip = ({ children, text }: { children: React.ReactNode; text: string }) => {
  return (
    <div className="relative group">
      {children}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {text}
      </div>
    </div>
  );
};

// Example match stats format we'll use for visualization
interface MatchStats {
  possession: {
    home: number;
    away: number;
  };
  shots: {
    home: number;
    away: number;
  };
  shotsOnTarget: {
    home: number;
    away: number;
  };
  corners: {
    home: number;
    away: number;
  };
  fouls: {
    home: number;
    away: number;
  };
  yellowCards: {
    home: number;
    away: number;
  };
  redCards: {
    home: number;
    away: number;
  };
  offsides: {
    home: number;
    away: number;
  };
  xG: {
    home: number;
    away: number;
  };
}

// Match event types
type EventType = 'goal' | 'yellowCard' | 'redCard' | 'substitution' | 'penalty' | 'var' | 'ownGoal';

// Match event interface
interface MatchEvent {
  time: number;
  type: EventType;
  team: 'home' | 'away';
  player: string;
  detail: string;
  assistedBy?: string;
}

// Helper for date formatting (same as in EventsTab)
const formatDateToDisplay = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
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

// Enhanced toast notification
const Toast = ({ 
  message, 
  type, 
  icon,
  duration = 3000,
  onClose 
}: { 
  message: string; 
  type: 'success' | 'error' | 'info';
  icon?: React.ReactNode;
  duration?: number;
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    
    return () => clearTimeout(timer);
  }, [onClose, duration]);
  
  return (
    <div 
      className={`px-4 py-3 rounded-lg shadow-lg border animate-slideUp ${
        type === 'success' 
          ? 'bg-green-900/90 text-white border-green-700/50' 
          : type === 'error'
            ? 'bg-red-900/90 text-white border-red-700/50'
            : 'bg-slate-800/90 text-white border-slate-700/50'
      }`}
      role="alert"
    >
      <div className="flex items-center gap-2">
        {icon || (
          type === 'success' ? <FiCheckCircle className="text-green-400" /> : 
          type === 'error' ? <FiAlertCircle className="text-red-400" /> : 
          <FiInfo className="text-blue-400" />
        )}
        <span>{message}</span>
      </div>
    </div>
  );
};

// Improved horizontal bar component for statistics visualization
const StatBar = ({ 
  label, 
  homeValue, 
  awayValue, 
  homeColor = "bg-blue-500", 
  awayColor = "bg-red-500",
  homeTeam = "Home",
  awayTeam = "Away",
  animate = true
}: { 
  label: string,
  homeValue: number, 
  awayValue: number, 
  homeColor?: string, 
  awayColor?: string,
  homeTeam?: string,
  awayTeam?: string,
  animate?: boolean
}) => {
  const total = homeValue + awayValue;
  const homePercent = total > 0 ? (homeValue / total * 100) : 50;
  const awayPercent = total > 0 ? (awayValue / total * 100) : 50;
  
  return (
    <div className="mb-6 group">
      <div className="flex justify-between mb-2">
        <div className="flex items-center">
          <span className="text-white font-medium">{homeValue}</span>
          <span className={`ml-1.5 w-2 h-2 rounded-full ${homeColor.replace('bg-', 'bg-')}`}></span>
        </div>
        <span className="text-sm font-medium text-slate-300">{label}</span>
        <div className="flex items-center">
          <span className={`mr-1.5 w-2 h-2 rounded-full ${awayColor.replace('bg-', 'bg-')}`}></span>
          <span className="text-white font-medium">{awayValue}</span>
        </div>
      </div>
      <div className="h-4 rounded-full overflow-hidden shadow-inner bg-slate-700/30 flex transition-all">
        <div 
          className={`${homeColor} relative ${animate ? 'group-hover:opacity-90' : ''} transition-all duration-1000 ease-out ${animate ? 'animate-grow-bar' : ''}`} 
          style={{ width: `${homePercent}%`, transitionDelay: '0.1s' }}
        >
          {homePercent >= 20 && (
            <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-medium">
              {homeTeam}
            </span>
          )}
        </div>
        <div 
          className={`${awayColor} relative ${animate ? 'group-hover:opacity-90' : ''} transition-all duration-1000 ease-out ${animate ? 'animate-grow-bar' : ''}`} 
          style={{ width: `${awayPercent}%`, transitionDelay: '0.2s' }}
        >
          {awayPercent >= 20 && (
            <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-medium">
              {awayTeam}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Player card component for lineups
const PlayerCard = ({ 
  number, 
  name, 
  position, 
  teamColor = "blue",
  isCaptain = false,
  isFavorite = false,
  onToggleFavorite
}: { 
  number: number, 
  name: string, 
  position: string,
  teamColor?: "blue" | "red",
  isCaptain?: boolean,
  isFavorite?: boolean,
  onToggleFavorite?: () => void 
}) => {
  const bgColor = teamColor === "blue" ? "bg-blue-600/30" : "bg-red-600/30";
  const borderColor = teamColor === "blue" ? "border-blue-500/40" : "border-red-500/40";
  const textColor = teamColor === "blue" ? "text-blue-300" : "text-red-300";
  
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-700/50 active:bg-slate-700/70 transition-colors group relative">
      <div className={`w-8 h-8 rounded-full ${bgColor} border ${borderColor} flex items-center justify-center text-xs ${textColor} font-medium ${isCaptain ? 'ring-1 ring-yellow-400' : ''}`}>
        {number}
        {isCaptain && (
          <span className="absolute -top-1 -right-1 text-yellow-400 text-xs">C</span>
        )}
      </div>
      <div className="flex-1">
        <span className="text-white font-medium">{name}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-xs bg-slate-600/50 text-slate-300 px-2 py-1 rounded">
          {position}
        </div>
        {onToggleFavorite && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={`p-1.5 rounded-full transition-colors ${
              isFavorite 
                ? 'text-red-400 hover:bg-slate-700/70' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 opacity-0 group-hover:opacity-100'
            }`}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <FiHeart size={16} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        )}
      </div>
    </div>
  );
};

// Match event card component for the events timeline
const EventCard = ({ event, homeTeam, awayTeam }: { event: MatchEvent, homeTeam: string, awayTeam: string }) => {
  const getEventIcon = (type: EventType) => {
    switch (type) {
      case 'goal':
        return <FiTarget className="text-green-400" size={18} />;
      case 'yellowCard':
        return <div className="w-4 h-5 bg-yellow-400 rounded-sm"></div>;
      case 'redCard':
        return <div className="w-4 h-5 bg-red-500 rounded-sm"></div>;
      case 'substitution':
        return <FiArrowLeft className="text-blue-400" size={18} />;
      case 'penalty':
        return <FiFlag className="text-purple-400" size={18} />;
      case 'var':
        return <FiVideo className="text-indigo-400" size={18} />;
      case 'ownGoal':
        return <FiTarget className="text-orange-400" size={18} />;
      default:
        return <FiInfo size={18} />;
    }
  };

  const getEventBg = (type: EventType, team: 'home' | 'away') => {
    const baseClasses = team === 'home' 
      ? 'border-l-4 border-l-blue-500/70 ' 
      : 'border-r-4 border-r-red-500/70 ';
    
    switch (type) {
      case 'goal':
        return baseClasses + 'bg-green-900/20 border-green-700/30';
      case 'yellowCard':
        return baseClasses + 'bg-yellow-900/20 border-yellow-700/30';
      case 'redCard':
        return baseClasses + 'bg-red-900/20 border-red-700/30';
      case 'substitution':
        return baseClasses + 'bg-blue-900/20 border-blue-700/30';
      case 'penalty':
        return baseClasses + 'bg-purple-900/20 border-purple-700/30';
      case 'var':
        return baseClasses + 'bg-indigo-900/20 border-indigo-700/30';
      case 'ownGoal':
        return baseClasses + 'bg-orange-900/20 border-orange-700/30';
      default:
        return baseClasses + 'bg-slate-700/30 border-slate-600/30';
    }
  };
  
  return (
    <div className="flex items-start gap-4 animate-fadeIn">
      {/* Time bubble */}
      <div className={`w-10 h-10 rounded-full ${
        event.type === 'goal' 
          ? 'bg-green-900/40 border-2 border-green-600/50' 
          : event.type === 'yellowCard'
            ? 'bg-yellow-900/40 border-2 border-yellow-600/50'
            : event.type === 'redCard'
              ? 'bg-red-900/40 border-2 border-red-600/50'
              : 'bg-slate-700 border-2 border-slate-600'
      } flex items-center justify-center font-medium text-white relative z-10 shadow-md`}>
        {event.time}'
      </div>
      
      {/* Event details */}
      <div className={`flex-1 p-4 rounded-lg shadow-md ${
        getEventBg(event.type, event.team)
      } hover:brightness-110 transition-all`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {getEventIcon(event.type)}
            <span className="font-medium text-white">{event.player}</span>
          </div>
          <div className="text-sm bg-slate-800/60 text-slate-300 px-2 py-1 rounded-full">
            {event.team === 'home' ? homeTeam : awayTeam}
          </div>
        </div>
        <div className="text-sm text-slate-300">{event.detail}</div>
        {event.assistedBy && (
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <FiZap size={12} />
            <span>Assisted by {event.assistedBy}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Action button component for consistent UI
const ActionButton = ({ 
  icon, 
  text, 
  onClick,
  active = false,
  tooltip
}: { 
  icon: React.ReactNode;
  text?: string;
  onClick: () => void;
  active?: boolean;
  tooltip: string;
}) => (
  <Tooltip text={tooltip}>
    <button
      onClick={onClick}
      className={`p-2 rounded-lg transition-all flex items-center gap-2 ${
        active 
          ? 'bg-indigo-600/50 text-white hover:bg-indigo-600/70' 
          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700/80 hover:text-white'
      } active:scale-95 focus:outline-none focus:ring-1 focus:ring-slate-400`}
      aria-pressed={active}
    >
      {icon}
      {text && <span className="hidden sm:inline text-sm">{text}</span>}
    </button>
  </Tooltip>
);

// Skeleton loader for match card
const MatchHeaderSkeleton = () => (
  <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700/50 shadow-lg mb-6 animate-pulse">
    <div className="bg-slate-700/70 p-3">
      <div className="h-6 w-36 bg-slate-600 rounded-md"></div>
    </div>
    <div className="p-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center gap-3 md:flex-1">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-slate-700"></div>
          <div className="h-8 w-40 bg-slate-700 rounded-md"></div>
        </div>
        <div className="flex flex-col items-center md:flex-1">
          <div className="h-12 w-24 bg-slate-700 rounded-xl"></div>
          <div className="mt-4 space-y-2 w-full">
            <div className="h-5 bg-slate-700 rounded"></div>
            <div className="h-5 bg-slate-700 rounded"></div>
            <div className="h-5 bg-slate-700 rounded"></div>
          </div>
          <div className="h-10 w-36 bg-slate-700 rounded-lg mt-4"></div>
        </div>
        <div className="flex flex-col items-center gap-3 md:flex-1">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-slate-700"></div>
          <div className="h-8 w-40 bg-slate-700 rounded-md"></div>
        </div>
      </div>
    </div>
  </div>
);

// Action menu component
const ActionMenu = ({
  isOpen,
  onClose,
  actions
}: {
  isOpen: boolean;
  onClose: () => void;
  actions: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    color?: string;
  }[];
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 rounded-t-xl p-4 animate-slideUp"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-16 h-1 bg-slate-600 rounded-full mx-auto mb-4"></div>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick();
                onClose();
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg ${
                action.color || 'text-white hover:bg-slate-700/50'
              } transition-colors active:scale-98`}
            >
              <div className="p-2 bg-slate-700/50 rounded-full">
                {action.icon}
              </div>
              <span className="font-medium">{action.label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-4 p-3 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default function MatchDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  // Determine initial active tab from URL or default to stats
  const initialTab = searchParams.get('tab');
  
  const [match, setMatch] = useState<FootballMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowed, setIsFollowed] = useState(false);
  const [favoritePlayerIds, setFavoritePlayerIds] = useState<string[]>([]);
  const [matchStats, setMatchStats] = useState<MatchStats | null>(null);
  const [lineups, setLineups] = useState<any>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'lineups' | 'events'>(
    initialTab === 'lineups' ? 'lineups' : 
    initialTab === 'events' ? 'events' : 'stats'
  );
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error' | 'info'; icon?: React.ReactNode} | null>(null);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [spotlightMode, setSpotlightMode] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Refs
  const headerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef<number>(0);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const statsRef = useRef<HTMLDivElement>(null);
  const lineupsRef = useRef<HTMLDivElement>(null);
  const eventsRef = useRef<HTMLDivElement>(null);
  const contentRefs = useRef<{[key: string]: HTMLDivElement | null}>({
    stats: null,
    lineups: null,
    events: null
  });

  // Get match data using our debug hook
  const { matches, loading: matchesLoading, refreshData } = useMatchesDebug({
    useMockData: true
  });
  
  // Find the specific match by ID
  useEffect(() => {
    if (matches && matches.length > 0) {
      const foundMatch = matches.find(m => m.id === id);
      if (foundMatch) {
        setMatch(foundMatch);
        
        // Check if match is followed
        setIsFollowed(foundMatch.followedByUser || false);
        
        // Generate mock stats for visualization
        generateMockStats(foundMatch);
        
        // Generate mock lineups and events data
        generateMockLineups(foundMatch);
        generateMockEvents(foundMatch);
        
        setLoading(false);
        
        // Log view
        console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} viewed match ${id}`);
      } else {
        setError("Match not found");
        setLoading(false);
      }
    } else if (!matchesLoading) {
      setError("Failed to load match data");
      setLoading(false);
    }
  }, [matches, id, matchesLoading]);
  
  // Show keyboard shortcuts tip once
  useEffect(() => {
    if (!loading && !error && match && !showTips) {
      // Check if we've shown tips before
      const tipsShown = localStorage.getItem('match-tips-shown');
      
      if (!tipsShown) {
        // Wait a moment before showing tips
        const timer = setTimeout(() => {
          setToast({
            message: "Press 'S' for stats, 'L' for lineups, 'E' for events, 'F' to follow",
            type: 'info',
            icon: <FiInfo className="text-blue-400" />
          });
          setShowTips(true);
          localStorage.setItem('match-tips-shown', 'true');
        }, 2000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [loading, error, match, showTips]);

  // Update URL when tab changes for deep linking
  useEffect(() => {
    const url = new URL(window.location.href);
    if (activeTab !== 'stats') {
      url.searchParams.set('tab', activeTab);
    } else {
      url.searchParams.delete('tab');
    }
    
    // Replace state without full navigation
    window.history.replaceState({}, '', url.toString());
  }, [activeTab]);

  // Scroll handler for sticky header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 100) {
        // Hide header when scrolling down, show when scrolling up
        if (currentScrollY > lastScrollY.current + 10) {
          setHeaderVisible(false);
        } else if (currentScrollY < lastScrollY.current - 10) {
          setHeaderVisible(true);
        }
      } else {
        setHeaderVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle pull-to-refresh functionality
  useEffect(() => {
    let startY = 0;
    let currentY = 0;
    const MIN_PULL_DISTANCE = 80;
    const MAX_PULL_DISTANCE = 120;
    const pullIndicator = document.getElementById('pull-to-refresh-indicator');
    
    const handleTouchStart = (e: TouchEvent) => {
      // Only enable pull-to-refresh at the top of the page
      if (window.scrollY > 5) return;
      startY = e.touches[0].clientY;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      // Only enable pull-to-refresh at the top of the page
      if (window.scrollY > 5 || startY === 0) return;
      
      currentY = e.touches[0].clientY;
      const pullDistance = currentY - startY;
      
      if (pullDistance > 0 && !refreshing) {
        // Prevent natural scrolling
        e.preventDefault();
        
        // Calculate the pull percentage (0-100%)
        const pullPercentage = Math.min(100, (pullDistance / MAX_PULL_DISTANCE) * 100);
        
        // Update the indicator
        if (pullIndicator) {
          pullIndicator.style.transform = `translateY(${pullDistance * 0.4}px)`;
          pullIndicator.style.opacity = (pullPercentage / 100).toString();
          
          // Show "release to refresh" when pulled enough
          if (pullDistance > MIN_PULL_DISTANCE) {
            pullIndicator.classList.add('release-state');
          } else {
            pullIndicator.classList.remove('release-state');
          }
        }
      }
    };
    
    const handleTouchEnd = () => {
      const pullDistance = currentY - startY;
      
      if (pullDistance > MIN_PULL_DISTANCE && !refreshing) {
        // Execute refresh
        handleRefresh();
      }
      
      // Reset
      startY = 0;
      currentY = 0;
      if (pullIndicator) {
        pullIndicator.style.transform = 'translateY(0)';
        pullIndicator.style.opacity = '0';
        pullIndicator.classList.remove('release-state');
      }
    };
    
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [refreshing]);

  // Touch events for swipe navigation between tabs
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (!e.changedTouches[0]) return;
      
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX.current;
      const deltaY = Math.abs(touchEndY - touchStartY.current);
      
      // Only register as horizontal swipe if horizontal movement is greater than vertical
      // and greater than the minimum threshold
      if (Math.abs(deltaX) > 70 && deltaY < 100) {
        const tabs = ['stats', 'lineups', 'events'];
        const currentIndex = tabs.indexOf(activeTab);
        
        if (deltaX < 0 && currentIndex < tabs.length - 1) {
          // Swipe left - next tab
          setActiveTab(tabs[currentIndex + 1] as 'stats' | 'lineups' | 'events');
          
          // Provide haptic feedback if available
          if ('vibrate' in navigator) {
            navigator.vibrate(15);
          }
        } else if (deltaX > 0 && currentIndex > 0) {
          // Swipe right - previous tab
          setActiveTab(tabs[currentIndex - 1] as 'stats' | 'lineups' | 'events');
          
          // Provide haptic feedback if available
          if ('vibrate' in navigator) {
            navigator.vibrate(15);
          }
        }
      }
    };
    
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [activeTab]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if we're in an input, textarea, etc.
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      const key = e.key.toLowerCase();
      
      // Tab shortcuts
      if (key === 's') {
        setActiveTab('stats');
      } else if (key === 'l') {
        setActiveTab('lineups');
      } else if (key === 'e') {
        setActiveTab('events');
      } else if (key === 'f') {
        toggleFollowMatch();
      } else if (key === 'h' || key === 'backspace') {
        goBack();
      } else if (key === 'r') {
        handleRefresh();
      } else if (key === 'm') {
        toggleFullscreenMode();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Generate mock statistics for visualization
  const generateMockStats = (match: FootballMatch) => {
    // Create realistic-looking mock stats based on match status
    const isLive = match.status === 'live';
    const isFinished = match.status === 'finished';
    
    if (isLive || isFinished) {
      // Generate more realistic stats for live or finished matches
      const homeScore = match.score?.home || 0;
      const awayScore = match.score?.away || 0;
      
      // Generate stats that correlate somewhat with the score
      const homePossession = 40 + Math.floor(Math.random() * 25);
      const homeShots = homeScore * 2 + Math.floor(Math.random() * 8);
      const homeShotsOnTarget = homeScore + Math.floor(Math.random() * homeScore + 2);
      
      setMatchStats({
        possession: {
          home: homePossession,
          away: 100 - homePossession
        },
        shots: {
          home: homeShots,
          away: awayScore * 2 + Math.floor(Math.random() * 8)
        },
        shotsOnTarget: {
          home: homeShotsOnTarget,
          away: awayScore + Math.floor(Math.random() * awayScore + 2)
        },
        corners: {
          home: Math.floor(Math.random() * 10),
          away: Math.floor(Math.random() * 8)
        },
        fouls: {
          home: Math.floor(Math.random() * 12) + 5,
          away: Math.floor(Math.random() * 10) + 5
        },
        yellowCards: {
          home: Math.floor(Math.random() * 4),
          away: Math.floor(Math.random() * 4)
        },
        redCards: {
          home: Math.random() > 0.8 ? 1 : 0,
          away: Math.random() > 0.8 ? 1 : 0
        },
        offsides: {
          home: Math.floor(Math.random() * 5),
          away: Math.floor(Math.random() * 5)
        },
        xG: {
          home: parseFloat((Math.random() * 2 + homeScore * 0.5).toFixed(2)),
          away: parseFloat((Math.random() * 2 + awayScore * 0.5).toFixed(2))
        }
      });
    } else {
      // For upcoming matches, set predicted stats
      setMatchStats({
        possession: {
          home: 50,
          away: 50
        },
        shots: {
          home: 0,
          away: 0
        },
        shotsOnTarget: {
          home: 0,
          away: 0
        },
        corners: {
          home: 0,
          away: 0
        },
        fouls: {
          home: 0,
          away: 0
        },
        yellowCards: {
          home: 0,
          away: 0
        },
        redCards: {
          home: 0,
          away: 0
        },
        offsides: {
          home: 0,
          away: 0
        },
        xG: {
          home: 0,
          away: 0
        }
      });
    }
  };
  
  // Generate mock lineups
  const generateMockLineups = (match: FootballMatch) => {
    // Get relevant team names for lineup generation
    const homeName = match.homeTeam.name;
    const awayName = match.awayTeam.name;
    
    // Create more realistic lineup data
    setLineups({
      home: {
        formation: "4-3-3",
        coach: `${homeName} Coach`,
        players: [
          { id: "h1", number: 1, name: `${homeName} GK`, position: "GK", isCaptain: false },
          { id: "h2", number: 2, name: `${homeName} LB`, position: "DEF", isCaptain: false },
          { id: "h3", number: 5, name: `${homeName} CB`, position: "DEF", isCaptain: true },
          { id: "h4", number: 6, name: `${homeName} CB2`, position: "DEF", isCaptain: false },
          { id: "h5", number: 3, name: `${homeName} RB`, position: "DEF", isCaptain: false },
          { id: "h6", number: 8, name: `${homeName} CM`, position: "MID", isCaptain: false },
          { id: "h7", number: 10, name: `${homeName} CAM`, position: "MID", isCaptain: false },
          { id: "h8", number: 6, name: `${homeName} CDM`, position: "MID", isCaptain: false },
          { id: "h9", number: 11, name: `${homeName} LW`, position: "FWD", isCaptain: false },
          { id: "h10", number: 9, name: `${homeName} ST`, position: "FWD", isCaptain: false },
          { id: "h11", number: 7, name: `${homeName} RW`, position: "FWD", isCaptain: false }
        ]
      },
      away: {
        formation: "4-2-3-1",
        coach: `${awayName} Coach`,
        players: [
          { id: "a1", number: 1, name: `${awayName} GK`, position: "GK", isCaptain: false },
          { id: "a2", number: 2, name: `${awayName} LB`, position: "DEF", isCaptain: false },
          { id: "a3", number: 4, name: `${awayName} CB`, position: "DEF", isCaptain: false },
          { id: "a4", number: 5, name: `${awayName} CB2`, position: "DEF", isCaptain: true },
          { id: "a5", number: 3, name: `${awayName} RB`, position: "DEF", isCaptain: false },
          { id: "a6", number: 6, name: `${awayName} CDM`, position: "MID", isCaptain: false },
          { id: "a7", number: 8, name: `${awayName} CM`, position: "MID", isCaptain: false },
          { id: "a8", number: 10, name: `${awayName} CAM`, position: "MID", isCaptain: false },
          { id: "a9", number: 11, name: `${awayName} LW`, position: "FWD", isCaptain: false },
          { id: "a10", number: 9, name: `${awayName} ST`, position: "FWD", isCaptain: false },
          { id: "a11", number: 7, name: `${awayName} RW`, position: "FWD", isCaptain: false }
        ]
      }
    });
  };
  
  // Generate mock match events
  const generateMockEvents = (match: FootballMatch) => {
    if (match.status === 'upcoming') {
      setEvents([]);
      return;
    }
    
    // Get score information to generate meaningful events
    const homeScore = match.score?.home || 0;
    const awayScore = match.score?.away || 0;
    
    // Generate more realistic events based on scores
    const mockEvents: MatchEvent[] = [];
    
    // Add home team goals
    for (let i = 0; i < homeScore; i++) {
      const time = Math.floor(Math.random() * 90) + 1;
      const isAssisted = Math.random() > 0.3;
      
      mockEvents.push({
        time,
        type: Math.random() > 0.9 ? 'penalty' : Math.random() > 0.8 ? 'ownGoal' : 'goal',
        team: 'home',
        player: `${match.homeTeam.name} Player ${Math.floor(Math.random() * 11) + 1}`,
        detail: Math.random() > 0.9 ? 'Goal from penalty' : 'Goal from open play',
        assistedBy: isAssisted ? `${match.homeTeam.name} Player ${Math.floor(Math.random() * 11) + 1}` : undefined
      });
    }
    
    // Add away team goals
    for (let i = 0; i < awayScore; i++) {
      const time = Math.floor(Math.random() * 90) + 1;
      const isAssisted = Math.random() > 0.3;
      
      mockEvents.push({
        time,
        type: Math.random() > 0.9 ? 'penalty' : Math.random() > 0.8 ? 'ownGoal' : 'goal',
        team: 'away',
        player: `${match.awayTeam.name} Player ${Math.floor(Math.random() * 11) + 1}`,
        detail: Math.random() > 0.9 ? 'Goal from penalty' : 'Goal from open play',
        assistedBy: isAssisted ? `${match.awayTeam.name} Player ${Math.floor(Math.random() * 11) + 1}` : undefined
      });
    }
    
    // Add yellow cards
    const yellowCardCount = Math.floor(Math.random() * 6) + 1;
    for (let i = 0; i < yellowCardCount; i++) {
      mockEvents.push({
        time: Math.floor(Math.random() * 90) + 1,
        type: 'yellowCard',
        team: Math.random() > 0.5 ? 'home' : 'away',
        player: Math.random() > 0.5 
          ? `${match.homeTeam.name} Player ${Math.floor(Math.random() * 11) + 1}`
          : `${match.awayTeam.name} Player ${Math.floor(Math.random() * 11) + 1}`,
        detail: 'Foul'
      });
    }
    
    // Maybe add a red card
    if (Math.random() > 0.7) {
      mockEvents.push({
        time: Math.floor(Math.random() * 90) + 1,
        type: 'redCard',
        team: Math.random() > 0.5 ? 'home' : 'away',
        player: Math.random() > 0.5 
          ? `${match.homeTeam.name} Player ${Math.floor(Math.random() * 11) + 1}`
          : `${match.awayTeam.name} Player ${Math.floor(Math.random() * 11) + 1}`,
        detail: Math.random() > 0.5 ? 'Serious foul play' : 'Second yellow card'
      });
    }
    
    // Add substitutions
    const subCount = Math.floor(Math.random() * 6) + 2;
    for (let i = 0; i < subCount; i++) {
      const team = Math.random() > 0.5 ? 'home' : 'away';
      const teamName = team === 'home' ? match.homeTeam.name : match.awayTeam.name;
      
      mockEvents.push({
        time: Math.floor(Math.random() * 75) + 15, // Subs usually happen after 15 minutes
        type: 'substitution',
        team,
        player: `${teamName} Player ${Math.floor(Math.random() * 11) + 1}`,
        detail: `Out: ${teamName} Player ${Math.floor(Math.random() * 11) + 1}, In: ${teamName} Player ${Math.floor(Math.random() * 10) + 12}`
      });
    }
    
    // Sort events by time
    mockEvents.sort((a, b) => a.time - b.time);
    
    // Add VAR decisions
    if (Math.random() > 0.7) {
      mockEvents.push({
        time: Math.floor(Math.random() * 90) + 1,
        type: 'var',
        team: Math.random() > 0.5 ? 'home' : 'away',
        player: '',
        detail: Math.random() > 0.5 ? 'Goal disallowed for offside' : 'Penalty decision confirmed'
      });
    }
    
    setEvents(mockEvents);
  };
  
  // Toggle player favorite status
  const togglePlayerFavorite = (playerId: string) => {
    setFavoritePlayerIds(prev => {
      const wasFavorite = prev.includes(playerId);
      
      // Update storage
      const updatedFavorites = wasFavorite
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId];
      
      // Show toast
      setToast({
        message: wasFavorite 
          ? "Player removed from favorites"
          : "Player added to favorites",
        type: wasFavorite ? 'info' : 'success',
        icon: <FiHeart className={wasFavorite ? "text-slate-400" : "text-red-400"} />
      });
      
      // Save to local storage for persistence
      try {
        localStorage.setItem('favorite-players', JSON.stringify(updatedFavorites));
      } catch (error) {
        console.error("Error saving favorites to localStorage:", error);
      }
      
      return updatedFavorites;
    });
  };
  
  // Load favorite players from localStorage
  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem('favorite-players');
      if (storedFavorites) {
        setFavoritePlayerIds(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error("Error loading favorites from localStorage:", error);
    }
  }, []);
  
  // Toggle follow match with notification feedback
  const toggleFollowMatch = useCallback(() => {
    const newFollowState = !isFollowed;
    
    // Toggle local state
    setIsFollowed(newFollowState);
    
    // Show toast notification
    setToast({
      message: newFollowState 
        ? `You are now following this match` 
        : `You've unfollowed this match`,
      type: newFollowState ? 'success' : 'info',
      icon: newFollowState ? <FiBell className="text-green-400" /> : <FiBellOff className="text-slate-400" />
    });
    
    // Provide haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(newFollowState ? [10, 30, 10] : 50);
    }
    
    // Log action with the current timestamp
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} ${newFollowState ? 'followed' : 'unfollowed'} match ${id}`);
    
    // Here you would integrate with your notifications system
    if (newFollowState) {
      requestNotificationPermission();
    }
  }, [isFollowed, id]);
  
  // Request permission for notifications
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return;
    }
    
    if (Notification.permission === "granted") {
      scheduleMatchNotifications();
    } else if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        scheduleMatchNotifications();
      }
    }
  };
  
  // Schedule notifications for the match
  const scheduleMatchNotifications = () => {
    if (!match) return;
    
    // Logic to schedule notifications based on match time
    const matchDate = new Date(`${match.date} ${match.time}`);
    const now = new Date();
    
    if (matchDate > now) {
      // Store this in localStorage or your backend
      const matchReminder = {
        id: match.id,
        title: `⚽ ${match.homeTeam.name} vs ${match.awayTeam.name}`,
        body: `Starting soon!`,
        time: matchDate.getTime() - 15 * 60 * 1000, // 15 minutes before
      };
      
      console.log(`[${CURRENT_TIMESTAMP}] Scheduled notification for match ${match.id}`);
      
      // In a real app, you might use:
      // localStorage.setItem('matchReminders', JSON.stringify([...existingReminders, matchReminder]));
      
      // Show a test notification
      if (Notification.permission === "granted") {
        new Notification(`Match Followed: ${match.homeTeam.name} vs ${match.awayTeam.name}`, {
          body: 'You will be notified when this match starts.',
          icon: match.league.logo || PLACEHOLDER_LEAGUE_IMG
        });
      }
    }
  };
  
  // Share this match
  const shareMatch = async () => {
    if (!match) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
          text: `Check out this ${match.status === 'live' ? 'live' : ''} match between ${match.homeTeam.name} and ${match.awayTeam.name}!`,
          url: window.location.href,
        });
        
        console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} shared match ${match.id}`);
        
        // Show success toast
        setToast({
          message: "Match shared successfully",
          type: 'success',
          icon: <FiShare2 className="text-green-400" />
        });
      } catch (error) {
        // User cancelled or share failed
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error sharing:', error);
          
          // Show error toast
          setToast({
            message: "Couldn't share match",
            type: 'error',
            icon: <FiAlertCircle className="text-red-400" />
          });
        }
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href);
      
      setToast({
        message: 'Match link copied to clipboard',
        type: 'success',
        icon: <FiShare2 className="text-green-400" />
      });
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    if (refreshing) return;
    
    setRefreshing(true);
    setToast({
      message: "Refreshing match data...",
      type: 'info',
      icon: <FiRefreshCw className="text-blue-400 animate-spin" />
    });
    
    // Simulate refresh with a loading state
    setTimeout(() => {
      refreshData();
      
      // Clean up after refresh
      setRefreshing(false);
      setToast({
        message: "Match data updated",
        type: 'success',
        icon: <FiCheckCircle className="text-green-400" />
      });
      
      // Provide haptic feedback on mobile
      if ('vibrate' in navigator) {
        navigator.vibrate([10, 10, 10]);
      }
    }, 1000);
  };
  
  // Toggle fullscreen mode
  const toggleFullscreenMode = () => {
    setFullscreenMode(prev => !prev);
    
    // Log the action
    console.log(`[${CURRENT_TIMESTAMP}] ${CURRENT_USER} ${!fullscreenMode ? 'enabled' : 'disabled'} fullscreen mode`);
    
    // Show toast
    setToast({
      message: !fullscreenMode ? "Fullscreen mode activated" : "Exited fullscreen mode",
      type: 'info',
      icon: !fullscreenMode ? <FiMaximize2 className="text-blue-400" /> : <FiX className="text-blue-400" />
    });
  };
  
  // Toggle spotlight mode (focus on the match content by dimming everything else)
  const toggleSpotlightMode = () => {
    setSpotlightMode(prev => !prev);
    
    // Show toast
    setToast({
      message: !spotlightMode ? "Focus mode activated" : "Focus mode deactivated",
      type: 'info',
      icon: !spotlightMode ? <FiEye className="text-blue-400" /> : <FiEyeOff className="text-blue-400" />
    });
  };
  
  // Go back to previous page
  const goBack = () => {
    router.back();
  };

  // Handle tab change with animation
  const handleTabChange = (tab: 'stats' | 'lineups' | 'events') => {
    if (tab === activeTab) return;
    
    // Scroll to tab content
    if (contentRefs.current[tab]) {
      contentRefs.current[tab]?.scrollIntoView({ behavior: 'smooth' });
    }
    
    setActiveTab(tab);
    
    // Optional: provide haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  // Get action menu options
  const getActionMenuOptions = useCallback(() => {
    if (!match) return [];
    
    return [
      {
        icon: <FiShare2 className="text-blue-400" size={20} />,
        label: 'Share Match',
        onClick: shareMatch
      },
      {
        icon: <FiBell className={isFollowed ? "text-green-400" : "text-slate-400"} size={20} />,
        label: isFollowed ? 'Unfollow Match' : 'Follow Match',
        onClick: toggleFollowMatch
      },
      {
        icon: <FiRefreshCw className="text-blue-400" size={20} />,
        label: 'Refresh Data',
        onClick: handleRefresh
      },
      {
        icon: <FiMaximize2 className="text-indigo-400" size={20} />,
        label: fullscreenMode ? 'Exit Fullscreen' : 'Enter Fullscreen',
        onClick: toggleFullscreenMode
      },
      {
        icon: <FiEye className="text-purple-400" size={20} />,
        label: spotlightMode ? 'Exit Focus Mode' : 'Focus Mode',
        onClick: toggleSpotlightMode
      },
      {
        icon: <FiExternalLink className="text-slate-400" size={20} />,
        label: 'Open in New Tab',
        onClick: () => window.open(window.location.href, '_blank')
      }
    ];
  }, [match, isFollowed, fullscreenMode, spotlightMode]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-8 px-4 bg-gradient-to-br from-slate-800 to-slate-900">
        <div className="w-full max-w-4xl">
          <button 
            onClick={goBack}
            className="mb-6 flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-all active:scale-95"
            aria-label="Go back"
          >
            <FiArrowLeft /> Back
          </button>
          
          <div className="animate-pulse text-center mb-8">
            <div className="inline-block mx-auto h-16 w-16 rounded-full bg-indigo-600/30 p-3 flex items-center justify-center">
                <FaFutbol className="text-indigo-400" size={24} />
            </div>
            <h1 className="text-xl text-white mt-3">Loading match details...</h1>
            <p className="text-slate-400 mt-1">Please wait while we fetch the latest information</p>
          </div>
          
          <MatchHeaderSkeleton />
          
          <div className="bg-slate-800 rounded-2xl border border-slate-700/50 shadow-lg overflow-hidden">
            <div className="flex border-b border-slate-700">
              {['Statistics', 'Lineups', 'Events'].map((tab, index) => (
                <div key={index} className="flex-1 py-3 text-center">
                  <div className="bg-slate-700 h-6 w-20 mx-auto rounded animate-pulse"></div>
                </div>
              ))}
            </div>
            <div className="p-6">
              <div className="h-6 w-40 bg-slate-700 rounded mb-6 animate-pulse"></div>
              <div className="space-y-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 bg-slate-700 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 min-h-screen p-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 max-w-3xl mx-auto mt-10">
          <h2 className="text-red-400 text-xl font-bold mb-4 flex items-center gap-2">
            <FiAlertCircle size={24} />
            <span>Error Loading Match</span>
          </h2>
          <p className="text-white mb-4">{error || "Failed to load match data. The match may no longer be available."}</p>
          <button 
            onClick={goBack} 
            className="px-5 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 inline-flex items-center gap-2 transition-colors active:scale-95"
          >
            <FiArrowLeft /> Back to Matches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-slate-800 to-slate-900 min-h-screen transition-all ${fullscreenMode ? 'fixed inset-0 z-50' : ''} ${spotlightMode ? 'bg-slate-900' : ''}`}>
            {/* Pull-to-refresh indicator (mobile) */}
      <div 
        id="pull-to-refresh-indicator" 
        className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-2 opacity-0 pointer-events-none transition-all duration-300"
      >
        <div className="bg-indigo-600/90 px-4 py-2 rounded-full flex items-center gap-2 shadow-lg border border-indigo-500">
          <FiRefreshCw className="text-white animate-spin" />
          <span className="text-white text-sm font-medium pull-text">
            Pull down to refresh
          </span>
          <span className="text-white text-sm font-medium release-text hidden">
            Release to refresh
          </span>
        </div>
      </div>

      <div className={`max-w-5xl mx-auto pb-20 sm:pb-4 ${spotlightMode ? 'spotlight-mode' : ''}`}>
        {/* Toast notifications */}
        {toast && (
          <div className="fixed bottom-24 sm:bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none">
            <Toast
              message={toast.message}
              type={toast.type}
              icon={toast.icon}
              onClose={() => setToast(null)}
            />
          </div>
        )}
        
        {/* Fixed header - Responsive and animated */}
        <div 
          className={`fixed top-0 left-0 right-0 z-30 bg-gradient-to-b from-slate-900 to-slate-900/90 transition-transform duration-300 backdrop-blur-sm ${
            headerVisible ? 'translate-y-0' : '-translate-y-full'
          } ${spotlightMode ? 'opacity-50 hover:opacity-100 transition-opacity' : ''}`}
        >
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <button 
              onClick={goBack}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/70 hover:bg-slate-700 text-white rounded-lg transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:ring-offset-1 focus:ring-offset-slate-800"
              aria-label="Go back"
            >
              <FiArrowLeft /> <span className="hidden sm:inline">Back</span>
            </button>
            
            <div className="flex items-center">
              {match.status === 'live' && (
                <span className="mr-3 flex items-center gap-1 text-red-400 font-medium text-sm px-2 py-0.5 bg-red-900/30 rounded-full animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  LIVE
                </span>
              )}
              
              <div className="flex items-center gap-2">
                {/* Status indicator for non-live matches */}
                {match.status !== 'live' && (
                  <span className={`mr-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                    match.status === 'upcoming' 
                      ? 'bg-blue-900/30 text-blue-400' 
                      : 'bg-green-900/30 text-green-400'
                  }`}>
                    {match.status === 'upcoming' ? 'UPCOMING' : 'FINISHED'}
                  </span>
                )}
                
                {/* Action buttons */}
                <div className="flex gap-1">
                  <ActionButton
                    icon={<FiRefreshCw size={18} className={refreshing ? "animate-spin" : ""} />}
                    onClick={handleRefresh}
                    tooltip="Refresh (R)"
                  />
                  
                  <ActionButton 
                    icon={isFollowed ? <FiBell size={18} /> : <FiBellOff size={18} />}
                    onClick={toggleFollowMatch}
                    active={isFollowed}
                    tooltip={isFollowed ? "Unfollow match (F)" : "Follow match (F)"}
                  />
                  
                  <ActionButton 
                    icon={<FiShare2 size={18} />}
                    onClick={shareMatch}
                    tooltip="Share match"
                  />
                  
                  <ActionButton
                    icon={fullscreenMode ? <FiX size={18} /> : <FiMaximize2 size={18} />}
                    onClick={toggleFullscreenMode}
                    tooltip={fullscreenMode ? "Exit fullscreen (M)" : "Fullscreen mode (M)"}
                  />
                  
                  <ActionButton
                    icon={<FiMoreHorizontal size={18} />}
                    onClick={() => setShowActionMenu(true)}
                    tooltip="More options"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main content with padding to account for fixed header */}
        <div className="pt-16 px-4">
          {/* Match header */}
          <div className="bg-gradient-to-b from-slate-800 to-slate-800/90 rounded-2xl overflow-hidden border border-slate-700/50 shadow-lg mb-6" ref={headerRef}>
            {/* League info */}
            <div className="bg-slate-700/70 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {match.league.logo ? (
                  <img 
                    src={match.league.logo} 
                    alt={match.league.name} 
                    className="w-6 h-6 rounded-full object-contain bg-slate-800"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PLACEHOLDER_LEAGUE_IMG;
                    }} 
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-xs">
                    <span className="text-[8px] uppercase">{match.league.name.substring(0, 2)}</span>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-white text-sm font-medium">{match.league.name}</span>
                  <span className="text-xs text-slate-400">{match.round || 'Regular Season'} • {match.season}</span>
                </div>
              </div>
              
              {/* Optional match day indicator */}
              {match.matchday && (
                <div className="bg-slate-800/80 px-2 py-1 rounded text-xs text-slate-300">
                  Matchday {match.matchday}
                </div>
              )}
            </div>
            
            {/* Teams and score */}
            <div className="p-4 sm:p-6 animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                {/* Home team */}
                <div className="flex items-center sm:flex-col sm:items-center md:items-start gap-3 md:flex-1 order-1">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-blue-600/30 to-blue-700/10 p-2 sm:p-3 flex items-center justify-center transform transition-transform hover:scale-105 border border-slate-700/50 shadow-inner">
                    {match.homeTeam.logo ? (
                      <img 
                        src={match.homeTeam.logo}
                        alt={match.homeTeam.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER_TEAM_IMG;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-slate-600 flex items-center justify-center">
                        <span className="text-xl font-bold">{match.homeTeam.name.substring(0, 2)}</span>
                      </div>
                    )}
                  </div>
                  <h2 className="text-sm sm:text-xl md:text-2xl text-white font-bold sm:text-center md:text-left max-w-[150px] sm:max-w-full">
                    {match.homeTeam.name}
                  </h2>
                </div>
                
                {/* Score and match info */}
                <div className="flex flex-col items-center order-3 md:order-2 md:flex-1 my-2">
                  {match.status === 'live' || match.status === 'finished' ? (
                    <div className={`px-6 py-3 sm:py-4 rounded-xl font-bold text-3xl sm:text-4xl md:text-5xl text-white shadow-inner border ${
                      match.status === 'live' 
                        ? 'bg-gradient-to-r from-red-900/40 to-red-800/20 border-red-700/30 animate-pulse-slow' 
                        : 'bg-slate-800/70 border-slate-700/40'
                    }`}>
                      <span className="score-home">{match.score?.home}</span>
                      <span className="score-separator"> - </span>
                      <span className="score-away">{match.score?.away}</span>
                    </div>
                  ) : (
                    <div className="px-4 sm:px-6 py-2 sm:py-4 text-2xl sm:text-3xl md:text-4xl font-bold text-slate-300 bg-slate-800/40 rounded-xl border border-slate-700/30">
                      VS
                    </div>
                  )}
                  
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                      <FiCalendar size={14} className="text-indigo-400" />
                      <span>{formatDateToDisplay(match.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <FiClock size={14} className="text-indigo-400" />
                      <span>{match.time}</span>
                      {match.status === 'live' && (
                        <span className="text-red-400 text-xs px-1.5 py-0.5 rounded bg-red-900/30 ml-1">
                          In Progress
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <FiMap size={14} className="text-indigo-400" />
                      <span className="truncate max-w-[180px]">{match.venue}</span>
                    </div>
                  </div>
                  
                  {/* Follow/unfollow button */}
                  <button 
                    onClick={toggleFollowMatch}
                    className={`mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-all inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                      isFollowed 
                        ? 'bg-indigo-600 text-white focus:ring-indigo-500 hover:bg-indigo-700 active:bg-indigo-800' 
                        : 'bg-slate-700 text-slate-200 focus:ring-slate-500 hover:bg-slate-600 active:bg-slate-800'
                    }`}
                    aria-pressed={isFollowed}
                  >
                    {isFollowed ? <FiBell size={16} /> : <FiBellOff size={16} />}
                    <span>{isFollowed ? "Following Match" : "Follow Match"}</span>
                  </button>
                </div>
                
                {/* Away team */}
                <div className="flex items-center sm:flex-col sm:items-center md:items-end gap-3 md:flex-1 order-2 md:order-3">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-red-600/30 to-red-700/10 p-2 sm:p-3 flex items-center justify-center transform transition-transform hover:scale-105 border border-slate-700/50 shadow-inner">
                    {match.awayTeam.logo ? (
                      <img 
                        src={match.awayTeam.logo}
                        alt={match.awayTeam.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER_TEAM_IMG;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-slate-600 flex items-center justify-center">
                        <span className="text-xl font-bold">{match.awayTeam.name.substring(0, 2)}</span>
                      </div>
                    )}
                  </div>
                  <h2 className="text-sm sm:text-xl md:text-2xl text-white font-bold sm:text-center md:text-right order-1 sm:order-2 max-w-[150px] sm:max-w-full">
                    {match.awayTeam.name}
                  </h2>
                </div>
              </div>
            </div>
          </div>
          
          {/* Match detail tabs with content */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700/50 shadow-lg overflow-hidden">
            {/* Tab headers */}
            <div className="flex border-b border-slate-700 relative">
              <button 
                onClick={() => handleTabChange('stats')}
                className={`flex-1 py-3 sm:py-4 text-center font-medium transition-all ${
                  activeTab === 'stats' 
                    ? 'text-indigo-400' 
                    : 'text-slate-400 hover:text-slate-300'
                }`}
                aria-pressed={activeTab === 'stats'}
                aria-controls="stats-content"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <FiBarChart2 size={16} />
                  <span>Statistics</span>
                  <span className="hidden sm:inline text-xs opacity-60">(S)</span>
                </div>
              </button>
              <button 
                onClick={() => handleTabChange('lineups')}
                className={`flex-1 py-3 sm:py-4 text-center font-medium transition-all ${
                  activeTab === 'lineups' 
                    ? 'text-indigo-400' 
                    : 'text-slate-400 hover:text-slate-300'
                }`}
                aria-pressed={activeTab === 'lineups'}
                aria-controls="lineups-content"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <FiUsers size={16} />
                  <span>Lineups</span>
                  <span className="hidden sm:inline text-xs opacity-60">(L)</span>
                </div>
              </button>
              <button 
                onClick={() => handleTabChange('events')}
                className={`flex-1 py-3 sm:py-4 text-center font-medium transition-all ${
                  activeTab === 'events' 
                    ? 'text-indigo-400' 
                    : 'text-slate-400 hover:text-slate-300'
                }`}
                aria-pressed={activeTab === 'events'}
                aria-controls="events-content"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <FiActivity size={16} />
                  <span>Events</span>
                  <span className="hidden sm:inline text-xs opacity-60">(E)</span>
                </div>
              </button>
              
              {/* Active tab indicator - animated */}
              <div 
                className="absolute bottom-0 h-0.5 bg-indigo-400 transition-all duration-300 ease-in-out"
                style={{
                  left: `${(activeTab === 'stats' ? 0 : activeTab === 'lineups' ? 33.33 : 66.66)}%`,
                  width: '33.33%'
                }}
                aria-hidden="true"
              ></div>
            </div>
            
            {/* Tab content */}
            <div className="p-4 sm:p-6">
              {/* Stats Tab */}
              <div 
                id="stats-content"
                ref={(el) => { contentRefs.current.stats = el; }}
                className={`${activeTab === 'stats' ? 'animate-fadeIn' : 'hidden'}`}
                role="tabpanel"
                aria-labelledby="stats-tab"
              >
                <h3 className="text-xl text-white font-medium mb-6 flex items-center gap-2">
                  <FiBarChart2 className="text-indigo-400" />
                  <span>Match Statistics</span>
                </h3>
                
                {match.status === 'upcoming' ? (
                  <div className="text-center py-12 bg-slate-700/20 rounded-lg border border-slate-700/40">
                    <div className="max-w-sm mx-auto">
                      <FiClock size={36} className="text-slate-500 mx-auto mb-4" />
                      <h4 className="text-lg text-white font-medium mb-2">Match Not Started Yet</h4>
                      <p className="text-slate-400">Statistics will be available once the match starts. Follow this match to receive updates.</p>
                      
                      {!isFollowed && (
                        <button 
                          onClick={toggleFollowMatch}
                          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <FiBell size={16} />
                            <span>Follow Match</span>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Possession chart - Enhanced for mobile */}
                    <div className="mb-6 bg-gradient-to-br from-slate-700/20 to-slate-700/30 p-4 rounded-lg border border-slate-700/40 shadow-inner">
                      <h4 className="text-slate-300 text-sm mb-3 font-medium flex items-center gap-2">
                        <FiPieChart className="text-indigo-400" size={16} />
                        <span>Possession</span>
                      </h4>
                      <div className="flex h-12 rounded-lg overflow-hidden shadow-lg">
                        <div 
                          className="bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-start px-3 text-white text-sm font-medium relative animate-grow-bar"
                          style={{ width: `${matchStats?.possession.home || 0}%` }}
                        >
                          <span className="absolute inset-0 flex items-center justify-center text-xs sm:text-sm font-medium text-white">
                            {matchStats?.possession.home || 0}%
                          </span>
                        </div>
                        <div 
                          className="bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-end px-3 text-white text-sm font-medium relative animate-grow-bar"
                          style={{ width: `${matchStats?.possession.away || 0}%`, animationDelay: '0.2s' }}
                        >
                          <span className="absolute inset-0 flex items-center justify-center text-xs sm:text-sm font-medium text-white">
                            {matchStats?.possession.away || 0}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between mt-2 text-xs text-slate-400">
                        <span>{match.homeTeam.name}</span>
                        <span>{match.awayTeam.name}</span>
                      </div>
                    </div>
                    
                    {/* Expected Goals - New */}
                    {matchStats?.xG && (
                      <div className="mb-6 bg-gradient-to-br from-slate-700/20 to-slate-700/30 p-4 rounded-lg border border-slate-700/40 shadow-inner">
                        <h4 className="text-slate-300 text-sm mb-3 font-medium flex items-center gap-2">
                          <FiTarget className="text-indigo-400" size={16} />
                          <span>Expected Goals (xG)</span>
                        </h4>
                        <div className="flex justify-between items-center">
                          <div className="text-center flex-1">
                            <span className="text-2xl font-bold text-blue-400">{matchStats.xG.home}</span>
                            <p className="text-xs text-slate-400 mt-1">{match.homeTeam.name}</p>
                          </div>
                          <div className="text-center px-3">
                            <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">xG</span>
                          </div>
                          <div className="text-center flex-1">
                            <span className="text-2xl font-bold text-red-400">{matchStats.xG.away}</span>
                            <p className="text-xs text-slate-400 mt-1">{match.awayTeam.name}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Team comparison legend */}
                    <div className="flex items-center justify-center gap-8 mb-2 px-4 py-3 bg-slate-700/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-xs text-slate-300">{match.homeTeam.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-xs text-slate-300">{match.awayTeam.name}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-8 sm:gap-6">
                      {/* Attack stats */}
                      <div className="bg-gradient-to-br from-slate-700/20 to-slate-700/30 p-4 rounded-lg border border-slate-700/40 shadow-inner">
                        <h4 className="text-slate-300 text-sm mb-4 font-medium flex items-center gap-2">
                          <FiZap className="text-indigo-400" size={16} />
                          <span>Attack</span>
                        </h4>
                        <StatBar 
                          label="Shots" 
                          homeValue={matchStats?.shots.home || 0} 
                          awayValue={matchStats?.shots.away || 0}
                          homeTeam={match.homeTeam.name.substring(0, 8)}
                          awayTeam={match.awayTeam.name.substring(0, 8)}
                        />
                        <StatBar 
                          label="On Target" 
                          homeValue={matchStats?.shotsOnTarget.home || 0} 
                          awayValue={matchStats?.shotsOnTarget.away || 0}
                          homeTeam={match.homeTeam.name.substring(0, 8)}
                          awayTeam={match.awayTeam.name.substring(0, 8)}
                        />
                        <StatBar 
                          label="Corners" 
                          homeValue={matchStats?.corners.home || 0} 
                          awayValue={matchStats?.corners.away || 0}
                          homeTeam={match.homeTeam.name.substring(0, 8)}
                          awayTeam={match.awayTeam.name.substring(0, 8)}
                        />
                        <StatBar 
                          label="Offsides" 
                          homeValue={matchStats?.offsides.home || 0} 
                          awayValue={matchStats?.offsides.away || 0}
                          homeTeam={match.homeTeam.name.substring(0, 8)}
                          awayTeam={match.awayTeam.name.substring(0, 8)}
                        />
                      </div>
                      
                      {/* Discipline stats */}
                      <div className="bg-gradient-to-br from-slate-700/20 to-slate-700/30 p-4 rounded-lg border border-slate-700/40 shadow-inner">
                        <h4 className="text-slate-300 text-sm mb-4 font-medium flex items-center gap-2">
                          <FiShield className="text-indigo-400" size={16} />
                          <span>Discipline</span>
                        </h4>
                        <StatBar 
                          label="Fouls" 
                          homeValue={matchStats?.fouls.home || 0} 
                          awayValue={matchStats?.fouls.away || 0}
                          homeColor="bg-amber-500"
                          awayColor="bg-amber-600"
                          homeTeam={match.homeTeam.name.substring(0, 8)}
                          awayTeam={match.awayTeam.name.substring(0, 8)}
                        />
                        <StatBar 
                          label="Yellow Cards" 
                          homeValue={matchStats?.yellowCards.home || 0} 
                          awayValue={matchStats?.yellowCards.away || 0}
                          homeColor="bg-yellow-500"
                          awayColor="bg-yellow-600"
                          homeTeam={match.homeTeam.name.substring(0, 8)}
                          awayTeam={match.awayTeam.name.substring(0, 8)}
                        />
                        <StatBar 
                          label="Red Cards" 
                          homeValue={matchStats?.redCards.home || 0} 
                          awayValue={matchStats?.redCards.away || 0}
                          homeColor="bg-red-500"
                          awayColor="bg-red-600"
                          homeTeam={match.homeTeam.name.substring(0, 8)}
                          awayTeam={match.awayTeam.name.substring(0, 8)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Lineups Tab */}
              <div 
                id="lineups-content"
                ref={(el) => { contentRefs.current.lineups = el; }}
                className={`${activeTab === 'lineups' ? 'animate-fadeIn' : 'hidden'}`}
                role="tabpanel"
                aria-labelledby="lineups-tab"
              >
                <h3 className="text-xl text-white font-medium mb-6 flex items-center gap-2">
                  <FiUsers className="text-indigo-400" />
                  <span>Match Lineups</span>
                </h3>
                
                {match.status === 'upcoming' ? (
                  <div className="text-center py-12 bg-slate-700/20 rounded-lg border border-slate-700/40">
                    <div className="max-w-sm mx-auto">
                      <FiUsers size={36} className="text-slate-500 mx-auto mb-4" />
                      <h4 className="text-lg text-white font-medium mb-2">Lineups Not Available</h4>
                      <p className="text-slate-400">Lineups will be announced closer to kick-off. Follow this match to get notified when they are available.</p>
                      
                      {!isFollowed && (
                        <button 
                          onClick={toggleFollowMatch}
                          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <FiBell size={16} />
                            <span>Follow Match</span>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                ) : lineups ? (
                  <div>
                    {/* Lineup tabs for mobile */}
                    <div className="flex sm:hidden mb-4 rounded-lg overflow-hidden shadow-lg">
                      <button 
                        onClick={() => {
                          const homeEl = document.getElementById('home-lineup');
                          homeEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className="flex-1 py-3 px-2 text-center bg-blue-600/30 text-white border-r border-slate-700 flex items-center justify-center gap-2"
                      >
                        <img 
                          src={match.homeTeam.logo || PLACEHOLDER_TEAM_IMG} 
                          alt={match.homeTeam.name}
                          className="w-6 h-6 object-contain rounded-full"
                        />
                        <span className="font-medium text-sm">{match.homeTeam.name}</span>
                      </button>
                      <button 
                        onClick={() => {
                          const awayEl = document.getElementById('away-lineup');
                          awayEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className="flex-1 py-3 px-2 text-center bg-red-600/30 text-white flex items-center justify-center gap-2"
                      >
                        <img 
                          src={match.awayTeam.logo || PLACEHOLDER_TEAM_IMG} 
                          alt={match.awayTeam.name}
                          className="w-6 h-6 object-contain rounded-full"
                        />
                        <span className="font-medium text-sm">{match.awayTeam.name}</span>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Home team lineup */}
                      <div id="home-lineup" className="scroll-mt-32 bg-gradient-to-br from-slate-700/20 to-slate-700/30 p-4 rounded-lg border border-blue-900/30 shadow-lg">
                        <div className="flex items-center justify-between mb-4 sticky top-16 sm:static bg-transparent py-2 sm:py-0 z-10">
                          <div className="flex items-center gap-3">
                            <img 
                              src={match.homeTeam.logo || PLACEHOLDER_TEAM_IMG} 
                              alt={match.homeTeam.name}
                              className="w-8 h-8 object-contain rounded-full bg-blue-900/20 p-1"
                            />
                            <h4 className="text-lg text-blue-300 font-medium">{match.homeTeam.name}</h4>
                          </div>
                          <div className="text-slate-300 text-sm bg-slate-700/50 px-2 py-1 rounded">
                            {lineups.home.formation}
                          </div>
                        </div>
                        
                        <div className="bg-blue-900/10 rounded-lg p-3 mb-3">
                          <div className="text-sm text-blue-300 mb-1 flex items-center gap-2">
                            <FiUser size={14} />
                            <span>Coach: {lineups.home.coach}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          {lineups.home.players.map((player: any) => (
                            <PlayerCard
                              key={player.id}
                              number={player.number}
                              name={player.name}
                              position={player.position}
                              teamColor="blue"
                              isCaptain={player.isCaptain}
                              isFavorite={favoritePlayerIds.includes(player.id)}
                              onToggleFavorite={() => togglePlayerFavorite(player.id)}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Away team lineup */}
                      <div id="away-lineup" className="scroll-mt-32 bg-gradient-to-br from-slate-700/20 to-slate-700/30 p-4 rounded-lg border border-red-900/30 shadow-lg">
                        <div className="flex items-center justify-between mb-4 sticky top-16 sm:static bg-transparent py-2 sm:py-0 z-10">
                          <div className="flex items-center gap-3">
                            <img 
                              src={match.awayTeam.logo || PLACEHOLDER_TEAM_IMG} 
                              alt={match.awayTeam.name}
                              className="w-8 h-8 object-contain rounded-full bg-red-900/20 p-1"
                            />
                            <h4 className="text-lg text-red-300 font-medium">{match.awayTeam.name}</h4>
                          </div>
                          <div className="text-slate-300 text-sm bg-slate-700/50 px-2 py-1 rounded">
                            {lineups.away.formation}
                          </div>
                        </div>
                        
                        <div className="bg-red-900/10 rounded-lg p-3 mb-3">
                          <div className="text-sm text-red-300 mb-1 flex items-center gap-2">
                            <FiUser size={14} />
                            <span>Coach: {lineups.away.coach}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          {lineups.away.players.map((player: any) => (
                            <PlayerCard
                              key={player.id}
                              number={player.number}
                              name={player.name}
                              position={player.position}
                              teamColor="red"
                              isCaptain={player.isCaptain}
                              isFavorite={favoritePlayerIds.includes(player.id)}
                              onToggleFavorite={() => togglePlayerFavorite(player.id)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-400 py-12 bg-slate-700/20 rounded-lg">
                    <FiUsers size={36} className="mx-auto text-slate-500 mb-3" />
                    <p>No lineup information available for this match</p>
                  </div>
                )}
              </div>
              
              {/* Events Tab */}
              <div 
                id="events-content"
                ref={(el) => { contentRefs.current.events = el; }}
                className={`${activeTab === 'events' ? 'animate-fadeIn' : 'hidden'}`}
                role="tabpanel"
                aria-labelledby="events-tab"
              >
                <h3 className="text-xl text-white font-medium mb-6 flex items-center gap-2">
                  <FiActivity className="text-indigo-400" />
                  <span>Match Events</span>
                </h3>
                
                {match.status === 'upcoming' ? (
                  <div className="text-center py-12 bg-slate-700/20 rounded-lg border border-slate-700/40">
                    <div className="max-w-sm mx-auto">
                      <FiClock size={36} className="text-slate-500 mx-auto mb-4" />
                      <h4 className="text-lg text-white font-medium mb-2">Match Not Started Yet</h4>
                      <p className="text-slate-400">Events will appear here once the match begins. Follow this match to stay updated.</p>
                      
                      {!isFollowed && (
                        <button 
                          onClick={toggleFollowMatch}
                          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <FiBell size={16} />
                            <span>Follow Match</span>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                ) : events.length > 0 ? (
                  <div className="relative">
                    {/* Match status indicator if live */}
                    {match.status === 'live' && (
                      <div className="mb-4 bg-red-900/20 p-4 rounded-lg border border-red-700/30 flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <div>
                          <span className="text-red-400 font-medium">LIVE</span>
                          <span className="text-slate-300 ml-2">Match in progress</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Timeline line */}
                    <div className="absolute left-[19px] top-4 bottom-0 w-0.5 bg-slate-600"></div>
                    
                    {/* Events */}
                    <div className="space-y-6 pt-4">
                      {events.map((event, index) => (
                        <EventCard 
                          key={index} 
                          event={event} 
                          homeTeam={match.homeTeam.name}
                          awayTeam={match.awayTeam.name}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-400 py-12 bg-slate-700/20 rounded-lg">
                    <FiActivity size={36} className="mx-auto text-slate-500 mb-3" />
                    <p>No events recorded for this match yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-xs text-slate-500 text-right">
            Last updated: {CURRENT_TIMESTAMP}
          </div>
        </div>
        
        {/* Mobile-friendly tab navigation */}
        <div className="fixed bottom-0 left-0 right-0 sm:hidden z-20 bg-gradient-to-t from-slate-900 to-slate-900/95 border-t border-slate-700 shadow-lg">
          <div className="flex justify-between">
            <button 
              onClick={() => handleTabChange('stats')}
              className={`flex-1 py-3 flex flex-col items-center transition-colors ${
                activeTab === 'stats' ? 'text-indigo-400' : 'text-slate-500'
              }`}
              aria-label="Show statistics"
              aria-pressed={activeTab === 'stats'}
            >
              <FiBarChart2 size={20} />
              <span className="text-xs mt-1">Stats</span>
              {activeTab === 'stats' && <div className="mt-1 h-1 w-6 bg-indigo-400 rounded-full"></div>}
            </button>
            <button 
              onClick={() => handleTabChange('lineups')}
              className={`flex-1 py-3 flex flex-col items-center transition-colors ${
                activeTab === 'lineups' ? 'text-indigo-400' : 'text-slate-500'
              }`}
              aria-label="Show lineups"
              aria-pressed={activeTab === 'lineups'}
            >
              <FiUsers size={20} />
              <span className="text-xs mt-1">Lineups</span>
              {activeTab === 'lineups' && <div className="mt-1 h-1 w-6 bg-indigo-400 rounded-full"></div>}
            </button>
            <button 
              onClick={() => handleTabChange('events')}
              className={`flex-1 py-3 flex flex-col items-center transition-colors ${
                activeTab === 'events' ? 'text-indigo-400' : 'text-slate-500'
              }`}
              aria-label="Show events"
              aria-pressed={activeTab === 'events'}
            >
              <FiActivity size={20} />
              <span className="text-xs mt-1">Events</span>
              {activeTab === 'events' && <div className="mt-1 h-1 w-6 bg-indigo-400 rounded-full"></div>}
            </button>
          </div>
        </div>
        
        {/* Keyboard shortcuts helper - appears once */}
        {showTips && (
          <div className="fixed bottom-20 sm:bottom-6 right-6 z-40 pointer-events-auto">
            <button 
              onClick={() => setToast({
                message: "Keyboard shortcuts: S (Stats), L (Lineups), E (Events), F (Follow), R (Refresh), H (Back)",
                type: 'info',
                icon: <FiInfo className="text-blue-400" />
              })}
              className="p-3 rounded-full bg-slate-700 text-slate-300 hover:bg-indigo-600 hover:text-white shadow-lg transition-all active:scale-95"
              aria-label="Show keyboard shortcuts"
            >
              <FiHelpCircle size={20} />
            </button>
          </div>
        )}
        
        {/* Swipe hint toast for mobile - appears once */}
        <div className="fixed bottom-20 left-0 right-0 flex justify-center pointer-events-none sm:hidden">
          <div className="text-xs text-slate-400 bg-slate-800/90 px-4 py-2 rounded-full border border-slate-700 animate-fadeInOut">
            <div className="flex items-center gap-2">
              <FiChevronsLeft size={14} />
              <span>Swipe to change tabs</span>
              <FiChevronsRight size={14} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Action menu modal */}
      <ActionMenu
        isOpen={showActionMenu}
        onClose={() => setShowActionMenu(false)}
        actions={getActionMenuOptions()}
      />
      
      {/* Add CSS for animations */}
      <style jsx global>{`
        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeInOut {
          0% { opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { opacity: 0; }
        }
        
        @keyframes pulseSlow {
          0% { opacity: 1; }
          50% { opacity: 0.8; }
          100% { opacity: 1; }
        }
        
        @keyframes grow-bar {
          from { width: 0; }
          to { width: 100%; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out forwards;
        }
        
        .animate-fadeInOut {
          animation: fadeInOut 4s ease-in-out forwards;
        }
        
        .animate-pulse-slow {
          animation: pulseSlow 2s infinite;
        }
        
        .animate-grow-bar {
          animation: grow-bar 1s ease-out forwards;
        }
        
        /* Pull to refresh */
        .pull-to-refresh-indicator.release-state .pull-text {
          display: none;
        }
        
        .pull-to-refresh-indicator.release-state .release-text {
          display: inline;
        }
        
        /* Spotlight mode */
        .spotlight-mode {
          position: relative;
          z-index: 1;
        }
        
        .spotlight-mode::before {
          content: "";
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          z-index: -1;
          pointer-events: none;
        }
        
        /* Active scale */
        .active-scale-95:active {
          transform: scale(0.95);
        }
        
        /* Improved scrolling */
        html {
          scroll-behavior: smooth;
        }
        
        /* Hide scrollbar for Chrome, Safari and Opera */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.1);
        }
        
        ::-webkit-scrollbar-thumb {
          background-color: rgba(99, 102, 241, 0.5);
          border-radius: 20px;
        }
        
        /* Score animations for live matches */
        @keyframes scoreUpdate {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); color: #818cf8; }
          100% { transform: scale(1); }
        }
        
        .live-match .score-home, 
        .live-match .score-away {
          display: inline-block;
        }
        
        .score-update {
          animation: scoreUpdate 1s ease-out;
        }
      `}</style>
    </div>
  );
}