"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ErrorDisplay } from "@/components/error-display";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusGuide } from "@/components/burndown/StatusGuide";
import { normalizeBurndownData } from "@/components/burndown/data";
import { calculateEnvironmentMetrics } from "@/components/burndown/logic";
import type { BurndownResponse } from "@/components/burndown/types";
import { BurndownEnvChartCard } from "@/components/burndown/BurndownEnvChartCard";

import type { EnvBurndownPoint } from "@/components/burndown/types";

export function BurndownPageClient() {
  const [burndown, setBurndown] = React.useState< { [key: string]: EnvBurndownPoint[] } | null >(null);
  const [targets, setTargets] = React.useState< { [key: string]: string } | null >(null);
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

  // Check if we have target dates for environments
  const environmentsWithTargets = Object.keys(targets || {}).filter(env => targets && targets[env]);
  if (environmentsWithTargets.length === 0) {
    return <ErrorDisplay message="No target dates found in burndown data. Please ensure the API includes target dates for each environment." />;
  }

  return (
      <div className="space-y-6">
        <StatusGuide />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {environmentMetrics.map((env) => (
            <Card key={env.env} className={`bg-muted ${env.overallProgress >= 95 ? 'rainbow-glow border' : env.status === 'at_risk' ? 'border-2 border-amber-500' : 'border'}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium capitalize">{env.env.toUpperCase()}</CardTitle>
                  <Badge variant={env.status === 'completed' || env.status === 'missed' ? 'secondary' : env.status === 'on_track' ? 'default' : 'destructive'} className={env.status === 'completed' || env.status === 'missed' ? 'bg-green-600 hover:bg-green-700 text-white' : env.status === 'at_risk' ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}>
                    {env.status === 'completed' || env.status === 'missed' ? 'Completed' : env.status === 'on_track' ? 'On Track' : 'At Risk'}
                  </Badge>
                </div>
                <CardDescription className="text-xs">Target: {new Date(env.target).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>SPAs</span>
                    <span>{env.spaProgress}%</span>
                  </div>
                  <Progress value={env.spaProgress} className="h-2" />
                  <div className="text-xs text-muted-foreground mt-1">
                    {env.currentSpa} of {env.totalSpa} remaining
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Microservices</span>
                    <span>{env.msProgress}%</span>
                  </div>
                  <Progress value={env.msProgress} className="h-2" />
                  <div className="text-xs text-muted-foreground mt-1">
                    {env.currentMs} of {env.totalMs} remaining
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span>Overall</span>
                    <span className="font-medium">{env.overallProgress}%</span>
                  </div>
                  <Progress value={env.overallProgress} className="h-2 mt-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
          {environmentMetrics.map((metrics) => {
            const chartData = burndown?.[metrics.env] || [];
            
            const filteredChartData = chartData.filter(point =>
              point.spaActual != null ||
              point.msActual != null ||
              point.spaProjected != null ||
              point.msProjected != null
            );

            console.log(`Filtered chart data for ${metrics.env}:`, JSON.stringify(filteredChartData, null, 2));

            if (filteredChartData.length === 0) {
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
              <BurndownEnvChartCard key={metrics.env} metrics={metrics} data={filteredChartData} />
            );
          })}
        </div>
      </div>
  );
}

