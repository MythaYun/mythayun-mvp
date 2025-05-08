'use client';

import React from 'react';
import Modal from '../../ui/Modal';
import ResetPasswordForm from '../forms/ResetPasswordForm';
import { useModal } from '@/lib/contexts/ModalContext';

interface ResetPasswordModalProps {
  token: string;
}

export default function ResetPasswordModal({ token }: ResetPasswordModalProps) {
  const { closeModal, openModal } = useModal();

  const handleSuccess = () => {
    openModal('login');
  };

  if (!token) {
    return (
      <Modal title="Erreur" onClose={closeModal}>
        <div className="text-center text-slate-300 py-4">
          Token de réinitialisation manquant ou invalide.
        </div>
        <button
          onClick={() => openModal('forgotPassword')}
          className="w-full mt-4 py-2 px-4 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Demander un nouveau lien
        </button>
      </Modal>
    );
  }

  return (
    <Modal title="Réinitialisation du mot de passe" onClose={closeModal}>
      <ResetPasswordForm 
        token={token}
        onSuccess={handleSuccess} 
      />
    </Modal>
  );
}