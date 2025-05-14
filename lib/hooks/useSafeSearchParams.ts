'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export function useSafeSearchParams() {
  // Initialize with null for SSR safety
  const [params, setParams] = useState<URLSearchParams | null>(null);
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Only set on client-side
    setParams(searchParams);
  }, [searchParams]);
  
  return params;
}