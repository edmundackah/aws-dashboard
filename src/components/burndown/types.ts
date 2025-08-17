export type EnvBurndownPoint = {
  date: string
  ts?: number
  spaActual?: number
  spaExpected?: number
  spaProjected?: number
  spaTotal?: number
  msActual?: number
  msExpected?: number
  msProjected?: number
  msTotal?: number
  combinedActual?: number
  combinedExpected?: number
  combinedProjected?: number
}

export type BurndownResponse = {
  version?: string
  updatedAt?: string
  organizationInventory?: {
    latest: {
      spa: number
      microservice: number
    }
  }
  environments: Array<{
    env: string
    target: string
    scope?: {
      spa?: { inEnv: number }
      microservice?: { inEnv: number }
    }
    series: Array<{
      key: string
      label?: string
      points: Array<{
        x: string
        y: number
        total?: number
      }>
    }>
  }>
}

export type EnvironmentProgress = {
  env: string
  target: string
  currentSpa: number
  currentMs: number
  totalSpa: number
  totalMs: number
  spaProgress: number
  msProgress: number
  overallProgress: number
  daysToTarget: number
  isOnTrack: boolean
  trend: 'improving' | 'declining' | 'stable'
  axisEndTs: number
  status: 'completed' | 'on_track' | 'at_risk' | 'missed'
  projectedCompletionTs: number | null
  projectedSpaTs: number | null
  projectedMsTs: number | null
  spaStatus: 'completed' | 'on_track' | 'at_risk' | 'missed'
  msStatus: 'completed' | 'on_track' | 'at_risk' | 'missed'
}


