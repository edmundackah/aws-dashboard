"use client";

import {useEffect, useMemo, useState} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {Spa} from "@/app/data/schema";
import {DataTable} from "@/components/dashboard/data-table";
import {columns as spaColumns} from "@/components/dashboard/spa-columns";
import {StatusValue} from "@/components/ui/StatusCombobox";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Separator} from "@/components/ui/separator";
import {X} from "lucide-react";
import {ServiceFiltersPopover} from "@/components/filters/ServiceFiltersPopover";

type EnvKey = "dev" | "sit" | "uat" | "nft";
type EnvFilter = EnvKey | "all";

interface SpasPageClientProps {
  spaData: Spa[];
  allTeams: string[];
}

export function SpasPageClient({ spaData, allTeams }: SpasPageClientProps) {
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
  
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (teamFilter !== "all") params.set("team", teamFilter); else params.delete("team");
    if (statusFilter !== "all") params.set("status", statusFilter); else params.delete("status");
    if (environmentFilter !== "all") params.set("env", environmentFilter); else params.delete("env");
    
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [teamFilter, statusFilter, environmentFilter, pathname, router, searchParams]);

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
            <ServiceFiltersPopover
              title="Filter SPAs"
              teams={allTeams}
              teamFilter={teamFilter}
              onTeamChange={setTeamFilter}
              statusFilter={statusFilter}
              onStatusChange={(v: StatusValue) => setStatusFilter(v)}
              environmentFilter={environmentFilter}
              onEnvironmentChange={(v) => setEnvironmentFilter(v as EnvFilter)}
              includeAllEnvOption={true}
              hasActiveFilters={hasActiveFilters}
              onClearAll={clearAll}
            />
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
