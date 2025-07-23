"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamProgressChart } from "@/components/team-progress-chart";
import { MigrationBanner } from "@/components/migration-banner";
import { AnimatedNumber } from "@/components/animated-number";
import { useDashboardStore } from "@/stores/use-dashboard-store";
import { useEffect } from "react";
import { TeamStat } from "@/app/data/schema";

interface DashboardPageClientProps {
  teamsData: TeamStat[];
}

export const DashboardPageClient = ({
  teamsData,
}: DashboardPageClientProps) => {
  const { fetchData } = useDashboardStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // calculate totals
  const totalSpas = teamsData.reduce(
    (acc, team) =>
      acc + (team.migratedSpaCount ?? 0) + (team.outstandingSpaCount ?? 0),
    0,
  );
  const migratedSpas = teamsData.reduce(
    (acc, team) => acc + (team.migratedSpaCount ?? 0),
    0,
  );

  const totalMs = teamsData.reduce(
    (acc, team) =>
      acc + (team.migratedMsCount ?? 0) + (team.outstandingMsCount ?? 0),
    0,
  );
  const migratedMs = teamsData.reduce(
    (acc, team) => acc + (team.migratedMsCount ?? 0),
    0,
  );

  const spaMigrationPercentage =
    totalSpas > 0 ? (migratedSpas / totalSpas) * 100 : 0;
  const msMigrationPercentage = totalMs > 0 ? (migratedMs / totalMs) * 100 : 0;
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <MigrationBanner />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Total SPAs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedNumber value={totalSpas} />
            </div>
            <p className="text-sm text-muted-foreground">Across all teams</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Migrated SPAs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedNumber value={migratedSpas} />
            </div>
            <p className="text-sm text-muted-foreground">
              {spaMigrationPercentage.toFixed(2)}% completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Total Microservices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedNumber value={totalMs} />
            </div>
            <p className="text-sm text-muted-foreground">Across all teams</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Migrated Microservices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedNumber value={migratedMs} />
            </div>
            <p className="text-sm text-muted-foreground">
              {msMigrationPercentage.toFixed(2)}% completed
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-7">
          <TeamProgressChart teamStats={teamsData ?? []} />
        </div>
      </div>
    </div>
  );
};
