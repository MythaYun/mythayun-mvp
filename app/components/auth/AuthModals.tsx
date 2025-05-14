'use client';

import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { useModal } from '@/lib/contexts/ModalContext';
import LoginForm from './forms/LoginForm';
import RegisterModal from './modals/RegisterModal';
import ForgotPasswordForm from './forms/ForgotPasswordForm';
import ResetPasswordForm from './forms/ResetPasswordForm';
import VerifyEmailForm from './forms/VerifyEmailResult';
import { ModalType } from '@/lib/contexts/ModalContext';

// Informations système actuelles
const CURRENT_TIMESTAMP = "2025-05-13 18:55:19";
const CURRENT_USER = "Sdiabate1337";

export default function AuthModals() {
  // Extraire toutes les fonctions du hook au niveau du composant principal
  const { activeModal, closeModal, openModal, modalData } = useModal();
  
  // Use useEffect for smoother modal transitions
  useEffect(() => {
    // When modalData contains passwordReset=true, add a success message
    if (activeModal === 'login' && modalData?.passwordReset) {
      console.log(`[${CURRENT_TIMESTAMP}] User logged in after password reset`);
    }
  }, [activeModal, modalData]);

  // Si aucun modal n'est actif, ne rien afficher
  if (!activeModal) return null;
  
  // Fonctions pour la navigation entre modaux avec animation plus fluide
  const navigateToModal = (modalType: ModalType) => {
    closeModal();
    // Small timeout to allow for closing animation
    setTimeout(() => openModal(modalType), 100);
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
          onRegisterClick={() => navigateToModal('register')}
          onForgotPasswordClick={() => navigateToModal('forgotPassword')}
          verificationSuccess={modalData?.verificationSuccess}
          passwordResetSuccess={modalData?.passwordReset}
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
          onLoginClick={() => navigateToModal('login')}
        />
      );
      break;
    case 'resetPassword':
      title = 'Réinitialisation du mot de passe';
      // Check if token exists in modalData
      if (!modalData?.token) {
        content = (
          <div className="text-center py-6">
            <p className="text-red-400 mb-4">
              Lien de réinitialisation invalide. Le token est manquant.
            </p>
            <button
              onClick={() => navigateToModal('forgotPassword')}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition"
            >
              Demander un nouveau lien
            </button>
          </div>
        );
      } else {
        content = (
          <ResetPasswordForm 
            token={modalData.token}
            onSuccess={() => {
              // Close current modal and open login with success message
              closeModal();
              setTimeout(() => openModal('login', { passwordReset: true }), 100);
            }}
          />
        );
      }
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
    <div 
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
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