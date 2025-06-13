'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Define timestamp for consistent logging
    const timestamp = '2025-06-13 02:32:33';
    const debug = (msg) => console.log(`[${timestamp}] [Sdiabate1337] ${msg}`);
    const error = (msg, err) => console.error(`[${timestamp}] [Sdiabate1337] ${msg}`, err);
    
    // Check immediately rather than waiting for load event
    // The load event might have already fired if component mounts late
    if ('serviceWorker' in navigator) {
      debug('Browser supports Service Workers');
      
      // Check if we're on HTTPS or localhost (required for service workers)
      const isLocalhost = Boolean(
        window.location.hostname === 'localhost' ||
        window.location.hostname === '[::1]' ||
        window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
      );
      
      const isSecure = window.location.protocol === 'https:' || isLocalhost;
      if (!isSecure) {
        error('Service Worker registration failed: HTTPS required except on localhost');
        return;
      }
      
      debug('Checking manifest...');
      
      // First verify the manifest is available
      fetch('/manifest.json')
        .then(response => {
          debug(`Manifest fetch status: ${response.status}`);
          if (!response.ok) {
            throw new Error(`Manifest HTTP error ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          debug(`Manifest loaded: ${data.name}`);
          
          // Next verify sw.js is accessible
          debug('Checking if service worker file exists...');
          return fetch('/sw.js').then(response => {
            if (!response.ok) {
              throw new Error(`Service worker file not found: ${response.status}`);
            }
            debug('Service worker file exists, proceeding with registration');
            return navigator.serviceWorker.register('/sw.js', {
              scope: '/'
            });
          });
        })
        .then(registration => {
          debug(`Service worker registered successfully with scope: ${registration.scope}`);
          
          // Check if there's an update
          if (registration.installing) {
            debug('Service worker is installing');
          } else if (registration.waiting) {
            debug('Service worker is waiting');
          } else if (registration.active) {
            debug('Service worker is active');
          }
        })
        .catch(err => {
          // More detailed error logging
          error(`Service worker registration failed:`, err);
          
          // Special handling for common errors
          if (err.message.includes('404')) {
            error('Service worker file (sw.js) not found. Make sure it exists in the public directory.');
          } else if (err.message.includes('SSL')) {
            error('Service worker registration requires HTTPS (except on localhost).');
          }
        });
    } else {
      debug('Browser does not support Service Workers');
    }
  }, []);

  return null;
}