"use client";

import { BurndownPageClient } from "@/components/burndown-page-client";
import { getFaro } from '@/lib/faro';
import { useEffect } from 'react';

export default function BurndownPage() {
  const faro = getFaro();

  useEffect(() => {
    if (faro) {
      faro.api.pushLog(['Burndown page loaded']);
    }
  }, [faro]);

  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 pt-6 md:gap-8">
      <BurndownPageClient />
    </main>
  );
}


