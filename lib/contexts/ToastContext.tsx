'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../../app/components/ui/Toast';

// Current system information
const CURRENT_TIMESTAMP = "2025-06-12 14:08:52";
const CURRENT_USER = "Sdiabate1337";

type ToastType = 'success' | 'info' | 'error' | 'warning';

interface ToastOptions {
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
    duration: number;
    id: number;
  } | null>(null);
  
  const showToast = useCallback((message: string, options?: ToastOptions) => {
    const id = Date.now();
    console.log(`[${CURRENT_TIMESTAMP}] [${CURRENT_USER}] Showing toast: ${message}`);
    
    setToast({
      message,
      type: options?.type || 'info',
      duration: options?.duration || 3000,
      id
    });
  }, []);
  
  const hideToast = useCallback(() => {
    setToast(null);
  }, []);
  
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={hideToast}
        />
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}