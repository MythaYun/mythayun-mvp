'use client';

import React from 'react';
import { FiCheck, FiMail } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

interface RegistrationSuccessProps {
  email: string;
  onClose: () => void;
}

export default function RegistrationSuccess({ email, onClose }: RegistrationSuccessProps) {
  const router = useRouter();
  
  const goToDashboard = () => {
    onClose();
    router.push('/dashboard');
  };
  
  return (
    <div className="text-center py-6">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
        <FiCheck className="h-6 w-6 text-green-600" />
      </div>
      
      <h3 className="text-xl font-medium text-white mb-2">
        Inscription réussie !
      </h3>
      
      <div className="text-sm text-slate-300 mb-6">
        <p className="mb-4">
          Votre compte a été créé avec succès. Bienvenue dans MythaYun !
        </p>
        
        <div className="p-4 bg-blue-900/30 rounded-md border border-blue-800 mb-6">
          <div className="flex items-center mb-2">
            <FiMail className="h-5 w-5 text-blue-400 mr-2" />
            <span className="text-blue-300 font-medium">Vérification de votre email</span>
          </div>
          <p className="text-slate-300 text-sm text-left">
            Un email de vérification a été envoyé à <span className="font-medium text-white">{email}</span>. 
            Merci de cliquer sur le lien qu'il contient pour valider votre adresse.
          </p>
        </div>
      </div>
      
      <div className="flex flex-col space-y-3">
    
       <button
          onClick={onClose}
          className="text-sm font-medium text-slate-400 hover:text-slate-300 transition"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}