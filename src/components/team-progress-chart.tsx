"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
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
} satisfies ChartConfig;

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
  payload: {
    spaProgress: number;
    msProgress: number;
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
    return (
      <div className="rounded-lg border bg-background p-3 shadow-sm">
        {chartType === "counts" && (
          <div className="grid gap-1.5">
            <p className="font-medium text-muted-foreground">Team {label}</p>
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
        )}
        {chartType === "progress" && (
          <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-8">
              <div className="flex flex-col">
                <span className="text-[0.7rem] uppercase text-muted-foreground">
                  Team
                </span>
                <span className="font-bold text-muted-foreground">{label}</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[0.7rem] uppercase text-muted-foreground">
                  Progress
                </span>
                <span className="font-bold">
                  {data.spaProgress + data.msProgress}%
                </span>
              </div>
            </div>
            <div className="grid gap-1.5 text-sm mt-2">
              <div className="flex items-center justify-between">
                <span>SPAs:</span>
                <span className="font-bold">
                  {data.migratedSpaCount} / {data.totalSpas}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Microservices:</span>
                <span className="font-bold">
                  {data.migratedMsCount} / {data.totalMs}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export function TeamProgressChart({ teamStats }: TeamProgressChartProps) {
  const [view, setView] = React.useState("counts");

  const chartData =
    view === "counts"
      ? teamStats.map((team) => ({
          name: team.teamName.replace("team-", ""),
          spas: team.migratedSpaCount,
          microservices: team.migratedMsCount,
        }))
      : teamStats.map((team) => {
          const totalSpas = team.migratedSpaCount + team.outstandingSpaCount;
          const totalMs = team.migratedMsCount + team.outstandingMsCount;
          const totalServices = totalSpas + totalMs;

          const spaProgress =
            totalServices > 0
              ? Math.round((team.migratedSpaCount / totalServices) * 100)
              : 0;
          const msProgress =
            totalServices > 0
              ? Math.round((team.migratedMsCount / totalServices) * 100)
              : 0;

          return {
            name: team.teamName,
            spaProgress: spaProgress,
            msProgress: msProgress,
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
      transition={{ duration: 0.5, delay: 0.4 }}
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
              <SelectItem value="counts">Migrated Counts</SelectItem>
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
                margin={{ top: 10, right: 20, left: 5, bottom: 0 }}
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
                  tickFormatter={(value) => `T${value}`}
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
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            ) : (
              <BarChart
                data={chartData}
                stackOffset="sign"
                margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.replace("team-", "T")}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  tickFormatter={(value) => `${value}%`}
                  width={30}
                  domain={[0, 100]}
                />
                <ChartTooltip
                  cursor={false}
                  content={<CustomTooltip chartType="progress" />}
                />
                <Bar
                  dataKey="spaProgress"
                  fill="hsl(var(--chart-spa) / 0.5)"
                  stackId="a"
                  radius={4}
                />
                <Bar
                  dataKey="msProgress"
                  fill="hsl(var(--chart-ms) / 0.5)"
                  stackId="a"
                  radius={4}
                />
              </BarChart>
            )}
          </ChartContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
