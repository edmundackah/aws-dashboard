import type { BurndownResponse, EnvBurndownPoint } from "./types"

export function normalizeBurndownData(data: BurndownResponse): { data: { [key: string]: EnvBurndownPoint[] }, targets: { [key: string]: string } } {
  const result: { [key: string]: EnvBurndownPoint[] } = {}
  const targets: { [key: string]: string } = {}
  if (!data || !data.environments || data.environments.length === 0) {
    return { data: {}, targets: {} }
  }
  data.environments.forEach((envData) => {
    const envKey = envData.env
    targets[envKey] = envData.target
    const map = new Map<string, EnvBurndownPoint>()
    const spaTotalInitial = envData.scope?.spa?.inEnv || envData.series.find(s => s.key === "spa.actual")?.points[0]?.total || 0
    const msTotalInitial = envData.scope?.microservice?.inEnv || envData.series.find(s => s.key === "ms.actual")?.points[0]?.total || 0
    envData.series.forEach((seriesData) => {
      seriesData.points.forEach((point) => {
        const date = point.x
        if (!map.has(date)) {
          map.set(date, { date })
        }
        const current = map.get(date)!
        const isSpaActual = seriesData.key === "spa.actual"
        const isMsActual = seriesData.key === "ms.actual"
        if (isSpaActual) {
          current.spaActual = point.y
          current.spaTotal = point.total
        } else if (isMsActual) {
          current.msActual = point.y
          current.msTotal = point.total
        }
      })
    })
    const series = Array.from(map.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    series.forEach(p => { p.ts = new Date(p.date).getTime() })
    const spaTotal = series.find(p => p.spaTotal != null)?.spaTotal ?? spaTotalInitial
    const msTotal = series.find(p => p.msTotal != null)?.msTotal ?? msTotalInitial
    series.forEach((point) => {
      point.spaActual = (point.spaTotal ?? spaTotal) - (point.spaActual ?? 0)
      point.msActual = (point.msTotal ?? msTotal) - (point.msActual ?? 0)
      point.combinedActual = (point.spaActual ?? 0) + (point.msActual ?? 0)
    })
    result[envKey] = series
  })
  return { data: result, targets }
}


