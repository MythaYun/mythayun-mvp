'use client';

import React, { useState } from 'react';
import Modal from '../../ui/Modal';
import RegisterForm from '../forms/RegisterForm';
import RegistrationSuccess from '../RegistrationSuccess';
import { useModal } from '@/lib/contexts/ModalContext';

export default function RegisterModal() {
  const { closeModal, openModal } = useModal();
  const [registeredEmail, setRegisteredEmail] = useState<string>('');
  const [registrationComplete, setRegistrationComplete] = useState<boolean>(false);

  const handleSuccess = () => {
    // Get the email from the form before closing
    const emailInput = document.getElementById('email') as HTMLInputElement;
    if (emailInput) {
      setRegisteredEmail(emailInput.value);
    }
    
    // Show success screen instead of closing the modal
    setRegistrationComplete(true);
  };

  const goToLogin = () => {
    closeModal();
    setTimeout(() => openModal('login'), 100);
  };

  return (
    <Modal 
      title={registrationComplete ? "Inscription réussie" : "Inscription"} 
      onClose={closeModal}
    >
      {registrationComplete ? (
        <RegistrationSuccess 
          email={registeredEmail} 
          onClose={closeModal} 
        />
      ) : (
        <RegisterForm 
          onSuccess={handleSuccess} 
          onLoginClick={goToLogin}
        />
      )}
    </Modal>
  );
}