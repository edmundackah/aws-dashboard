import type { BurndownResponse, EnvBurndownPoint } from "./types"

export function normalizeBurndownData(data: BurndownResponse): { data: { [key: string]: EnvBurndownPoint[] }, targets: { [key: string]: { spa: string; ms: string } } } {
  const result: { [key: string]: EnvBurndownPoint[] } = {}
  const targets: { [key: string]: { spa: string; ms: string } } = {}
  if (!data || !data.environments || data.environments.length === 0) {
    return { data: {}, targets: {} }
  }
  data.environments.forEach((envData) => {
    const envKey = envData.env
    const t = envData.target
    targets[envKey] = typeof t === 'string' ? { spa: t, ms: t } : { spa: t.spa, ms: t.microservice }
    const map = new Map<string, EnvBurndownPoint>()
    const spaTotalInitial = envData.scope?.spa?.inEnv || envData.series.find(s => s.key === "spa.actual")?.points[0]?.total || envData.series.find(s => s.key === "spa.planned")?.points[0]?.total || 0
    const msTotalInitial = envData.scope?.microservice?.inEnv || envData.series.find(s => s.key === "ms.actual")?.points[0]?.total || envData.series.find(s => s.key === "ms.planned")?.points[0]?.total || 0
    envData.series.forEach((seriesData) => {
      seriesData.points.forEach((point) => {
        const date = point.x
        if (!map.has(date)) {
          map.set(date, { date })
        }
        const current = map.get(date)!
        const isSpaActual = seriesData.key === "spa.actual"
        const isMsActual = seriesData.key === "ms.actual"
        const isSpaPlanned = seriesData.key === "spa.planned"
        const isMsPlanned = seriesData.key === "ms.planned"
        if (isSpaActual) {
          current.spaActual = point.y
          current.spaTotal = point.total
        } else if (isMsActual) {
          current.msActual = point.y
          current.msTotal = point.total
        } else if (isSpaPlanned) {
          current.spaPlanned = point.y
          current.spaTotal = current.spaTotal ?? point.total
        } else if (isMsPlanned) {
          current.msPlanned = point.y
          current.msTotal = current.msTotal ?? point.total
        }
      })
    })
    const series = Array.from(map.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    series.forEach(p => { p.ts = new Date(p.date).getTime() })
    const inferredSpaTotal = (series.find(p => p.spaTotal != null)?.spaTotal ?? spaTotalInitial) || 0
    const inferredMsTotal = (series.find(p => p.msTotal != null)?.msTotal ?? msTotalInitial) || 0
    series.forEach((point) => {
      // Ensure totals exist and compute combined series
      if (point.spaTotal == null) point.spaTotal = inferredSpaTotal
      if (point.msTotal == null) point.msTotal = inferredMsTotal
      if (point.spaActual == null && point.spaPlanned != null) {
        // leave as is; actual may be missing on planned-only dates
      }
      if (point.msActual == null && point.msPlanned != null) {
        // leave as is
      }
      point.combinedActual = (point.spaActual ?? 0) + (point.msActual ?? 0)
      point.combinedPlanned = (point.spaPlanned ?? 0) + (point.msPlanned ?? 0)
    })
    result[envKey] = series
  })
  return { data: result, targets }
}


