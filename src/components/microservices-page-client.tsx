"use client";

import { useMemo, useState, useEffect } from "react";
import { Microservice } from "@/app/data/schema";
import { DataTable } from "@/components/dashboard/data-table";
import { columns as msColumns } from "@/components/dashboard/ms-columns";
import { TeamCombobox } from "@/components/team-combobox";
import { EnvironmentCombobox } from "@/components/ui/EnvironmentCombobox";
import { VersionCombobox } from "@/components/ui/VersionCombobox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Filter, X } from "lucide-react";
import { StatusCombobox, StatusValue } from "@/components/ui/StatusCombobox";

type EnvKey = "dev" | "sit" | "uat" | "nft";
type EnvFilter = EnvKey | "all";

type VersionValue = string | null;

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
  const [statusFilter, setStatusFilter] = usePersistentState<StatusValue>(
    "ms_statusFilter",
    "all",
  );
  const [environmentFilter, setEnvironmentFilter] = usePersistentState<EnvFilter>(
    "ms_environmentFilter",
    "all",
  );
  const [otelFilter, setOtelFilter] = usePersistentState<VersionValue>(
    "ms_otelFilter",
    null,
  );
  const [mssdkFilter, setMssdkFilter] = usePersistentState<VersionValue>(
    "ms_mssdkFilter",
    null,
  );

  const otelVersionValues = useMemo(() => {
    const versions = new Set<string>();
    msData.forEach((item) => {
      const value = item.otel as unknown;
      if (typeof value === "string") {
        const v = value.trim();
        if (v && v.toUpperCase() !== "N/A") versions.add(v);
      } else if (value && typeof value === "object") {
        const maybeVersion = (value as Record<string, unknown>)["version"];
        if (typeof maybeVersion === "string" && maybeVersion.trim()) {
          versions.add(maybeVersion.trim());
        }
      }
    });
    return Array.from(versions).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [msData]);

  const mssdkVersionValues = useMemo(() => {
    const versions = new Set<string>();
    msData.forEach((item) => {
      const value = item.mssdk as unknown;
      if (typeof value === "string") {
        const v = value.trim();
        if (v && v.toUpperCase() !== "N/A") versions.add(v);
      } else if (value && typeof value === "object") {
        const maybeVersion = (value as Record<string, unknown>)["version"];
        if (typeof maybeVersion === "string" && maybeVersion.trim()) {
          versions.add(maybeVersion.trim());
        }
      }
    });
    return Array.from(versions).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [msData]);

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
      )
      .filter(
        (item) =>
          environmentFilter === "all" ||
          !!item.environments?.[environmentFilter as EnvKey],
      )
      .filter((item) => {
        if (!otelFilter) return true;
        const value = item.otel as unknown;
        if (typeof value === "string") return value === otelFilter;
        if (value && typeof value === "object") {
          const maybeVersion = (value as Record<string, unknown>)["version"];
          if (typeof maybeVersion === "string") return maybeVersion === otelFilter;
        }
        return false;
      })
      .filter((item) => {
        if (!mssdkFilter) return true;
        const value = item.mssdk as unknown;
        if (typeof value === "string") return value === mssdkFilter;
        if (value && typeof value === "object") {
          const maybeVersion = (value as Record<string, unknown>)["version"];
          if (typeof maybeVersion === "string") return maybeVersion === mssdkFilter;
        }
        return false;
      });
  }, [
    msData,
    teamFilter,
    statusFilter,
    environmentFilter,
    otelFilter,
    mssdkFilter,
  ]);

  const hasActiveFilters = useMemo(() => {
    return (
      teamFilter !== "all" ||
      statusFilter !== "all" ||
      environmentFilter !== "all" ||
      !!otelFilter ||
      !!mssdkFilter
    );
  }, [teamFilter, statusFilter, environmentFilter, otelFilter, mssdkFilter]);

  const clearAll = () => {
    setTeamFilter("all");
    setStatusFilter("all");
    setEnvironmentFilter("all");
    setOtelFilter(null);
    setMssdkFilter(null);
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
                      <div className="text-sm font-medium">Filter microservices</div>
                      <div className="text-xs text-muted-foreground">Refine by team, status, environment, and versions.</div>
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
                      <div className="text-xs font-medium text-muted-foreground mt-3">Show by migration completion</div>
                      <StatusCombobox
                        value={statusFilter}
                        onChange={setStatusFilter}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">Environment</div>
                      <EnvironmentCombobox
                        value={environmentFilter}
                        onChange={(v) => setEnvironmentFilter(v as EnvFilter)}
                      />
                      <div className="text-xs font-medium text-muted-foreground mt-3">OTel version</div>
                      <VersionCombobox
                        value={otelFilter}
                        onChange={setOtelFilter}
                        options={otelVersionValues}
                        placeholder="OTel version..."
                      />
                      <div className="text-xs font-medium text-muted-foreground mt-3">MSSDK version</div>
                      <VersionCombobox
                        value={mssdkFilter}
                        onChange={setMssdkFilter}
                        options={mssdkVersionValues}
                        placeholder="MSSDK version..."
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
            Showing {filteredData.length} of {msData.length}
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
            {otelFilter && (
              <Badge variant="outline" className="bg-accent/40 h-8 px-3">
                OTel: {otelFilter}
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-1 h-5 w-5"
                  onClick={() => setOtelFilter(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </Badge>
            )}
            {mssdkFilter && (
              <Badge variant="outline" className="bg-accent/40 h-8 px-3">
                MSSDK: {mssdkFilter}
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-1 h-5 w-5"
                  onClick={() => setMssdkFilter(null)}
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
        <DataTable columns={msColumns} data={filteredData} tabId="microservices" />
      </div>
    </div>
  );
}
