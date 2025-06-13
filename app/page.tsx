import { Suspense } from 'react';
import HomePage from './components/HomePage';

// Current system information
const CURRENT_TIMESTAMP = "2025-06-12 21:05:04";
const CURRENT_USER = "Sdiabate1337";

// Mobile-optimized loading fallback
const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 px-4">
    <div className="relative w-14 h-14 mb-4">
      <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
      <div className="absolute inset-3 flex items-center justify-center">
        <div className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">M</div>
      </div>
    </div>
    <div className="text-slate-300 text-center">
      Loading the Mythayun experience...
    </div>
  </div>
);

export default function Page() {
  // Capture page load time for performance metrics
  if (typeof window !== 'undefined') {
    console.log(`[${CURRENT_TIMESTAMP}] [${CURRENT_USER}] Page loaded`);
    
    // Record performance metrics when available
    if (window.performance) {
      setTimeout(() => {
        const pageLoadTime = window.performance.now();
        console.log(`[${CURRENT_TIMESTAMP}] [${CURRENT_USER}] Page load time: ${Math.round(pageLoadTime)}ms`);
      }, 0);
    }
  }
  
  return (
    <Suspense fallback={<LoadingFallback />}>
      <HomePage />
    </Suspense>
  );
}