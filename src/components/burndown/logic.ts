import type {EnvBurndownPoint, EnvironmentProgress} from "./types"

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

    // compute trend/projection (simplified here to keep module small)
    const DAY_MS = 24 * 60 * 60 * 1000
    const combinedSeries = points
      .filter(p => p.spaActual != null || p.msActual != null)
      .map(p => ({ ts: p.ts ?? new Date(p.date).getTime(), remaining: (p.spaActual ?? 0) + (p.msActual ?? 0) }))
      .filter(p => Number.isFinite(p.ts) && Number.isFinite(p.remaining))
      .sort((a, b) => a.ts - b.ts)
    const recent = combinedSeries.slice(-4)
    let decreasesCount = 0
    for (let i = 1; i < recent.length; i++) {
      if (recent[i - 1].remaining > recent[i].remaining) decreasesCount++
    }
    const trendImproving = decreasesCount >= 2
    const todayTs = Date.now()
    // overall status will be derived from per-type statuses below

    // Type-specific statuses vs their respective targets
    const spaTrend = determineTrend(points, 'spa')
    const msTrend = determineTrend(points, 'ms')
    const spaRemaining = currentSpa
    const msRemaining = currentMs
    const spaStatus: EnvironmentProgress['spaStatus'] =
      spaRemaining === 0
        ? (Number.isFinite(targetSpaTsFinite) && todayTs > targetSpaTsFinite ? 'completed_late' : 'completed')
        : ((Number.isFinite(targetSpaTsFinite) && todayTs > targetSpaTsFinite)
            ? 'missed'
            : (spaTrend === 'improving' ? 'on_track' : 'at_risk'))
    const msStatus: EnvironmentProgress['msStatus'] =
      msRemaining === 0
        ? (Number.isFinite(targetMsTsFinite) && todayTs > targetMsTsFinite ? 'completed_late' : 'completed')
        : ((Number.isFinite(targetMsTsFinite) && todayTs > targetMsTsFinite)
            ? 'missed'
            : (msTrend === 'improving' ? 'on_track' : 'at_risk'))

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
      trend: overallProgress >= 95 ? 'stable' : (trendImproving ? 'improving' : 'declining'),
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


