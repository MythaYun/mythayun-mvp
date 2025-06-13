'use client';

import { useEffect } from 'react';

export default function ManifestLinker() {
  useEffect(() => {
    // Check if manifest link already exists
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = '/manifest.json';
      document.head.appendChild(link);
      console.log('[2025-06-13 00:48:18] [Sdiabate1337] Manifest link added dynamically');
    }
  }, []);

  return null;
}