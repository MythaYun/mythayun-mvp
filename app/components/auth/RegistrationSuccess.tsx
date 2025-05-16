'use client';

import React from 'react';
import { FiMail, FiCheck } from 'react-icons/fi';

// Current system information
const CURRENT_TIMESTAMP = "2025-05-16 10:56:48";

interface RegistrationSuccessProps {
  email: string;
  message?: string;
  onClose: () => void;
  onLoginClick: () => void;
}

export default function RegistrationSuccess({ 
  email, 
  message, 
  onClose,
  onLoginClick
}: RegistrationSuccessProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <FiCheck className="w-8 h-8 text-green-600" />
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Inscription réussie!
      </h3>
      
      <p className="text-gray-600 text-center mb-4">
        {message || 'Un email de vérification a été envoyé à votre adresse email.'}
      </p>
      
      <div className="w-full p-4 bg-gray-50 rounded-lg border border-gray-200 mb-6 flex items-center">
        <FiMail className="text-gray-400 mr-3 flex-shrink-0" />
        <span className="text-gray-600 font-medium overflow-hidden text-ellipsis">{email}</span>
      </div>
      
      <p className="text-gray-500 text-sm text-center mb-6">
        Veuillez vérifier votre boîte de réception et cliquer sur le lien de vérification pour activer votre compte.
        <br /><br />
        <span className="text-gray-400">
          Si vous ne recevez pas l'email dans les prochaines minutes, vérifiez votre dossier spam.
        </span>
      </p>
      
      <div className="flex flex-col sm:flex-row w-full gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors"
        >
          Fermer
        </button>
        <button
          onClick={onLoginClick}
          className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
        >
          Aller à la connexion
        </button>
      </div>
    </div>
  );
}