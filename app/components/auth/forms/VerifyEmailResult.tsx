'use client';

import { useState } from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import { requestVerificationEmail } from '@/lib/auth/email-actions';

// Informations système actuelles
const CURRENT_TIMESTAMP = "2025-05-08 12:25:32";
const CURRENT_USER = "Sdiabate1337";

// Ajout de l'interface des props
interface VerifyEmailFormProps {
  onSuccess: () => void;
}

export default function VerifyEmailForm({ onSuccess }: VerifyEmailFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    if (!email) {
      setError('Veuillez saisir votre adresse email');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await requestVerificationEmail(email);
      
      if (result.success) {
        onSuccess(); // Appel de la fonction de callback
      } else {
        setError(result.message || 'Une erreur s\'est produite');
      }
    } catch (err) {
      setError('Une erreur inattendue s\'est produite');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <>
      {error && (
        <div className="rounded-md bg-red-900/50 p-4 border-l-4 border-red-500 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-300">{error}</p>
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
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              placeholder="vous@exemple.com"
            />
          </div>
        </div>
        
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 disabled:opacity-75 transition"
          >
            {isLoading ? 'Envoi en cours...' : 'Envoyer le lien de vérification'}
          </button>
        </div>
      </form>
    </>
  );
}