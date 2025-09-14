"use client";

import { TeamsPageClient } from "@/components/teams-page-client";
import { ErrorDisplay } from "@/components/error-display";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { LoadingScreen } from "@/components/loading-screen";
import { getFaro } from '@/lib/faro';
import { useEffect, useMemo } from 'react';
import { TeamStat } from '@/app/data/schema';

export default function TeamsPage() {
  const { data, isLoading, error } = useDashboardData();
  const faro = getFaro();

  useEffect(() => {
    if (faro) {
      faro.api.pushLog(['Teams page loaded']);
    }
  }, [faro]);

  const derivedTeamStats: TeamStat[] = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, TeamStat>();
    (data.allTeams || []).forEach((name) => {
      map.set(name, {
        teamName: name,
        migratedSpaCount: 0,
        outstandingSpaCount: 0,
        migratedMsCount: 0,
        outstandingMsCount: 0,
      });
    });

    (data.spaData || []).forEach((s) => {
      const team = map.get(s.subgroupName) || {
        teamName: s.subgroupName,
        migratedSpaCount: 0,
        outstandingSpaCount: 0,
        migratedMsCount: 0,
        outstandingMsCount: 0,
      };
      if (s.status === 'MIGRATED') team.migratedSpaCount += 1; else team.outstandingSpaCount += 1;
      map.set(s.subgroupName, team);
    });

    (data.msData || []).forEach((m) => {
      const team = map.get(m.subgroupName) || {
        teamName: m.subgroupName,
        migratedSpaCount: 0,
        outstandingSpaCount: 0,
        migratedMsCount: 0,
        outstandingMsCount: 0,
      };
      if (m.status === 'MIGRATED') team.migratedMsCount += 1; else team.outstandingMsCount += 1;
      map.set(m.subgroupName, team);
    });

    return Array.from(map.values());
  }, [data]);

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
      <TeamsPageClient teamsData={data.allTeamStats && data.allTeamStats.length > 0 ? data.allTeamStats : derivedTeamStats} />
    </main>
  );
}
