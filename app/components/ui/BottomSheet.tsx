'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';

// Current system information
const CURRENT_TIMESTAMP = "2025-06-12 15:17:22";
const CURRENT_USER = "Sdiabate1337";

export default function BottomSheet({ 
  isOpen, 
  onClose, 
  title, 
  children,
  height = 'auto'
}) {
  const [mounted, setMounted] = useState(false);
  const sheetRef = useRef(null);
  const startY = useRef(null);
  const currentY = useRef(null);
  
  useEffect(() => {
    setMounted(true);
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      console.log(`[${CURRENT_TIMESTAMP}] [${CURRENT_USER}] Bottom sheet opened: ${title || 'untitled'}`);
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, title]);
  
  const handleTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
  };
  
  const handleTouchMove = (e) => {
    if (!startY.current) return;
    
    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;
    
    if (deltaY > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  };
  
  const handleTouchEnd = () => {
    if (!startY.current || !currentY.current || !sheetRef.current) return;
    
    const deltaY = currentY.current - startY.current;
    
    if (deltaY > 100) {
      console.log(`[${CURRENT_TIMESTAMP}] [${CURRENT_USER}] Bottom sheet swiped down to close`);
      onClose();
    } else {
      sheetRef.current.style.transform = '';
    }
    
    startY.current = null;
    currentY.current = null;
  };
  
  if (!mounted) return null;
  
  return createPortal(
    <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`absolute left-0 right-0 bottom-0 bg-slate-800 rounded-t-2xl shadow-xl transition-transform duration-300 overflow-hidden ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: height === 'full' ? '90vh' : height === 'half' ? '50vh' : 'auto' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="w-12 h-1 bg-slate-600 rounded-full mx-auto my-3" />
        
        {/* Header */}
        {title && (
          <div className="px-4 py-3 border-b border-slate-700 flex justify-between items-center">
            <h3 className="text-lg font-medium text-white">{title}</h3>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-700 text-slate-400"
            >
              <FiX size={20} />
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 4rem)' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}