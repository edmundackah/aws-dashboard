"use client";

import {Column, ColumnDef} from "@tanstack/react-table";
import {Microservice, Spa, TeamStat} from "@/app/data/schema";
import {Button} from "@/components/ui/button";
import {ArrowUpDown, Mail, User} from "lucide-react";
import {HoverCard, HoverCardContent, HoverCardTrigger,} from "../ui/hover-card";
import {Separator} from "../ui/separator";
import {ServicePopover} from "./service-popover";
import {useDashboardStore} from "@/stores/use-dashboard-store";
import {useSearchParams} from "next/navigation";

const SortableHeader = <TData,>({
  column,
  children,
}: {
  column: Column<TData, unknown>;
  children: React.ReactNode;
}) => (
  <Button
    variant="ghost"
    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    className="-ml-4"
  >
    {children}
    <ArrowUpDown className="ml-2 h-4 w-4" />
  </Button>
);

type EnvKey = "dev" | "sit" | "uat" | "nft";

// Extend TeamStat for Teams page rows to include precomputed lists
export type TeamRow = TeamStat & {
  _migratedSpaList?: Spa[];
  _outstandingSpaList?: Spa[];
  _migratedMsList?: Microservice[];
  _outstandingMsList?: Microservice[];
};

const CellRenderer = ({
  teamName,
  count,
  serviceType,
  status,
  prefilteredServices,
}: {
  teamName: string;
  count: number;
  serviceType: "SPA" | "Microservice";
  status: "Migrated" | "Outstanding";
  prefilteredServices?: (Spa | Microservice)[];
}) => {
  const { data } = useDashboardStore();
  const searchParams = useSearchParams();
  const envParam = searchParams?.get("env");
  const envKey: EnvKey = envParam === "dev" || envParam === "sit" || envParam === "uat" || envParam === "nft" ? envParam : "dev";
  const services =
    serviceType === "SPA" ? data?.spaData || [] : data?.msData || [];

  // If caller provided exact list used to compute the count, prefer it to avoid mismatches
  let filteredServices: (Spa | Microservice)[] | undefined = prefilteredServices;
  if (!filteredServices) {
    // Base filter by team
    filteredServices = services.filter((s: Spa | Microservice) => s.subgroupName === teamName);

    if (status === "Migrated") {
      // For migrated lists, show what is migrated in the selected env
      filteredServices = filteredServices.filter(
        (s: Spa | Microservice) => s.status === "MIGRATED" && !!s.environments?.[envKey],
      );
    } else {
      // For outstanding lists, total should be constant: show items not migrated in the selected env.
      filteredServices = filteredServices.filter(
        (s: Spa | Microservice) => !(s.status === "MIGRATED" && !!s.environments?.[envKey]),
      );
    }
  }

  return (
    <ServicePopover
      teamName={teamName}
      serviceType={serviceType}
      status={status}
      count={count}
      services={filteredServices}
    >
      <div className="text-right pr-4 cursor-pointer text-primary underline hover:font-bold">
        {count}
      </div>
    </ServicePopover>
  );
};

export const columns: ColumnDef<TeamRow>[] = [
  {
    accessorKey: "teamName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Team Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="capitalize pl-4">{row.getValue("teamName")}</div>
    ),
  },
  {
    accessorKey: "technicalSme",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4"
      >
        Technical SME
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.technicalSme?.name || "";
      const b = rowB.original.technicalSme?.name || "";
      return a.localeCompare(b);
    },
    cell: ({ row }) => {
      const sme = row.original.technicalSme;
      if (!sme) return "N/A";
      return (
        <HoverCard>
          <HoverCardTrigger asChild>
            <span className="cursor-pointer border-b border-dashed border-primary">
              {sme.name}
            </span>
          </HoverCardTrigger>
          <HoverCardContent className="w-auto">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold">{sme.name}</h4>
              </div>
              <Separator />
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${sme.email}`}
                  className="text-sm text-primary hover:underline"
                >
                  {sme.email}
                </a>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      );
    },
  },
  {
    accessorKey: "migratedSpaCount",
    header: ({ column }) => (
      <div className="text-right">
        <SortableHeader column={column}>Migrated SPAs</SortableHeader>
      </div>
    ),
    cell: ({ row }) => (
      <CellRenderer
        teamName={row.original.teamName}
        count={row.original.migratedSpaCount}
        serviceType="SPA"
        status="Migrated"
        prefilteredServices={row.original._migratedSpaList}
      />
    ),
  },
  {
    accessorKey: "outstandingSpaCount",
    header: ({ column }) => (
      <div className="text-right">
        <SortableHeader column={column}>Outstanding SPAs</SortableHeader>
      </div>
    ),
    cell: ({ row }) => (
      <CellRenderer
        teamName={row.original.teamName}
        count={row.original.outstandingSpaCount}
        serviceType="SPA"
        status="Outstanding"
        prefilteredServices={row.original._outstandingSpaList}
      />
    ),
  },
  {
    accessorKey: "migratedMsCount",
    header: ({ column }) => (
      <div className="text-right">
        <SortableHeader column={column}>Migrated MS</SortableHeader>
      </div>
    ),
    cell: ({ row }) => (
      <CellRenderer
        teamName={row.original.teamName}
        count={row.original.migratedMsCount}
        serviceType="Microservice"
        status="Migrated"
        prefilteredServices={row.original._migratedMsList}
      />
    ),
  },
  {
    accessorKey: "outstandingMsCount",
    header: ({ column }) => (
      <div className="text-right">
        <SortableHeader column={column}>Outstanding MS</SortableHeader>
      </div>
    ),
    cell: ({ row }) => (
      <CellRenderer
        teamName={row.original.teamName}
        count={row.original.outstandingMsCount}
        serviceType="Microservice"
        status="Outstanding"
        prefilteredServices={row.original._outstandingMsList}
      />
    ),
  },
];