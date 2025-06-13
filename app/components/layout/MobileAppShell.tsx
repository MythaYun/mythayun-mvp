'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  FiHome, FiCalendar, FiList, FiUser,
  FiChevronLeft, FiMenu, FiSearch 
} from 'react-icons/fi';
import { useAuth } from '@/lib/contexts/AuthContext';

// Current system information
const CURRENT_TIMESTAMP = "2025-06-12 15:17:22";
const CURRENT_USER = "Sdiabate1337";

export default function MobileAppShell({ 
  children,
  title = "Mythayun",
  showBackButton = false,
  showHeader = true,
  showFooter = true,
  onBackClick
}) {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();
  
  return (
    <div className="flex flex-col min-h-screen bg-slate-900">
      {/* Mobile App Header */}
      {showHeader && (
        <header className="fixed top-0 left-0 right-0 h-14 bg-slate-800/90 backdrop-blur-md z-40 border-b border-slate-700/50">
          <div className="flex items-center h-full px-4">
            {showBackButton ? (
              <button 
                onClick={onBackClick || (() => window.history.back())}
                className="w-10 h-10 flex items-center justify-center rounded-full text-slate-300 hover:bg-slate-700/50"
              >
                <FiChevronLeft size={24} />
              </button>
            ) : (
              <div className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-500">
                {title}
              </div>
            )}
            
            {showBackButton && (
              <div className="ml-4 text-white font-medium">
                {title}
              </div>
            )}
            
            <div className="ml-auto flex items-center gap-2">
              <button className="w-10 h-10 flex items-center justify-center rounded-full text-slate-300 hover:bg-slate-700/50">
                <FiSearch size={20} />
              </button>
              
              <Link 
                href={isAuthenticated ? "/profile" : "/login"}
                className={`w-10 h-10 flex items-center justify-center rounded-full ${
                  isAuthenticated ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                <FiUser size={20} />
              </Link>
            </div>
          </div>
        </header>
      )}
      
      {/* Main Content Area */}
      <main className={`flex-1 ${showHeader ? 'pt-14' : ''} ${showFooter ? 'pb-16' : ''}`}>
        {children}
      </main>
      
      {/* Mobile App Bottom Navigation */}
      {showFooter && (
        <footer className="fixed bottom-0 left-0 right-0 h-16 bg-slate-800/90 backdrop-blur-md z-40 border-t border-slate-700/50">
          <nav className="h-full grid grid-cols-4 gap-1">
            <Link
              href="/"
              className={`flex flex-col items-center justify-center ${
                pathname === '/' ? 'text-indigo-400' : 'text-slate-400'
              }`}
            >
              <FiHome size={20} />
              <span className="text-xs mt-1">Home</span>
            </Link>
            
            <Link
              href="/matches"
              className={`flex flex-col items-center justify-center ${
                pathname === '/matches' ? 'text-indigo-400' : 'text-slate-400'
              }`}
            >
              <FiCalendar size={20} />
              <span className="text-xs mt-1">Matches</span>
            </Link>
            
            <Link
              href="/leagues"
              className={`flex flex-col items-center justify-center ${
                pathname === '/leagues' ? 'text-indigo-400' : 'text-slate-400'
              }`}
            >
              <FiList size={20} />
              <span className="text-xs mt-1">Leagues</span>
            </Link>
            
            <Link
              href="/profile"
              className={`flex flex-col items-center justify-center ${
                pathname === '/profile' ? 'text-indigo-400' : 'text-slate-400'
              }`}
            >
              <FiUser size={20} />
              <span className="text-xs mt-1">Profile</span>
            </Link>
          </nav>
        </footer>
      )}
    </div>
  );
}