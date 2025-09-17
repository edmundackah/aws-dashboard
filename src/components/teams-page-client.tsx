"use client";

import {useEffect, useMemo, useState} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {Microservice, Spa, TeamStat} from "@/app/data/schema";
import {DataTable} from "@/components/dashboard/data-table";
import {columns as teamStatsColumns} from "@/components/dashboard/team-stats-columns";
import {EnvironmentCombobox} from "@/components/ui/EnvironmentCombobox";
import { useDashboardStore } from "@/stores/use-dashboard-store";

type EnvKey = "dev" | "sit" | "uat" | "nft";

interface TeamsPageClientProps {
  teamsData: TeamStat[];
  spaData: Spa[];
  msData: Microservice[];
}

export function TeamsPageClient({
  teamsData = [],
  spaData = [],
  msData = [],
}: TeamsPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { selectedDepartment } = useDashboardStore();
  
  const [environmentFilter, setEnvironmentFilter] = useState<EnvKey>(
    () => {
      const env = searchParams?.get("env");
      if (env === "dev" || env === "sit" || env === "uat" || env === "nft") {
        return env;
      }
      return "dev";
    }
  );

  useEffect(() => {
    if (!searchParams) return;
    const params = new URLSearchParams(searchParams);
    if (environmentFilter !== "dev") params.set("env", environmentFilter); else params.delete("env");
    if (selectedDepartment) params.set("department", selectedDepartment);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [environmentFilter, selectedDepartment, pathname, router, searchParams]);

  const rows = useMemo(() => {
    // Recompute counts per team based on selected environment
    return teamsData.map((team) => {
      const envKey: EnvKey = environmentFilter;

      // Use environment flags (from main API) only to compute migrated-in-env.
      // Outstanding should represent all services belonging to the team, regardless of env.
      const teamSpasAll = spaData.filter((spa) => spa.subgroupName === team.teamName);
      const teamMsAll = msData.filter((ms) => ms.subgroupName === team.teamName);

      const teamSpasInEnv = teamSpasAll.filter((spa) => !!spa.environments?.[envKey]);
      const teamMsInEnv = teamMsAll.filter((ms) => !!ms.environments?.[envKey]);

      const migratedSpaCount = teamSpasInEnv.filter((s) => s.status === "MIGRATED").length;
      const migratedMsCount = teamMsInEnv.filter((m) => m.status === "MIGRATED").length;

      // Outstanding should count non-migrated services across all of the team's services
      const outstandingSpaCount = teamSpasAll.filter((s) => s.status !== "MIGRATED").length;
      const outstandingMsCount = teamMsAll.filter((m) => m.status !== "MIGRATED").length;

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
