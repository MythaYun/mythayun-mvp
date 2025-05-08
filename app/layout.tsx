import { AuthProvider } from '@/lib/contexts/AuthContext';
import { ModalProvider } from '@/lib/contexts/ModalContext';
import AuthModals from './components/auth/AuthModals';
import './globals.css';

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
            {children}
            <AuthModals />
          </ModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}