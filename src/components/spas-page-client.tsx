"use client";

import { useMemo, useState, useEffect } from "react";
import { Spa } from "@/app/data/schema";
import { DataTable } from "@/components/dashboard/data-table";
import { columns as spaColumns } from "@/components/dashboard/spa-columns";
import { TeamCombobox } from "@/components/team-combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      );
  }, [spaData, teamFilter, statusFilter]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 h-full w-full max-w-none">
      <div className="flex flex-col md:flex-row md:items-end gap-4 flex-shrink-0 w-full">
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
              <SelectItem value="migrated">Migrated Only</SelectItem>
              <SelectItem value="not_migrated">Not Migrated Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex-1 min-h-0 w-full">
        <DataTable columns={spaColumns} data={filteredData} />
      </div>
    </div>
  );
}
