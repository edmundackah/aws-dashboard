// components/dashboard/team-stats-columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { TeamStat } from "@/app/data/schema";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";

const SortableHeader = ({ column, children }: { column: any; children: React.ReactNode }) => (
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
    header: ({ column }) => <SortableHeader column={column}>SPAs</SortableHeader>,
    cell: ({ row }) => <div className="text-center">{row.getValue("spaCount")}</div>
  },
  {
    accessorKey: "msCount",
    header: ({ column }) => <SortableHeader column={column}>Microservices</SortableHeader>,
    cell: ({ row }) => <div className="text-center">{row.getValue("msCount")}</div>
  },
];