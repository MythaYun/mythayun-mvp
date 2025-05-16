'use client';

import { useSearchParams } from 'next/navigation';
import Modal from '../../ui/Modal';
import LoginForm from '../forms/LoginForm';
import { useModal } from '@/lib/contexts/ModalContext';

// Current system information
const CURRENT_TIMESTAMP = "2025-05-16 11:27:47";
const CURRENT_USER = "Sdiabate1337finally";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'register' | 'forgotPassword';
  verified?: boolean;
  requiresVerification?: boolean;
  passwordReset?: boolean;
}

export default function LoginModal({ 
  isOpen, 
  onClose, 
  initialView = 'login',
  verified = false,
  requiresVerification = false,
  passwordReset = false
}: LoginModalProps) {
  const { openModal, closeModal } = useModal();
  const searchParams = useSearchParams();
  
  // Check for verification status in URL parameters
  const urlVerified = searchParams.get('verified') === 'true';
  
  // Handle success
  const handleLoginSuccess = () => {
    closeModal();
  };

  // Navigation between forms
  const goToRegister = () => {
    closeModal();
    setTimeout(() => openModal('register'), 100);
  };

  const goToForgotPassword = () => {
    closeModal();
    setTimeout(() => openModal('forgotPassword'), 100);
  };

  return (
    <Modal 
      title="Connexion" 
      onClose={onClose}
    >
      <LoginForm
        onSuccess={handleLoginSuccess}
        onRegisterClick={goToRegister}
        onForgotPasswordClick={goToForgotPassword}
        verified={verified || urlVerified}
        requiresVerification={requiresVerification}
        passwordReset={passwordReset}
      />
    </Modal>
  );
}