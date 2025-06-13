'use client';

import { useEffect, useState } from 'react';

export default function PwaDebugger() {
  const [debugInfo, setDebugInfo] = useState({
    manifest: { status: 'Checking...', details: '' },
    serviceWorker: { status: 'Checking...', details: '' },
    installable: { status: 'Checking...', details: '' },
    icons: { status: 'Checking...', details: '' },
    iconDetails: {
      icon192: { status: 'Checking...', dimensions: '', size: '' },
      icon512: { status: 'Checking...', dimensions: '', size: '' },
      appleIcon: { status: 'Checking...', dimensions: '', size: '' }
    }
  });
  
  useEffect(() => {
    const timestamp = '2025-06-13 02:52:28';
    const debug = (area, msg) => console.log(`[${timestamp}] [Sdiabate1337] [${area}] ${msg}`);
    
    // Check manifest
    fetch('/manifest.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        debug('Manifest', `Found with name: ${data.name}`);
        setDebugInfo(prev => ({ 
          ...prev, 
          manifest: { 
            status: 'Found ✅', 
            details: `Name: ${data.name}, Icons: ${data.icons?.length || 0}` 
          } 
        }));
      })
      .catch(error => {
        debug('Manifest', `Error: ${error.message}`);
        setDebugInfo(prev => ({ 
          ...prev, 
          manifest: { 
            status: `Error ❌`, 
            details: error.message 
          } 
        }));
      });
      
    // Check service worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations()
        .then(registrations => {
          if (registrations.length > 0) {
            debug('ServiceWorker', `Registered (${registrations.length})`);
            setDebugInfo(prev => ({ 
              ...prev, 
              serviceWorker: { 
                status: `Registered (${registrations.length}) ✅`, 
                details: `Scope: ${registrations[0].scope}` 
              } 
            }));
          } else {
            debug('ServiceWorker', 'Not registered');
            setDebugInfo(prev => ({ 
              ...prev, 
              serviceWorker: { 
                status: 'Not registered ❌', 
                details: 'No service worker registrations found' 
              } 
            }));
          }
        })
        .catch(error => {
          debug('ServiceWorker', `Error: ${error.message}`);
          setDebugInfo(prev => ({ 
            ...prev, 
            serviceWorker: { 
              status: `Error ❌`, 
              details: error.message 
            } 
          }));
        });
    } else {
      debug('ServiceWorker', 'Not supported');
      setDebugInfo(prev => ({ 
        ...prev, 
        serviceWorker: { 
          status: 'Not supported ❌', 
          details: 'This browser does not support service workers' 
        } 
      }));
    }
    
    // Check if app is installable
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      debug('Install', 'Installable');
      setDebugInfo(prev => ({ 
        ...prev, 
        installable: { 
          status: 'Yes ✅', 
          details: 'Install prompt available' 
        } 
      }));
    });
    
    // Detailed icon checking
    const iconUrls = [
      { name: 'icon192', url: '/icons/icon-192x192.png', expectedSize: 192 },
      { name: 'icon512', url: '/icons/icon-512x512.png', expectedSize: 512 },
      { name: 'appleIcon', url: '/icons/apple-touch-icon.png', expectedSize: 180 }
    ];
    
    iconUrls.forEach(({ name, url, expectedSize }) => {
      debug('Icons', `Checking ${url}`);
      
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
          }
          debug('Icons', `Fetch successful for ${url}`);
          
          // Get file size
          const size = response.headers.get('content-length') || 'unknown';
          const contentType = response.headers.get('content-type');
          
          setDebugInfo(prev => ({
            ...prev,
            iconDetails: {
              ...prev.iconDetails,
              [name]: {
                ...prev.iconDetails[name],
                status: 'Accessible ✅',
                size: `${Math.round(size / 1024)}KB`,
                contentType
              }
            }
          }));
          
          // Now actually load the image to check its dimensions
          return response.blob();
        })
        .then(blob => {
          if (blob.type.startsWith('image/')) {
            const img = new Image();
            img.onload = () => {
              debug('Icons', `Loaded ${url}: ${img.width}x${img.height}px`);
              
              setDebugInfo(prev => ({
                ...prev,
                iconDetails: {
                  ...prev.iconDetails,
                  [name]: {
                    ...prev.iconDetails[name],
                    dimensions: `${img.width}x${img.height}px`,
                    status: img.width === expectedSize ? 'Valid ✅' : 'Wrong size ⚠️'
                  }
                }
              }));
              
              // Update total icon count
              updateIconCount();
            };
            
            img.onerror = () => {
              debug('Icons', `Failed to load image data for ${url}`);
              setDebugInfo(prev => ({
                ...prev,
                iconDetails: {
                  ...prev.iconDetails,
                  [name]: {
                    ...prev.iconDetails[name],
                    dimensions: 'Not loadable',
                    status: 'Invalid image ❌'
                  }
                }
              }));
              updateIconCount();
            };
            
            img.src = URL.createObjectURL(blob);
          } else {
            debug('Icons', `Not an image: ${url} (${blob.type})`);
            setDebugInfo(prev => ({
              ...prev,
              iconDetails: {
                ...prev.iconDetails,
                [name]: {
                  ...prev.iconDetails[name],
                  dimensions: 'Not an image',
                  status: 'Wrong type ❌'
                }
              }
            }));
            updateIconCount();
          }
        })
        .catch(error => {
          debug('Icons', `Error for ${url}: ${error.message}`);
          setDebugInfo(prev => ({
            ...prev,
            iconDetails: {
              ...prev.iconDetails,
              [name]: {
                ...prev.iconDetails[name],
                status: 'Error ❌',
                details: error.message
              }
            }
          }));
          updateIconCount();
        });
    });
    
    const updateIconCount = () => {
      setTimeout(() => {
        setDebugInfo(prev => {
          const validIcons = Object.values(prev.iconDetails).filter(
            icon => icon.status.includes('✅')
          ).length;
          
          return {
            ...prev,
            icons: {
              status: `${validIcons}/3 found ${validIcons === 3 ? '✅' : '❌'}`,
              details: `Check individual icon details below`
            }
          };
        });
      }, 100);
    };
  }, []);
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '350px',
      maxHeight: '80vh',
      overflowY: 'auto'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '14px' }}>PWA Debug (Enhanced)</div>
      
      <div style={{ marginBottom: '5px' }}>
        <b>Manifest:</b> {debugInfo.manifest.status}
        {debugInfo.manifest.details && <div style={{ fontSize: '10px', opacity: 0.8 }}>{debugInfo.manifest.details}</div>}
      </div>
      
      <div style={{ marginBottom: '5px' }}>
        <b>Service Worker:</b> {debugInfo.serviceWorker.status}
        {debugInfo.serviceWorker.details && <div style={{ fontSize: '10px', opacity: 0.8 }}>{debugInfo.serviceWorker.details}</div>}
      </div>
      
      <div style={{ marginBottom: '5px' }}>
        <b>Installable:</b> {debugInfo.installable.status}
        {debugInfo.installable.details && <div style={{ fontSize: '10px', opacity: 0.8 }}>{debugInfo.installable.details}</div>}
      </div>
      
      <div style={{ marginBottom: '5px' }}>
        <b>Icons:</b> {debugInfo.icons.status}
        {debugInfo.icons.details && <div style={{ fontSize: '10px', opacity: 0.8 }}>{debugInfo.icons.details}</div>}
      </div>
      
      <div style={{ marginTop: '10px', fontSize: '11px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '5px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Icon Details:</div>
        
        <div style={{ marginBottom: '3px' }}>
          <b>icon-192x192.png:</b> {debugInfo.iconDetails.icon192.status}
          <div style={{ fontSize: '10px', opacity: 0.8 }}>
            {debugInfo.iconDetails.icon192.dimensions && `Size: ${debugInfo.iconDetails.icon192.dimensions}`}
            {debugInfo.iconDetails.icon192.size && `, File: ${debugInfo.iconDetails.icon192.size}`}
          </div>
        </div>
        
        <div style={{ marginBottom: '3px' }}>
          <b>icon-512x512.png:</b> {debugInfo.iconDetails.icon512.status}
          <div style={{ fontSize: '10px', opacity: 0.8 }}>
            {debugInfo.iconDetails.icon512.dimensions && `Size: ${debugInfo.iconDetails.icon512.dimensions}`}
            {debugInfo.iconDetails.icon512.size && `, File: ${debugInfo.iconDetails.icon512.size}`}
          </div>
        </div>
        
        <div style={{ marginBottom: '3px' }}>
          <b>apple-touch-icon.png:</b> {debugInfo.iconDetails.appleIcon.status}
          <div style={{ fontSize: '10px', opacity: 0.8 }}>
            {debugInfo.iconDetails.appleIcon.dimensions && `Size: ${debugInfo.iconDetails.appleIcon.dimensions}`}
            {debugInfo.iconDetails.appleIcon.size && `, File: ${debugInfo.iconDetails.appleIcon.size}`}
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '10px', fontSize: '10px', color: '#aaa', textAlign: 'right' }}>
        {new Date().toISOString().split('T')[0]}
      </div>
    </div>
  );
}