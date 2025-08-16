"use client";

import * as React from "react";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
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
import { TrendingUp, TrendingDown, Target, Clock, CheckCircle, AlertCircle } from "lucide-react";
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
  spaActual?: number;
  spaExpected?: number;
  spaTotal?: number;
  msActual?: number;
  msExpected?: number;
  msTotal?: number;
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
    });

    result[envKey] = series;
    console.log(`Normalized data for ${envKey}:`, JSON.stringify(series, null, 2));
  });

  return { data: result, targets };
}

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


    const isSpaOnTrack = spaProgress >= 95 || daysToTarget > 0 && latest.spaExpected != null && currentSpa <= latest.spaExpected;
    const isMsOnTrack = msProgress >= 95 || daysToTarget > 0 && latest.msExpected != null && currentMs <= latest.msExpected;

    const isOnTrack = (spaProgress >= 95 || isSpaOnTrack) && (msProgress >= 95 || isMsOnTrack);
    
    const trendSpa = determineTrend(points, 'spa');
    const trendMs = determineTrend(points, 'ms');

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

  const burndownTotals = React.useMemo(() => {
    if (!burndown || !targets) {
      return {
        overallProgress: 0,
        spaTotal: 0,
        msTotal: 0,
        remainingServices: 0,
        lastUpdated: "N/A",
      };
    }

    const totalEnvironments = Object.keys(burndown).length;
    const completedEnvironments = environmentMetrics.filter(env => env.overallProgress >= 95).length;
    const overallProgress = totalEnvironments > 0 ? Math.round((completedEnvironments / totalEnvironments) * 100) : 0;

    let totalSpaInOrg = 0;
    let totalMsInOrg = 0;
    let totalSpaMigrated = 0;
    let totalMsMigrated = 0;
    let lastUpdated = "N/A";

    // Get total services from the organizationInventory (from the first environment's latest entry)
    const firstEnvKey = Object.keys(burndown)[0];
    const firstEnv = burndown[firstEnvKey];
    if (firstEnv && firstEnv.length > 0) {
      const latest = firstEnv[firstEnv.length - 1]; // Assuming the last point represents the latest overall totals for the org
      totalSpaInOrg = latest.spaTotal ?? 0;
      totalMsInOrg = latest.msTotal ?? 0;
    }
    
    // Sum migrated services across all environments
    environmentMetrics.forEach(({ totalSpa, currentSpa, totalMs, currentMs }) => {
      totalSpaMigrated += (totalSpa - currentSpa); // Migrated = Total - Remaining
      totalMsMigrated += (totalMs - currentMs);
    });

    const remainingServices = (totalSpaInOrg - totalSpaMigrated) + (totalMsInOrg - totalMsMigrated);

    const latestUpdateTimestamp = Object.values(burndown)
      .flatMap(envPoints => envPoints.map(p => new Date(p.date).getTime()))
      .reduce((max, current) => Math.max(max, current), 0);

    if (latestUpdateTimestamp > 0) {
      lastUpdated = new Date(latestUpdateTimestamp).toLocaleDateString();
    }

    return {
      overallProgress,
      spaTotal: totalSpaInOrg,
      msTotal: totalMsInOrg,
      remainingServices: Math.max(0, remainingServices), // Ensure remaining is not negative
      lastUpdated,
    };
  }, [burndown, targets, environmentMetrics]);

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
    <TooltipProvider>
      <div className="space-y-6">
        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CheckCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  Percentage of environments that have completed migration (95%+ migrated)
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{burndownTotals.overallProgress}%</div>
              <Progress value={burndownTotals.overallProgress} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {environmentMetrics.filter(env => env.isOnTrack).length} of {environmentMetrics.length} environments on track
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Services</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Target className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  Total unique SPAs and Microservices in the organization
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {burndownTotals.spaTotal + burndownTotals.msTotal}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                SPAs: {burndownTotals.spaTotal}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Microservices: {burndownTotals.msTotal}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remaining</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Clock className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  Services that still need to be migrated to all environments
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {burndownTotals.remainingServices}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {environmentMetrics.reduce((max, env) => Math.max(max, Math.max(0, env.daysToTarget)), 0)} days to furthest target
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  {burndownTotals.overallProgress >= 75 ? (
                    <CheckCircle className="h-4 w-4 text-green-600 cursor-help" />
                  ) : burndownTotals.overallProgress >= 50 ? (
                    <AlertCircle className="h-4 w-4 text-yellow-600 cursor-help" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600 cursor-help" />
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  Overall migration status based on completion percentage
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {burndownTotals.overallProgress >= 75 ? "On Track" : burndownTotals.overallProgress >= 50 ? "At Risk" : "Behind"}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {burndownTotals.overallProgress >= 75 ? "Targets achievable" : "Action required"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Environment Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {environmentMetrics.map((env) => (
            <Card key={env.env} className={`${env.overallProgress >= 95 ? "rainbow-glow" : env.isOnTrack ? "" : "border-2 border-red-500"}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium capitalize">{env.env.toUpperCase()}</CardTitle>
                  <Badge variant={env.overallProgress >= 95 ? "secondary" : env.isOnTrack ? "default" : "destructive"} className={env.overallProgress >= 95 ? "bg-green-600 hover:bg-green-700 text-white" : ""}>
                    {env.overallProgress >= 95 ? "Completed" : env.isOnTrack ? "On Track" : "At Risk"}
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
                      <TooltipContent>
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
                      <TooltipContent>
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
                      <TooltipContent>
                        Combined progress of SPAs and Microservices in this environment
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Progress value={env.overallProgress} className="h-2 mt-1" />
                  <div className="text-xs text-muted-foreground mt-1">
                    {env.overallProgress >= 95 ? "Target achieved" : env.isOnTrack ? "On track for target" : "Off track for target"}
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
              point.msActual != null || point.msExpected != null
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
                    <Badge variant={metrics.overallProgress >= 95 ? "secondary" : metrics.isOnTrack ? "default" : "destructive"} className={metrics.overallProgress >= 95 ? "bg-green-600 hover:bg-green-700 text-white" : ""}>
                      {metrics.overallProgress >= 95 ? "Completed" : metrics.isOnTrack ? "On Track" : "At Risk"}
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
                    {" • "}
                    {(() => {
                      if (metrics.daysToTarget > 0) {
                        return `${metrics.daysToTarget} days to target`;
                      } else if (metrics.overallProgress >= 95) {
                        return 'Target achieved';
                      } else {
                        return 'Target missed';
                      }
                    })()}
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
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                        label={{ value: "Time", position: "bottom", offset: 15 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        label={{ value: "Services Remaining", angle: -90, position: "left", offset: 0 }}
                      />
                      <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
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
                      <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '35px' }} />
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
