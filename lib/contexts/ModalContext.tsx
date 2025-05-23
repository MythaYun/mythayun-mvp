'use client';

import React, { createContext, useContext, useState } from 'react';

// Types de modaux disponibles
export type ModalType = 'login' | 'register' | 'forgotPassword' | 'resetPassword' | 'verifyEmail' | null;

interface ModalContextType {
  activeModal: ModalType;
  openModal: (modal: ModalType, data?: any) => void;
  closeModal: () => void;
  modalData?: any;
}

// Informations système actuelles
const CURRENT_TIMESTAMP = "2025-05-07 17:42:36";
const CURRENT_USER = "Sdiabate1337";

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalData, setModalData] = useState<any>(null);

  const openModal = (modal: ModalType, data?: any): void => {
    console.log(`[${CURRENT_TIMESTAMP}] Ouverture du modal: ${modal}`);
    setActiveModal(modal);
    if (data) setModalData(data);
  };

  const closeModal = (): void => {
    console.log(`[${CURRENT_TIMESTAMP}] Fermeture du modal: ${activeModal}`);
    setActiveModal(null);
    setModalData(null);
  };

  return (
    <ModalContext.Provider value={{ activeModal, openModal, closeModal, modalData }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};