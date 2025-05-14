'use client';

import { useState } from 'react';
import { FiAlertCircle, FiEye, FiEyeOff, FiCheck, FiX } from 'react-icons/fi';
import { resetPassword } from '@/lib/auth/email-actions';

interface ResetPasswordFormProps {
  token: string;
  onSuccess: () => void;
}

export default function ResetPasswordForm({ token, onSuccess }: ResetPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Password requirements validation
  const hasMinLength = password.length >= 8;
  const hasValidRequirements = hasMinLength;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    // Validation du mot de passe
    if (!hasValidRequirements) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`[2025-05-13 21:26:58] Submitting password reset for token: ${token.substring(0, 10)}...`);
      const result = await resetPassword(token, password);
      
      if (result.success) {
        console.log(`[2025-05-13 21:26:58] Password reset successful`);
        onSuccess(); // Appel de la fonction de callback
      } else {
        console.error(`[2025-05-13 21:26:58] Password reset failed: ${result.message}`);
        setError(result.message || 'Une erreur s\'est produite');
      }
    } catch (err) {
      console.error(`[2025-05-13 21:26:58] Unexpected error during password reset:`, err);
      setError('Une erreur inattendue s\'est produite');
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <>
      {error && (
        <div className="rounded-md bg-red-900/50 p-4 border-l-4 border-red-500 mb-6" role="alert">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-300">
            Nouveau mot de passe
          </label>
          <div className="mt-1 relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              autoComplete="new-password"
              required
              minLength={8}
              aria-describedby="password-requirements"
              className="block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? 
                <FiEyeOff className="h-5 w-5 text-slate-400" aria-hidden="true" /> : 
                <FiEye className="h-5 w-5 text-slate-400" aria-hidden="true" />
              }
            </button>
          </div>
          
          {/* Password requirements feedback */}
          <div 
            id="password-requirements" 
            className={`mt-2 text-xs space-y-1 ${passwordFocused || password ? 'block' : 'hidden'}`}
          >
            <div className="flex items-center">
              {hasMinLength ? (
                <FiCheck className="text-green-500 mr-1.5" />
              ) : (
                <FiX className="text-red-500 mr-1.5" />
              )}
              <span className={hasMinLength ? "text-green-400" : "text-slate-400"}>
                Minimum 8 caractères
              </span>
            </div>
          </div>
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">
            Confirmer le mot de passe
          </label>
          <div className="mt-1 relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              className="block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              placeholder="••••••••"
              aria-invalid={confirmPassword && password !== confirmPassword ? "true" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              aria-label={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showConfirmPassword ? 
                <FiEyeOff className="h-5 w-5 text-slate-400" aria-hidden="true" /> : 
                <FiEye className="h-5 w-5 text-slate-400" aria-hidden="true" />
              }
            </button>
          </div>
          {confirmPassword && password !== confirmPassword && (
            <p className="mt-1 text-xs text-red-400">
              Les mots de passe ne correspondent pas
            </p>
          )}
        </div>
        
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 disabled:opacity-75 transition"
          >
            {isLoading ? 'Réinitialisation en cours...' : 'Réinitialiser le mot de passe'}
          </button>
        </div>
      </form>
    </>
  );
}