"use client";

import {Column, ColumnDef} from "@tanstack/react-table";
import {useEffect, useState} from "react";
import {Spa} from "@/app/data/schema";
import {Button} from "@/components/ui/button";
import {ArrowUpDown, CheckCircle2, ExternalLink, XCircle, Copy} from "lucide-react";
import {StatusBadge} from "@/components/status-badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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

function HomepageCell({ href }: { href?: string }) {
  // Hooks must be called unconditionally
  const [open, setOpen] = useState(false);
  const [requested, setRequested] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const hasHomepage = !!href && href !== "#";

  let hostname: string | null = null;
  let normalizedUrl = "";
  let displayLabel = "";
  let favicon: string | undefined = undefined;
  if (hasHomepage) {
    try {
      const url = href!.startsWith("http") ? new URL(href!) : new URL(`https://${href}`);
      hostname = url.hostname;
      normalizedUrl = url.toString();
    } catch {
      normalizedUrl = href!;
    }
    displayLabel = (hostname || normalizedUrl.replace(/^https?:\/\//, ""));
    favicon = hostname ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=64` : undefined;
  }

  useEffect(() => {
    if (!hasHomepage) return;
    let timeout: number | undefined;
    if (open) {
      setRequested(true);
      // If it doesn't load within 2.5s, assume embedding is blocked
      timeout = window.setTimeout(() => {
        if (!loaded) setFailed(true);
      }, 2500);
    } else {
      // Reset load state when closed to free resources
      setLoaded(false);
      setFailed(false);
    }
    return () => {
      if (timeout) window.clearTimeout(timeout);
    };
  }, [open, loaded, hasHomepage]);

  const copyUrl = async () => {
    if (!hasHomepage) return;
    try {
      await navigator.clipboard.writeText(normalizedUrl);
      toast.success("Homepage URL copied");
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  if (!hasHomepage) {
    return <span className="text-muted-foreground text-xs italic">No homepage</span>;
  }

  return (
    <HoverCard openDelay={150} closeDelay={100} onOpenChange={setOpen}>
      <HoverCardTrigger asChild>
        <button type="button" className="inline-flex items-center gap-2 px-2 py-1.5 rounded-md border bg-background hover:bg-muted/50 transition text-sm">
          {favicon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={favicon} alt="favicon" className="h-4 w-4 rounded" loading="lazy" />
          )}
          <span className="truncate max-w-[200px] text-left">{displayLabel}</span>
          <ExternalLink className="h-3.5 w-3.5 opacity-70" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-96">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            {favicon && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={favicon} alt="favicon" className="h-6 w-6 rounded mt-0.5" />
            )}
            <div className="min-w-0">
              <div className="font-medium break-words">{displayLabel}</div>
              <div className="text-xs text-muted-foreground break-all">{normalizedUrl}</div>
            </div>
          </div>

          {/* Live preview (best-effort; may be blocked by site's CSP/X-Frame-Options) */}
          <div className="relative w-full overflow-hidden rounded-md border bg-muted aspect-video">
            {!requested || (!loaded && !failed) ? (
              <div className="absolute inset-0 p-3">
                <div className={cn("h-full w-full rounded-md", "bg-gradient-to-br from-muted/60 to-muted/40")}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            ) : null}
            {requested && !failed && (
              <iframe
                src={normalizedUrl}
                className="absolute inset-0 h-full w-full"
                loading="lazy"
                sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-popups-to-escape-sandbox"
                referrerPolicy="no-referrer"
                onLoad={() => setLoaded(true)}
                onError={() => setFailed(true)}
              />
            )}
            {failed && (
              <div className="absolute inset-0 flex items-center justify-center p-3 text-center text-xs text-muted-foreground">
                This site blocks embedding. Use the buttons below to open it directly.
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" asChild>
              <a href={normalizedUrl} target="_blank" rel="noopener noreferrer">Open</a>
            </Button>
            <Button size="sm" variant="outline" onClick={copyUrl}>
              <Copy className="h-3.5 w-3.5 mr-1" /> Copy
            </Button>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export const columns: ColumnDef<Spa>[] = [
  {
    accessorKey: "projectName",
    header: ({ column }) => <SortableHeader column={column}>Project</SortableHeader>,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span>{row.original.projectName}</span>
        <StatusBadge status={row.original.status} />
      </div>
    ),
  },
  {
    accessorKey: "homepage",
    header: "Homepage",
    cell: ({ row }) => <HomepageCell href={row.original.homepage} />
  },
  {
    accessorKey: "subgroupName",
    header: ({ column }) => <SortableHeader column={column}>Team</SortableHeader>,
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
    cell: ({ row }) => {
      const { projectLink } = row.original;
      if (!projectLink) {
        return null;
      }
      return (
        <Button variant="outline" size="sm" asChild>
          <a href={projectLink} target="_blank" rel="noopener noreferrer">View Project</a>
        </Button>
      )
    }
  }
];