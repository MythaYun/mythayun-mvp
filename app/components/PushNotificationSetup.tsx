'use client';

import { useEffect, useState } from 'react';
import { FiBell, FiBellOff } from 'react-icons/fi';
import { useToast } from '@/lib/contexts/ToastContext';

// Current system information
const CURRENT_TIMESTAMP = "2025-06-12 15:05:16";
const CURRENT_USER = "Sdiabate1337";

// Get VAPID public key from environment variables
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

export default function PushNotificationSetup() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [supported, setSupported] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const { showToast } = useToast();
  
  useEffect(() => {
    // Check if notifications and service workers are supported
    const isNotificationSupported = 'Notification' in window;
    const isServiceWorkerSupported = 'serviceWorker' in navigator;
    const hasVapidKey = !!VAPID_PUBLIC_KEY;
    
    if (isNotificationSupported && isServiceWorkerSupported && hasVapidKey) {
      console.log(`[${CURRENT_TIMESTAMP}] [${CURRENT_USER}] Push notifications are supported`);
      setSupported(true);
      setPermission(Notification.permission);
      
      // Only show button if permission is not granted and not denied
      if (Notification.permission === 'default') {
        // Wait a bit before showing the button to not overwhelm the user
        setTimeout(() => setShowButton(true), 5000);
      }
    } else {
      if (!hasVapidKey) {
        console.error(`[${CURRENT_TIMESTAMP}] [${CURRENT_USER}] VAPID public key is missing`);
      } else {
        console.log(`[${CURRENT_TIMESTAMP}] [${CURRENT_USER}] Push notifications are not supported`);
      }
    }
  }, []);
  
  const requestPermission = async () => {
    if (!supported) return;
    
    try {
      console.log(`[${CURRENT_TIMESTAMP}] [${CURRENT_USER}] Requesting notification permission`);
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        showToast('Notifications enabled!', { type: 'success' });
        registerForPushNotifications();
      } else if (result === 'denied') {
        showToast('Notifications disabled', { type: 'info' });
        setShowButton(false);
      }
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] [${CURRENT_USER}] Error requesting notification permission:`, error);
      showToast('Could not enable notifications', { type: 'error' });
    }
  };
  
  const registerForPushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }
    
    try {
      console.log(`[${CURRENT_TIMESTAMP}] [${CURRENT_USER}] Registering for push notifications`);
      
      // Register or get existing service worker
      const registration = await navigator.serviceWorker.ready;
      
      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      
      // Send subscription to server
      const response = await fetch('/api/push/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          userId: CURRENT_USER,
          timestamp: CURRENT_TIMESTAMP
        })
      });
      
      if (response.ok) {
        console.log(`[${CURRENT_TIMESTAMP}] [${CURRENT_USER}] Push notification subscription successful`);
        
        // Send a test notification after successful registration
        if (process.env.NODE_ENV === 'development') {
          setTimeout(() => {
            new Notification('Mythayun Notifications', {
              body: 'Notifications are now enabled!',
              icon: '/icons/icon-192x192.png'
            });
          }, 1000);
        }
      } else {
        console.error(`[${CURRENT_TIMESTAMP}] [${CURRENT_USER}] Failed to register push subscription on server`);
      }
    } catch (error) {
      console.error(`[${CURRENT_TIMESTAMP}] [${CURRENT_USER}] Failed to subscribe to push notifications:`, error);
      showToast('Failed to setup notifications', { type: 'error' });
    }
  };
  
  // Hide button if not supported or permission is already decided
  if (!supported || !showButton || permission === 'granted' || permission === 'denied') {
    return null;
  }
  
  return (
    <div className="fixed bottom-20 right-4 z-30 animate-bounce-subtle">
      <button
        onClick={requestPermission}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-colors"
        aria-label="Enable notifications"
      >
        <FiBell size={20} />
      </button>
    </div>
  );
}

// Helper function to convert base64 to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}