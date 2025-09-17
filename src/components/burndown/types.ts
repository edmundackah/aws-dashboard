export type EnvBurndownPoint = {
  date: string
  ts?: number
  spaActual?: number
  spaPlanned?: number
  spaTotal?: number
  msActual?: number
  msPlanned?: number
  msTotal?: number
  combinedActual?: number
  combinedPlanned?: number
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
    target: string | { spa: string; microservice: string }
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
  targetSpa: string
  targetMs: string
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
  status: 'completed' | 'completed_late' | 'on_track' | 'at_risk' | 'missed'
  spaStatus: 'completed' | 'completed_late' | 'on_track' | 'at_risk' | 'missed'
  msStatus: 'completed' | 'completed_late' | 'on_track' | 'at_risk' | 'missed'
  // New metrics for better predictions
  burnRate?: number
  projectedCompletion?: number | null
  confidence?: number
}


