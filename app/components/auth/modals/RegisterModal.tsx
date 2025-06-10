'use client';

import React, { useState } from 'react';
import { FaGoogle, FaFacebook } from 'react-icons/fa';
import Modal from '../../ui/Modal';
import RegisterForm from '../forms/RegisterForm';
import RegistrationSuccess from '../RegistrationSuccess';
import { useModal } from '@/lib/contexts/ModalContext';

// Current timestamp and user for logging
const CURRENT_TIMESTAMP = "2025-06-10 18:20:46"; // Updated timestamp
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
    setRegistrationMessage(message || 'Registration successful. Please check your email inbox.');
    
    // Show success screen
    setRegistrationComplete(true);
    console.log(`[${CURRENT_TIMESTAMP}] Registration complete, showing verification instructions`);
  };

  // Handle social login redirects
  const handleGoogleSignup = () => {
    console.log(`[${CURRENT_TIMESTAMP}] User initiated Google signup`);
    window.location.href = '/api/auth/google';
  };
  
  const handleFacebookSignup = () => {
    console.log(`[${CURRENT_TIMESTAMP}] User initiated Facebook signup`);
    window.location.href = '/api/auth/facebook';
  };

  const goToLogin = () => {
    closeModal();
    setTimeout(() => openModal('login'), 100);
  };

  return (
    <Modal 
      title={registrationComplete ? "Check Your Email" : "Sign Up"} 
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
        <>
          {/* Social login buttons */}
          <div className="mb-6 space-y-3">
            <button 
              onClick={handleGoogleSignup}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl transition-all bg-white hover:bg-gray-100 text-gray-800 font-medium shadow-sm"
            >
              <FaGoogle className="text-[#4285F4] text-xl" />
              <span>Continue with Google</span>
            </button>
            
            <button 
              onClick={handleFacebookSignup}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl transition-all bg-[#1877F2] hover:bg-[#166FE5] text-white font-medium shadow-sm"
            >
              <FaFacebook className="text-xl" />
              <span>Continue with Facebook</span>
            </button>
          </div>
          
          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 h-px bg-slate-700"></div>
            <span className="px-3 text-sm text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-700"></div>
          </div>
          
          {/* Email registration form */}
          <RegisterForm 
            onSuccess={handleRegistrationSuccess} 
            onLoginClick={goToLogin}
          />
        </>
      )}
    </Modal>
  );
}