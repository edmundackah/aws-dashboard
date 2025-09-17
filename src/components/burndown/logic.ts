import type {EnvBurndownPoint, EnvironmentProgress} from "./types"

const DAY_MS = 24 * 60 * 60 * 1000;

export function calculateDaysToTarget(target: string): number {
  const targetDate = new Date(target)
  const diffTime = targetDate.getTime() - new Date().getTime()
  return Math.ceil(diffTime / DAY_MS)
}

// Calculate burn rate using linear regression for more accurate projections
function calculateBurnRate(points: Array<{ts: number, remaining: number}>): {
  burnRate: number,
  confidence: number,
  projectedCompletion: number | null
} {
  // Need at least 2 points for regression
  if (points.length < 2) {
    return { burnRate: 0, confidence: 0, projectedCompletion: null };
  }

  // Validate data quality
  const validPoints = points.filter(p => 
    Number.isFinite(p.ts) && 
    Number.isFinite(p.remaining) && 
    p.remaining >= 0
  );
  
  if (validPoints.length < 2) {
    return { burnRate: 0, confidence: 0, projectedCompletion: null };
  }
  
  // Sort by timestamp to ensure chronological order
  validPoints.sort((a, b) => a.ts - b.ts);
  
  // Check for sufficient time span (at least 1 day)
  const timeSpan = validPoints[validPoints.length - 1].ts - validPoints[0].ts;
  if (timeSpan < DAY_MS) {
    return { burnRate: 0, confidence: 0, projectedCompletion: null };
  }

  // Calculate average time and remaining values using validated points
  const n = validPoints.length;
  const sumX = validPoints.reduce((sum, p) => sum + p.ts, 0);
  const sumY = validPoints.reduce((sum, p) => sum + p.remaining, 0);
  const avgX = sumX / n;
  const avgY = sumY / n;

  // Calculate slope using least squares method
  let numerator = 0;
  let denominator = 0;
  let sumSquaredResiduals = 0;
  
  for (const point of validPoints) {
    const xDiff = point.ts - avgX;
    const yDiff = point.remaining - avgY;
    numerator += xDiff * yDiff;
    denominator += xDiff * xDiff;
  }

  if (denominator === 0) {
    return { burnRate: 0, confidence: 0, projectedCompletion: null };
  }

  const slope = numerator / denominator; // items per millisecond
  const intercept = avgY - slope * avgX;

  // Calculate R-squared for confidence
  let totalSumSquares = 0;
  for (const point of validPoints) {
    const predicted = slope * point.ts + intercept;
    const residual = point.remaining - predicted;
    sumSquaredResiduals += residual * residual;
    const yDiff = point.remaining - avgY;
    totalSumSquares += yDiff * yDiff;
  }

  const rSquared = totalSumSquares === 0 ? 0 : Math.max(0, 1 - (sumSquaredResiduals / totalSumSquares));
  const confidence = Math.max(0, Math.min(1, rSquared));

  // Convert to daily burn rate (negative slope means improvement)
  const dailyBurnRate = -slope * DAY_MS;
  
  // Project completion date from the last data point
  const lastPoint = validPoints[validPoints.length - 1];
  const lastTimestamp = lastPoint.ts;
  const currentRemaining = lastPoint.remaining;
  let projectedCompletion: number | null = null;
  
  // Only project if we have positive burn rate and remaining work
  if (dailyBurnRate > 0 && currentRemaining > 0) {
    const daysToComplete = currentRemaining / dailyBurnRate;
    projectedCompletion = lastTimestamp + (daysToComplete * DAY_MS);
    
    // Sanity check: don't project more than 2 years in the future
    const maxProjection = Date.now() + (2 * 365 * DAY_MS);
    if (projectedCompletion > maxProjection) {
      projectedCompletion = null; // Invalid projection
    }
  }

  return {
    burnRate: dailyBurnRate,
    confidence,
    projectedCompletion
  };
}

export function determineTrend(points: EnvBurndownPoint[], type: 'spa' | 'ms'): 'improving' | 'declining' | 'stable' {
  if (points.length < 2) return 'stable'
  const actualKey = type === 'spa' ? 'spaActual' : 'msActual'
  
  // Get recent points with timestamps
  const recentWithTs = points
    .filter(p => {
      const value = actualKey === 'spaActual' ? p.spaActual : p.msActual;
      return value != null && (p.ts || p.date);
    })
    .slice(-7) // Use last week of data for better accuracy
    .map(p => ({
      ts: p.ts || new Date(p.date).getTime(),
      remaining: (actualKey === 'spaActual' ? p.spaActual : p.msActual) as number
    }));

  if (recentWithTs.length < 2) return 'stable';

  const { burnRate, confidence } = calculateBurnRate(recentWithTs);
  
  // Consider trend based on burn rate and confidence
  if (confidence < 0.3) return 'stable'; // Low confidence in the trend
  if (burnRate > 1) return 'improving'; // Burning more than 1 item per day
  if (burnRate < -0.5) return 'declining'; // Adding items
  return 'stable';
}

