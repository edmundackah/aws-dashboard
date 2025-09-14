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

  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 w-full max-w-none">
      <div className="flex flex-col gap-3 w-full">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" /> Filters
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[560px] p-4" align="start">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Filter SPAs</div>
                      <div className="text-xs text-muted-foreground">Refine by team, status, and environment.</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">Team</div>
                      <TeamCombobox
                        teams={allTeams}
                        value={teamFilter}
                        onChange={setTeamFilter}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">Show by migration completion</div>
                      <StatusCombobox
                        value={statusFilter}
                        onChange={(v: StatusValue) => setStatusFilter(v)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <div className="text-xs font-medium text-muted-foreground">Environment</div>
                      <EnvironmentCombobox
                        value={environmentFilter}
                        onChange={(v) => setEnvironmentFilter(v as EnvFilter)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="destructive-outline"
                      size="sm"
                      onClick={() => {
                        clearAll();
                        setFiltersOpen(false);
                      }}
                      disabled={!hasActiveFilters}
                    >
                      Clear all
                    </Button>
                    <Button size="sm" onClick={() => setFiltersOpen(false)}>Done</Button>
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
