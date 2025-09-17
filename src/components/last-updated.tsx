"use client";

import {useEffect, useState} from "react";
import { RefreshCcw, CalendarDays } from "lucide-react";
import {Button} from "@/components/ui/button";
import {cn} from "@/lib/utils";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Separator } from "@/components/ui/separator";

interface LastUpdatedIndicatorProps {
  lastUpdate: string;
  onRefresh: () => Promise<void>;
}

export function LastUpdatedIndicator({ lastUpdate, onRefresh }: LastUpdatedIndicatorProps) {
  const [now, setNow] = useState<number>(() => Date.now());
  const [refreshing, setRefreshing] = useState(false);
  const [spinOnClick, setSpinOnClick] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const formatTimestamp = (isoString: string) => {
    return new Date(isoString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatRelative = (isoString: string) => {
    const updated = new Date(isoString).getTime();
    const diff = Math.max(0, now - updated);
    const sec = Math.floor(diff / 1000);
    if (sec < 10) return "just now";
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const freshnessColor = (isoString: string) => {
    const updated = new Date(isoString).getTime();
    const diffMin = (now - updated) / 60000;
    if (diffMin <= 5) return { dot: "bg-emerald-500", ping: "bg-emerald-500", label: "Fresh" };
    if (diffMin <= 30) return { dot: "bg-amber-500", ping: "bg-amber-500", label: "Stale" };
    return { dot: "bg-rose-500", ping: "bg-rose-500", label: "Outdated" };
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setSpinOnClick(true);
      await onRefresh();
    } finally {
      setRefreshing(false);
      window.setTimeout(() => setSpinOnClick(false), 600);
    }
  };

  const color = freshnessColor(lastUpdate);

  return (
    <HoverCard openDelay={100} closeDelay={100}>
      <HoverCardTrigger asChild>
        <Button variant="ghost" className="h-9 w-9 p-0 rounded-full">
          <span className="relative flex h-3 w-3">
            <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping", color.ping)} />
            <span className={cn("relative inline-flex rounded-full h-3 w-3", color.dot)} />
          </span>
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-4" side="bottom" align="end">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-bold tracking-wide">Data Status</h4>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-mr-2 h-8 w-8 p-0 rounded-full hover:bg-accent/50 active:scale-95 transition"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  aria-label="Refresh data"
                >
                  <RefreshCcw className={cn("h-4 w-4", (refreshing || spinOnClick) && "animate-spin")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="space-y-3">
          <div className="flex items-center">
            <span className={cn("h-2.5 w-2.5 rounded-full mr-2.5", color.dot)} />
            <span className="text-sm font-semibold">{color.label}</span>
            <span className="text-sm text-muted-foreground ml-auto">{formatRelative(lastUpdate)}</span>
          </div>

          <div className="flex items-center text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 mr-2.5" />
            <span>{formatTimestamp(lastUpdate)}</span>
          </div>
        </div>

        <Separator className="my-3" />

        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="font-semibold text-foreground/80 mb-2">Legend</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 mr-2"/> Fresh
            </div>
            <span>&lt; 5 min</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500 mr-2"/> Stale
            </div>
            <span>&lt; 30 min</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="inline-block h-2 w-2 rounded-full bg-rose-500 mr-2"/> Outdated
            </div>
            <span>&gt; 30 min</span>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
