"use client";

import { useMemo, useState, useEffect } from "react";
import { TeamStat } from "@/app/data/schema";
import { DataTable } from "@/components/dashboard/data-table";
import { columns as teamStatsColumns } from "@/components/dashboard/team-stats-columns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TeamsPageClientProps {
  teamsData: TeamStat[];
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

export function TeamsPageClient({ teamsData = [] }: TeamsPageClientProps) {
  const [statusFilter, setStatusFilter] = usePersistentState(
    "teams_statusFilter",
    "all",
  );

  const filteredData = useMemo(() => {
    return (teamsData || []).filter((team) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "migrated") {
        return team.outstandingSpaCount === 0 && team.outstandingMsCount === 0;
      }
      if (statusFilter === "not_migrated") {
        return team.migratedSpaCount === 0 && team.migratedMsCount === 0;
      }
      return true;
    });
  }, [teamsData, statusFilter]);

  return (
    <div className="flex flex-col gap-4 w-full max-w-none">
      <div className="flex items-center gap-4 w-full">
        <div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] font-medium">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Show All</SelectItem>
              <SelectItem value="migrated">Completed</SelectItem>
              <SelectItem value="not_migrated">Not Started</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="w-full">
        <DataTable columns={teamStatsColumns} data={filteredData} tabId="teams" />
      </div>
    </div>
  );
}
