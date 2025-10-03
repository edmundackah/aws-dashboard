"use client";

import {useEffect, useMemo, useState} from "react";
import {Microservice, Spa, TeamStat} from "@/app/data/schema";
import {DataTable} from "@/components/dashboard/data-table";
import {columns as teamStatsColumns, TeamRow} from "@/components/dashboard/team-stats-columns";
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
  const { selectedEnv, setSelectedEnv } = useDashboardStore();
  
  const [environmentFilter, setEnvironmentFilter] = useState<EnvKey>(selectedEnv || "dev");

  useEffect(() => {
    setSelectedEnv(environmentFilter);
  }, [environmentFilter, setSelectedEnv]);

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

      const migratedSpaList = teamSpasInEnv.filter((s) => s.status === "MIGRATED");
      const migratedMsList = teamMsInEnv.filter((m) => m.status === "MIGRATED");
      const migratedSpaCount = migratedSpaList.length;
      const migratedMsCount = migratedMsList.length;

      // Outstanding in selected environment is total minus migrated in that env
      const outstandingSpaList = teamSpasAll.filter(
        (s) => !(s.status === "MIGRATED" && !!s.environments?.[envKey]),
      );
      const outstandingMsList = teamMsAll.filter(
        (m) => !(m.status === "MIGRATED" && !!m.environments?.[envKey]),
      );
      const outstandingSpaCount = outstandingSpaList.length;
      const outstandingMsCount = outstandingMsList.length;

      return {
        ...team,
        migratedSpaCount,
        outstandingSpaCount,
        migratedMsCount,
        outstandingMsCount,
        // Provide exact lists used for popovers so they always match the counts
        _migratedSpaList: migratedSpaList,
        _outstandingSpaList: outstandingSpaList,
        _migratedMsList: migratedMsList,
        _outstandingMsList: outstandingMsList,
      } satisfies TeamRow;
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
