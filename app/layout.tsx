import { Suspense } from 'react';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { ModalProvider } from '@/lib/contexts/ModalContext';
import { FootballDataProvider } from '@/lib/contexts/FootballDataContext';
import { ToastProvider } from '@/lib/contexts/ToastContext';
import AuthModals from './components/auth/AuthModals';
import PushNotificationSetup from './components/PushNotificationSetup';
import GlobalStyles from './components/GlobalStyles';
import ServiceWorkerRegistration from './components/ServiceWorkerRegistration';
import './globals.css';
import PwaDebugger from './components/PwaDebugger';

/**
 * Root layout configuration
 * Last updated: 2025-06-13 01:50:30
 * Updated by: Sdiabate1337
 */

export const metadata = {
  title: 'Mythayun - Football Experience Reimagined',
  description: 'Live scores, stadium guides, and official news for an unmatched football experience',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Mythayun'
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#4f46e5',
};

// Enhanced loading fallback with branded spinner
const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900">
    <div className="relative w-16 h-16 mb-4">
      <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
      <div className="absolute inset-3 flex items-center justify-center">
        <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">M</div>
      </div>
    </div>
    <div className="text-slate-300">Loading...</div>
  </div>
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Direct link to manifest.json - this is crucial */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Apple specific tags for PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        
        {/* Theme color for browser UI */}
        <meta name="theme-color" content="#4f46e5" />
        
        {/* Prevent tap highlight on mobile */}
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className="bg-slate-900 text-white overscroll-none">
        <AuthProvider>
          <ModalProvider>
            <ToastProvider>
              {/* Add FootballDataProvider around Suspense */}
              <FootballDataProvider>
                {/* Wrap children in Suspense boundary */}
                <Suspense fallback={<LoadingFallback />}>
                  {children}
                </Suspense>
              </FootballDataProvider>
              <AuthModals />
              <PushNotificationSetup />
              <GlobalStyles />
            </ToastProvider>
          </ModalProvider>
        </AuthProvider>
        <ServiceWorkerRegistration />
        {process.env.NODE_ENV === 'development' && <PwaDebugger />}
      </body>
    </html>
  );
}