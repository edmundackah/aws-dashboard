"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/stores/use-dashboard-store";
import { LoadingScreen } from "@/components/loading-screen";
import { ErrorDisplay } from "@/components/error-display";
import { DashboardPageClient } from "@/components/dashboard/page";
import { SpasPageClient } from "@/components/spas-page-client";
import { MicroservicesPageClient } from "@/components/microservices-page-client";
import { TeamsPageClient } from "@/components/teams-page-client";
import { BurndownPageClient } from "@/components/burndown-page-client";
import ReleaseNotesPage from "@/app/(dashboard)/release-notes/page";
import ApiDocsPageClient from "@/components/api-docs/api-docs-page-client";

export function DashboardContentSwitcher() {
  const { data, loading, error, fetchData, selectedPage } = useDashboardStore();

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

  switch (selectedPage) {
    case "overview":
      return (
        <DashboardPageClient
          teamsData={data.allTeamStats}
          spaData={data.spaData}
          msData={data.msData}
        />
      );
    case "spas":
      return (
        <SpasPageClient
          spaData={data.spaData}
          allTeams={data.allTeams}
        />
      );
    case "microservices":
      return (
        <MicroservicesPageClient
          msData={data.msData}
          allTeams={data.allTeams}
        />
      );
    case "teams":
      return (
        <div className="grid flex-1 items-start gap-4 p-0 sm:px-0 sm:py-0 md:gap-8">
          <TeamsPageClient
            teamsData={data.allTeamStats}
            spaData={data.spaData}
            msData={data.msData}
          />
        </div>
      );
    case "burndown":
      return <BurndownPageClient />;
    case "release-notes":
      return <ReleaseNotesPage />;
    case "api-docs":
      return <ApiDocsPageClient />;
    default:
      return <ErrorDisplay message="Unknown page." />;
  }
}


