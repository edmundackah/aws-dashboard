"use client";

import {useDashboardData} from "@/hooks/use-dashboard-data";
import {DashboardPage} from "@/components/dashboard/page";
import {LoadingScreen} from "@/components/loading-screen";
import {ErrorDisplay} from "@/components/error-display";

export default function Home() {
  const { data, isLoading, error } = useDashboardData();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !data) {
    return <ErrorDisplay message={error || "An unknown error occurred."} />;
  }

  return <DashboardPage data={data} />;
}