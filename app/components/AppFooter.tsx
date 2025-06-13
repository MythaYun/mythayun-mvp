'use client';

import { useState, useEffect } from 'react';
import InstallButton from './InstallButton';

export default function AppFooter() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div>
      <InstallButton />
    </div>
  );
}