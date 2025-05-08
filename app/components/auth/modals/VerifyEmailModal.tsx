'use client';

import React, { useEffect, useState } from 'react';
import Modal from '../../ui/Modal';
import VerifyEmailForm from '../forms/VerifyEmailResult';
import { useModal } from '@/lib/contexts/ModalContext';
import { verifyEmail } from '@/lib/auth/email-actions';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

interface VerifyEmailModalProps {
  token?: string;
}

export default function VerifyEmailModal({ token }: VerifyEmailModalProps) {
  const { closeModal, openModal } = useModal();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ 
    success: boolean; 
    message: string 
  } | null>(null);

  // Si un token est fourni, tenter de vérifier automatiquement
  useEffect(() => {
    if (token) {
      const verify = async () => {
        setIsVerifying(true);
        try {
          const result = await verifyEmail(token);
          setVerificationResult(result);
        } catch (err) {
          setVerificationResult({
            success: false,
            message: 'Une erreur s\'est produite lors de la vérification.'
          });
        } finally {
          setIsVerifying(false);
        }
      };
      verify();
    }
  }, [token]);

  const handleRequestNewLink = () => {
    openModal('verifyEmail');
  };

  const handleGoToLogin = () => {
    openModal('login');
  };

  // Affichage du résultat de la vérification
  if (token && verificationResult) {
    return (
      <Modal title="Vérification d'email" onClose={closeModal}>
        <div className="text-center py-6">
          {verificationResult.success ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <FiCheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <h3 className="text-xl font-medium text-white">Email vérifié avec succès</h3>
              <p className="text-slate-300">{verificationResult.message}</p>
              <button
                onClick={handleGoToLogin}
                className="w-full mt-4 py-2 px-4 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
              >
                Se connecter
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <FiAlertCircle className="h-16 w-16 text-red-500" />
              </div>
              <h3 className="text-xl font-medium text-white">Échec de la vérification</h3>
              <p className="text-slate-300">{verificationResult.message}</p>
              <button
                onClick={handleRequestNewLink}
                className="w-full mt-4 py-2 px-4 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
              >
                Demander un nouveau lien
              </button>
            </div>
          )}
        </div>
      </Modal>
    );
  }

  // Formulaire pour demander un nouveau lien de vérification
  return (
    <Modal title="Vérification d'email" onClose={closeModal}>
      <VerifyEmailForm 
        onSuccess={() => {
          closeModal();
        }}
      />
    </Modal>
  );
}