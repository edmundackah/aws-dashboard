"use client";

import {Column, ColumnDef} from "@tanstack/react-table";
import {TeamStat} from "@/app/data/schema";
import {Button} from "@/components/ui/button";
import {ArrowUpDown} from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";
import { Separator } from "../ui/separator";
import { User, Mail } from "lucide-react";

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
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Team Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="capitalize pl-4">{row.getValue("teamName")}</div>
    ),
  },
  {
    accessorKey: "technicalSme",
    header: "Technical SME",
    cell: ({ row }) => {
      const sme = row.original.technicalSme;
      if (!sme) {
        return "N/A";
      }
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