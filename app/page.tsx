import { Suspense } from 'react';
import Link from 'next/link';
import HomePage from './components/HomePage';

// Current system information
const CURRENT_TIMESTAMP = "2025-05-29 17:01:30";
const CURRENT_USER = "Sdiabate1337";

export default function Page() {
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      

      <HomePage />
    </Suspense>
  );
}