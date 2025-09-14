"use client";

import { useMemo, useState, useEffect } from "react";
import { Spa } from "@/app/data/schema";
import { DataTable } from "@/components/dashboard/data-table";
import { columns as spaColumns } from "@/components/dashboard/spa-columns";
import { TeamCombobox } from "@/components/team-combobox";
import { EnvironmentDropdown } from "@/components/ui/EnvironmentDropdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type EnvKey = "dev" | "sit" | "uat" | "nft";
type EnvFilter = EnvKey | "all";

interface SpasPageClientProps {
  spaData: Spa[];
  allTeams: string[];
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

export function SpasPageClient({ spaData, allTeams }: SpasPageClientProps) {
  const [teamFilter, setTeamFilter] = usePersistentState(
    "spa_teamFilter",
    "all",
  );
  const [statusFilter, setStatusFilter] = usePersistentState(
    "spa_statusFilter",
    "all",
  );
  const [environmentFilter, setEnvironmentFilter] = usePersistentState<EnvFilter>(
    "spa_environmentFilter",
    "all",
  );

  const filteredData = useMemo(() => {
    return spaData
      .filter(
        (item) =>
          statusFilter === "all" ||
          item.status?.toLowerCase().replace("_", "") ===
            statusFilter.replace("_", ""),
      )
      .filter(
        (item) =>
          teamFilter === "all" ||
          item.subgroupName.toLowerCase() === teamFilter.toLowerCase(),
      )
      .filter(
        (item) =>
          environmentFilter === "all" ||
          !!item.environments?.[environmentFilter as EnvKey],
      );
  }, [spaData, teamFilter, statusFilter, environmentFilter]);

  return (
    <div className="flex flex-col gap-4 w-full max-w-none">
      <div className="flex flex-col md:flex-row md:items-end gap-4 w-full">
        <div>
          <TeamCombobox
            teams={allTeams}
            value={teamFilter}
            onChange={setTeamFilter}
          />
        </div>
        <div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] font-medium">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Show All</SelectItem>
              <SelectItem value="migrated">Migrated</SelectItem>
              <SelectItem value="not_migrated">Not Migrated</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <EnvironmentDropdown
            value={environmentFilter}
            onChange={(v) => setEnvironmentFilter(v as EnvFilter)}
          />
        </div>
      </div>
      <div className="w-full">
        <DataTable columns={spaColumns} data={filteredData} tabId="spas" />
      </div>
    </div>
  );
}
