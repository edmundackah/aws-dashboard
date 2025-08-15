"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamProgressChart } from "@/components/team-progress-chart";
import { MigrationBanner } from "@/components/migration-banner";
import { AnimatedNumber } from "@/components/animated-number";
import { useDashboardStore } from "@/stores/use-dashboard-store";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Microservice, Spa, TeamStat } from "@/app/data/schema";

interface DashboardPageClientProps {
  teamsData: TeamStat[];
  spaData: Spa[];
  msData: Microservice[];
}

export const DashboardPageClient = ({
  teamsData,
  spaData,
  msData,
}: DashboardPageClientProps) => {
  const { fetchData } = useDashboardStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Overall totals (All environments)
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

  type EnvKey = "dev" | "sit" | "uat" | "nft";
  const ENV_STORAGE_KEY = "dashboard.selectedEnv";
  const isEnvValue = (value: string): value is "all" | EnvKey =>
    value === "all" || value === "dev" || value === "sit" || value === "uat" || value === "nft";
  const [selectedEnv, setSelectedEnv] = useState<"all" | EnvKey>(() => {
    if (typeof window === "undefined") return "dev";
    const saved = window.localStorage.getItem(ENV_STORAGE_KEY);
    return saved && isEnvValue(saved) ? saved : "dev";
  });
  const handleEnvChange = (value: string) => {
    if (isEnvValue(value)) {
      setSelectedEnv(value);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(ENV_STORAGE_KEY, value);
      }
    }
  };

  const envLabels: Record<EnvKey, string> = {
    dev: "DEV",
    sit: "SIT",
    uat: "UAT",
    nft: "NFT",
  };

  const inSelectedEnv = useCallback(
    (env?: {
      dev?: boolean;
      sit?: boolean;
      uat?: boolean;
      nft?: boolean;
    }) =>
      selectedEnv === "all"
        ? Boolean(env?.dev && env?.sit && env?.uat && env?.nft)
        : Boolean(env?.[selectedEnv]),
    [selectedEnv],
  );

  const envCounts = useMemo(() => {
    const spaTotalAll = spaData.length;
    const msTotalAll = msData.length;

    const spaInEnv = spaData.filter((s) => inSelectedEnv(s.environments)).length;
    const msInEnv = msData.filter((m) => inSelectedEnv(m.environments)).length;

    const spaMigratedInEnv = spaData.filter(
      (s) => inSelectedEnv(s.environments) && s.status === "MIGRATED",
    ).length;
    const msMigratedInEnv = msData.filter(
      (m) => inSelectedEnv(m.environments) && m.status === "MIGRATED",
    ).length;

    return {
      spaTotal: spaData.length, // overall totals to make stats comparable
      spaMigrated: spaMigratedInEnv,
      msTotal: msData.length,
      msMigrated: msMigratedInEnv,
      spaCoveragePct: spaTotalAll > 0 ? (spaInEnv / spaTotalAll) * 100 : 0,
      msCoveragePct: msTotalAll > 0 ? (msInEnv / msTotalAll) * 100 : 0,
      spaPresent: spaInEnv,
      msPresent: msInEnv,
    };
  }, [inSelectedEnv, spaData, msData]);

  const displayTeamStats: TeamStat[] = useMemo(() => {
    const teamMap = new Map<string, TeamStat>();

    const ensureTeam = (teamName: string) => {
      if (!teamMap.has(teamName)) {
        teamMap.set(teamName, {
          teamName,
          migratedSpaCount: 0,
          outstandingSpaCount: 0,
          migratedMsCount: 0,
          outstandingMsCount: 0,
        } as TeamStat);
      }
      return teamMap.get(teamName)!;
    };

    spaData.forEach((s) => {
      if (inSelectedEnv(s.environments)) {
        const team = ensureTeam(s.subgroupName);
        if (s.status === "MIGRATED") team.migratedSpaCount += 1;
        else team.outstandingSpaCount += 1;
      }
    });

    msData.forEach((m) => {
      if (inSelectedEnv(m.environments)) {
        const team = ensureTeam(m.subgroupName);
        if (m.status === "MIGRATED") team.migratedMsCount += 1;
        else team.outstandingMsCount += 1;
      }
    });

    return Array.from(teamMap.values());
  }, [inSelectedEnv, spaData, msData]);
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <MigrationBanner />
      <Tabs value={selectedEnv} onValueChange={handleEnvChange}>
        <div className="flex items-center justify-between">
          <TabsList className="bg-muted/90 border border-border">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="dev">DEV</TabsTrigger>
            <TabsTrigger value="sit">SIT</TabsTrigger>
            <TabsTrigger value="uat">UAT</TabsTrigger>
            <TabsTrigger value="nft">NFT</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={selectedEnv}>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border p-3 bg-muted">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">SPAs</span>
                <span className="text-sm text-muted-foreground">
                  {selectedEnv === "all" ? "All envs deployed" : envLabels[selectedEnv as EnvKey]}
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <div className="text-2xl font-bold">
                  <AnimatedNumber value={envCounts.spaMigrated} />
                </div>
                <div className="text-sm text-muted-foreground">/ {envCounts.spaTotal}</div>
                <div className="ml-auto text-sm font-medium">
                  {(
                    envCounts.spaTotal > 0
                      ? (envCounts.spaMigrated / envCounts.spaTotal) * 100
                      : 0
                  ).toFixed(1)}%
                </div>
              </div>
              <div className="mt-4 h-1.5 w-full rounded bg-border">
                <div
                  className="h-1.5 rounded bg-emerald-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, envCounts.spaTotal > 0 ? (envCounts.spaMigrated / envCounts.spaTotal) * 100 : 0))}%`,
                    transition: "width 400ms ease-out",
                  }}
                />
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {envCounts.spaPresent} present in {selectedEnv === "all" ? "all envs" : envLabels[selectedEnv as EnvKey]} · {envCounts.spaCoveragePct.toFixed(1)}% coverage
              </div>
            </div>

            <div className="rounded-md border p-3 bg-muted">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Microservices</span>
                <span className="text-sm text-muted-foreground">
                  {selectedEnv === "all" ? "All envs deployed" : envLabels[selectedEnv as EnvKey]}
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <div className="text-2xl font-bold">
                  <AnimatedNumber value={envCounts.msMigrated} />
                </div>
                <div className="text-sm text-muted-foreground">/ {envCounts.msTotal}</div>
                <div className="ml-auto text-sm font-medium">
                  {(
                    envCounts.msTotal > 0
                      ? (envCounts.msMigrated / envCounts.msTotal) * 100
                      : 0
                  ).toFixed(1)}%
                </div>
              </div>
              <div className="mt-4 h-1.5 w-full rounded bg-border">
                <div
                  className="h-1.5 rounded bg-indigo-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, envCounts.msTotal > 0 ? (envCounts.msMigrated / envCounts.msTotal) * 100 : 0))}%`,
                    transition: "width 400ms ease-out",
                  }}
                />
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {envCounts.msPresent} present in {selectedEnv === "all" ? "all envs" : envLabels[selectedEnv as EnvKey]} · {envCounts.msCoveragePct.toFixed(1)}% coverage
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-7">
          <TeamProgressChart
            teamStats={displayTeamStats ?? []}
            overallTeamStats={teamsData}
            contextLabel={
              selectedEnv === "all" ? "All envs deployed" : envLabels[selectedEnv as EnvKey]
            }
          />
        </div>
      </div>
    </div>
  );
};
