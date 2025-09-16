"use client"

import * as React from "react"

import {CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis} from "recharts"

import {Badge} from "@/components/ui/badge"
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip"
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card"
import {ChartContainer, ChartTooltip} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton";

import type {EnvBurndownPoint, EnvironmentProgress} from "./types"
import { motion } from "framer-motion";

type Props = {
  metrics: EnvironmentProgress
  data: EnvBurndownPoint[]
  animationKey?: number
}

export function BurndownEnvChartCard({ metrics, data, animationKey = 0 }: Props) {
  const [isLoading, setIsLoading] = React.useState(true);
  const spaTargetTs = new Date(metrics.targetSpa).getTime()
  const msTargetTs = new Date(metrics.targetMs).getTime()
  const spaDateValid = metrics.targetSpa && !Number.isNaN(Date.parse(metrics.targetSpa))
  const msDateValid = metrics.targetMs && !Number.isNaN(Date.parse(metrics.targetMs))
  const spaDateLabel = spaDateValid ? new Date(metrics.targetSpa).toLocaleDateString() : null
  const msDateLabel = msDateValid ? new Date(metrics.targetMs).toLocaleDateString() : null

  React.useEffect(() => {
    // Simulate loading delay for the shimmer effect
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 750); // Adjust delay as needed

    return () => clearTimeout(timer);
  }, [animationKey]);


  const yMax = React.useMemo(() => {
    let maxTotal = 0
    for (const p of data) {
      if (typeof p.spaTotal === 'number') maxTotal = Math.max(maxTotal, p.spaTotal)
      if (typeof p.msTotal === 'number') maxTotal = Math.max(maxTotal, p.msTotal)
    }
    // Fallback to data maxima if totals missing
    if (maxTotal === 0) {
      for (const p of data) {
        if (typeof p.spaActual === 'number') maxTotal = Math.max(maxTotal, p.spaActual)
        if (typeof p.msActual === 'number') maxTotal = Math.max(maxTotal, p.msActual)
      }
    }
    return maxTotal
  }, [data])

  return (
    <Card
      className={`bg-card border ${
        (metrics.spaStatus === "completed" ||
          metrics.spaStatus === "completed_late") &&
        (metrics.msStatus === "completed" ||
          metrics.msStatus === "completed_late")
          ? "rainbow-glow"
          : ""
      } py-1.5 gap-1.5 h-full`}
    >
      <CardHeader className="py-0.5 px-2.5">
        <div className="flex items-center justify-between">
          <CardTitle className="capitalize text-sm">
            {metrics.env.toUpperCase()} Burndown
          </CardTitle>
        </div>
        {isLoading ? (
          <div className="flex flex-wrap gap-1 items-center text-[11px] pt-1">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-32 rounded-full" />
          </div>
        ) : (
          <motion.div
            className="flex flex-wrap gap-1 items-center text-[11px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    className={
                      metrics.spaStatus === "missed"
                        ? "px-2 py-0.5 text-white bg-red-600 hover:bg-red-700 dark:text-red-100 dark:bg-red-400/45 dark:hover:bg-red-400/55"
                        : metrics.spaStatus === "at_risk"
                        ? "px-2 py-0.5 text-white bg-amber-500 hover:bg-amber-600 dark:text-amber-50 dark:bg-amber-300/45 dark:hover:bg-amber-300/55"
                        : "px-2 py-0.5 text-white bg-[hsl(var(--chart-spa))] hover:opacity-95 dark:bg-[hsl(var(--chart-spa)/0.55)]"
                    }
                  >
                    SPA ·{" "}
                    {metrics.spaStatus === "missed"
                      ? "Missed"
                      : metrics.spaStatus === "completed_late"
                      ? "Completed (Late)"
                      : metrics.spaStatus === "completed"
                      ? "Completed"
                      : metrics.spaStatus === "on_track"
                      ? "On Track"
                      : "At Risk"}
                    {spaDateLabel ? ` · ${spaDateLabel}` : ""}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    SPA status: {metrics.spaStatus.replace("_", " ")}
                    {spaDateLabel ? ` · Target: ${spaDateLabel}` : ""}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    className={
                      metrics.msStatus === "missed"
                        ? "px-2 py-0.5 text-white bg-red-600 hover:bg-red-700 dark:text-red-100 dark:bg-red-400/45 dark:hover:bg-red-400/55"
                        : metrics.msStatus === "at_risk"
                        ? "px-2 py-0.5 text-white bg-amber-500 hover:bg-amber-600 dark:text-amber-50 dark:bg-amber-300/45 dark:hover:bg-amber-300/55"
                        : "px-2 py-0.5 text-white bg-[hsl(var(--chart-ms))] hover:opacity-95 dark:bg-[hsl(var(--chart-ms)/0.55)]"
                    }
                  >
                    MS ·{" "}
                    {metrics.msStatus === "missed"
                      ? "Missed"
                      : metrics.msStatus === "completed_late"
                      ? "Completed (Late)"
                      : metrics.msStatus === "completed"
                      ? "Completed"
                      : metrics.msStatus === "on_track"
                      ? "On Track"
                      : "At Risk"}
                    {msDateLabel ? ` · ${msDateLabel}` : ""}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Microservices status: {metrics.msStatus.replace("_", " ")}
                    {msDateLabel ? ` · Target: ${msDateLabel}` : ""}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </motion.div>
        )}
      </CardHeader>
      <CardContent className="px-3 flex-1">
        {isLoading ? (
          <div className="h-[250px] w-full flex items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
        ) : (
          <motion.div
            className="h-full w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <ChartContainer
              config={{}}
              className="h-full w-full text-[12px] aspect-auto"
            >
              <LineChart
                key={animationKey}
                accessibilityLayer
                data={data}
                margin={{ left: 24, right: 24, top: 10, bottom: 10 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="ts"
                  type="number"
                  scale="time"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  domain={[ 'dataMin', metrics.axisEndTs ]}
                  allowDuplicatedCategory={false}
                  tickFormatter={(value) => {
                    const ts = typeof value === 'number' ? value : Number(value)
                    if (Number.isNaN(ts)) return ''
                    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
                  }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  domain={[0, yMax]}
                  label={{ value: "Services Remaining", angle: -90, position: "left", offset: 0, style: { fontSize: 12 } }}
                />
                {spaDateValid && (
                  <ReferenceLine x={spaTargetTs} stroke="hsl(var(--chart-spa))" strokeDasharray="3 3" />
                )}
                {msDateValid && (
                  <ReferenceLine x={msTargetTs} stroke="hsl(var(--chart-ms))" strokeDasharray="3 3" />
                )}
                <ChartTooltip
                  cursor={{ stroke: 'hsl(var(--foreground))', strokeWidth: 2 }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload || payload.length === 0) return null
                    const date = typeof label === 'number' ? new Date(label) : (typeof payload[0]?.payload?.ts === 'number' ? new Date(payload[0].payload.ts) : null)
                    const dateLabel = date ? date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : ''
                    const rows = payload
                      .filter(item => item && item.value != null && (item.dataKey === 'spaActual' || item.dataKey === 'spaPlanned' || item.dataKey === 'msActual' || item.dataKey === 'msPlanned'))
                      .map((item) => ({
                        key: String(item.dataKey ?? item.name ?? 'value'),
                        label: item.name ?? String(item.dataKey ?? ''),
                        value: Number(item.value),
                        color: item.color as string | undefined,
                      }))
                    if (rows.length === 0) return null
                    return (
                      <div className="rounded-xl border border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 py-3 shadow-2xl min-w-[16rem] max-w-[28rem]">
                        <div className="text-[12px] uppercase tracking-wide text-muted-foreground mb-2">{dateLabel}</div>
                        <div className="space-y-1.5">
                          {rows.map((r) => (
                            <div key={r.key} className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: r.color || 'hsl(var(--muted-foreground))' }} />
                                <span className="text-[13px] text-foreground whitespace-pre-wrap break-words leading-5">{r.label}</span>
                              </div>
                              <span className="text-[13px] font-mono tabular-nums leading-5">{r.value.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="spaActual"
                  stroke="hsl(var(--chart-spa))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls={true}
                  name="SPAs Remaining (Actual)"
                  isAnimationActive={true}
                  animationBegin={0}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
                <Line
                  type="monotone"
                  dataKey="msActual"
                  stroke="hsl(var(--chart-ms))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls={true}
                  name="Microservices Remaining (Actual)"
                  isAnimationActive={true}
                  animationBegin={200}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
                <Line
                  type="monotone"
                  dataKey="spaPlanned"
                  stroke="hsl(var(--chart-spa))"
                  strokeWidth={2}
                  strokeDasharray="4 6"
                  dot={{ r: 2 }}
                  connectNulls={true}
                  name="SPAs Remaining (Planned)"
                  isAnimationActive={true}
                  animationBegin={400}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
                <Line
                  type="monotone"
                  dataKey="msPlanned"
                  stroke="hsl(var(--chart-ms))"
                  strokeWidth={2}
                  strokeDasharray="4 6"
                  dot={{ r: 2 }}
                  connectNulls={true}
                  name="Microservices Remaining (Planned)"
                  isAnimationActive={true}
                  animationBegin={600}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ChartContainer>
          </motion.div>
        )}
      </CardContent>
      <CardFooter className="hidden" />
    </Card>
  )
}

