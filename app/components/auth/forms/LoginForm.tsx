'use client';

import React, { useState, useEffect } from 'react';
import { FaGoogle, FaFacebook, FaEnvelope, FaLock } from 'react-icons/fa';
import { useAuth } from '@/lib/contexts/AuthContext';

interface LoginFormProps {
  onSuccess?: () => void;
  onRegisterClick: () => void;
  onForgotPasswordClick: () => void;
  verificationSuccess?: boolean;
  passwordReset?: boolean;
}

export default function LoginForm({
  onSuccess,
  onRegisterClick,
  onForgotPasswordClick,
  verificationSuccess = false,
  passwordReset = false,
}: LoginFormProps) {
  // State management
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  
  // Authentication context
  const { login, authError, clearAuthError } = useAuth();
  
  // Clear previous auth errors when component mounts
  useEffect(() => {
    clearAuthError();
    
    // Show success message if email was verified or password was reset
    if (verificationSuccess) {
      setShowSuccess('Votre adresse email a été vérifiée avec succès. Vous pouvez maintenant vous connecter.');
    } else if (passwordReset) {
      setShowSuccess('Votre mot de passe a été réinitialisé avec succès. Veuillez vous connecter avec votre nouveau mot de passe.');
    }
    
    // Clear success message after 5 seconds
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [clearAuthError, verificationSuccess, passwordReset, showSuccess]);

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      
      // Attempt login through AuthContext
      const result = await login(email, password);
      
      // Handle login failure
      if (!result.success) {
        setError(result.error || 'Échec de la connexion');
        return;
      }
      
      // Handle success - no need to redirect as AuthContext already does it
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      setError('Une erreur est survenue. Veuillez réessayer.');
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Social login handlers
  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };
  
  const handleFacebookLogin = () => {
    window.location.href = '/api/auth/facebook';
  };

  return (
    <div className="w-full">
      {/* Success message if applicable */}
      {showSuccess && (
        <div className="mb-4 p-3 rounded-lg bg-green-100 text-green-800 text-sm">
          {showSuccess}
        </div>
      )}
      
      {/* Error message if applicable */}
    {(error || authError) && (
    <div className="mb-4 p-4 rounded-lg bg-red-100 border-l-4 border-red-500 text-red-800 flex items-start">
      <div className="mr-3 mt-0.5">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </div>
      <div>
        <p className="font-medium">Erreur de connexion</p>
        <p className="text-sm">{error || authError}</p>
        {(error || authError)?.toLowerCase().includes('vérifier votre email') && (
          <button
            onClick={() => {/* Add resend verification email function here */}}
            className="text-sm text-red-700 underline mt-1 hover:text-red-900"
          >
            Renvoyer l'email de vérification
          </button>
        )}
      </div>

      {(error || authError)?.toLowerCase().includes('mot de passe incorrect') && (
      <div className="mt-2">
        <button
          onClick={onForgotPasswordClick}
          className="text-sm text-red-700 underline hover:text-red-900"
        >
          Mot de passe oublié?
        </button>
      </div>
    )}
    </div>
)}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email field */}
        <div>
          <label htmlFor="email" className="block mb-2 text-sm font-medium text-slate-300">
            Adresse email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <FaEnvelope />
            </div>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white w-full pl-10 pr-3 py-2.5 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="votre@email.com"
              required
            />
          </div>
        </div>
        
        {/* Password field */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-300">
              Mot de passe
            </label>
            <button
              type="button"
              onClick={onForgotPasswordClick}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Mot de passe oublié?
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <FaLock />
            </div>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white w-full pl-10 pr-3 py-2.5 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="••••••••"
              required
            />
          </div>
        </div>
        
        {/* Login button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors ${
            isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Connexion...
            </div>
          ) : (
            'Se connecter'
          )}
        </button>
      </form>
      
      {/* Divider */}
      <div className="my-5 flex items-center">
        <div className="flex-1 h-px bg-slate-700"></div>
        <span className="px-3 text-sm text-slate-400">ou</span>
        <div className="flex-1 h-px bg-slate-700"></div>
      </div>
      
      {/* Social login buttons */}
      <div className="space-y-3">
        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg transition-colors bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
        >
          <FaGoogle className="text-red-500" />
          <span>Continuer avec Google</span>
        </button>
        
        <button
          onClick={handleFacebookLogin}
          type="button"
          className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg transition-colors bg-[#1877F2] text-white hover:bg-[#0e6bde]"
        >
          <FaFacebook />
          <span>Continuer avec Facebook</span>
        </button>
      </div>
      
      {/* Register link */}
      <div className="mt-5 text-center text-sm text-slate-400">
        Pas encore de compte?{' '}
        <button
          onClick={onRegisterClick}
          className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
        >
          S'inscrire
        </button>
      </div>
    </div>
  );
}