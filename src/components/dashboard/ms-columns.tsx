"use client"

import { ColumnDef, Column } from "@tanstack/react-table";
import { Microservice } from "@/app/data/schema";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

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

const BooleanCell = ({ value }: { value: boolean }) => (
  value ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />
);

export const columns: ColumnDef<Microservice>[] = [
  {
    accessorKey: "projectName",
    header: ({ column }) => <SortableHeader column={column}>Project</SortableHeader>,
  },
  {
    accessorKey: "subgroupName",
    header: ({ column }) => <SortableHeader column={column}>Team</SortableHeader>,
  },
  {
    accessorKey: "otel",
    header: ({ column }) => <SortableHeader column={column}>OTel</SortableHeader>,
  },
  {
    accessorKey: "mssdk",
    header: ({ column }) => <SortableHeader column={column}>MSSDK</SortableHeader>,
  },
  {
    accessorKey: "environments.dev",
    header: ({ column }) => <SortableHeader column={column}>DEV</SortableHeader>,
    cell: ({ row }) => <BooleanCell value={row.original.environments.dev} />,
  },
  {
    accessorKey: "environments.sit",
    header: ({ column }) => <SortableHeader column={column}>SIT</SortableHeader>,
    cell: ({ row }) => <BooleanCell value={row.original.environments.sit} />,
  },
  {
    accessorKey: "environments.uat",
    header: ({ column }) => <SortableHeader column={column}>UAT</SortableHeader>,
    cell: ({ row }) => <BooleanCell value={row.original.environments.uat} />,
  },
  {
    accessorKey: "environments.nft",
    header: ({ column }) => <SortableHeader column={column}>NFT</SortableHeader>,
    cell: ({ row }) => <BooleanCell value={row.original.environments.nft} />,
  },
  {
    id: "actions",
    header: "Link",
    cell: ({ row }) => (
      <Button variant="outline" size="sm" asChild>
        <Link href={row.original.projectLink} target="_blank">View Project</Link>
      </Button>
    )
  }
]