'use client';

import React from 'react';
import Modal from '../../ui/Modal';
import RegisterForm from '../forms/RegisterForm';
import { useModal } from '@/lib/contexts/ModalContext';

export default function RegisterModal() {
  const { closeModal, openModal } = useModal();

  const handleSuccess = () => {
    closeModal();
  };

  const goToLogin = () => {
    openModal('login');
  };

  return (
    <Modal title="Inscription" onClose={closeModal}>
      <RegisterForm 
        onSuccess={handleSuccess} 
        onLoginClick={goToLogin}
      />
    </Modal>
  );
}