// Determine project status based on burn rate projections
function determineProjectStatus(
  currentRemaining: number,
  targetDate: number | null,
  projectedCompletion: number | null,
  confidence: number
): 'completed' | 'completed_late' | 'on_track' | 'at_risk' | 'missed' {
  const now = Date.now();
  
  // Already completed
  if (currentRemaining === 0) {
    if (!targetDate || now <= targetDate) {
      return 'completed';
    }
    return 'completed_late';
  }
  
  // Still has work remaining
  if (targetDate && now > targetDate) {
    return 'missed';
  }
  
  // No target date - use trend
  if (!targetDate) {
    return confidence > 0.5 && projectedCompletion ? 'on_track' : 'at_risk';
  }
  
  // Project based on burn rate
  if (!projectedCompletion) {
    return 'at_risk'; // No velocity data or stalled
  }
  
  // Add buffer based on confidence using a more sophisticated calculation
  // Low confidence (0-0.3): 21-30 day buffer
  // Medium confidence (0.3-0.7): 7-21 day buffer  
  // High confidence (0.7-1.0): 3-7 day buffer
  const bufferDays = confidence < 0.3 ? 30 - (confidence * 30) :
                     confidence < 0.7 ? 21 - ((confidence - 0.3) * 35) :
                     7 - ((confidence - 0.7) * 13.33);
  const roundedBufferDays = Math.max(3, Math.round(bufferDays));
  const bufferedProjection = projectedCompletion + (roundedBufferDays * DAY_MS);
  
  if (bufferedProjection <= targetDate) {
    return 'on_track';
  }
  
  return 'at_risk';
}

