"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorDisplay } from "@/components/error-display";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusExplainer } from "@/components/burndown/StatusExplainer";
import { normalizeBurndownData } from "@/components/burndown/data";
import { calculateEnvironmentMetrics } from "@/components/burndown/logic";
import type { BurndownResponse } from "@/components/burndown/types";
import { BurndownEnvChartCard } from "@/components/burndown/BurndownEnvChartCard";

import type { EnvBurndownPoint } from "@/components/burndown/types";

export function BurndownPageClient() {
  const [burndown, setBurndown] = React.useState< { [key: string]: EnvBurndownPoint[] } | null >(null);
  const [targets, setTargets] = React.useState< { [key: string]: { spa: string; ms: string } } | null >(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    
    const fetchBurndown = async () => {
      try {
        setLoading(true);
        setError(null);
        const url = process.env.NEXT_PUBLIC_BURNDOWN_API_URL;
        if (!url || url.trim().length === 0) {
          throw new Error("Burndown API URL is not configured (NEXT_PUBLIC_BURNDOWN_API_URL).");
        }
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`Failed to fetch burndown: ${res.status}`);
        const json: BurndownResponse = await res.json();
        if (!isMounted) return;
        const { data, targets } = normalizeBurndownData(json);
        setBurndown(data);
        setTargets(targets); // Store targets here
      } catch (e) {
        if (!isMounted) return;
        if (e instanceof Error && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Failed to load burndown data.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBurndown();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const environmentMetrics = React.useMemo(() => {
    if (!burndown || !targets) return [];
    return calculateEnvironmentMetrics(burndown, targets);
  }, [burndown, targets]);


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  if (!burndown || Object.keys(burndown).length === 0) {
    return <ErrorDisplay message="No burndown data available" />;
  }

  // Targets are optional (read from .env); proceed even if none found

  return (
      <div className="space-y-1">
        <div className="md:hidden">
          <StatusExplainer />
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-2 items-stretch content-stretch min-h-[calc(100vh-7rem)] grid-rows-[repeat(2,minmax(0,1fr))]">
          {environmentMetrics.map((metrics) => {
            const chartData = burndown?.[metrics.env] || [];
            
            const filteredChartData = chartData.filter(point =>
              point.spaActual != null ||
              point.msActual != null ||
              point.spaPlanned != null ||
              point.msPlanned != null
            );

            // Use data as-is; no synthetic alignment to a global start date
            const alignedChartData = filteredChartData;

            if (alignedChartData.length === 0) {
              return (
                <Card key={metrics.env}>
                  <CardHeader>
                    <CardTitle className="capitalize">{metrics.env.toUpperCase()} Burndown</CardTitle>
                    <CardDescription>No chart data available for this environment.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                  </CardContent>
                </Card>
              );
            }
            
            return (
              <BurndownEnvChartCard key={metrics.env} metrics={metrics} data={alignedChartData} />
            );
          })}
        </div>
        <BurndownHelpFab />
      </div>
  );
}

function BurndownHelpFab() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="icon" aria-label="Open status guide" className="h-10 w-10 rounded-full shadow-lg">
            <HelpCircle className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Status guide</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-block size-2.5 rounded-full bg-blue-500 flex-shrink-0" />
                <div><span className="font-medium text-primary">Completed</span> — zero remaining by the target date</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-block size-2.5 rounded-full bg-green-500 flex-shrink-0" />
                <div><span className="font-medium text-primary">On track</span> — trend indicates zero remaining by each service target (SPA/MS)</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-block size-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                <div><span className="font-medium text-primary">At risk</span> — trend/burn rate suggests slipping or close to the target</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-block size-2.5 rounded-full bg-red-500 flex-shrink-0" />
                <div><span className="font-medium text-primary">Target missed</span> — the relevant target (SPA or MS) passed without reaching zero remaining</div>
              </div>
              <div className="pt-2 text-sm text-primary/80 leading-6">
                Planned vs actual: Dotted lines show planned remaining; solid lines show actual remaining. Two targets per environment: SPA and Microservices.
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

