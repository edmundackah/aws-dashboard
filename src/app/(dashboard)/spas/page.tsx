"use client";

import { SpasPageClient } from "@/components/spas-page-client";
import { ErrorDisplay } from "@/components/error-display";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { LoadingScreen } from "@/components/loading-screen";
import { getFaro } from '@/lib/faro';
import { useEffect } from 'react';

export default function SpasPage() {
  const { data, isLoading, error } = useDashboardData();
  const faro = getFaro();

  useEffect(() => {
    if (faro) {
      faro.api.pushLog(['SPAs page loaded']);
    }
  }, [faro]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  if (!data) {
    return <ErrorDisplay message="Failed to load dashboard data. Please try again later." />;
  }

  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 pt-6 md:gap-8">
      <SpasPageClient spaData={data.spaData} allTeams={data.allTeams} />
    </main>
  );
}
