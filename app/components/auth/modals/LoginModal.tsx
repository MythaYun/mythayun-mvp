'use client';

import React from 'react';
import Modal from '../../ui/Modal';
import LoginForm from '../forms/LoginForm';
import { useModal } from '@/lib/contexts/ModalContext';

export default function LoginModal() {
  const { closeModal, openModal } = useModal();

  const handleSuccess = () => {
    closeModal();
  };

  const goToRegister = () => {
    openModal('register');
  };

  const goToForgotPassword = () => {
    openModal('forgotPassword');
  };

  return (
    <Modal title="Connexion" onClose={closeModal}>
      <LoginForm 
        onSuccess={handleSuccess} 
        onRegisterClick={goToRegister}
        onForgotPasswordClick={goToForgotPassword}
      />
    </Modal>
  );
}