export function calculateEnvironmentMetrics(
  burndownData: { [key: string]: EnvBurndownPoint[] },
  targets: { [key: string]: { spa: string; ms: string } }
): EnvironmentProgress[] {
  const metrics: EnvironmentProgress[] = []
  const desiredOrder = ["dev", "sit", "uat", "nft"]
  const orderedEnvData = new Map<string, EnvBurndownPoint[]>()
  desiredOrder.forEach(envKey => {
    if (burndownData[envKey]) {
      orderedEnvData.set(envKey, burndownData[envKey])
    }
  })
  Object.keys(burndownData).forEach(envKey => {
    if (!orderedEnvData.has(envKey)) {
      orderedEnvData.set(envKey, burndownData[envKey])
    }
  })

  orderedEnvData.forEach((points, envKey) => {
    if (points.length === 0) return
    const targetSpa = targets[envKey]?.spa
    const targetMs = targets[envKey]?.ms
    const parsedSpa = targetSpa ? new Date(targetSpa).getTime() : NaN
    const parsedMs = targetMs ? new Date(targetMs).getTime() : NaN
    const targetSpaTsFinite = Number.isFinite(parsedSpa) ? (parsedSpa as number) : NaN
    const targetMsTsFinite = Number.isFinite(parsedMs) ? (parsedMs as number) : NaN
    const latest = points[points.length - 1]
    const spaTotal = (points.slice().reverse().find(p => p.spaTotal != null)?.spaTotal) || latest.spaTotal || 0
    const msTotal = (points.slice().reverse().find(p => p.msTotal != null)?.msTotal) || latest.msTotal || 0
    const lastSpaActualPoint = points.slice().reverse().find(p => p.spaActual != null)
    const lastMsActualPoint = points.slice().reverse().find(p => p.msActual != null)
    const currentSpa = lastSpaActualPoint?.spaActual ?? spaTotal
    const currentMs = lastMsActualPoint?.msActual ?? msTotal
    const spaProgress = spaTotal > 0 ? Math.round(((spaTotal - currentSpa) / spaTotal) * 100) : 0
    const msProgress = msTotal > 0 ? Math.round(((msTotal - currentMs) / msTotal) * 100) : 0
    const overallProgress = (spaTotal > 0 && msTotal > 0)
      ? Math.round((((spaTotal - currentSpa) + (msTotal - currentMs)) / (spaTotal + msTotal)) * 100)
      : (spaTotal > 0) ? spaProgress : (msTotal > 0) ? msProgress : 0

    // Compute burn rates and projections for each type
    const spaSeries = points
      .filter(p => p.spaActual != null && (p.ts || p.date))
      .slice(-14) // Two weeks of data
      .map(p => ({ 
        ts: p.ts ?? new Date(p.date).getTime(), 
        remaining: p.spaActual as number 
      }));
    
    const msSeries = points
      .filter(p => p.msActual != null && (p.ts || p.date))
      .slice(-14)
      .map(p => ({ 
        ts: p.ts ?? new Date(p.date).getTime(), 
        remaining: p.msActual as number 
      }));

    // Calculate individual burn rates and projections
    const spaMetrics = calculateBurnRate(spaSeries);
    const msMetrics = calculateBurnRate(msSeries);
    
    // Combined series for overall trend - use available data intelligently
    const combinedSeries = points
      .filter(p => (p.spaActual != null || p.msActual != null) && (p.ts || p.date))
      .slice(-14)
      .map(p => {
        const spaValue = p.spaActual ?? 0;
        const msValue = p.msActual ?? 0;
        // Only count if at least one service type has data
        const remaining = (p.spaActual != null && p.msActual != null) ? 
                         spaValue + msValue :
                         (p.spaActual != null ? spaValue : msValue);
        return {
          ts: p.ts ?? new Date(p.date).getTime(),
          remaining
        };
      })
      .filter(p => Number.isFinite(p.ts) && Number.isFinite(p.remaining) && p.remaining >= 0)
      .sort((a, b) => a.ts - b.ts);
    
    const overallMetrics = calculateBurnRate(combinedSeries);

    // Type-specific statuses based on projections
    const spaRemaining = currentSpa;
    const msRemaining = currentMs;
    
    // Use projection-based status determination
    const spaStatus = determineProjectStatus(
      spaRemaining,
      Number.isFinite(targetSpaTsFinite) ? targetSpaTsFinite : null,
      spaMetrics.projectedCompletion,
      spaMetrics.confidence
    );
    
    const msStatus = determineProjectStatus(
      msRemaining,
      Number.isFinite(targetMsTsFinite) ? targetMsTsFinite : null,
      msMetrics.projectedCompletion,
      msMetrics.confidence
    );

    // Overall status: if both completed (even if late), treat as completed; else if any missed and not both completed, missed; else if both on_track, on_track; otherwise at_risk
    const bothCompletedOrLate = (spaStatus === 'completed' || spaStatus === 'completed_late') && (msStatus === 'completed' || msStatus === 'completed_late')
    const anyMissed = spaStatus === 'missed' || msStatus === 'missed'
    const bothOnTrack = spaStatus === 'on_track' && msStatus === 'on_track'
    const derivedOverallStatus: EnvironmentProgress['status'] = bothCompletedOrLate
      ? (spaStatus === 'completed_late' || msStatus === 'completed_late' ? 'completed_late' : 'completed')
      : anyMissed
      ? 'missed'
      : bothOnTrack
      ? 'on_track'
      : 'at_risk'

    metrics.push({
      env: envKey,
      currentSpa,
      currentMs,
      totalSpa: spaTotal,
      totalMs: msTotal,
      spaProgress,
      msProgress,
      overallProgress,
      daysToTarget: Math.max(0, Math.ceil(((Math.min(
        Number.isFinite(targetSpaTsFinite) ? targetSpaTsFinite : Infinity,
        Number.isFinite(targetMsTsFinite) ? targetMsTsFinite : Infinity
      )) - Date.now()) / DAY_MS)),
      isOnTrack: derivedOverallStatus === 'on_track' || overallProgress >= 95,
      trend: overallProgress >= 95 ? 'stable' : 
             (overallMetrics.burnRate > 1 ? 'improving' : 
              overallMetrics.burnRate < -0.5 ? 'declining' : 'stable'),
      // Add new metrics for better visibility
      burnRate: overallMetrics.burnRate,
      projectedCompletion: overallMetrics.projectedCompletion,
      confidence: overallMetrics.confidence,
      // Separate metrics for SPAs and Microservices
      spaBurnRate: spaMetrics.burnRate,
      spaProjectedCompletion: spaMetrics.projectedCompletion,
      spaConfidence: spaMetrics.confidence,
      msBurnRate: msMetrics.burnRate,
      msProjectedCompletion: msMetrics.projectedCompletion,
      msConfidence: msMetrics.confidence,
      axisEndTs: Math.max(
        Number.isFinite(targetSpaTsFinite) ? targetSpaTsFinite : 0,
        Number.isFinite(targetMsTsFinite) ? targetMsTsFinite : 0,
        points.reduce((m, p) => Math.max(m, p.ts ?? new Date(p.date).getTime()), 0)
      ),
      status: derivedOverallStatus,
      spaStatus,
      msStatus,
      targetSpa: targetSpa ?? '',
      targetMs: targetMs ?? '',
    })
  })

  metrics.sort((a, b) => {
    const order = ["dev", "sit", "uat", "nft"]
    return order.indexOf(a.env) - order.indexOf(b.env)
  })
  return metrics
}


