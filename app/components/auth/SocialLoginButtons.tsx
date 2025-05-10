'use client';

import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { BsFacebook } from 'react-icons/bs';

export default function SocialLoginButtons() {
  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({
    google: false,
    facebook: false
  });
  
  async function handleSocialLogin(provider: 'google' | 'facebook') {
    setIsLoading(prev => ({ ...prev, [provider]: true }));
    
    try {
      // Redirect to the appropriate OAuth provider
      const response = await fetch(`/api/auth/${provider}`);
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error(`Error during ${provider} login:`, error);
    } finally {
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
          disabled={isLoading.google}
          className="flex justify-center items-center px-4 py-2 border border-slate-600 rounded-md shadow-sm bg-slate-700 hover:bg-slate-600 transition disabled:opacity-70"
        >
          <FcGoogle className="h-5 w-5 mr-2" />
          <span>{isLoading.google ? '...' : 'Google'}</span>
        </button>
        <button
          onClick={() => handleSocialLogin('facebook')}
          disabled={isLoading.facebook}
          className="flex justify-center items-center px-4 py-2 border border-slate-600 rounded-md shadow-sm bg-slate-700 hover:bg-slate-600 transition disabled:opacity-70"
        >
          <BsFacebook className="h-5 w-5 mr-2 text-blue-500" />
          <span>{isLoading.facebook ? '...' : 'Facebook'}</span>
        </button>
      </div>
    </div>
  );
}