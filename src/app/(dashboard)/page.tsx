"use client";

import {useEffect} from "react";
import {useDashboardStore} from "@/stores/use-dashboard-store";
import {LoadingScreen} from "@/components/loading-screen";
import {ErrorDisplay} from "@/components/error-display";
import {DashboardPageClient} from "@/components/dashboard/page";

export default function Page() {
  const { data, loading, error, fetchData } = useDashboardStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorDisplay message={error} />;
  if (!data) return <ErrorDisplay message="No data available" />;

  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <DashboardPageClient teamsData={data.allTeamStats} spaData={data.spaData} msData={data.msData} />
    </main>
  );
}
