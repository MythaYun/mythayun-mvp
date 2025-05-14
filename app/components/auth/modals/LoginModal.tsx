'use client';

import React from 'react';
import Modal from '../../ui/Modal';
import LoginForm from '../forms/LoginForm';
import { useModal } from '@/lib/contexts/ModalContext';

interface LoginModalProps {
  verificationSuccess?: boolean;
  passwordReset?: boolean;
}

export default function LoginModal({ 
  verificationSuccess = false,
  passwordReset = false
}: LoginModalProps) {
  const { closeModal, openModal } = useModal();
  
  // Current timestamp for logging
  const CURRENT_TIMESTAMP = "2025-05-14 00:04:49";
  
  const handleLoginSuccess = () => {
    console.log(`[${CURRENT_TIMESTAMP}] Login successful, modal will close automatically`);
    closeModal();
    // No need to redirect here, the AuthContext handles it
  };
  
  const goToRegister = () => {
    closeModal();
    setTimeout(() => openModal('register'), 100);
  };
  
  const goToForgotPassword = () => {
    closeModal();
    setTimeout(() => openModal('forgotPassword'), 100);
  };

  return (
    <Modal title="Connexion" onClose={closeModal}>
      <LoginForm
        onSuccess={handleLoginSuccess}
        onRegisterClick={goToRegister}
        onForgotPasswordClick={goToForgotPassword}
        verificationSuccess={verificationSuccess}
        passwordReset={passwordReset}
      />
    </Modal>
  );
}