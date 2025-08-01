import { metrics } from "@opentelemetry/api";

// Create a meter for this service
const meter = metrics.getMeter("aws-dashboard", "1.0.0");

// Create OpenTelemetry metrics instruments
const systemMetrics = {
  // System metrics
  systemCpuUsage: meter.createObservableGauge("system_cpu_usage", {
    description: "System CPU usage percentage",
  }),
  
  systemMemoryUsage: meter.createObservableGauge("system_memory_usage_bytes", {
    description: "System memory usage in bytes",
  }),
  
  systemLoadAverage: meter.createObservableGauge("system_load_average", {
    description: "System load average",
  }),

  // Node.js metrics
  nodejsHeapUsage: meter.createObservableGauge("nodejs_heap_usage_bytes", {
    description: "Node.js heap usage in bytes",
  }),
  
  nodejsEventLoopLag: meter.createObservableGauge("nodejs_event_loop_lag_ms", {
    description: "Node.js event loop lag in milliseconds",
  }),
  
  nodejsGcRuns: meter.createCounter("nodejs_gc_runs_total", {
    description: "Total number of garbage collection runs",
  }),
  
  processUptime: meter.createObservableGauge("process_uptime_seconds", {
    description: "Process uptime in seconds",
  }),
  
  nodejsActiveHandles: meter.createObservableGauge("nodejs_active_handles", {
    description: "Number of active handles in Node.js",
  }),
  
  nodejsActiveRequests: meter.createObservableGauge("nodejs_active_requests", {
    description: "Number of active requests in Node.js",
  }),

  // HTTP metrics
  httpRequestsTotal: meter.createCounter("http_requests_total", {
    description: "Total number of HTTP requests",
  }),
  
  httpRequestDuration: meter.createHistogram("http_request_duration_ms", {
    description: "HTTP request duration in milliseconds",
  }),
  
  httpRequestsInFlight: meter.createUpDownCounter("http_requests_in_flight", {
    description: "Number of HTTP requests currently being processed",
  }),

  // Application metrics
  pageRendersTotal: meter.createCounter("page_renders_total", {
    description: "Total number of page renders",
  }),
  
  dataFetchTotal: meter.createCounter("data_fetch_total", {
    description: "Total number of data fetch operations",
  }),
  
  dataFetchDuration: meter.createHistogram("data_fetch_duration_ms", {
    description: "Duration of data fetch operations in milliseconds",
  }),
  
  dataProcessingDuration: meter.createHistogram("data_processing_duration_ms", {
    description: "Duration of data processing operations in milliseconds",
  }),

  // Application info
  applicationInfo: meter.createObservableGauge("aws_dashboard_info", {
    description: "Information about the AWS Dashboard application",
  })
};

// Track some internal state
let eventLoopLag = 0;
let requestsInFlight = 0;

// GC observer initialization (server-side only)
function initializeGCObserver() {
  // Only initialize in Node.js server environment
  if (typeof window === 'undefined' && typeof process !== 'undefined' && process.versions?.node) {
    try {
      // Use dynamic import to avoid bundling issues
      eval(`
        try {
          const { PerformanceObserver } = require('perf_hooks');
          const obs = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.entryType === 'gc') {
                systemMetrics.nodejsGcRuns.add(1, {
                  job: 'aws-dashboard'
                });
              }
            }
          });
          obs.observe({ entryTypes: ['gc'] });
        } catch (e) {
          console.log("GC metrics not available:", e.message);
        }
      `);
    } catch {
      console.log("GC metrics not available in this Node.js version");
    }
  }
}

// Only initialize these in Node.js environment
if (typeof process !== 'undefined' && process.hrtime) {
  // Measure event loop lag
  let eventLoopStart = process.hrtime();
  const measureEventLoopLag = () => {
    const delta = process.hrtime(eventLoopStart);
    const lag = (delta[0] * 1000) + (delta[1] * 1e-6) - 100; // Expected 100ms
    eventLoopLag = Math.max(0, lag);
    eventLoopStart = process.hrtime();
  };

  // Measure event loop lag every second
  setInterval(measureEventLoopLag, 1000);

  // Initialize GC observer (only on server side)
  initializeGCObserver();
}

