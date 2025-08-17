import type { EnvBurndownPoint, EnvironmentProgress } from "./types"

export function calculateDaysToTarget(target: string): number {
  const targetDate = new Date(target)
  const diffTime = targetDate.getTime() - new Date().getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function determineTrend(points: EnvBurndownPoint[], type: 'spa' | 'ms'): 'improving' | 'declining' | 'stable' {
  if (points.length < 2) return 'stable'
  const actualKey = type === 'spa' ? 'spaActual' : 'msActual'
  const recent = points.slice(-3).filter(p => (actualKey === 'spaActual' ? p.spaActual != null : p.msActual != null))
  if (recent.length < 2) return 'stable'
  const firstValue = actualKey === 'spaActual' ? (recent[0].spaActual as number) : (recent[0].msActual as number)
  const lastValue = actualKey === 'spaActual' ? (recent[recent.length - 1].spaActual as number) : (recent[recent.length - 1].msActual as number)
  if (lastValue < firstValue) return 'improving'
  if (lastValue > firstValue) return 'declining'
  return 'stable'
}

export function calculateEnvironmentMetrics(
  burndownData: { [key: string]: EnvBurndownPoint[] },
  targets: { [key: string]: string }
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
    const target = targets[envKey]
    const targetTs = new Date(target).getTime()
    const latest = points[points.length - 1]
    const spaTotal = latest.spaTotal || 0
    const msTotal = latest.msTotal || 0
    const currentSpa = latest.spaActual ?? spaTotal
    const currentMs = latest.msActual ?? msTotal
    const spaProgress = spaTotal > 0 ? Math.round(((spaTotal - currentSpa) / spaTotal) * 100) : 0
    const msProgress = msTotal > 0 ? Math.round(((msTotal - currentMs) / msTotal) * 100) : 0
    const overallProgress = (spaTotal > 0 && msTotal > 0)
      ? Math.round((((spaTotal - currentSpa) + (msTotal - currentMs)) / (spaTotal + msTotal)) * 100)
      : (spaTotal > 0) ? spaProgress : (msTotal > 0) ? msProgress : 0

    // compute trend/projection (simplified here to keep module small)
    const DAY_MS = 24 * 60 * 60 * 1000
    const combinedSeries = points
      .map(p => ({ ts: p.ts ?? new Date(p.date).getTime(), remaining: (p.spaActual ?? 0) + (p.msActual ?? 0) }))
      .filter(p => Number.isFinite(p.ts) && Number.isFinite(p.remaining))
      .sort((a, b) => a.ts - b.ts)
    const recent = combinedSeries.slice(-4)
    let decreasesCount = 0
    for (let i = 1; i < recent.length; i++) {
      if (recent[i - 1].remaining > recent[i].remaining) decreasesCount++
    }
    const trendImproving = decreasesCount >= 2

    let projectedCompletionTs = Number.POSITIVE_INFINITY
    if (recent.length >= 2) {
      const first = recent[0]
      const last = recent[recent.length - 1]
      const deltaRem = first.remaining - last.remaining
      const deltaDays = Math.max(1e-6, (last.ts - first.ts) / DAY_MS)
      const burnRatePerDay = deltaRem / deltaDays
      if (burnRatePerDay > 0) {
        const projDays = last.remaining / burnRatePerDay
        projectedCompletionTs = last.ts + projDays * DAY_MS
      }
    }
    const todayTs = Date.now()
    const status: EnvironmentProgress["status"] = overallProgress >= 95
      ? ((combinedSeries.find(p => p.remaining <= 0)?.ts ?? null) && (combinedSeries.find(p => p.remaining <= 0)!.ts > targetTs) ? 'missed' : 'completed')
      : (todayTs > targetTs ? 'missed' : (Number.isFinite(projectedCompletionTs) && projectedCompletionTs <= targetTs && trendImproving ? 'on_track' : 'at_risk'))

    // Inject projected points between last known and projected end for smoother dotted line
    if (Number.isFinite(projectedCompletionTs)) {
      const projTs = projectedCompletionTs as number
      const lastPoint = points[points.length - 1]
      const lastSpa = lastPoint.spaActual ?? 0
      const lastMs = lastPoint.msActual ?? 0
      const lastCombined = lastSpa + lastMs
      const lastTs = lastPoint.ts ?? new Date(lastPoint.date).getTime()
      const DAY_MS = 24 * 60 * 60 * 1000
      const spanMs = Math.max(1, projTs - lastTs)
      const desiredSteps = 8
      const steps = Math.min(desiredSteps, Math.max(1, Math.floor(spanMs / DAY_MS)))
      const intervalMs = spanMs / (steps + 1)
      for (let i = 1; i <= steps; i++) {
        const ts = Math.round(lastTs + intervalMs * i)
        const t = i / (steps + 1)
        const spaProj = Math.max(0, Math.round(lastSpa * (1 - t)))
        const msProj = Math.max(0, Math.round(lastMs * (1 - t)))
        const combinedProj = Math.max(0, Math.round(lastCombined * (1 - t)))
        const mid: EnvBurndownPoint = {
          date: new Date(ts).toISOString().split('T')[0],
          ts,
          spaProjected: spaProj,
          msProjected: msProj,
          combinedProjected: combinedProj,
        }
        points.push(mid)
      }
      const endPoint: EnvBurndownPoint = {
        date: new Date(projTs).toISOString().split('T')[0],
        ts: projTs,
        spaProjected: 0,
        msProjected: 0,
        combinedProjected: 0,
      }
      points.push(endPoint)
      points.sort((a, b) => (a.ts ?? new Date(a.date).getTime()) - (b.ts ?? new Date(b.date).getTime()))
      lastPoint.spaProjected = lastSpa
      lastPoint.msProjected = lastMs
      lastPoint.combinedProjected = lastCombined
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
      daysToTarget: Math.ceil((targetTs - Date.now()) / DAY_MS),
      isOnTrack: status === 'on_track' || overallProgress >= 95,
      trend: overallProgress >= 95 ? 'stable' : (trendImproving ? 'improving' : 'declining'),
      axisEndTs: Math.max(targetTs, points.reduce((m, p) => Math.max(m, p.ts ?? new Date(p.date).getTime()), 0), Number.isFinite(projectedCompletionTs) ? (projectedCompletionTs as number) : 0),
      status,
      projectedCompletionTs: Number.isFinite(projectedCompletionTs) ? projectedCompletionTs : null,
      projectedSpaTs: null,
      projectedMsTs: null,
      spaStatus: spaProgress >= 95 ? 'completed' : 'on_track',
      msStatus: msProgress >= 95 ? 'completed' : 'on_track',
    })
  })

  metrics.sort((a, b) => {
    const order = ["dev", "sit", "uat", "nft"]
    return order.indexOf(a.env) - order.indexOf(b.env)
  })
  return metrics
}


