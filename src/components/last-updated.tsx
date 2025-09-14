"use client";

import {useEffect, useState} from "react";
import {Clock, RefreshCcw} from "lucide-react";
import {Button} from "@/components/ui/button";
import {cn} from "@/lib/utils";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";

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
    if (diffMin <= 5) return { dot: "bg-emerald-500", ping: "bg-emerald-500" };
    if (diffMin <= 30) return { dot: "bg-amber-500", ping: "bg-amber-500" };
    return { dot: "bg-rose-500", ping: "bg-rose-500" };
  };

  const freshnessLegend = () => "Green: ≤5m • Amber: ≤30m • Red: >30m";

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

  return (
    <div className="relative flex items-center gap-3 px-3 py-2 bg-white/10 dark:bg-white/5 rounded-xl border border-border/50 hover:bg-white/20 dark:hover:bg-white/10 hover:border-border transition-all duration-200 backdrop-blur">
      <span className="pointer-events-none absolute inset-0 rounded-xl border bg-primary/15 border-primary/25 dark:bg-primary/20 dark:border-primary/30 opacity-50" />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative flex items-center cursor-help">
              <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", freshnessColor(lastUpdate).dot)} />
              <span className={cn("absolute inline-flex h-2.5 w-2.5 rounded-full opacity-40 animate-ping", freshnessColor(lastUpdate).ping)} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              <div className="font-medium mb-0.5">Data freshness</div>
              <div>{freshnessLegend()}</div>
              <div className="text-muted-foreground">Current: {formatRelative(lastUpdate)}</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground font-medium">Last updated</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-foreground font-semibold cursor-default">
                {formatRelative(lastUpdate)}
              </span>
            </TooltipTrigger>
            <TooltipContent>{formatTimestamp(lastUpdate)}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="ml-1 h-8 w-8 p-0 rounded-lg hover:bg-white/20 active:scale-95 transition"
        onClick={handleRefresh}
        disabled={refreshing}
        aria-label="Refresh data"
        title="Refresh"
      >
        <RefreshCcw className={cn("h-4 w-4", (refreshing || spinOnClick) && "animate-spin")} />
      </Button>
    </div>
  );
}
