"use client";

import { useMemo, useState, useEffect } from "react";
import { Spa } from "@/app/data/schema";
import { DataTable } from "@/components/dashboard/data-table";
import { columns as spaColumns } from "@/components/dashboard/spa-columns";
import { TeamCombobox } from "@/components/team-combobox";
import { EnvironmentCombobox } from "@/components/ui/EnvironmentCombobox";
import { StatusCombobox, StatusValue } from "@/components/ui/StatusCombobox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Filter, X } from "lucide-react";

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
  const [statusFilter, setStatusFilter] = usePersistentState<StatusValue>(
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

  const hasActiveFilters = useMemo(() => {
    return (
      teamFilter !== "all" ||
      statusFilter !== "all" ||
      environmentFilter !== "all"
    );
  }, [teamFilter, statusFilter, environmentFilter]);

  const clearAll = () => {
    setTeamFilter("all");
    setStatusFilter("all");
    setEnvironmentFilter("all");
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-none">
      <div className="flex flex-col gap-3 w-full">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" /> Filters
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[360px] p-4" align="start">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Filter SPAs</span>
                    {hasActiveFilters && (
                      <Button variant="destructive-outline" size="sm" onClick={clearAll}>
                        Clear all
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-col gap-3">
                    <TeamCombobox
                      teams={allTeams}
                      value={teamFilter}
                      onChange={setTeamFilter}
                    />
                    <StatusCombobox
                      value={statusFilter}
                      onChange={(v: StatusValue) => setStatusFilter(v)}
                    />
                    <EnvironmentCombobox
                      value={environmentFilter}
                      onChange={(v) => setEnvironmentFilter(v as EnvFilter)}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="text-sm text-muted-foreground">
            Showing {filteredData.length} of {spaData.length}
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            {teamFilter !== "all" && (
              <Badge variant="outline" className="bg-accent/40 h-8 px-3">
                Team: {teamFilter}
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-1 h-5 w-5"
                  onClick={() => setTeamFilter("all")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </Badge>
            )}
            {statusFilter !== "all" && (
              <Badge variant="outline" className="bg-accent/40 h-8 px-3">
                Status: {statusFilter}
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-1 h-5 w-5"
                  onClick={() => setStatusFilter("all")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </Badge>
            )}
            {environmentFilter !== "all" && (
              <Badge variant="outline" className="bg-accent/40 h-8 px-3">
                Env: {environmentFilter}
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-1 h-5 w-5"
                  onClick={() => setEnvironmentFilter("all")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </Badge>
            )}
            <Separator className="mx-1 h-4" orientation="vertical" />
            <Button variant="destructive-outline" size="sm" onClick={clearAll}>
              Clear all
            </Button>
          </div>
        )}
      </div>

      <div className="w-full">
        <DataTable columns={spaColumns} data={filteredData} tabId="spas" />
      </div>
    </div>
  );
}
