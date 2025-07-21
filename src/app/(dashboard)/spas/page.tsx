"use client";

import {SpasPageClient} from "@/components/spas-page-client";
import {useDashboardStore} from "@/stores/use-dashboard-store";
import {useEffect} from "react";
import {LoadingScreen} from "@/components/loading-screen";
import {ErrorDisplay} from "@/components/error-display";

export default function SpasPage() {
  const { data, loading, error, fetchData } = useDashboardStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (!data) {
    return <ErrorDisplay error="No data available" />;
  }

  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <SpasPageClient spaData={data.spaData} allTeams={data.allTeams} />
    </main>
  );
}