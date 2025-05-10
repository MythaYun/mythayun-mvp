'use client';

import React, { useState } from 'react';
import { FiX, FiCheck } from 'react-icons/fi';
import { useModal } from '@/lib/contexts/ModalContext';
import LoginForm from './forms/LoginForm';
import RegisterModal from './modals/RegisterModal'; // Import the RegisterModal instead
import ForgotPasswordForm from './forms/ForgotPasswordForm';
import ResetPasswordForm from './forms/ResetPasswordForm';
import VerifyEmailForm from './forms/VerifyEmailResult';

// Informations système actuelles
const CURRENT_TIMESTAMP = "2025-05-10 02:07:48"; // Updated timestamp
const CURRENT_USER = "Sdiabate1337";

export default function AuthModals() {
  // Extraire toutes les fonctions du hook au niveau du composant principal
  const { activeModal, closeModal, openModal, modalData } = useModal();

  // Si aucun modal n'est actif, ne rien afficher
  if (!activeModal) return null;
  
  // Fonctions pour la navigation entre modaux
  const navigateToLogin = () => {
    closeModal();
    setTimeout(() => openModal('login'), 100);
  };
  
  const navigateToRegister = () => {
    closeModal();
    setTimeout(() => openModal('register'), 100);
  };
  
  const navigateToForgotPassword = () => {
    closeModal();
    setTimeout(() => openModal('forgotPassword'), 100);
  };
  
  // Déterminer le titre du modal en fonction du type
  let title = '';
  let content = null;
  
  switch(activeModal) {
    case 'login':
      title = 'Connexion';
      content = (
        <LoginForm 
          onSuccess={() => closeModal()}
          onRegisterClick={navigateToRegister}
          onForgotPasswordClick={navigateToForgotPassword}
          verificationSuccess={modalData?.verificationSuccess}
        />
      );
      break;
    case 'register':
      // Special case for registration - use the dedicated modal
      return <RegisterModal />;
    case 'forgotPassword':
      title = 'Mot de passe oublié';
      content = (
        <ForgotPasswordForm 
          onSuccess={() => closeModal()}
          onLoginClick={navigateToLogin}
        />
      );
      break;
    case 'resetPassword':
      title = 'Réinitialisation du mot de passe';
      content = (
        <ResetPasswordForm 
          token={modalData?.token || ''}
          onSuccess={navigateToLogin}
        />
      );
      break;
    case 'verifyEmail':
      title = 'Vérification d\'email';
      content = (
        <VerifyEmailForm 
          onSuccess={() => closeModal()}
        />
      );
      break;
  }

  // Modal UI - except for register which has its own component
  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}
    >
      <div className="p-5 sm:p-8 rounded-2xl shadow-xl w-full max-w-md border bg-slate-800 border-slate-700 animate-slideUp">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {title}
          </h2>
          <button
            onClick={closeModal}
            className="p-1 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>
        {content}
      </div>
    </div>
  );
}