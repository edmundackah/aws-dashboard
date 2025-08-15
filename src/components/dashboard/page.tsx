"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamProgressChart } from "@/components/team-progress-chart";
import { MigrationBanner } from "@/components/migration-banner";
import { AnimatedNumber } from "@/components/animated-number";
import { useDashboardStore } from "@/stores/use-dashboard-store";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Trophy } from "lucide-react";
import confetti from "canvas-confetti";
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

  // Totals are computed contextually per environment below
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

  const thresholdPct = (() => {
    const raw = process.env.NEXT_PUBLIC_CONFETTI_THRESHOLD_PCT;
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 50;
  })();
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  const confettiMode = (process.env.NEXT_PUBLIC_CONFETTI_MODE as
    | "off"
    | "eco"
    | "normal") || "eco";
  const confettiCooldownMs = (() => {
    const raw = process.env.NEXT_PUBLIC_CONFETTI_COOLDOWN_MS;
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? Math.max(0, n) : 30000; // 30s default
  })();


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

  // Compute overall progress specifically for services deployed to all environments
  const allEnvStats = useMemo(() => {
    const inAll = (env?: { dev?: boolean; sit?: boolean; uat?: boolean; nft?: boolean }) =>
      Boolean(env?.dev && env?.sit && env?.uat && env?.nft);

    const spaMigratedAll = spaData.filter(
      (s) => inAll(s.environments) && s.status === "MIGRATED",
    ).length;
    const msMigratedAll = msData.filter(
      (m) => inAll(m.environments) && m.status === "MIGRATED",
    ).length;

    const spaPct = spaData.length > 0 ? (spaMigratedAll / spaData.length) * 100 : 0;
    const msPct = msData.length > 0 ? (msMigratedAll / msData.length) * 100 : 0;
    const meetsThreshold = spaPct >= thresholdPct && msPct >= thresholdPct;

    return {
      spaMigratedAll,
      msMigratedAll,
      spaPct,
      msPct,
      meetsThreshold,
    };
  }, [spaData, msData, thresholdPct]);

  // Fire confetti when threshold met on every tab change
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Respect OS reduced motion
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const spaPct = envCounts.spaTotal > 0 ? (envCounts.spaMigrated / envCounts.spaTotal) * 100 : 0;
    const msPct = envCounts.msTotal > 0 ? (envCounts.msMigrated / envCounts.msTotal) * 100 : 0;
    const meets = Math.max(spaPct, msPct) >= thresholdPct;
    if (!meets) return;

    // Tune for low-performance (Citrix, low cores) and configurable modes
    const ua = navigator.userAgent?.toLowerCase?.() || "";
    const isLikelyCitrix = ua.includes("citrix");
    const navAny = navigator as Navigator & { hardwareConcurrency?: number };
    const lowCores = typeof navAny.hardwareConcurrency === "number" && navAny.hardwareConcurrency <= 2;
    const mode: "off" | "eco" | "normal" = isLikelyCitrix || lowCores ? "eco" : confettiMode;
    if (mode === "off") return;

    // Cooldown to avoid repeated heavy effects when flipping tabs
    const cdKey = `confetti_last_${selectedEnv}`;
    const now = Date.now();
    const last = Number(window.sessionStorage.getItem(cdKey) || 0);
    if (confettiCooldownMs > 0 && now - last < confettiCooldownMs) {
      return;
    }

    const duration = mode === "eco" ? 500 : 900;
    const end = Date.now() + duration;
    const colors = ["#ef4444","#f59e0b","#eab308","#22c55e","#06b6d4","#6366f1","#a855f7"];
    if (mode === "eco") {
      // Single light burst
      confetti({ particleCount: 60, spread: 70, startVelocity: 30, origin: { y: 0.6 }, colors, scalar: 0.9 });
    } else {
      const burst = () => {
        confetti({ particleCount: 4, angle: 60, spread: 75, origin: { x: 0 }, colors, scalar: 1 });
        confetti({ particleCount: 4, angle: 120, spread: 75, origin: { x: 1 }, colors, scalar: 1 });
        if (Date.now() < end) requestAnimationFrame(burst);
      };
      confetti({ particleCount: 120, spread: 80, startVelocity: 35, origin: { y: 0.6 }, colors, scalar: 1 });
      requestAnimationFrame(burst);
    }

    window.sessionStorage.setItem(cdKey, String(now));
  }, [selectedEnv, thresholdPct, envCounts.spaMigrated, envCounts.spaTotal, envCounts.msMigrated, envCounts.msTotal, confettiCooldownMs, confettiMode]);

  const displayTeamStats: TeamStat[] = useMemo(() => {
    const teamMap = new Map<string, TeamStat>();

    // Seed all known teams so 0% teams still appear
    teamsData.forEach((t) => {
      teamMap.set(t.teamName, {
        teamName: t.teamName,
        migratedSpaCount: 0,
        outstandingSpaCount: 0,
        migratedMsCount: 0,
        outstandingMsCount: 0,
      } as TeamStat);
    });

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
  }, [inSelectedEnv, spaData, msData, teamsData]);
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {allEnvStats.meetsThreshold ? (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-green-500/20 p-2 rounded-full">
              <Trophy className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-black dark:text-black">Milestone reached! 🎉</h3>
              <p className="text-sm text-black/80 dark:text-black/80">Across all environments, migration has surpassed {thresholdPct}% for SPAs and Microservices.</p>
            </div>
          </div>
          <div className="text-xs text-black/80 dark:text-black/80 whitespace-nowrap">
            {allEnvStats.spaMigratedAll + allEnvStats.msMigratedAll} of {spaData.length + msData.length} migrated
          </div>
        </div>
      ) : (
        <MigrationBanner />
      )}
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
            <div className={`rounded-md border p-3 bg-muted ${hasMounted && ((envCounts.spaTotal > 0 ? (envCounts.spaMigrated / envCounts.spaTotal) * 100 : 0) >= thresholdPct) ? 'rainbow-glow' : ''}`}>
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

            <div className={`rounded-md border p-3 bg-muted ${hasMounted && ((envCounts.msTotal > 0 ? (envCounts.msMigrated / envCounts.msTotal) * 100 : 0) >= thresholdPct) ? 'rainbow-glow' : ''}`}>
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
