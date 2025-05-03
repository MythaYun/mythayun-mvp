'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { FiMail, FiLock, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';

// Current user and timestamp
const CURRENT_TIMESTAMP = "2025-05-03 13:21:26";
const CURRENT_USER = "Sdiabate1337";

// Custom hook to detect theme from parent document
const useTheme = () => {
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initial check
      setIsDark(document.documentElement.classList.contains('dark'));
      
      // Setup observer to detect theme changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (
            mutation.attributeName === 'class' &&
            mutation.target === document.documentElement
          ) {
            setIsDark(document.documentElement.classList.contains('dark'));
          }
        });
      });
      
      observer.observe(document.documentElement, { attributes: true });
      
      return () => observer.disconnect();
    }
  }, []);
  
  return isDark;
};

// Props interface
interface LoginFormProps {
  onLoginSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  // Form state
  const [email, setEmail] = useState(`${CURRENT_USER.toLowerCase()}@mythayun.com`);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Get theme from document
  const isDark = useTheme();
  
  // Get auth context
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth();
  
  // Watch for authentication state changes
  useEffect(() => {
    if (isAuthenticated && onLoginSuccess) {
      onLoginSuccess();
    }
  }, [isAuthenticated, onLoginSuccess]);

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!email || !password) {
      return;
    }
    
    await login(email, password);
    // No need to check return value - we'll monitor isAuthenticated instead
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className={`rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
        <h2 className={`text-2xl font-bold mb-6 text-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Log in to MythaYun
        </h2>
        
        {/* Error message */}
        {error && (
          <div className={`border-l-4 border-red-500 p-4 mb-6 ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`} role="alert">
            <div className="flex items-center">
              <FiAlertCircle className="text-red-500 mr-2" />
              <p className={isDark ? 'text-red-400' : 'text-red-700'}>{error}</p>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* Email input */}
          <div className="mb-6">
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`} htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className={isDark ? 'text-slate-400' : 'text-gray-500'} />
              </div>
              <input
                id="email"
                type="email"
                placeholder={`${CURRENT_USER.toLowerCase()}@mythayun.com`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`appearance-none border rounded w-full py-3 px-4 pl-10 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  ${isDark 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                    : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400'}`}
              />
            </div>
          </div>
          
          {/* Password input */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className={`block text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`} htmlFor="password">
                Password
              </label>
              <Link href="/forgot-password" className={`text-sm hover:underline ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className={isDark ? 'text-slate-400' : 'text-gray-500'} />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`appearance-none border rounded w-full py-3 px-4 pl-10 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  ${isDark 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                    : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400'}`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`focus:outline-none ${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-gray-500 hover:text-gray-700'}`}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
          </div>
          
          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition duration-200 ease-in-out
              ${isLoading 
                ? 'opacity-70 cursor-not-allowed' 
                : 'hover:bg-indigo-700'} 
              bg-indigo-600`}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
          
          <div className={`mt-4 text-center text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            Last updated: {CURRENT_TIMESTAMP}
          </div>
        </form>
        
        {/* Registration link */}
        <div className="mt-8 text-center">
          <p className={isDark ? 'text-slate-300' : 'text-gray-600'}>
            Don&apos;t have an account?{' '}
            <Link href="/register" className={`hover:underline ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;