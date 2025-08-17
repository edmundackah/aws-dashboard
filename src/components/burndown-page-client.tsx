"use client";

import * as React from "react";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, CheckCircle } from "lucide-react";
import { ErrorDisplay } from "@/components/error-display";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

type EnvBurndownPoint = {
  date: string;
  ts?: number;
  spaActual?: number;
  spaExpected?: number;
  spaProjected?: number;
  spaTotal?: number;
  msActual?: number;
  msExpected?: number;
  msProjected?: number;
  msTotal?: number;
  combinedActual?: number;
  combinedExpected?: number;
  combinedProjected?: number;
};

type BurndownResponse = {
  version?: string;
  updatedAt?: string;
  organizationInventory?: {
    latest: {
      spa: number;
      microservice: number;
    };
  };
  environments: Array<{
    env: string;
    target: string;
    scope?: {
      spa?: { inEnv: number };
      microservice?: { inEnv: number };
    };
    series: Array<{
      key: string;
      label?: string;
      points: Array<{
        x: string;
        y: number;
        total?: number;
      }>;
    }>;
  }>;
};

type EnvironmentProgress = {
  env: string;
  target: string;
  currentSpa: number;
  currentMs: number;
  totalSpa: number;
  totalMs: number;
  spaProgress: number;
  msProgress: number;
  overallProgress: number;
  daysToTarget: number;
  isOnTrack: boolean;
  trend: 'improving' | 'declining' | 'stable';
  axisEndTs: number;
  status: 'completed' | 'on_track' | 'at_risk' | 'missed';
  projectedCompletionTs: number | null;
};

const chartConfig = {
  spaRemaining: { label: "SPAs Remaining (Actual)", color: "var(--chart-1)" },
  spaExpectedRemaining: { label: "SPAs Remaining (Expected)", color: "var(--chart-1)" },
  msRemaining: { label: "Microservices Remaining (Actual)", color: "var(--chart-2)" },
  msExpectedRemaining: { label: "Microservices Remaining (Expected)", color: "var(--chart-2)" },
} satisfies ChartConfig;

