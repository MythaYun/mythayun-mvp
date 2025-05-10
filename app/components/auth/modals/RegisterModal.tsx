'use client';

import React, { useState } from 'react';
import Modal from '../../ui/Modal';
import RegisterForm from '../forms/RegisterForm';
import RegistrationSuccess from '../RegistrationSuccess'; // Fixed path
import { useModal } from '@/lib/contexts/ModalContext';

// Current timestamp and user for logging
const CURRENT_TIMESTAMP = "2025-05-10 02:07:48"; // Updated timestamp
const CURRENT_USER = "Sdiabate1337";

export default function RegisterModal() {
  const { closeModal, openModal } = useModal();
  const [registeredEmail, setRegisteredEmail] = useState<string>('');
  const [registrationComplete, setRegistrationComplete] = useState<boolean>(false);

  const handleSuccess = () => {
    console.log(`[${CURRENT_TIMESTAMP}] Registration successful`);
    
    // Get the email from the form before closing
    const emailInput = document.getElementById('email') as HTMLInputElement;
    if (emailInput) {
      setRegisteredEmail(emailInput.value);
      console.log(`[${CURRENT_TIMESTAMP}] Setting registered email to: ${emailInput.value}`);
    }
    
    // Show success screen instead of closing the modal
    setRegistrationComplete(true);
    console.log(`[${CURRENT_TIMESTAMP}] Registration complete set to true`);
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