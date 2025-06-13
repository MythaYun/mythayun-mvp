'use client';

import { useState, useEffect } from 'react';

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Handler for the beforeinstallprompt event
    const beforeInstallPromptHandler = (e: any) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the button
      setShowButton(true);
    };

    // Check if already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowButton(false);
      return;
    }

    window.addEventListener('beforeinstallprompt', beforeInstallPromptHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallPromptHandler);
    };
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
        setShowButton(false);
      }
      // Clear the saved prompt as it can't be used again
      setDeferredPrompt(null);
    });
  };

  if (!showButton) return null;

  return (
    <button
      className="fixed bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-full z-50 shadow-lg"
      onClick={handleInstallClick}
    >
      Install App
    </button>
  );
}