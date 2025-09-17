import { CalendarDays, TrendingDown, TrendingUp, Activity } from "lucide-react";
import { format } from "date-fns";
import type { EnvironmentProgress } from "./types";

interface BurndownMetricsProps {
  metrics: EnvironmentProgress;
}

export function BurndownMetrics({ metrics }: BurndownMetricsProps) {
  if (!metrics.burnRate || metrics.confidence === undefined) {
    return null; // Don't show if new metrics aren't available
  }

  const formatBurnRate = (rate: number) => {
    if (rate < 0) {
      return `+${Math.abs(rate).toFixed(1)} items/day`;
    }
    return `${rate.toFixed(1)} items/day`;
  };

  const formatConfidence = (confidence: number) => {
    const percentage = Math.round(confidence * 100);
    if (percentage >= 80) return { text: "High", color: "text-green-600" };
    if (percentage >= 50) return { text: "Medium", color: "text-amber-600" };
    return { text: "Low", color: "text-red-600" };
  };

  const confidenceInfo = formatConfidence(metrics.confidence);

  return (
    <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t text-xs">
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-muted-foreground">
          {metrics.burnRate >= 0 ? (
            <TrendingDown className="h-3 w-3" />
          ) : (
            <TrendingUp className="h-3 w-3" />
          )}
          <span>Burn Rate</span>
        </div>
        <div className="font-medium">{formatBurnRate(metrics.burnRate)}</div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Activity className="h-3 w-3" />
          <span>Confidence</span>
        </div>
        <div className={`font-medium ${confidenceInfo.color}`}>
          {confidenceInfo.text} ({Math.round(metrics.confidence * 100)}%)
        </div>
      </div>

      {metrics.projectedCompletion && (
        <div className="col-span-2 space-y-1">
          <div className="flex items-center gap-1 text-muted-foreground">
            <CalendarDays className="h-3 w-3" />
            <span>Projected Completion</span>
          </div>
          <div className="font-medium">
            {format(new Date(metrics.projectedCompletion), "MMM d, yyyy")}
          </div>
        </div>
      )}
    </div>
  );
}
