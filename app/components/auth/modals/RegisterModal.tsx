'use client';

import React, { useState } from 'react';
import Modal from '../../ui/Modal';
import RegisterForm from '../forms/RegisterForm';
import RegistrationSuccess from '../RegistrationSuccess';
import { useModal } from '@/lib/contexts/ModalContext';

// Current timestamp and user for logging
const CURRENT_TIMESTAMP = "2025-05-16 10:56:48"; // Updated timestamp
const CURRENT_USER = "Sdiabate1337";

export default function RegisterModal() {
  const { closeModal, openModal } = useModal();
  const [registeredEmail, setRegisteredEmail] = useState<string>('');
  const [registrationComplete, setRegistrationComplete] = useState<boolean>(false);
  const [registrationMessage, setRegistrationMessage] = useState<string>('');

  // Updated handler to receive email and message directly from the form component
  const handleRegistrationSuccess = (email: string, message: string) => {
    console.log(`[${CURRENT_TIMESTAMP}] Registration successful for: ${email}`);
    
    // Set the email and message from the registration result
    setRegisteredEmail(email);
    setRegistrationMessage(message || 'Inscription réussie. Veuillez vérifier votre boîte email.');
    
    // Show success screen
    setRegistrationComplete(true);
    console.log(`[${CURRENT_TIMESTAMP}] Registration complete, showing verification instructions`);
  };

  const goToLogin = () => {
    closeModal();
    setTimeout(() => openModal('login'), 100);
  };

  return (
    <Modal 
      title={registrationComplete ? "Vérifiez votre email" : "Inscription"} 
      onClose={closeModal}
    >
      {registrationComplete ? (
        <RegistrationSuccess 
          email={registeredEmail}
          message={registrationMessage}
          onClose={closeModal} 
          onLoginClick={goToLogin}
        />
      ) : (
        <RegisterForm 
          onSuccess={handleRegistrationSuccess} 
          onLoginClick={goToLogin}
        />
      )}
    </Modal>
  );
}