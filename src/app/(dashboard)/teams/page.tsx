"use client";

import {TeamsPageClient} from "@/components/teams-page-client";
import {useDashboardStore} from "@/stores/use-dashboard-store";
import {useEffect} from "react";
import {LoadingScreen} from "@/components/loading-screen";
import {ErrorDisplay} from "@/components/error-display";

export default function TeamsPage() {
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

  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <TeamsPageClient
        teamsData={data.allTeamStats}
        spaData={data.spaData}
        msData={data.msData}
      />
    </main>
  );
}
