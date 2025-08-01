// Edge Runtime compatible metrics for middleware
// This file avoids Node.js APIs that aren't supported in Edge Runtime

interface RequestMetrics {
  count: Map<string, number>;
  durations: Map<string, number[]>;
  inFlight: number;
}

// Simple in-memory storage for Edge Runtime
const metrics: RequestMetrics = {
  count: new Map(),
  durations: new Map(),
  inFlight: 0
};

export function incrementHttpRequests(method: string, path: string, status: string) {
  const key = `${method}:${path}:${status}`;
  const current = metrics.count.get(key) || 0;
  metrics.count.set(key, current + 1);
}

export function observeHttpDuration(method: string, path: string, status: string, duration: number) {
  const key = `${method}:${path}:${status}`;
  const durations = metrics.durations.get(key) || [];
  durations.push(duration);
  
  // Keep only last 100 measurements to prevent memory issues
  if (durations.length > 100) {
    durations.splice(0, durations.length - 100);
  }
  
  metrics.durations.set(key, durations);
}

export function setHttpInFlight(count: number) {
  metrics.inFlight = count;
}

export function getEdgeMetrics() {
  return {
    httpRequestCounts: Object.fromEntries(metrics.count),
    httpInFlight: metrics.inFlight,
    httpDurationSamples: Object.fromEntries(
      Array.from(metrics.durations.entries()).map(([key, durations]) => [
        key,
        {
          count: durations.length,
          avg: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
          min: durations.length > 0 ? Math.min(...durations) : 0,
          max: durations.length > 0 ? Math.max(...durations) : 0
        }
      ])
    )
  };
}

// Normalize paths to prevent high cardinality
export function normalizePath(path: string): string {
  // Replace UUIDs and IDs with placeholders
  const normalized = path
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/{uuid}')
    .replace(/\/\d+/g, '/{id}')
    .replace(/\?.*$/, ''); // Remove query parameters
  
  // Common paths
  if (normalized === '/') return '/';
  if (normalized.startsWith('/api/')) return '/api/*';
  if (normalized.startsWith('/_next/')) return '/_next/*';
  if (normalized === '/overview') return '/overview';
  if (normalized === '/spas') return '/spas';
  if (normalized === '/microservices') return '/microservices';
  if (normalized === '/teams') return '/teams';
  
  return normalized || '/';
} 