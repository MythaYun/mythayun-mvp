'use client';

import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { BsFacebook } from 'react-icons/bs';
import { FiLoader } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

// Optional: You can accept a mode prop to customize button text for "login" vs "register" contexts
type SocialButtonsProps = {
  mode?: 'login' | 'register';
  onError?: (error: string) => void;
};

export default function SocialLoginButtons({ mode = 'login', onError }: SocialButtonsProps) {
  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({
    google: false,
    facebook: false
  });
  const router = useRouter();
  
  const actionText = mode === 'login' ? 'Se connecter avec' : 'S\'inscrire avec';
  const currentTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  
  function handleSocialLogin(provider: 'google' | 'facebook') {
    setIsLoading(prev => ({ ...prev, [provider]: true }));
    
    try {
      console.log(`[${currentTimestamp}] Initialisation de l'authentification ${provider}`);
      
      // Use Next.js router for client-side navigation (or direct navigation for simpler approach)
      // Option 1: Direct navigation - more reliable, ensures we get full page reload
      window.location.href = `/api/auth/${provider}`;
      
      // Option 2: Next.js router - better UX but can have issues with auth redirects
      // router.push(`/api/auth/${provider}`);
      
      // Note: We intentionally don't reset loading state here since we're navigating away
      
    } catch (error) {
      // This will only catch client-side errors before navigation
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error(`[${currentTimestamp}] Erreur lors de la connexion ${provider}:`, errorMessage);
      
      if (onError) {
        onError(`Impossible de contacter le service ${provider}. Veuillez réessayer plus tard.`);
      } else {
        alert(`Erreur lors de la connexion avec ${provider}. Veuillez réessayer.`);
      }
      
      setIsLoading(prev => ({ ...prev, [provider]: false }));
    }
  }
  
  return (
    <div className="mt-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-slate-800 text-slate-400">Ou continuer avec</span>
        </div>
      </div>
      
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button 
          onClick={() => handleSocialLogin('google')}
          disabled={isLoading.google || isLoading.facebook}
          className="flex justify-center items-center px-4 py-2 border border-slate-600 rounded-md shadow-sm bg-slate-700 hover:bg-slate-600 transition disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500"
          aria-label={`${actionText} Google`}
        >
          {isLoading.google ? (
            <>
              <FiLoader className="h-5 w-5 mr-2 animate-spin text-white" aria-hidden="true" />
              <span>Chargement...</span>
            </>
          ) : (
            <>
              <FcGoogle className="h-5 w-5 mr-2" aria-hidden="true" />
              <span>Google</span>
            </>
          )}
        </button>
        <button
          onClick={() => handleSocialLogin('facebook')}
          disabled={isLoading.facebook || isLoading.google}
          className="flex justify-center items-center px-4 py-2 border border-slate-600 rounded-md shadow-sm bg-slate-700 hover:bg-slate-600 transition disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500"
          aria-label={`${actionText} Facebook`}
        >
          {isLoading.facebook ? (
            <>
              <FiLoader className="h-5 w-5 mr-2 animate-spin text-white" aria-hidden="true" />
              <span>Chargement...</span>
            </>
          ) : (
            <>
              <BsFacebook className="h-5 w-5 mr-2 text-blue-500" aria-hidden="true" />
              <span>Facebook</span>
            </>
          )}
        </button>
      </div>
      
      {/* Optional helper text for registration context */}
      {mode === 'register' && (
        <p className="mt-3 text-center text-xs text-slate-400">
          En vous inscrivant via Google ou Facebook, vous acceptez nos{' '}
          <a href="/terms" className="text-indigo-400 hover:text-indigo-300">
            conditions d'utilisation
          </a>{' '}
          et notre{' '}
          <a href="/privacy" className="text-indigo-400 hover:text-indigo-300">
            politique de confidentialité
          </a>
          .
        </p>
      )}
    </div>
  );
}