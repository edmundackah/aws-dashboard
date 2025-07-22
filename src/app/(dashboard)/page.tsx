"use client";

import { ErrorDisplay } from "@/components/error-display";
import { DashboardPageClient } from "@/components/dashboard/page";
import { useDashboardStore } from "@/stores/use-dashboard-store";
import { useEffect } from "react";
import { LoadingScreen } from "@/components/loading-screen";

export default function Page() {
  const { data, loading, error, fetchData } = useDashboardStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  if (!data) {
    return <ErrorDisplay message="No data available" />;
  }

  return <DashboardPageClient teamsData={data.allTeamStats} />;
}
