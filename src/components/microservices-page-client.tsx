"use client";

import { useMemo, useState, useEffect } from "react";
import { Microservice } from "@/app/data/schema";
import { DataTable } from "@/components/dashboard/data-table";
import { columns as msColumns } from "@/components/dashboard/ms-columns";
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
  const [environmentFilter, setEnvironmentFilter] = usePersistentState<EnvFilter>(
    "ms_environmentFilter",
    "all",
  );
  const [otelFilter, setOtelFilter] = usePersistentState("ms_otelFilter", "all");
  const [mssdkFilter, setMssdkFilter] =
    usePersistentState("ms_mssdkFilter", "all");

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
        if (otelFilter === "all") return true;
        const value = item.otel as unknown;
        if (typeof value === "string") return value === otelFilter;
        if (value && typeof value === "object") {
          const maybeVersion = (value as Record<string, unknown>)["version"];
          if (typeof maybeVersion === "string") return maybeVersion === otelFilter;
        }
        return false;
      })
      .filter((item) => {
        if (mssdkFilter === "all") return true;
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

  const otelOptions = otelVersionValues.map((v) => ({ label: v, value: v }));
  const mssdkOptions = mssdkVersionValues.map((v) => ({ label: v, value: v }));

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
        <div>
          <Select value={otelFilter} onValueChange={setOtelFilter}>
            <SelectTrigger className="w-full sm:w-[200px] font-medium">
              <SelectValue placeholder="Select OTel version" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All OTel versions</SelectItem>
              {otelOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={mssdkFilter} onValueChange={setMssdkFilter}>
            <SelectTrigger className="w-full sm:w-[200px] font-medium">
              <SelectValue placeholder="Select MSSDK version" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All MSSDK versions</SelectItem>
              {mssdkOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="w-full">
        <DataTable columns={msColumns} data={filteredData} tabId="microservices" />
      </div>
    </div>
  );
}
