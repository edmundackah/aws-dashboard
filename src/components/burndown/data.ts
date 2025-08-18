import type { BurndownResponse, EnvBurndownPoint } from "./types"

export function normalizeBurndownData(data: BurndownResponse): { data: { [key: string]: EnvBurndownPoint[] }, targets: { [key: string]: { spa: string; ms: string } } } {
  const result: { [key: string]: EnvBurndownPoint[] } = {}
  const targets: { [key: string]: { spa: string; ms: string } } = {}
  if (!data || !data.environments || data.environments.length === 0) {
    return { data: {}, targets: {} }
  }
  // Read defaults from .env using explicit keys (Next.js inlines literals only)
  const envDefaults: { [key: string]: { spa?: string; ms?: string } } = {
    dev: {
      spa: process.env.NEXT_PUBLIC_BURNDOWN_DEFAULT_SPA_DEV,
      ms: process.env.NEXT_PUBLIC_BURNDOWN_DEFAULT_MS_DEV,
    },
    sit: {
      spa: process.env.NEXT_PUBLIC_BURNDOWN_DEFAULT_SPA_SIT,
      ms: process.env.NEXT_PUBLIC_BURNDOWN_DEFAULT_MS_SIT,
    },
    uat: {
      spa: process.env.NEXT_PUBLIC_BURNDOWN_DEFAULT_SPA_UAT,
      ms: process.env.NEXT_PUBLIC_BURNDOWN_DEFAULT_MS_UAT,
    },
    nft: {
      spa: process.env.NEXT_PUBLIC_BURNDOWN_DEFAULT_SPA_NFT,
      ms: process.env.NEXT_PUBLIC_BURNDOWN_DEFAULT_MS_NFT,
    },
  }
  Object.entries(envDefaults).forEach(([envKey, vals]) => {
    if (vals.spa && vals.ms) {
      targets[envKey] = { spa: String(vals.spa), ms: String(vals.ms) }
    }
  })
  data.environments.forEach((envData) => {
    const envKey = envData.env
    // Apply .env defaults for this env when present
    const explicit = envDefaults[envKey]
    if (explicit?.spa && explicit?.ms) {
      targets[envKey] = { spa: String(explicit.spa), ms: String(explicit.ms) }
    }
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
    // Densify planned series weekly up to target dates from .env so graphs show intermediate dates
    const DAY_MS = 24 * 60 * 60 * 1000
    const WEEK_MS = 7 * DAY_MS
    const explicitTargets = envDefaults[envKey] || {}
    const spaTargetTs = explicitTargets.spa ? new Date(explicitTargets.spa).getTime() : NaN
    const msTargetTs = explicitTargets.ms ? new Date(explicitTargets.ms).getTime() : NaN
    if (Number.isFinite(spaTargetTs)) {
      // find last spa planned point
      let lastSpaTs = -Infinity
      let lastSpaVal = 0
      Array.from(map.values()).forEach(p => {
        const ts = new Date(p.date).getTime()
        if (p.spaPlanned != null && Number.isFinite(ts) && ts > lastSpaTs) {
          lastSpaTs = ts
          lastSpaVal = p.spaPlanned as number
        }
      })
      if (Number.isFinite(lastSpaTs) && lastSpaTs < (spaTargetTs as number)) {
        const steps = Math.max(1, Math.floor(((spaTargetTs as number) - lastSpaTs) / WEEK_MS))
        for (let i = 1; i <= steps; i++) {
          const ts = lastSpaTs + i * WEEK_MS
          if (ts > (spaTargetTs as number)) break
          const t = Math.min(1, (ts - lastSpaTs) / ((spaTargetTs as number) - lastSpaTs))
          const y = Math.max(0, Math.round(lastSpaVal * (1 - t)))
          const date = new Date(ts).toISOString().split('T')[0]
          const curr = map.get(date) || { date }
          curr.spaPlanned = curr.spaPlanned != null ? curr.spaPlanned : y
          map.set(date, curr)
        }
        // ensure endpoint at target date with 0
        const endDate = new Date(spaTargetTs as number).toISOString().split('T')[0]
        const end = map.get(endDate) || { date: endDate }
        if (end.spaPlanned == null) end.spaPlanned = 0
        map.set(endDate, end)
      }
    }
    if (Number.isFinite(msTargetTs)) {
      let lastMsTs = -Infinity
      let lastMsVal = 0
      Array.from(map.values()).forEach(p => {
        const ts = new Date(p.date).getTime()
        if (p.msPlanned != null && Number.isFinite(ts) && ts > lastMsTs) {
          lastMsTs = ts
          lastMsVal = p.msPlanned as number
        }
      })
      if (Number.isFinite(lastMsTs) && lastMsTs < (msTargetTs as number)) {
        const steps = Math.max(1, Math.floor(((msTargetTs as number) - lastMsTs) / WEEK_MS))
        for (let i = 1; i <= steps; i++) {
          const ts = lastMsTs + i * WEEK_MS
          if (ts > (msTargetTs as number)) break
          const t = Math.min(1, (ts - lastMsTs) / ((msTargetTs as number) - lastMsTs))
          const y = Math.max(0, Math.round(lastMsVal * (1 - t)))
          const date = new Date(ts).toISOString().split('T')[0]
          const curr = map.get(date) || { date }
          curr.msPlanned = curr.msPlanned != null ? curr.msPlanned : y
          map.set(date, curr)
        }
        const endDate = new Date(msTargetTs as number).toISOString().split('T')[0]
        const end = map.get(endDate) || { date: endDate }
        if (end.msPlanned == null) end.msPlanned = 0
        map.set(endDate, end)
      }
    }
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