// System metrics callbacks (only if we have access to Node.js APIs)
if (typeof process !== 'undefined' && typeof require !== 'undefined') {
  try {
    const os = require('os');
    
    // CPU usage callback
    systemMetrics.systemCpuUsage.addCallback((result) => {
      try {
        const cpus = os.cpus();
        let totalUsage = 0;
        
        cpus.forEach((cpu: { times: Record<string, number> }) => {
          const times = cpu.times;
                      const total = Object.values(times).reduce((acc: number, time: number) => acc + time, 0);
          const idle = times.idle;
          const usage = ((total - idle) / total) * 100;
          totalUsage += usage;
        });
        
        const avgCpuUsage = totalUsage / cpus.length;
        result.observe(avgCpuUsage, { job: 'aws-dashboard' });
      } catch (error) {
        // Silently fail
      }
    });

    // Memory usage callback
    systemMetrics.systemMemoryUsage.addCallback((result) => {
      try {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        
        result.observe(totalMem, { job: 'aws-dashboard', type: 'total' });
        result.observe(freeMem, { job: 'aws-dashboard', type: 'free' });
        result.observe(usedMem, { job: 'aws-dashboard', type: 'used' });
      } catch (error) {
        // Silently fail
      }
    });

    // Load average callback
    systemMetrics.systemLoadAverage.addCallback((result) => {
      try {
        const loadAvg = os.loadavg();
        result.observe(loadAvg[0], { job: 'aws-dashboard', period: '1m' });
        result.observe(loadAvg[1], { job: 'aws-dashboard', period: '5m' });
        result.observe(loadAvg[2], { job: 'aws-dashboard', period: '15m' });
      } catch (error) {
        // Silently fail
      }
    });

    // Node.js heap usage callback
    systemMetrics.nodejsHeapUsage.addCallback((result) => {
      try {
        const memUsage = process.memoryUsage();
        result.observe(memUsage.heapUsed, { job: 'aws-dashboard', type: 'used' });
        result.observe(memUsage.heapTotal, { job: 'aws-dashboard', type: 'total' });
        result.observe(memUsage.external, { job: 'aws-dashboard', type: 'external' });
        result.observe(memUsage.rss, { job: 'aws-dashboard', type: 'rss' });
        
        if (memUsage.arrayBuffers !== undefined) {
          result.observe(memUsage.arrayBuffers, { job: 'aws-dashboard', type: 'array_buffers' });
        }
      } catch (error) {
        // Silently fail
      }
    });

    // Event loop lag callback
    systemMetrics.nodejsEventLoopLag.addCallback((result) => {
      result.observe(eventLoopLag, { job: 'aws-dashboard' });
    });

    // Process uptime callback
    systemMetrics.processUptime.addCallback((result) => {
      try {
        result.observe(process.uptime(), { job: 'aws-dashboard' });
      } catch (error) {
        // Silently fail
      }
    });

    // Active handles and requests callbacks (Node.js internal APIs)
    systemMetrics.nodejsActiveHandles.addCallback((result) => {
      try {
        const nodeProcess = process as unknown as { _getActiveHandles?: () => unknown[] };
        if (nodeProcess._getActiveHandles) {
          result.observe(nodeProcess._getActiveHandles().length, { job: 'aws-dashboard' });
        }
      } catch {
        // Silently fail
      }
    });

    systemMetrics.nodejsActiveRequests.addCallback((result) => {
      try {
        const nodeProcess = process as unknown as { _getActiveRequests?: () => unknown[] };
        if (nodeProcess._getActiveRequests) {
          result.observe(nodeProcess._getActiveRequests().length, { job: 'aws-dashboard' });
        }
      } catch {
        // Silently fail
      }
    });

    // Application info callback
    systemMetrics.applicationInfo.addCallback((result) => {
      result.observe(1, { 
        job: 'aws-dashboard', 
        version: '1.0.0', 
        service: 'aws-dashboard' 
      });
    });

  } catch (error) {
    console.log("System metrics not available:", error);
  }
}

// Export functions for HTTP and application metrics
export function incrementHttpRequests(method: string, path: string, status: string) {
  systemMetrics.httpRequestsTotal.add(1, { 
    job: 'aws-dashboard', 
    method, 
    path, 
    status 
  });
}

