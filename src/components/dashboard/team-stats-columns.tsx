"use client";

import { ColumnDef, Column } from "@tanstack/react-table";
import { TeamStat } from "@/app/data/schema";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";

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
  },
  {
    accessorKey: "spaCount",
    header: ({ column }) => (
      <div className="text-right">
        <SortableHeader column={column}>SPAs</SortableHeader>
      </div>
    ),
    cell: ({ row }) => <div className="text-right pr-4">{row.getValue("spaCount")}</div>
  },
  {
    accessorKey: "msCount",
    header: ({ column }) => (
      <div className="text-right">
        <SortableHeader column={column}>Microservices</SortableHeader>
      </div>
    ),
    cell: ({ row }) => <div className="text-right pr-4">{row.getValue("msCount")}</div>
  },
];