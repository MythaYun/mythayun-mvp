'use client';

import { useSearchParams } from 'next/navigation';
import { createContext, useContext, ReactNode } from 'react';

// Create context
const SearchParamsContext = createContext<URLSearchParams | null>(null);

// Provider component
export function SearchParamsProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  
  return (
    <SearchParamsContext.Provider value={searchParams}>
      {children}
    </SearchParamsContext.Provider>
  );
}

// Hook to use the search params
export function useSearchParamsContext() {
  const context = useContext(SearchParamsContext);
  if (context === null) {
    throw new Error('useSearchParamsContext must be used within SearchParamsProvider');
  }
  return context;
}