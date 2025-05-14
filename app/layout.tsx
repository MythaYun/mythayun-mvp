

import { Suspense } from 'react';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { ModalProvider } from '@/lib/contexts/ModalContext';
import AuthModals from './components/auth/AuthModals';
import './globals.css';

export const metadata = {
  title: 'MythaYun',
  description: 'MythaYun App'
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
};

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-900">
    <div className="animate-pulse text-white">Chargement...</div>
  </div>
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-slate-900 text-white">
        <AuthProvider>
          <ModalProvider>
            {/* Wrap children in Suspense boundary */}
            <Suspense fallback={<LoadingFallback />}>
              {children}
            </Suspense>
            <AuthModals />
          </ModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}