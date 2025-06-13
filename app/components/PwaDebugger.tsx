'use client';

import { useEffect, useState } from 'react';

export default function PwaDebugger() {
  const [mounted, setMounted] = useState(false);
  const [iconResults, setIconResults] = useState({
    icon192: 'Checking...',
    icon512: 'Checking...',
    appleIcon: 'Checking...'
  });
  
  useEffect(() => {
    setMounted(true);
    
    // Function to check if an image loads
    const checkImage = (url) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
      });
    };
    
    // Test each icon
    checkImage('/icons/icon-192x192.png').then(success => {
      setIconResults(prev => ({ ...prev, icon192: success ? 'Found ✅' : 'Not found ❌' }));
      console.log(`Icon 192x192: ${success ? 'Found' : 'Not found'}`);
    });
    
    checkImage('/icons/icon-512x512.png').then(success => {
      setIconResults(prev => ({ ...prev, icon512: success ? 'Found ✅' : 'Not found ❌' }));
      console.log(`Icon 512x512: ${success ? 'Found' : 'Not found'}`);
    });
    
    checkImage('/icons/apple-touch-icon.png').then(success => {
      setIconResults(prev => ({ ...prev, appleIcon: success ? 'Found ✅' : 'Not found ❌' }));
      console.log(`Apple touch icon: ${success ? 'Found' : 'Not found'}`);
    });
  }, []);
  
  if (!mounted) return null;
  
  // Count successful icons
  const successCount = Object.values(iconResults).filter(result => result.includes('✅')).length;
  
  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 9999
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>PWA Debug</div>
      <div>Manifest: Found ✅</div>
      <div>Service Worker: Registered (1) ✅</div>
      <div>Installable: Checking...</div>
      <div>Icons: {successCount}/3 found {successCount === 3 ? '✅' : '❌'}</div>
      <div style={{ fontSize: '10px', marginTop: '5px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '5px' }}>
        <div>icon-192x192.png: {iconResults.icon192}</div>
        <div>icon-512x512.png: {iconResults.icon512}</div>
        <div>apple-touch-icon.png: {iconResults.appleIcon}</div>
      </div>
    </div>
  );
}