'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiCheck, FiInfo, FiAlertTriangle, FiX } from 'react-icons/fi';

// Current system information
const CURRENT_TIMESTAMP = "2025-06-12 15:15:51";
const CURRENT_USER = "Sdiabate1337";

type ToastType = 'success' | 'info' | 'error' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export default function Toast({ 
  message, 
  type = 'info', 
  duration = 3000, 
  onClose 
}: ToastProps) {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Slight delay before showing the toast for smooth animation
    const showTimer = setTimeout(() => {
      setIsVisible(true);
      console.log(`[${CURRENT_TIMESTAMP}] [${CURRENT_USER}] Toast displayed: ${message}`);
    }, 10);
    
    if (duration > 0) {
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
        
        // Allow time for exit animation before actually removing
        setTimeout(() => {
          console.log(`[${CURRENT_TIMESTAMP}] [${CURRENT_USER}] Toast dismissed: ${message}`);
          onClose();
        }, 300);
      }, duration);
      
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
    
    return () => clearTimeout(showTimer);
  }, [duration, onClose, message]);
  
  const handleClose = () => {
    console.log(`[${CURRENT_TIMESTAMP}] [${CURRENT_USER}] Toast manually closed: ${message}`);
    setIsVisible(false);
    setTimeout(onClose, 300);
  };
  
  if (!mounted) return null;
  
  const getIcon = () => {
    switch (type) {
      case 'success': return <FiCheck className="text-green-400" size={18} />;
      case 'error': return <FiAlertTriangle className="text-red-400" size={18} />;
      case 'warning': return <FiAlertTriangle className="text-yellow-400" size={18} />;
      default: return <FiInfo className="text-blue-400" size={18} />;
    }
  };
  
  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return 'bg-green-900/20 border-green-500/30';
      case 'error': return 'bg-red-900/20 border-red-500/30';
      case 'warning': return 'bg-yellow-900/20 border-yellow-500/30';
      default: return 'bg-blue-900/20 border-blue-500/30';
    }
  };
  
  return createPortal(
    <div 
      className={`fixed bottom-20 left-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}
      aria-live="polite"
      role="status"
      aria-atomic="true"
    >
      <div className={`rounded-lg p-4 backdrop-blur-sm border shadow-lg flex items-center ${getBackgroundColor()}`}>
        <div className="flex-shrink-0 mr-3">
          {getIcon()}
        </div>
        <div className="flex-1 text-sm text-white">
          {message}
        </div>
        <button 
          onClick={handleClose}
          className="ml-3 p-1 rounded-full hover:bg-slate-700/50 text-slate-400"
          aria-label="Close notification"
        >
          <FiX size={16} />
        </button>
      </div>
    </div>,
    document.body
  );
}