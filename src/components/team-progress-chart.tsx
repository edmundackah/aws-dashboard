"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TeamStat } from "@/app/data/schema";

interface TeamProgressChartProps {
  teamStats: TeamStat[];
}

const chartConfig = {
  spas: {
    label: "SPAs",
    color: "hsl(var(--chart-spa))",
  },
  microservices: {
    label: "Microservices",
    color: "hsl(var(--chart-ms))",
  },
  spaProgress: {
    label: "SPA Progress",
    color: "hsl(var(--chart-spa))",
  },
  msProgress: {
    label: "MS Progress",
    color: "hsl(var(--chart-ms))",
  },
  totalProgress: {
    label: "Overall Progress",
    color: "hsl(var(--chart-purple))",
  },
} satisfies ChartConfig;

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
  payload: {
    spaProgress?: number;
    msProgress?: number;
    totalProgress?: number;
    migratedSpaCount: number;
    totalSpas: number;
    migratedMsCount: number;
    totalMs: number;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  chartType: "counts" | "progress";
}

const CustomTooltip = ({
  active,
  payload,
  label,
  chartType,
}: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const labelContent = label?.replace("team-", "");

    if (chartType === "counts") {
      return (
        <div className="rounded-lg border bg-background p-3 shadow-sm">
          <div className="grid gap-1.5">
            <p className="font-medium text-muted-foreground">
              Team {labelContent}
            </p>
            {payload.map((entry) => (
              <div
                key={entry.name}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm">
                    Migrated{" "}
                    {chartConfig[entry.name as keyof typeof chartConfig].label}
                  </span>
                </div>
                <span className="font-bold text-sm">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (chartType === "progress" && data.totalProgress !== undefined) {
      const spaMigrationProgress =
        data.totalSpas > 0
          ? Math.round((data.migratedSpaCount / data.totalSpas) * 100)
          : 0;
      const msMigrationProgress =
        data.totalMs > 0
          ? Math.round((data.migratedMsCount / data.totalMs) * 100)
          : 0;
      const totalMigrated = data.migratedSpaCount + data.migratedMsCount;
      const totalServices = data.totalSpas + data.totalMs;

      return (
        <div className="min-w-[250px] rounded-lg border bg-background p-3 shadow-sm">
          <div className="mb-2 flex justify-between">
            <span className="font-medium text-muted-foreground">
              Team {labelContent}
            </span>
            <span className="text-sm font-bold">{payload[0].value}%</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>SPAs</span>
              <span className="font-semibold">
                {data.migratedSpaCount} / {data.totalSpas} (
                {spaMigrationProgress}%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Microservices</span>
              <span className="font-semibold">
                {data.migratedMsCount} / {data.totalMs} ({msMigrationProgress}
                %)
              </span>
            </div>
            <div className="my-2 border-t"></div>
            <div className="flex items-center justify-between font-bold">
              <span>Total Migrated</span>
              <span>
                {totalMigrated} / {totalServices}
              </span>
            </div>
          </div>
        </div>
      );
    }
  }
  return null;
};

export function TeamProgressChart({ teamStats }: TeamProgressChartProps) {
  const [view, setView] = React.useState("counts");

  const processedTeamStats = React.useMemo(() => {
    const teamMap = new Map<string, TeamStat>();

    teamStats.forEach((team) => {
      const teamName = team.teamName.toLowerCase();
      if (teamMap.has(teamName)) {
        const existingTeam = teamMap.get(teamName)!;
        existingTeam.migratedSpaCount += team.migratedSpaCount;
        existingTeam.outstandingSpaCount += team.outstandingSpaCount;
        existingTeam.migratedMsCount += team.migratedMsCount;
        existingTeam.outstandingMsCount += team.outstandingMsCount;
      } else {
        teamMap.set(teamName, { ...team });
      }
    });

    return Array.from(teamMap.values());
  }, [teamStats]);


  const chartData =
    view === "counts"
      ? processedTeamStats.map((team) => ({
          name: team.teamName.replace("team-", ""),
          spas: team.migratedSpaCount,
          microservices: team.migratedMsCount,
        }))
      : processedTeamStats.map((team) => {
          const totalSpas = team.migratedSpaCount + team.outstandingSpaCount;
          const totalMs = team.migratedMsCount + team.outstandingMsCount;
          const totalServices = totalSpas + totalMs;
          const totalMigrated = team.migratedSpaCount + team.migratedMsCount;
          const totalProgress =
            totalServices > 0
              ? Math.round((totalMigrated / totalServices) * 100)
              : 0;

          return {
            name: team.teamName.replace("team-", ""),
            totalProgress: totalProgress,
            migratedSpaCount: team.migratedSpaCount,
            totalSpas,
            migratedMsCount: team.migratedMsCount,
            totalMs,
          };
        });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.5 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Team Progress</CardTitle>
            <CardDescription>
              {view === "counts"
                ? "Showing number of migrated services per team."
                : "Showing overall migration percentage per team."}
            </CardDescription>
          </div>
          <Select value={view} onValueChange={setView}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="counts">Migrated Services</SelectItem>
              <SelectItem value="progress">Overall Progress</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            {view === "counts" ? (
              <AreaChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillSpas" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--chart-spa))"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--chart-spa))"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient
                    id="fillMicroservices"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--chart-ms))"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--chart-ms))"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) =>
                    value.length > 13 ? `${value.slice(0, 13)}...` : value
                  }
                  angle={45}
                  textAnchor="start"
                  height={50}
                />
                <YAxis width={30} />
                <ChartTooltip
                  cursor={false}
                  content={<CustomTooltip chartType="counts" />}
                />
                <Area
                  dataKey="microservices"
                  type="natural"
                  fill="url(#fillMicroservices)"
                  stroke="hsl(var(--chart-ms))"
                />
                <Area
                  dataKey="spas"
                  type="natural"
                  fill="url(#fillSpas)"
                  stroke="hsl(var(--chart-spa))"
                />
                <ChartLegend content={<ChartLegendContent className="text-sm" />} />
              </AreaChart>
            ) : (
              <AreaChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="fillTotalProgress"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--chart-purple))"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--chart-purple))"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) =>
                    value.length > 13 ? `${value.slice(0, 13)}...` : value
                  }
                  angle={45}
                  textAnchor="start"
                  height={50}
                />
                <YAxis
                  tickFormatter={(value) => `${value}%`}
                  width={30}
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                />
                <ChartTooltip
                  cursor={false}
                  content={<CustomTooltip chartType="progress" />}
                />
                <Area
                  dataKey="totalProgress"
                  type="natural"
                  fill="url(#fillTotalProgress)"
                  stroke="hsl(var(--chart-purple))"
                  strokeWidth={2}
                />
                <ChartLegend content={<ChartLegendContent className="text-sm" />} />
              </AreaChart>
            )}
          </ChartContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
