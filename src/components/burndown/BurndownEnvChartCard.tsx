"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { CheckCircle, TrendingDown, TrendingUp } from "lucide-react"

import type { EnvironmentProgress, EnvBurndownPoint } from "./types"

type Props = {
  metrics: EnvironmentProgress
  data: EnvBurndownPoint[]
}

export function BurndownEnvChartCard({ metrics, data }: Props) {
  return (
    <Card className="bg-card border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="capitalize">{metrics.env.toUpperCase()} Burndown</CardTitle>
          <Badge
            variant={
              metrics.overallProgress >= 95
                ? 'secondary'
                : metrics.status === 'on_track'
                ? 'default'
                : 'destructive'
            }
            className={
              metrics.overallProgress >= 95
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : metrics.status === 'missed'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : ''
            }
          >
            {metrics.overallProgress >= 95
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
        <ChartContainer config={{}} className="min-h-[250px] w-full" >
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{ left: 12, right: 12, top: 40, bottom: 36 }}
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
                const ts = typeof value === 'number' ? value : Number(value)
                if (Number.isNaN(ts)) return ''
                return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
              }}
              label={{ value: "Time", position: "bottom", offset: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              label={{ value: "Services Remaining", angle: -90, position: "left", offset: 0 }}
            />
            <defs>
              <linearGradient id={`fillSpa-${metrics.env}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-spa))" stopOpacity={0.35} />
                <stop offset="95%" stopColor="hsl(var(--chart-spa))" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id={`fillMs-${metrics.env}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-ms))" stopOpacity={0.35} />
                <stop offset="95%" stopColor="hsl(var(--chart-ms))" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <ChartTooltip
              cursor={{ stroke: 'hsl(var(--foreground))', strokeWidth: 2 }}
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null
                const date = typeof label === 'number' ? new Date(label) : (typeof payload[0]?.payload?.ts === 'number' ? new Date(payload[0].payload.ts) : null)
                const dateLabel = date ? date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : ''
                const rows = payload
                  .filter(item => item && item.value != null && (item.dataKey === 'spaActual' || item.dataKey === 'spaProjected' || item.dataKey === 'msActual' || item.dataKey === 'msProjected'))
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
            <Area
              type="monotone"
              dataKey="spaActual"
              stroke="hsl(var(--chart-spa))"
              fill={`url(#fillSpa-${metrics.env})`}
              fillOpacity={1}
              connectNulls={true}
              name="SPAs Remaining"
            />
            <Area
              type="monotone"
              dataKey="msActual"
              stroke="hsl(var(--chart-ms))"
              fill={`url(#fillMs-${metrics.env})`}
              fillOpacity={1}
              connectNulls={true}
              name="Microservices Remaining"
            />
            <Area
              type="monotone"
              dataKey="spaProjected"
              stroke="hsl(var(--chart-spa))"
              fill="none"
              strokeDasharray="2 6"
              connectNulls={true}
              name="SPAs Remaining (Projected)"
            />
            <Area
              type="monotone"
              dataKey="msProjected"
              stroke="hsl(var(--chart-ms))"
              fill="none"
              strokeDasharray="2 6"
              connectNulls={true}
              name="Microservices Remaining (Projected)"
            />
            {metrics.projectedCompletionTs && (
              <ReferenceLine
                x={metrics.projectedCompletionTs}
                stroke="var(--foreground)"
                strokeDasharray="3 3"
                label={{ value: 'Projected', position: 'top', fill: 'currentColor', dy: 8, dx: -24 }}
              />
            )}
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="w-full">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
            <div className="flex items-center gap-2 text-sm">
              {metrics.overallProgress >= 95 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : metrics.isOnTrack ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className="font-medium">{metrics.overallProgress}% complete</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {metrics.overallProgress >= 95
                ? 'Completed'
                : metrics.daysToTarget > 0
                ? `${metrics.daysToTarget} days to target`
                : 'At Risk'}
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">Legend: Projected (dotted)</div>
        </div>
      </CardFooter>
    </Card>
  )
}


