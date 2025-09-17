import { CalendarDays, TrendingDown, TrendingUp, Activity, Grid, Server } from "lucide-react";
import { format } from "date-fns";
import type { EnvironmentProgress } from "./types";

interface BurndownMetricsProps {
  metrics: EnvironmentProgress;
}

export function BurndownMetrics({ metrics }: BurndownMetricsProps) {
  const hasSpaMetrics = metrics.spaBurnRate !== undefined && metrics.spaConfidence !== undefined;
  const hasMsMetrics = metrics.msBurnRate !== undefined && metrics.msConfidence !== undefined;
  
  if (!hasSpaMetrics && !hasMsMetrics) {
    return null; // Don't show if no metrics are available
  }

  const formatBurnRate = (rate: number) => {
    if (rate < 0) {
      return `+${Math.abs(rate).toFixed(1)} items/day`;
    }
    return `${rate.toFixed(1)} items/day`;
  };

  const formatConfidence = (confidence: number) => {
    const percentage = Math.round(confidence * 100);
    if (percentage >= 80) return { text: "High", color: "text-green-600 dark:text-green-400" };
    if (percentage >= 50) return { text: "Medium", color: "text-amber-600 dark:text-amber-400" };
    return { text: "Low", color: "text-red-600 dark:text-red-400" };
  };

  return (
    <div className="space-y-4 p-4">
      {/* SPA Metrics */}
      {hasSpaMetrics && metrics.currentSpa > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Grid className="h-3.5 w-3.5" />
            <span>SPA Projections</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs pl-5">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                {metrics.spaBurnRate! >= 0 ? (
                  <TrendingDown className="h-3 w-3" />
                ) : (
                  <TrendingUp className="h-3 w-3" />
                )}
                <span>Burn Rate</span>
              </div>
              <div className="font-medium">{formatBurnRate(metrics.spaBurnRate!)}</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Activity className="h-3 w-3" />
                <span>Confidence</span>
              </div>
              <div className={`font-medium ${formatConfidence(metrics.spaConfidence!).color}`}>
                {formatConfidence(metrics.spaConfidence!).text} ({Math.round(metrics.spaConfidence! * 100)}%)
              </div>
            </div>

            {metrics.spaProjectedCompletion && (
              <div className="col-span-2 space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  <span>Projected Completion</span>
                </div>
                <div className="font-medium">
                  {format(new Date(metrics.spaProjectedCompletion), "MMM d, yyyy")}
                  {metrics.targetSpa && (
                    <span className="text-muted-foreground ml-2">
                      (Target: {format(new Date(metrics.targetSpa), "MMM d, yyyy")})
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Microservices Metrics */}
      {hasMsMetrics && metrics.currentMs > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Server className="h-3.5 w-3.5" />
            <span>Microservices Projections</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs pl-5">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                {metrics.msBurnRate! >= 0 ? (
                  <TrendingDown className="h-3 w-3" />
                ) : (
                  <TrendingUp className="h-3 w-3" />
                )}
                <span>Burn Rate</span>
              </div>
              <div className="font-medium">{formatBurnRate(metrics.msBurnRate!)}</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Activity className="h-3 w-3" />
                <span>Confidence</span>
              </div>
              <div className={`font-medium ${formatConfidence(metrics.msConfidence!).color}`}>
                {formatConfidence(metrics.msConfidence!).text} ({Math.round(metrics.msConfidence! * 100)}%)
              </div>
            </div>

            {metrics.msProjectedCompletion && (
              <div className="col-span-2 space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  <span>Projected Completion</span>
                </div>
                <div className="font-medium">
                  {format(new Date(metrics.msProjectedCompletion), "MMM d, yyyy")}
                  {metrics.targetMs && (
                    <span className="text-muted-foreground ml-2">
                      (Target: {format(new Date(metrics.targetMs), "MMM d, yyyy")})
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overall Summary (optional - only if both are present) */}
      {hasSpaMetrics && hasMsMetrics && metrics.burnRate !== undefined && (
        <div className="pt-3 mt-3 border-t text-xs text-muted-foreground">
          <span className="font-medium">Combined burn rate:</span> {formatBurnRate(metrics.burnRate)}
        </div>
      )}
      
      <div className="pt-3 mt-1 border-t text-[12px] leading-5 text-muted-foreground/90">
        Projections use the most recent 14 days via linear regression with confidence-based buffering. Actuals and targets may change.
      </div>
    </div>
  );
}