'use client';

import { useState } from 'react';
import { FiAlertCircle, FiEye, FiEyeOff, FiCheck, FiX } from 'react-icons/fi';
import { registerAction } from '@/lib/auth/auth-actions';
import { useAuth } from '@/lib/contexts/AuthContext';

interface RegisterFormProps {
  onSuccess: () => void;
  onLoginClick: () => void;
}

// Password strength requirements
const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: '8 caractères minimum', regex: /.{8,}/ },
  { id: 'lowercase', label: 'Une lettre minuscule', regex: /[a-z]/ },
  { id: 'uppercase', label: 'Une lettre majuscule', regex: /[A-Z]/ },
  { id: 'number', label: 'Un chiffre', regex: /[0-9]/ },
];

export default function RegisterForm({ onSuccess, onLoginClick }: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const { updateUser } = useAuth();

  // Calculate password strength
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return 0;
    return PASSWORD_REQUIREMENTS.filter(req => req.regex.test(pwd)).length;
  };

  const passwordStrength = getPasswordStrength(password);
  const passwordStrengthPercent = (passwordStrength / PASSWORD_REQUIREMENTS.length) * 100;

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500';
    if (passwordStrength <= 2) return 'bg-orange-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  const getPasswordStrengthLabel = () => {
    if (!password) return '';
    if (passwordStrength <= 1) return 'Faible';
    if (passwordStrength <= 2) return 'Moyen';
    if (passwordStrength <= 3) return 'Bon';
    return 'Excellent';
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    
    // Client-side validation
    if (!name || !email || !password || !confirmPassword) {
      setError('Tous les champs sont obligatoires');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    if (!acceptTerms) {
      setError('Veuillez accepter les conditions d\'utilisation');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const registerFormData = new FormData();
      registerFormData.append('name', name);
      registerFormData.append('email', email);
      registerFormData.append('password', password);
      
      const result = await registerAction(registerFormData);
      
      if (result.success) {
        updateUser(result.user);
        onSuccess();
      } else {
        setError(result.message || 'Échec de l\'inscription');
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
          <label htmlFor="name" className="block text-sm font-medium text-slate-300">
            Nom complet
          </label>
          <div className="mt-1">
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              className="block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              placeholder="Votre nom"
            />
          </div>
        </div>
        
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
              autoComplete="new-password"
              required
              minLength={8}
              className="block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
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
          
          {/* Password strength indicator */}
          {password && (
            <div className="mt-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-400">
                  Niveau de sécurité: <span className={
                    passwordStrength <= 1 ? 'text-red-400' : 
                    passwordStrength <= 2 ? 'text-orange-400' :
                    passwordStrength <= 3 ? 'text-yellow-400' : 
                    'text-green-400'
                  }>{getPasswordStrengthLabel()}</span>
                </span>
                <span className="text-xs text-slate-400">{passwordStrength}/{PASSWORD_REQUIREMENTS.length}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${getPasswordStrengthColor()}`}
                  style={{ width: `${passwordStrengthPercent}%` }}
                ></div>
              </div>
              
              <div className="mt-2 space-y-1.5">
                {PASSWORD_REQUIREMENTS.map(req => (
                  <div key={req.id} className="flex items-center">
                    {req.regex.test(password) ? (
                      <FiCheck className="h-3.5 w-3.5 text-green-400 mr-2" />
                    ) : (
                      <FiX className="h-3.5 w-3.5 text-slate-400 mr-2" />
                    )}
                    <span className={`text-xs ${req.regex.test(password) ? 'text-green-400' : 'text-slate-400'}`}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">
            Confirmer le mot de passe
          </label>
          <div className="mt-1 relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              className="block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showConfirmPassword ? 
                <FiEyeOff className="h-5 w-5 text-slate-400" /> : 
                <FiEye className="h-5 w-5 text-slate-400" />
              }
            </button>
          </div>
        </div>
        
        {/* Terms and conditions checkbox */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-slate-600 bg-slate-700 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="terms" className="text-slate-400">
              J'accepte les <a href="/conditions" className="text-indigo-400 hover:text-indigo-300">conditions d'utilisation</a> et la <a href="/privacy" className="text-indigo-400 hover:text-indigo-300">politique de confidentialité</a>
            </label>
          </div>
        </div>
        
        <div>
          <button
            type="submit"
            disabled={isLoading || !acceptTerms}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 disabled:opacity-75 disabled:hover:bg-indigo-600 transition"
          >
            {isLoading ? 'Inscription en cours...' : 'S\'inscrire'}
          </button>
        </div>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-slate-300">
          Déjà un compte?{' '}
          <button 
            onClick={onLoginClick}
            className="font-medium text-indigo-400 hover:text-indigo-300 transition"
          >
            Se connecter
          </button>
        </p>
      </div>
    </>
  );
}