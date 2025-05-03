import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'MythaYun - Football Standings',
  description: 'Your favorite football standings and stats app',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}