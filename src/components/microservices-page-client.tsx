"use client";

import {useEffect, useMemo, useState} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {Microservice} from "@/app/data/schema";
import {DataTable} from "@/components/dashboard/data-table";
import {columns as msColumns} from "@/components/dashboard/ms-columns";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Separator} from "@/components/ui/separator";
import {X} from "lucide-react";
import {StatusValue} from "@/components/ui/StatusCombobox";
import {ServiceFiltersPopover} from "@/components/filters/ServiceFiltersPopover";

type EnvKey = "dev" | "sit" | "uat" | "nft";
type EnvFilter = EnvKey | "all";

type VersionValue = string | null;

interface MicroservicesPageClientProps {
  msData: Microservice[];
  allTeams: string[];
}

export function MicroservicesPageClient({
  msData,
  allTeams,
}: MicroservicesPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [teamFilter, setTeamFilter] = useState(
    () => searchParams.get("team") ?? "all",
  );
  const [statusFilter, setStatusFilter] = useState<StatusValue>(
    () => (searchParams.get("status") as StatusValue) ?? "all",
  );
  const [environmentFilter, setEnvironmentFilter] = useState<EnvFilter>(
    () => (searchParams.get("env") as EnvFilter) ?? "all",
  );
  const [otelFilter, setOtelFilter] = useState<VersionValue>(
    () => searchParams.get("otel"),
  );
  const [mssdkFilter, setMssdkFilter] = useState<VersionValue>(
    () => searchParams.get("mssdk"),
  );

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (teamFilter !== "all") params.set("team", teamFilter); else params.delete("team");
    if (statusFilter !== "all") params.set("status", statusFilter); else params.delete("status");
    if (environmentFilter !== "all") params.set("env", environmentFilter); else params.delete("env");
    if (otelFilter) params.set("otel", otelFilter); else params.delete("otel");
    if (mssdkFilter) params.set("mssdk", mssdkFilter); else params.delete("mssdk");

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [teamFilter, statusFilter, environmentFilter, otelFilter, mssdkFilter, pathname, router, searchParams]);

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

  return (
    <div className="flex flex-col gap-4 w-full max-w-none">
      <div className="flex flex-col gap-3 w-full">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ServiceFiltersPopover
              title="Filter microservices"
              teams={allTeams}
              teamFilter={teamFilter}
              onTeamChange={setTeamFilter}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              environmentFilter={environmentFilter}
              onEnvironmentChange={(v) => setEnvironmentFilter(v as EnvFilter)}
              otelVersionOptions={otelVersionValues}
              otelVersion={otelFilter}
              onOtelVersionChange={setOtelFilter}
              mssdkVersionOptions={mssdkVersionValues}
              mssdkVersion={mssdkFilter}
              onMssdkVersionChange={setMssdkFilter}
              hasActiveFilters={hasActiveFilters}
              onClearAll={clearAll}
            />
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
