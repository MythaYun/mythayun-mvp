'use client';

import { useState } from 'react';
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { requestPasswordReset } from '@/lib/auth/email-actions';

// Informations système actuelles
const CURRENT_TIMESTAMP = "2025-05-07 18:16:04";
const CURRENT_USER = "Sdiabate1337";

// Définir l'interface des props correctement
interface ForgotPasswordFormProps {
  onSuccess: () => void;
  onLoginClick: () => void;
}

export default function ForgotPasswordForm({ onSuccess, onLoginClick }: ForgotPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
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
      // Cette fonction doit être implémentée dans vos actions d'authentification
      // Vous pouvez la remplacer par un appel API direct si nécessaire
      const result = await requestPasswordReset(email);
      
      if (result.success) {
        console.log(`[${CURRENT_TIMESTAMP}] Demande de réinitialisation de mot de passe envoyée pour: ${email}`);
        setSuccess(true);
      } else {
        setError(result.message || 'Une erreur s\'est produite');
      }
    } catch (err) {
      console.error(`[${CURRENT_TIMESTAMP}] Erreur lors de la demande de réinitialisation:`, err);
      setError('Une erreur inattendue s\'est produite');
    } finally {
      setIsLoading(false);
    }
  }
  
  // Afficher un message de succès
  if (success) {
    return (
      <div className="text-center py-6">
        <div className="flex justify-center">
          <FiCheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <h3 className="mt-4 text-xl font-medium text-white">Email envoyé</h3>
        <p className="mt-2 text-slate-300">
          Si un compte est associé à l'adresse {email}, vous recevrez bientôt un email avec les instructions pour réinitialiser votre mot de passe.
        </p>
        <button
          onClick={onLoginClick}
          className="w-full mt-6 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition"
        >
          Retour à la connexion
        </button>
      </div>
    );
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
              name="email"
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
            {isLoading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
          </button>
        </div>
      </form>
      
      <div className="mt-6 text-center">
        <button 
          onClick={onLoginClick}
          className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition"
        >
          Retour à la connexion
        </button>
      </div>
    </>
  );
}