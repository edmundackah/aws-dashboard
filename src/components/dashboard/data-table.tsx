"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {useEffect, useState,} from "react";

import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {HoverCard, HoverCardContent, HoverCardTrigger} from "@/components/ui/hover-card";


interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  tabId?: string; // To identify which tab this table belongs to
}

// Custom hook for persistent state
const usePersistentState = <T,>(key: string, defaultValue: T) => {
  const [state, setState] = useState<T>(() => {
    if (typeof window !== 'undefined') {
      const storedValue = localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : defaultValue;
    }
    return defaultValue;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(state));
    }
  }, [key, state]);

  return [state, setState] as const;
};

// Helper function to generate the pagination range
const getPaginationRange = (pageCount: number, pageIndex: number): (number | string)[] => {
  const range: (number | string)[] = [];
  const delta = 2;
  const left = pageIndex - delta;
  const right = pageIndex + delta + 1;
  let last: number | undefined;

  for (let i = 0; i < pageCount; i++) {
    if (i === 0 || i === pageCount - 1 || (i >= left && i < right)) {
      if (last !== undefined && i - last === 2) {
        range.push(last + 1);
      } else if (last !== undefined && i - last > 2) {
        range.push('...');
      }
      range.push(i);
      last = i;
    }
  }
  return range;
};


export function DataTable<TData, TValue>({
                                           columns,
                                           data,
                                           tabId = "default",
                                         }: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageSize, setPageSize] = usePersistentState(`${tabId}_pageSize`, 15);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: pageSize,
      },
    },
  });

  // Update table page size when pageSize state changes
  useEffect(() => {
    table.setPageSize(pageSize);
  }, [pageSize, table]);

  const paginationRange = getPaginationRange(table.getPageCount(), table.getState().pagination.pageIndex);

  return (
    <div className="flex flex-col w-full">
      <div className="rounded-md border bg-card w-full">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="p-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-4 flex-shrink-0 w-full">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} results
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page:</span>
            <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
              <SelectTrigger className="w-[80px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              />
            </PaginationItem>

            {paginationRange.map((page, index, arr) => {
              if (typeof page === 'string') {
                // Determine surrounding numeric pages
                let prevNumeric: number | null = null;
                let nextNumeric: number | null = null;
                for (let i = index - 1; i >= 0; i--) {
                  if (typeof arr[i] === 'number') { prevNumeric = arr[i] as number; break; }
                }
                for (let i = index + 1; i < arr.length; i++) {
                  if (typeof arr[i] === 'number') { nextNumeric = arr[i] as number; break; }
                }
                const gapStart = prevNumeric !== null ? prevNumeric + 1 : 0;
                const gapEnd = nextNumeric !== null ? nextNumeric - 1 : Math.max(0, table.getPageCount() - 2);
                const midpoint = Math.floor((gapStart + gapEnd) / 2);
                const candidates = Array.from(new Set([
                  gapStart,
                  gapStart + 1,
                  midpoint,
                  gapEnd - 1,
                  gapEnd,
                ])).filter((p) => p >= 0 && p < table.getPageCount() && p >= gapStart && p <= gapEnd).sort((a,b)=>a-b);

                return (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <HoverCard openDelay={150} closeDelay={150}>
                      <HoverCardTrigger asChild>
                        <div>
                          <PaginationEllipsis className="hover:cursor-not-allowed" />
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-72" align="center">
                        <div className="flex flex-col gap-2">
                          <div className="text-xs text-muted-foreground">
                            Pages {gapStart + 1} - {gapEnd + 1} hidden
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {candidates.map((p) => (
                              <Button key={p} variant="outline" size="sm" onClick={() => table.setPageIndex(p)}>
                                {p + 1}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </PaginationItem>
                );
              }
              return (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => table.setPageIndex(page)}
                    isActive={table.getState().pagination.pageIndex === page}
                  >
                    {page + 1}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            <PaginationItem>
              <PaginationNext
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>

        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          {`Page {table.getState().pagination.pageIndex + 1} of ${table.getPageCount()}`}
        </div>
      </div>
    </div>
  );
}