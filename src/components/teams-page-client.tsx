"use client";

import { useMemo, useState, useEffect } from "react";
import { TeamStat, Spa, Microservice } from "@/app/data/schema";
import { DataTable } from "@/components/dashboard/data-table";
import { columns as teamStatsColumns } from "@/components/dashboard/team-stats-columns";
import { EnvironmentCombobox } from "@/components/ui/EnvironmentCombobox";

type EnvKey = "dev" | "sit" | "uat" | "nft";

interface TeamsPageClientProps {
  teamsData: TeamStat[];
  spaData: Spa[];
  msData: Microservice[];
}

const usePersistentState = <T,>(key: string, defaultValue: T) => {
  const [state, setState] = useState<T>(() => {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState] as const;
};

export function TeamsPageClient({
  teamsData = [],
  spaData = [],
  msData = [],
}: TeamsPageClientProps) {
  const [environmentFilter, setEnvironmentFilter] = usePersistentState<EnvKey>(
    "teams_environmentFilter",
    "dev",
  );

  // Sanitize legacy 'all' values if present
  useEffect(() => {
    if (environmentFilter === ("all" as unknown as EnvKey)) {
      setEnvironmentFilter("dev");
    }
  }, [environmentFilter, setEnvironmentFilter]);

  const rows = useMemo(() => {
    // Recompute counts per team based on selected environment
    return teamsData.map((team) => {
      const envKey: EnvKey = environmentFilter;

      const teamSpas = spaData.filter((spa) => {
        if (spa.subgroupName !== team.teamName) return false;
        return !!spa.environments?.[envKey];
      });

      const teamMs = msData.filter((ms) => {
        if (ms.subgroupName !== team.teamName) return false;
        return !!ms.environments?.[envKey];
      });

      const migratedSpaCount = teamSpas.filter((s) => s.status === "MIGRATED").length;
      const outstandingSpaCount = teamSpas.filter((s) => s.status !== "MIGRATED").length;
      const migratedMsCount = teamMs.filter((m) => m.status === "MIGRATED").length;
      const outstandingMsCount = teamMs.filter((m) => m.status !== "MIGRATED").length;

      return {
        ...team,
        migratedSpaCount,
        outstandingSpaCount,
        migratedMsCount,
        outstandingMsCount,
      } satisfies TeamStat;
    });
  }, [teamsData, spaData, msData, environmentFilter]);

  return (
    <div className="flex flex-col gap-4 w-full max-w-none">
      <div className="flex items-center gap-4 w-full">
        <div>
          <EnvironmentCombobox
            value={environmentFilter}
            onChange={(v) => setEnvironmentFilter(v as EnvKey)}
            includeAllOption={false}
          />
        </div>
      </div>
      <div className="w-full">
        <DataTable columns={teamStatsColumns} data={rows} tabId="teams" />
      </div>
    </div>
  );
}
