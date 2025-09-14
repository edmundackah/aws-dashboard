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
