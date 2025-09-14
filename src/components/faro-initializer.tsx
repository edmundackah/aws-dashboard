'use client';

import { useEffect } from 'react';
import { initializeFaroClient } from '@/lib/faro';

export function FaroInitializer() {
  useEffect(() => {
    const enabled = (process.env.NEXT_PUBLIC_FARO_ENABLED ?? 'true').toLowerCase() !== 'false';
    if (enabled) {
      void initializeFaroClient();
    }
  }, []);

  return null;
}