function calculateDaysToTarget(target: string): number {
  const targetDate = new Date(target);
  const diffTime = targetDate.getTime() - new Date().getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function determineTrend(points: EnvBurndownPoint[], type: 'spa' | 'ms'): 'improving' | 'declining' | 'stable' {
  if (points.length < 2) return 'stable';
  
  const actualKey = type === 'spa' ? 'spaActual' : 'msActual';
  const recent = points.slice(-3).filter(p => p[actualKey] != null);

  if (recent.length < 2) return 'stable';

  const firstValue = recent[0][actualKey]!;
  const lastValue = recent[recent.length - 1][actualKey]!;

  if (lastValue < firstValue) {
    return 'improving'; // Remaining services are decreasing
  } else if (lastValue > firstValue) {
    return 'declining'; // Remaining services are increasing
  } else {
    return 'stable';
  }
}

function normalizeBurndownData(data: BurndownResponse): { data: { [key: string]: EnvBurndownPoint[] }, targets: { [key: string]: string } } {
  const result: { [key: string]: EnvBurndownPoint[] } = {};
  const targets: { [key: string]: string } = {};

  if (!data || !data.environments || data.environments.length === 0) {
    return { data: {}, targets: {} };
  }

  data.environments.forEach((envData) => {
    const envKey = envData.env;
    targets[envKey] = envData.target;
    const map = new Map<string, EnvBurndownPoint>();

    const spaTotalInitial = envData.scope?.spa?.inEnv || envData.series.find(s => s.key === "spa.actual")?.points[0]?.total || 0;
    const msTotalInitial = envData.scope?.microservice?.inEnv || envData.series.find(s => s.key === "ms.actual")?.points[0]?.total || 0;

    envData.series.forEach((seriesData) => {
      seriesData.points.forEach((point) => {
        const date = point.x;
        if (!map.has(date)) {
          map.set(date, { date });
        }
        const current = map.get(date)!;

        const isSpaActual = seriesData.key === "spa.actual";
        const isMsActual = seriesData.key === "ms.actual";

        if (isSpaActual) {
          current.spaActual = point.y;
          current.spaTotal = point.total;
        } else if (isMsActual) {
          current.msActual = point.y;
          current.msTotal = point.total;
        }
      });
    });

    // Populate actuals with totalStart if no points exist
    const latestSpaActual = Array.from(map.values()).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).findLast(p => p.spaActual != null)?.spaActual;
    const latestMsActual = Array.from(map.values()).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).findLast(p => p.msActual != null)?.msActual;

    if (spaTotalInitial > 0 && latestSpaActual == null) {
      const firstDate = envData.series.find(s => s.key === "spa.actual")?.points[0]?.x || new Date().toISOString().split('T')[0];
      if (!map.has(firstDate)) {
          map.set(firstDate, { date: firstDate });
      }
      map.get(firstDate)!.spaActual = spaTotalInitial;
      map.get(firstDate)!.spaTotal = spaTotalInitial;
    }
    if (msTotalInitial > 0 && latestMsActual == null) {
        const firstDate = envData.series.find(s => s.key === "ms.actual")?.points[0]?.x || new Date().toISOString().split('T')[0];
        if (!map.has(firstDate)) {
            map.set(firstDate, { date: firstDate });
        }
        map.get(firstDate)!.msActual = msTotalInitial;
        map.get(firstDate)!.msTotal = msTotalInitial;
    }

    const series = Array.from(map.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    // assign numeric timestamp for time-scale axis
    series.forEach(p => { p.ts = new Date(p.date).getTime(); });
    
    // Calculate expected burndown for SPA and Microservices
    const firstSpaActualPoint = series.find(p => p.spaActual != null);
    const firstMsActualPoint = series.find(p => p.msActual != null);

    const spaStartDate = firstSpaActualPoint ? new Date(firstSpaActualPoint.date) : new Date();
    const msStartDate = firstMsActualPoint ? new Date(firstMsActualPoint.date) : new Date();
    
    const spaStartValue = firstSpaActualPoint?.spaActual ?? spaTotalInitial;
    const msStartValue = firstMsActualPoint?.msActual ?? msTotalInitial;

    const targetDate = new Date(envData.target);

    series.forEach((point) => {
      const currentDate = new Date(point.date);

      // SPA Expected
      if (spaTotalInitial > 0) {
        if (point.spaActual != null && point.spaActual <= spaTotalInitial * 0.05) { // If remaining is very low (e.g., <5%), consider it completed for expected
          point.spaExpected = 0; // Expected remaining should be 0 if completed
        } else {
          const timeDiff = targetDate.getTime() - spaStartDate.getTime();
          const progressTime = currentDate.getTime() - spaStartDate.getTime();
          if (timeDiff > 0 && progressTime >= 0) {
            
            const totalServicesAtFirstPoint = firstSpaActualPoint?.spaTotal ?? spaTotalInitial;
            const servicesToMigrate = totalServicesAtFirstPoint - (firstSpaActualPoint?.spaActual ?? 0);
            
            const rate = servicesToMigrate / ( (targetDate.getTime() - spaStartDate.getTime()) / (1000 * 60 * 60 * 24) );
            const expectedRemaining = servicesToMigrate - (rate * progressTime / (1000 * 60 * 60 * 24));
            
            point.spaExpected = Math.max(0, expectedRemaining); // Cannot go below 0
            
          } else {
            point.spaExpected = spaStartValue; // Before start date, expected is initial value
          }
        }
      } else {
        point.spaExpected = 0;
      }
      
      // MS Expected
      if (msTotalInitial > 0) {
        if (point.msActual != null && point.msActual <= msTotalInitial * 0.05) { // If remaining is very low (e.g., <5%), consider it completed for expected
          point.msExpected = 0; // Expected remaining should be 0 if completed
        } else {
          const timeDiff = targetDate.getTime() - msStartDate.getTime();
          const progressTime = currentDate.getTime() - msStartDate.getTime();
          if (timeDiff > 0 && progressTime >= 0) {
            
            const totalServicesAtFirstPoint = firstMsActualPoint?.msTotal ?? msTotalInitial;
            const servicesToMigrate = totalServicesAtFirstPoint - (firstMsActualPoint?.msActual ?? 0);
            
            const rate = servicesToMigrate / ( (targetDate.getTime() - msStartDate.getTime()) / (1000 * 60 * 60 * 24) );
            const expectedRemaining = servicesToMigrate - (rate * progressTime / (1000 * 60 * 60 * 24));
            
            point.msExpected = Math.max(0, expectedRemaining); // Cannot go below 0
            
          } else {
            point.msExpected = msStartValue; // Before start date, expected is initial value
          }
        }
      } else {
        point.msExpected = 0;
      }

      // Convert actual migrated to remaining
      point.spaActual = (point.spaTotal ?? spaTotalInitial) - (point.spaActual ?? 0);
      point.msActual = (point.msTotal ?? msTotalInitial) - (point.msActual ?? 0);
      point.combinedActual = (point.spaActual ?? 0) + (point.msActual ?? 0);
    });

    // Initialize projected/expected placeholders
    // We initialize projected fields here; they will be populated after metrics calculation when projectedCompletionTs is known.
    series.forEach((p) => {
      p.spaProjected = undefined;
      p.msProjected = undefined;
      p.combinedProjected = undefined;
      p.combinedExpected = undefined;
    });

    result[envKey] = series;
    console.log(`Normalized data for ${envKey}:`, JSON.stringify(series, null, 2));
  });

  return { data: result, targets };
}

