"use client";

import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Filter} from "lucide-react";
import {TeamCombobox} from "@/components/team-combobox";
import {StatusCombobox, type StatusValue} from "@/components/ui/StatusCombobox";
import {EnvironmentCombobox} from "@/components/ui/EnvironmentCombobox";
import {VersionCombobox} from "@/components/ui/VersionCombobox";

export type EnvKey = "dev" | "sit" | "uat" | "nft";
export type EnvFilter = EnvKey | "all";
export type VersionValue = string | null;

interface ServiceFiltersPopoverProps {
  title: string;
  teams: string[];
  teamFilter: string;
  onTeamChange: (value: string) => void;

  statusFilter: StatusValue;
  onStatusChange: (value: StatusValue) => void;

  environmentFilter: EnvFilter;
  onEnvironmentChange: (value: EnvFilter) => void;
  includeAllEnvOption?: boolean;

  otelVersionOptions?: string[];
  otelVersion?: VersionValue;
  onOtelVersionChange?: (value: VersionValue) => void;

  mssdkVersionOptions?: string[];
  mssdkVersion?: VersionValue;
  onMssdkVersionChange?: (value: VersionValue) => void;

  hasActiveFilters: boolean;
  onClearAll: () => void;
}

export function ServiceFiltersPopover({
  title,
  teams,
  teamFilter,
  onTeamChange,
  statusFilter,
  onStatusChange,
  environmentFilter,
  onEnvironmentChange,
  includeAllEnvOption = true,
  otelVersionOptions,
  otelVersion,
  onOtelVersionChange,
  mssdkVersionOptions,
  mssdkVersion,
  onMssdkVersionChange,
  hasActiveFilters,
  onClearAll,
}: ServiceFiltersPopoverProps) {
  const [open, setOpen] = useState(false);

  const showOtel = Array.isArray(otelVersionOptions) && typeof onOtelVersionChange === "function";
  const showMssdk = Array.isArray(mssdkVersionOptions) && typeof onMssdkVersionChange === "function";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" /> Filters
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-" align="start" sideOffset={8}>
        <div className="flex flex-col gap-4" style={{ width: '520px' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{title}</div>
              <div className="text-xs text-muted-foreground">
                Refine by team, status, environment{showOtel || showMssdk ? ", and versions" : "."}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Team</div>
              <TeamCombobox
                teams={teams}
                value={teamFilter}
                onChange={onTeamChange}
                className="w-[240px]"
              />

              <div className="text-xs font-medium text-muted-foreground mt-3">Show by migration completion</div>
              <StatusCombobox value={statusFilter} onChange={onStatusChange} />
            </div>

            <div className="flex-1 space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Environment</div>
              <EnvironmentCombobox
                value={environmentFilter}
                onChange={(v) => onEnvironmentChange(v as EnvFilter)}
                includeAllOption={includeAllEnvOption}
              />

              {showOtel && (
                <>
                  <div className="text-xs font-medium text-muted-foreground mt-3">OTel version</div>
                  <VersionCombobox
                    value={otelVersion ?? null}
                    onChange={onOtelVersionChange!}
                    options={otelVersionOptions!}
                    placeholder="OTel version..."
                  />
                </>
              )}

              {showMssdk && (
                <>
                  <div className="text-xs font-medium text-muted-foreground mt-3">MSSDK version</div>
                  <VersionCombobox
                    value={mssdkVersion ?? null}
                    onChange={onMssdkVersionChange!}
                    options={mssdkVersionOptions!}
                    placeholder="MSSDK version..."
                  />
                </>
              )}
            </div>
          </div>

          <div className="flex pt-2">
            <div className="flex-1">
              {hasActiveFilters && (
                <Button
                  variant="destructive-outline"
                  size="sm"
                  onClick={() => {
                    onClearAll();
                    setOpen(false);
                  }}
                >
                  Clear all
                </Button>
              )}
            </div>
            <div className="flex-1 flex justify-end mr-3">
              <Button
                size="sm"
                onClick={() => setOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
