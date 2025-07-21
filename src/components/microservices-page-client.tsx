"use client";

import { useMemo, useState, useEffect } from "react";
import { Microservice } from "@/app/data/schema";
import { DataTable } from "@/components/dashboard/data-table";
import { columns as msColumns } from "@/components/dashboard/ms-columns";
import { TeamCombobox } from "@/components/team-combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MicroservicesPageClientProps {
  msData: Microservice[];
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

export function MicroservicesPageClient({
  msData,
  allTeams,
}: MicroservicesPageClientProps) {
  const [teamFilter, setTeamFilter] = usePersistentState(
    "ms_teamFilter",
    "all",
  );
  const [statusFilter, setStatusFilter] = usePersistentState(
    "ms_statusFilter",
    "all",
  );

  const filteredData = useMemo(() => {
    return msData
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
  }, [msData, teamFilter, statusFilter]);

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
              <SelectItem value="migrated">Migrated</SelectItem>
              <SelectItem value="not_migrated">Not Migrated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex-1 min-h-0 w-full">
        <DataTable columns={msColumns} data={filteredData} />
      </div>
    </div>
  );
}
