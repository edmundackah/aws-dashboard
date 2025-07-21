"use client";

import { useMemo, useState, useEffect } from "react";
import { Microservice } from "@/app/data/schema";
import { DataTable } from "@/components/dashboard/data-table";
import { columns as msColumns } from "@/components/dashboard/ms-columns";
import { TeamCombobox } from "@/components/team-combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
  const [teamFilter, setTeamFilter] = usePersistentState("ms_teamFilter", "all");
  const [statusFilter, setStatusFilter] = usePersistentState("ms_statusFilter", "all");
  const [globalFilter, setGlobalFilter] = usePersistentState("ms_globalFilter", "");

  const filteredData = useMemo(() => {
    return msData
      .filter(item => statusFilter === 'all' || item.status?.toLowerCase().replace('_', '') === statusFilter.replace('_', ''))
      .filter(item => teamFilter === 'all' || item.subgroupName.toLowerCase() === teamFilter.toLowerCase())
      .filter(item => {
        if (!globalFilter) return true;
        const searchStr = globalFilter.toLowerCase();
        return Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchStr)
        ) || (item.environments && JSON.stringify(item.environments).toLowerCase().includes(searchStr));
      });
  }, [msData, teamFilter, statusFilter, globalFilter]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 h-full w-full max-w-none">
      <div className="flex flex-col md:flex-row md:items-end gap-4 flex-shrink-0 w-full">
        <div>
          <label className="text-sm font-medium mb-2 block">Filter by Team:</label>
          <TeamCombobox teams={allTeams} value={teamFilter} onChange={setTeamFilter} />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Filter by Status:</label>
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
        <div className="flex-grow">
          <label className="text-sm font-medium mb-2 block">Global Search:</label>
          <Input
            id="global-search"
            placeholder="Search..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="flex-grow"
          />
        </div>
        <div className="flex gap-2 self-end">
          <Button
            variant="destructive"
            onClick={() => {
              setGlobalFilter("");
              setTeamFilter("all");
              setStatusFilter("all");
            }}
          >
            Clear
          </Button>
        </div>
      </div>
      <div className="flex-1 min-h-0 w-full">
        <DataTable columns={msColumns} data={filteredData} />
      </div>
    </div>
  );
}