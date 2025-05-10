'use client';

import { useState, useEffect } from 'react';
import { FiAlertCircle, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';
import { loginAction } from '@/lib/auth/auth-actions';
import { useAuth } from '@/lib/contexts/AuthContext';
import SocialLoginButtons from '../SocialLoginButtons';

interface LoginFormProps {
  onSuccess: () => void;
  onRegisterClick: () => void;
  onForgotPasswordClick: () => void;
  verificationSuccess?: boolean;
}

export default function LoginForm({ 
  onSuccess, 
  onRegisterClick, 
  onForgotPasswordClick,
  verificationSuccess = false 
}: LoginFormProps) {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [staySignedIn, setStaySignedIn] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [email, setEmail] = useState('');
  const { updateUser } = useAuth();
  
  // Success notification timeout
  useEffect(() => {
    if (verificationSuccess) {
      const timer = setTimeout(() => {
        const emailInput = document.getElementById('email') as HTMLInputElement;
        if (emailInput) {
          emailInput.focus();
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [verificationSuccess]);
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const emailValue = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    // Store email for potential resend verification
    setEmail(emailValue);
    
    // Client-side validation
    if (!emailValue || !password) {
      setError('Email et mot de passe requis');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setNeedsVerification(false);
    
    // Append stay signed in preference
    formData.append('staySignedIn', staySignedIn.toString());
    
    try {
      const result = await loginAction(formData);
      
      if (result.success) {
        updateUser(result.user);
        onSuccess();
      } else if (result.needsVerification) {
        setNeedsVerification(true);
        setError(result.message || 'Veuillez vérifier votre email avant de vous connecter');
      } else {
        setError(result.message || 'Identifiants invalides');
      }
    } catch (err) {
      setError('Une erreur inattendue s\'est produite');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }
  
  async function handleResendVerification() {
    if (!email) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      }).then(r => r.json());
      
      if (result.success) {
        setError(null);
        setNeedsVerification(false);
        alert('Un email de vérification a été envoyé à votre adresse email.');
      } else {
        setError(result.message || 'Erreur lors de l\'envoi de l\'email de vérification');
      }
    } catch (err) {
      setError('Une erreur est survenue lors de l\'envoi de l\'email');
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <>
      {/* Email verification success message */}
      {verificationSuccess && (
        <div className="rounded-md bg-green-900/50 p-4 border-l-4 border-green-500 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiCheck className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-300">
                Votre adresse email a été vérifiée avec succès. Vous pouvez maintenant vous connecter.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="rounded-md bg-red-900/50 p-4 border-l-4 border-red-500 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-300">{error}</p>
              
              {/* Resend verification option */}
              {needsVerification && (
                <button 
                  onClick={handleResendVerification} 
                  className="mt-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition"
                  disabled={isLoading}
                >
                  {isLoading ? 'Envoi en cours...' : 'Renvoyer l\'email de vérification'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300">
            Adresse email
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              placeholder="vous@exemple.com"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-300">
            Mot de passe
          </label>
          <div className="mt-1 relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              className="block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? 
                <FiEyeOff className="h-5 w-5 text-slate-400" /> : 
                <FiEye className="h-5 w-5 text-slate-400" />
              }
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="stay-signed-in"
              name="staySignedIn"
              type="checkbox"
              checked={staySignedIn}
              onChange={(e) => setStaySignedIn(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-600 bg-slate-700 rounded"
            />
            <label htmlFor="stay-signed-in" className="ml-2 block text-sm text-slate-400">
              Rester connecté pendant 30 jours
            </label>
          </div>
          
          <button
            type="button"
            onClick={onForgotPasswordClick}
            className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition"
          >
            Mot de passe oublié?
          </button>
        </div>
        
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 disabled:opacity-75 transition"
          >
            {isLoading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </div>
      </form>
      
      {/* Social login options */}
      <SocialLoginButtons />
      
      <div className="mt-6 text-center">
        <p className="text-sm text-slate-300">
          Pas encore de compte?{' '}
          <button 
            onClick={onRegisterClick}
            className="font-medium text-indigo-400 hover:text-indigo-300 transition"
          >
            S'inscrire
          </button>
        </p>
      </div>
    </>
  );
}