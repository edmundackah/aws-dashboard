"use client";

import {Column, ColumnDef} from "@tanstack/react-table";
import {TeamStat} from "@/app/data/schema";
import {Button} from "@/components/ui/button";
import {StatusBadge} from "@/components/status-badge";
import {ArrowUpDown} from "lucide-react";

const SortableHeader = <TData,>({ column, children }: { column: Column<TData, unknown>; children: React.ReactNode }) => (
  <Button
    variant="ghost"
    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    className="-ml-4"
  >
    {children}
    <ArrowUpDown className="ml-2 h-4 w-4" />
  </Button>
);

export const columns: ColumnDef<TeamStat>[] = [
  {
    accessorKey: "teamName",
    header: ({ column }) => <SortableHeader column={column}>Team Name</SortableHeader>,
    cell: ({ row }) => {
      const team = row.original;
      const isNotMigrated = team.migratedSpaCount === 0 && team.migratedMsCount === 0;
      const status = isNotMigrated ? "NOT_MIGRATED" : "MIGRATED";

      return (
        <div className="flex items-center gap-2">
          <span>{team.teamName}</span>
          <StatusBadge
            status={status}
            tooltipContent="This team has no migrated services."
          />
        </div>
      );
    }
  },
  {
    accessorKey: "migratedSpaCount",
    header: ({ column }) => (
      <div className="text-right">
        <SortableHeader column={column}>Migrated SPAs</SortableHeader>
      </div>
    ),
    cell: ({ row }) => <div className="text-right pr-4">{row.getValue("migratedSpaCount")}</div>
  },
  {
    accessorKey: "outstandingSpaCount",
    header: ({ column }) => (
      <div className="text-right">
        <SortableHeader column={column}>Outstanding SPAs</SortableHeader>
      </div>
    ),
    cell: ({ row }) => <div className="text-right pr-4">{row.getValue("outstandingSpaCount")}</div>
  },
  {
    accessorKey: "migratedMsCount",
    header: ({ column }) => (
      <div className="text-right">
        <SortableHeader column={column}>Migrated MS</SortableHeader>
      </div>
    ),
    cell: ({ row }) => <div className="text-right pr-4">{row.getValue("migratedMsCount")}</div>
  },
  {
    accessorKey: "outstandingMsCount",
    header: ({ column }) => (
      <div className="text-right">
        <SortableHeader column={column}>Outstanding MS</SortableHeader>
      </div>
    ),
    cell: ({ row }) => <div className="text-right pr-4">{row.getValue("outstandingMsCount")}</div>
  },
];