'use client';

import { useState, useEffect } from 'react';

export const useTheme = () => {
  // États initaux avec valeurs par défaut sécurisées pour le rendu serveur
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Marquer le composant comme monté
    setMounted(true);
    
    // Vérifier le thème actuel
    setIsDark(document.documentElement.classList.contains('dark'));
    
    // Observer les changements de thème
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.attributeName === 'class' &&
          mutation.target === document.documentElement
        ) {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  return { isDark, mounted };
};