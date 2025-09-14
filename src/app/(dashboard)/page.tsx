"use client";

import { ErrorDisplay } from "@/components/error-display";
import { DashboardPageClient } from "@/components/dashboard/page";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { LoadingScreen } from "@/components/loading-screen";
import { getFaro } from '@/lib/faro';
import { useEffect } from 'react';

export default function Page() {
  const { data, isLoading, error } = useDashboardData();
  const faro = getFaro();

  useEffect(() => {
    if (faro && data) {
      faro.api.pushLog(['Dashboard data loaded']);
    }
  }, [data, faro]);

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
    <DashboardPageClient
      teamsData={data.allTeamStats}
      spaData={data.spaData}
      msData={data.msData}
    />
  );
}