export function observeHttpDuration(method: string, path: string, status: string, duration: number) {
  systemMetrics.httpRequestDuration.record(duration, { 
    job: 'aws-dashboard', 
    method, 
    path, 
    status 
  });
}

export function setHttpInFlight(count: number) {
  const change = count - requestsInFlight;
  if (change !== 0) {
    systemMetrics.httpRequestsInFlight.add(change, { job: 'aws-dashboard' });
    requestsInFlight = count;
  }
}

export function incrementPageRenders(page: string, status: string) {
  systemMetrics.pageRendersTotal.add(1, { 
    job: 'aws-dashboard', 
    page, 
    status 
  });
}

export function incrementDataFetch(operation: string) {
  systemMetrics.dataFetchTotal.add(1, { 
    job: 'aws-dashboard', 
    operation 
  });
}

export function observeDataFetchDuration(operation: string, status: string, duration: number) {
  systemMetrics.dataFetchDuration.record(duration, { 
    job: 'aws-dashboard', 
    operation, 
    status 
  });
}

export function observeDataProcessingDuration(
  spaCount: number, 
  microserviceCount: number, 
  teamCount: number, 
  duration: number
) {
  systemMetrics.dataProcessingDuration.record(duration, { 
    job: 'aws-dashboard',
    spa_count: spaCount.toString(),
    microservice_count: microserviceCount.toString(),
    team_count: teamCount.toString()
  });
}

// Simple metrics endpoint that returns current values
export async function getSimpleMetrics(): Promise<string> {
  const lines: string[] = [];
  
  lines.push("# AWS Dashboard Metrics");
  lines.push("# Generated at: " + new Date().toISOString());
  lines.push("# Service: aws-dashboard");
  lines.push("");
  
  if (typeof process !== 'undefined') {
    try {
      const os = require('os');
      
      // System info
      lines.push("# System Information");
      lines.push(`# OS: ${os.type()} ${os.release()}`);
      lines.push(`# Architecture: ${os.arch()}`);
      lines.push(`# CPUs: ${os.cpus().length}`);
      lines.push(`# Total Memory: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`);
      lines.push("");
      
      // Current metrics
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const memUsage = process.memoryUsage();
      const loadAvg = os.loadavg();
      
      lines.push("# Current System Metrics");
      lines.push(`system_memory_total_bytes ${totalMem}`);
      lines.push(`system_memory_free_bytes ${freeMem}`);
      lines.push(`system_memory_used_bytes ${usedMem}`);
      lines.push(`system_load_average_1m ${loadAvg[0]}`);
      lines.push(`system_load_average_5m ${loadAvg[1]}`);
      lines.push(`system_load_average_15m ${loadAvg[2]}`);
      lines.push("");
      
      lines.push("# Node.js Process Metrics");
      lines.push(`nodejs_heap_used_bytes ${memUsage.heapUsed}`);
      lines.push(`nodejs_heap_total_bytes ${memUsage.heapTotal}`);
      lines.push(`nodejs_external_bytes ${memUsage.external}`);
      lines.push(`nodejs_rss_bytes ${memUsage.rss}`);
      lines.push(`process_uptime_seconds ${process.uptime()}`);
      lines.push(`nodejs_event_loop_lag_ms ${eventLoopLag}`);
      
      const nodeProcess = process as unknown as { 
        _getActiveHandles?: () => unknown[]; 
        _getActiveRequests?: () => unknown[] 
      };
      if (nodeProcess._getActiveHandles) {
        lines.push(`nodejs_active_handles ${nodeProcess._getActiveHandles().length}`);
      }
      if (nodeProcess._getActiveRequests) {
        lines.push(`nodejs_active_requests ${nodeProcess._getActiveRequests().length}`);
      }
      
    } catch (error) {
      lines.push("# System metrics not available");
    }
  } else {
    lines.push("# Running in non-Node.js environment");
    lines.push("# System metrics not available");
  }
  
  lines.push("");
  lines.push("# Note: This endpoint provides basic metrics.");
  lines.push("# For complete OpenTelemetry metrics, configure your OTEL collector to scrape from the OTLP endpoint.");
  
  return lines.join("\n");
} 