// removed unused projected completion logic since axis end rule is simplified

function calculateEnvironmentMetrics(burndownData: { [key: string]: EnvBurndownPoint[] }, targets: { [key: string]: string }): EnvironmentProgress[] {
  const metrics: EnvironmentProgress[] = [];

  // Define the desired order of environments
  const desiredOrder = ["dev", "sit", "uat", "nft"];

  // Create a map for quick lookup and to maintain custom order
  const orderedEnvData = new Map<string, EnvBurndownPoint[]>();
  desiredOrder.forEach(envKey => {
    if (burndownData[envKey]) {
      orderedEnvData.set(envKey, burndownData[envKey]);
    }
  });
  // Add any environments not in desiredOrder (though not expected by prompt)
  Object.keys(burndownData).forEach(envKey => {
    if (!orderedEnvData.has(envKey)) {
      orderedEnvData.set(envKey, burndownData[envKey]);
    }
  });


  orderedEnvData.forEach((points, envKey) => {
    if (points.length === 0) return;

    const latest = points[points.length - 1];
    const target = targets[envKey];
    const daysToTarget = calculateDaysToTarget(target);
    const targetTs = new Date(target).getTime();

    const spaTotal = latest.spaTotal || 0;
    const msTotal = latest.msTotal || 0;

    const currentSpa = latest.spaActual ?? spaTotal;
    const currentMs = latest.msActual ?? msTotal;

    const spaProgress = spaTotal > 0 ? Math.round(((spaTotal - currentSpa) / spaTotal) * 100) : 0;
    const msProgress = msTotal > 0 ? Math.round(((msTotal - currentMs) / msTotal) * 100) : 0;
    
    // Overall progress is based on completion of the environment (95%+)
    const overallProgress = (spaTotal > 0 && msTotal > 0) 
      ? Math.round((((spaTotal - currentSpa) + (msTotal - currentMs)) / (spaTotal + msTotal)) * 100)
      : (spaTotal > 0) ? spaProgress : (msTotal > 0) ? msProgress : 0;


    const isSpaOnTrack = spaProgress >= 95 || (daysToTarget > 0 && latest.spaExpected != null && currentSpa <= latest.spaExpected);
    const isMsOnTrack = msProgress >= 95 || (daysToTarget > 0 && latest.msExpected != null && currentMs <= latest.msExpected);

    const isOnTrack = (spaProgress >= 95 || isSpaOnTrack) && (msProgress >= 95 || isMsOnTrack);

    // PM-friendly status logic
    const DAY_MS = 24 * 60 * 60 * 1000;
    const combinedSeries = points
      .map((p) => ({
        ts: p.ts ?? new Date(p.date).getTime(),
        remaining: (p.spaActual ?? 0) + (p.msActual ?? 0),
      }))
      .filter((p) => Number.isFinite(p.ts) && Number.isFinite(p.remaining))
      .sort((a, b) => a.ts - b.ts);

    const recent = combinedSeries.slice(-4); // up to 3 intervals
    // trend: remaining decreased in at least 2 of last 3 intervals
    let decreasesCount = 0;
    for (let i = 1; i < recent.length; i++) {
      if (recent[i - 1].remaining > recent[i].remaining) decreasesCount++;
    }
    const trendImproving = decreasesCount >= 2;

    // compute current burn rate (avg decrease per day over last intervals)
    let intervals = 0;
    let totalDecreasePerDay = 0;
    for (let i = 1; i < recent.length; i++) {
      const deltaRem = recent[i - 1].remaining - recent[i].remaining; // positive if decreasing
      const deltaDays = Math.max(1e-6, (recent[i].ts - recent[i - 1].ts) / DAY_MS);
      const rate = deltaRem / deltaDays;
      if (rate > 0) {
        totalDecreasePerDay += rate;
        intervals++;
      }
    }
    const currentBurnRate = intervals > 0 ? totalDecreasePerDay / intervals : 0;

    const combinedRemaining = currentSpa + currentMs;
    const requiredRate = daysToTarget > 0 ? combinedRemaining / daysToTarget : Infinity;

    // projected completion date based on last segment
    let projectedCompletionTs = Number.POSITIVE_INFINITY;
    if (recent.length >= 2) {
      const first = recent[0];
      const last = recent[recent.length - 1];
      const deltaRem = first.remaining - last.remaining; // positive if decreasing
      const deltaDays = Math.max(1e-6, (last.ts - first.ts) / DAY_MS);
      const burnRatePerDay = deltaRem / deltaDays;
      if (burnRatePerDay > 0) {
        const projDays = last.remaining / burnRatePerDay;
        projectedCompletionTs = last.ts + projDays * DAY_MS;
      }
    }
    const todayTs = Date.now();
    const daysLate = Number.isFinite(projectedCompletionTs)
      ? (projectedCompletionTs - targetTs) / DAY_MS
      : Number.POSITIVE_INFINITY;

    let status: 'completed' | 'on_track' | 'at_risk' | 'missed';
    if (overallProgress >= 95) {
      status = 'completed';
    } else if (todayTs > targetTs && overallProgress < 95) {
      status = 'missed';
    } else if (Number.isFinite(projectedCompletionTs) && projectedCompletionTs <= targetTs && trendImproving) {
      status = 'on_track';
    } else if (
      (Number.isFinite(projectedCompletionTs) && daysLate > 0 && daysLate <= 14) ||
      (Number.isFinite(projectedCompletionTs) && projectedCompletionTs <= targetTs && currentBurnRate < requiredRate * 0.9) ||
      !trendImproving
    ) {
      status = 'at_risk';
    } else if (Number.isFinite(projectedCompletionTs) && daysLate > 14) {
      status = 'missed';
    } else {
      status = 'at_risk';
    }
    
    const trendSpa = determineTrend(points, 'spa');
    const trendMs = determineTrend(points, 'ms');

    // Axis should end at target date unless the project has overshot the target date
    const latestPointTs = points.reduce((maxTs, p) => {
      const ts = p.ts ?? new Date(p.date).getTime();
      return ts > maxTs ? ts : maxTs;
    }, 0);
    const axisEndTs = latestPointTs > targetTs ? latestPointTs : targetTs;

    // Populate projected lines (spa/ms) to zero at projection for chart rendering
    if (Number.isFinite(projectedCompletionTs)) {
      const projTs = projectedCompletionTs as number;
      const lastPoint = points[points.length - 1];
      const lastSpa = lastPoint.spaActual ?? 0;
      const lastMs = lastPoint.msActual ?? 0;
      // const lastTs = lastPoint.ts ?? new Date(lastPoint.date).getTime();
      // const spanDays = Math.max(1, Math.round((projTs - lastTs) / DAY_MS));
      // Create or set projected values on existing series dates up to projection end
      // We only add a single terminal point at projection with zeros for clarity
      const projEndPoint: EnvBurndownPoint = {
        date: new Date(projTs).toISOString().split('T')[0],
        ts: projTs,
        spaProjected: 0,
        msProjected: 0,
      };
      // Append projected terminal point for rendering
      points.push(projEndPoint);
      // Set projected start values at last actual point
      lastPoint.spaProjected = lastSpa;
      lastPoint.msProjected = lastMs;
    }

    metrics.push({
      env: envKey,
      target,
      currentSpa,
      currentMs,
      totalSpa: spaTotal,
      totalMs: msTotal,
      spaProgress,
      msProgress,
      overallProgress,
      daysToTarget,
      isOnTrack,
      trend: overallProgress >= 95 ? 'stable' : (trendSpa === 'improving' || trendMs === 'improving' ? 'improving' : 'declining'),
      axisEndTs,
      status,
      projectedCompletionTs: Number.isFinite(projectedCompletionTs) ? projectedCompletionTs : null,
    });
  });

  // Sort environments according to desired order
  metrics.sort((a, b) => {
    const aIndex = desiredOrder.indexOf(a.env);
    const bIndex = desiredOrder.indexOf(b.env);
    return aIndex - bIndex;
  });

  return metrics;
}

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

  // summary cards removed; no overview totals needed

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
    <TooltipProvider delayDuration={100}>
      <div className="space-y-6">
        {/* Executive Summary Cards removed for simplicity */}

        {/* Environment Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {environmentMetrics.map((env) => (
            <Card key={env.env} className={`${env.overallProgress >= 95 ? "rainbow-glow" : env.isOnTrack ? "" : "border-2 border-red-500"}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium capitalize">{env.env.toUpperCase()}</CardTitle>
                  <Badge
                    variant={
                      env.status === 'completed' ? 'secondary' : env.status === 'on_track' ? 'default' : 'destructive'
                    }
                    className={
                      env.status === 'completed'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : env.status === 'missed'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : ''
                    }
                  >
                    {env.status === 'completed'
                      ? 'Completed'
                      : env.status === 'on_track'
                      ? 'On Track'
                      : env.status === 'at_risk'
                      ? 'At Risk'
                      : 'Target Missed'}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Target: {new Date(env.target).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>SPAs</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">{env.spaProgress}%</span>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="center" sideOffset={8} className="z-50 rounded-md border border-border bg-background text-foreground shadow-lg px-3 py-2 bg-opacity-100 backdrop-blur-none">
                        Percentage of SPAs migrated in this environment
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Progress value={env.spaProgress} className="h-2" />
                  <div className="text-xs text-muted-foreground mt-1">
                    {env.currentSpa} of {env.totalSpa} remaining
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Microservices</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">{env.msProgress}%</span>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="center" sideOffset={8} className="z-50 rounded-md border border-border bg-background text-foreground shadow-lg px-3 py-2 bg-opacity-100 backdrop-blur-none">
                        Percentage of Microservices migrated in this environment
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Progress value={env.msProgress} className="h-2" />
                  <div className="text-xs text-muted-foreground mt-1">
                    {env.currentMs} of {env.totalMs} remaining
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span>Overall</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="font-medium cursor-help">{env.overallProgress}%</span>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="center" sideOffset={8} className="z-50 rounded-md border border-border bg-background text-foreground shadow-lg px-3 py-2 bg-opacity-100 backdrop-blur-none">
                        Combined progress of SPAs and Microservices in this environment
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Progress value={env.overallProgress} className="h-2 mt-1" />
                  <div className="text-xs text-muted-foreground mt-1">
                    {env.status === 'completed'
                      ? 'Target achieved'
                      : env.status === 'on_track'
                      ? 'On track for target'
                      : env.status === 'at_risk'
                      ? 'At Risk'
                      : 'Target missed'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
          {environmentMetrics.map((metrics) => {
            const chartData = burndown?.[metrics.env] || [];
            
            // Filter out points where all values are null or undefined
            const filteredChartData = chartData.filter(point => 
              point.spaActual != null || point.spaExpected != null || 
              point.msActual != null || point.msExpected != null ||
              point.spaProjected != null || point.msProjected != null
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
              <Card key={metrics.env}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="capitalize">{metrics.env.toUpperCase()} Burndown</CardTitle>
                    <Badge
                      variant={
                        metrics.status === 'completed' ? 'secondary' : metrics.status === 'on_track' ? 'default' : 'destructive'
                      }
                      className={
                        metrics.status === 'completed'
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : metrics.status === 'missed'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : ''
                      }
                    >
                      {metrics.status === 'completed'
                        ? 'Completed'
                        : metrics.status === 'on_track'
                        ? 'On Track'
                        : metrics.status === 'at_risk'
                        ? 'At Risk'
                        : 'Target Missed'}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <span className="font-medium">
                      {metrics.overallProgress >= 95 ? "100% complete" : `${metrics.overallProgress}% complete`}
                    </span>
                    {metrics.overallProgress >= 95 ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : metrics.isOnTrack ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    
                    {metrics.status === 'completed'
                      ? 'Target achieved'
                      : metrics.status === 'on_track'
                      ? `${metrics.daysToTarget} days to target`
                      : metrics.status === 'at_risk'
                      ? 'At Risk'
                      : 'Target missed'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="min-h-[250px] w-full" >
                    <LineChart
                      accessibilityLayer
                      data={filteredChartData}
                      margin={{
                        left: 12,
                        right: 12,
                        top: 20,
                        bottom: 80,
                      }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="ts"
                        type="number"
                        scale="time"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        domain={[ 'dataMin', metrics.axisEndTs ]}
                        allowDuplicatedCategory={false}
                        tickFormatter={(value) => {
                          const ts = typeof value === 'number' ? value : Number(value);
                          if (Number.isNaN(ts)) return '';
                          return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
                        }}
                        label={{ value: "Time", position: "bottom", offset: 15 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        label={{ value: "Services Remaining", angle: -90, position: "left", offset: 0 }}
                      />
                      <ChartTooltip
                        cursor={false}
                        wrapperStyle={{ background: 'transparent', border: 'none', opacity: 1 as unknown as number, backdropFilter: 'none' as unknown as string }}
                        content={<ChartTooltipContent className="!bg-background !text-foreground !opacity-100 !backdrop-blur-none" />}
                      />
                      <Line
                        type="monotone"
                        dataKey="spaActual"
                        stroke="var(--chart-1)"
                        strokeWidth={2}
                        connectNulls={true}
                        name="SPAs Remaining (Actual)"
                      />
                      <Line
                        type="monotone"
                        dataKey="spaExpected"
                        stroke="var(--chart-1)"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        connectNulls={true}
                        name="SPAs Remaining (Expected)"
                        opacity={0.7}
                      />
                      <Line
                        type="monotone"
                        dataKey="spaProjected"
                        stroke="var(--chart-1)"
                        strokeWidth={2}
                        strokeDasharray="2 6"
                        connectNulls={true}
                        name="SPAs Remaining (Projected)"
                        opacity={0.8}
                      />
                      <Line
                        type="monotone"
                        dataKey="msActual"
                        stroke="var(--chart-2)"
                        strokeWidth={2}
                        connectNulls={true}
                        name="Microservices Remaining (Actual)"
                      />
                      <Line
                        type="monotone"
                        dataKey="msExpected"
                        stroke="var(--chart-2)"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        connectNulls={true}
                        name="Microservices Remaining (Expected)"
                        opacity={0.7}
                      />
                      <Line
                        type="monotone"
                        dataKey="msProjected"
                        stroke="var(--chart-2)"
                        strokeWidth={2}
                        strokeDasharray="2 6"
                        connectNulls={true}
                        name="Microservices Remaining (Projected)"
                        opacity={0.8}
                      />
                      <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '35px' }} />
                      {metrics.projectedCompletionTs && (
                        <ReferenceLine
                          x={metrics.projectedCompletionTs}
                          stroke="var(--foreground)"
                          strokeDasharray="3 3"
                          label={{ value: 'Projected', position: 'top', fill: 'currentColor' }}
                        />
                      )}
                    </LineChart>
                  </ChartContainer>
                </CardContent>
                <CardFooter>
                  <div className="flex w-full items-start gap-2 text-sm">
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2 leading-none font-medium">
                        {metrics ? `${metrics.overallProgress}% complete` : 'No data available'}
                      </div>
                      <div className="text-muted-foreground flex items-center gap-2 leading-none">
                        {metrics ? (() => {
                          if (metrics.daysToTarget > 0) {
                            return `${metrics.daysToTarget} days to target`;
                          } else if (metrics.overallProgress >= 95) {
                            return 'Target achieved';
                          } else {
                            return 'Target missed';
                          }
                        })() : 'Migration progress tracking'}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Dashed lines show path to 100% migration by target deadline
                      </div>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
