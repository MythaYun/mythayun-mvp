'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { FiUser, FiMail, FiLock, FiAlertCircle, FiEye, FiEyeOff, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { useTheme } from './useTheme';

// Current user and timestamp
const CURRENT_TIMESTAMP = "2025-05-03 13:38:16";
const CURRENT_USER = "Sdiabate1337";

// Props interface
interface RegisterFormProps {
  onRegisterSuccess?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegisterSuccess }) => {
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  // Get theme from shared hook
  const { isDark, mounted } = useTheme();
  
  // Get auth context
  const { register, isLoading, error, clearError } = useAuth();
  
  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Name validation
    if (name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    // Confirm password validation
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Password strength requirements
  const passwordRequirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains a number', met: /\d/.test(password) },
    { label: 'Contains a special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
  ];

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (validateForm()) {
      try {
        await register(name, email, password);
        // If no error was thrown and we got here, consider it successful
        setRegistrationSuccess(true);
        
        // Call the callback after a delay if provided
        if (onRegisterSuccess) {
          setTimeout(() => {
            onRegisterSuccess();
          }, 1500);
        }
      } catch (err) {
        // Error is handled by the auth context
      }
    }
  };

  // Afficher un placeholder pendant le chargement côté client
  if (!mounted) {
    // Rendu simple sans classes conditionnelles basées sur le thème
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded mb-6 mx-auto w-3/4"></div>
          <div className="space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-10 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-10 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-10 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-10 bg-slate-200 rounded"></div>
            <div className="h-10 bg-slate-200 rounded mt-4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className={`rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
        <h2 className={`text-2xl font-bold mb-6 text-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Create your MythaYun Account
        </h2>
        
        {/* Success message */}
        {registrationSuccess && (
          <div className={`border-l-4 border-green-500 p-4 mb-6 ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`} role="alert">
            <div className="flex items-center">
              <FiCheckCircle className="text-green-500 mr-2" />
              <p className={isDark ? 'text-green-400' : 'text-green-700'}>
                Registration successful! You can now log in.
              </p>
            </div>
          </div>
        )}
        
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
          {/* Name input */}
          <div className="mb-6">
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`} htmlFor="name">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiUser className={isDark ? 'text-slate-400' : 'text-gray-500'} />
              </div>
              <input
                id="name"
                type="text"
                placeholder={CURRENT_USER}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={`appearance-none border rounded w-full py-3 px-4 pl-10 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  ${isDark 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                    : 'bg-white text-gray-700 placeholder-gray-400'}
                  ${errors.name ? (isDark ? 'border-red-500' : 'border-red-500') : (isDark ? 'border-slate-600' : 'border-gray-300')}`}
              />
            </div>
            {errors.name && (
              <p className={`mt-1 text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{errors.name}</p>
            )}
          </div>
          
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
                    : 'bg-white text-gray-700 placeholder-gray-400'}
                  ${errors.email ? (isDark ? 'border-red-500' : 'border-red-500') : (isDark ? 'border-slate-600' : 'border-gray-300')}`}
              />
            </div>
            {errors.email && (
              <p className={`mt-1 text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{errors.email}</p>
            )}
          </div>
          
          {/* Password input */}
          <div className="mb-4">
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`} htmlFor="password">
              Password
            </label>
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
                    : 'bg-white text-gray-700 placeholder-gray-400'}
                  ${errors.password ? (isDark ? 'border-red-500' : 'border-red-500') : (isDark ? 'border-slate-600' : 'border-gray-300')}`}
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
            {errors.password && (
              <p className={`mt-1 text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{errors.password}</p>
            )}
          </div>

          {/* Password requirements checklist */}
          {password && (
            <div className={`mb-6 p-3 rounded-md ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
              <p className={`text-xs font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Password requirements:</p>
              <ul className="space-y-1">
                {passwordRequirements.map((req, idx) => (
                  <li key={idx} className="flex items-center text-xs">
                    {req.met ? (
                      <FiCheckCircle className={`mr-2 ${isDark ? 'text-green-400' : 'text-green-500'}`} />
                    ) : (
                      <FiXCircle className={`mr-2 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                    )}
                    <span className={req.met 
                      ? (isDark ? 'text-green-400' : 'text-green-600')
                      : (isDark ? 'text-slate-400' : 'text-gray-500')
                    }>
                      {req.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Confirm Password input */}
          <div className="mb-8">
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`} htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className={isDark ? 'text-slate-400' : 'text-gray-500'} />
              </div>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={`appearance-none border rounded w-full py-3 px-4 pl-10 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  ${isDark 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                    : 'bg-white text-gray-700 placeholder-gray-400'}
                  ${errors.confirmPassword ? (isDark ? 'border-red-500' : 'border-red-500') : (isDark ? 'border-slate-600' : 'border-gray-300')}`}
              />
            </div>
            {errors.confirmPassword && (
              <p className={`mt-1 text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{errors.confirmPassword}</p>
            )}
          </div>
          
          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading || registrationSuccess}
            className={`w-full py-3 px-4 text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition duration-200 ease-in-out
              ${(isLoading || registrationSuccess) 
                ? 'opacity-70 cursor-not-allowed' 
                : 'hover:bg-indigo-700'} 
              bg-indigo-600`}
          >
            {isLoading ? 'Creating Account...' : registrationSuccess ? 'Account Created!' : 'Create Account'}
          </button>
          
          <div className={`mt-4 text-center text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            Last updated: {CURRENT_TIMESTAMP}
          </div>
        </form>
        
        {/* Login link */}
        <div className="mt-8 text-center">
          <p className={isDark ? 'text-slate-300' : 'text-gray-600'}>
            Already have an account?{' '}
            <Link href="/login" className={`hover:underline ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;