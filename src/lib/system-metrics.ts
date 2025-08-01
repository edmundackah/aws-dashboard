import { metrics } from "@opentelemetry/api";

// Conditional imports to avoid Edge Runtime issues
let os: any = null;
let process: any = null;

// Only import Node.js modules when in Node.js environment
if (typeof globalThis.process !== 'undefined' && globalThis.process.versions?.node) {
  try {
    os = require("os");
    process = require("process");
  } catch {
    // Modules not available
  }
}

// Create a meter for system metrics
const meter = metrics.getMeter("aws-dashboard-system", "1.0.0");

// Create metric instruments
const cpuUsageGauge = meter.createObservableGauge("system_cpu_usage", {
  description: "System CPU usage percentage",
});

const memoryUsageGauge = meter.createObservableGauge("system_memory_usage_bytes", {
  description: "System memory usage in bytes",
});

const heapUsageGauge = meter.createObservableGauge("nodejs_heap_usage_bytes", {
  description: "Node.js heap usage in bytes",
});

const eventLoopLagGauge = meter.createObservableGauge("nodejs_event_loop_lag_ms", {
  description: "Node.js event loop lag in milliseconds",
});

const gcCounter = meter.createCounter("nodejs_gc_runs_total", {
  description: "Total number of garbage collection runs",
});

const processUptimeGauge = meter.createObservableGauge("process_uptime_seconds", {
  description: "Process uptime in seconds",
});

const activeHandlesGauge = meter.createObservableGauge("nodejs_active_handles", {
  description: "Number of active handles in Node.js",
});

const activeRequestsGauge = meter.createObservableGauge("nodejs_active_requests", {
  description: "Number of active requests in Node.js",
});

// Event loop lag measurement
let eventLoopStart = process.hrtime();
let eventLoopLag = 0;

const measureEventLoopLag = () => {
  const delta = process.hrtime(eventLoopStart);
  const nanosec = delta[0] * 1e9 + delta[1];
  const millisec = nanosec / 1e6;
  eventLoopLag = Math.max(0, millisec - 1); // Subtract 1ms as baseline
  eventLoopStart = process.hrtime();
};

// GC tracking
const gcStats = { count: 0, totalDuration: 0 };
let gcObserver: any = null;

try {
  // Try to use perf_hooks for GC observation (Node.js 8.5+)
  const { PerformanceObserver } = require("perf_hooks");
  
  gcObserver = new PerformanceObserver((list: any) => {
    const entries = list.getEntries();
    for (const entry of entries) {
      if (entry.entryType === "gc") {
        gcStats.count++;
        gcStats.totalDuration += entry.duration;
        gcCounter.add(1, { type: entry.detail?.kind || "unknown" });
      }
    }
  });
  
  gcObserver.observe({ entryTypes: ["gc"] });
} catch (error) {
  console.log("GC metrics not available in this Node.js version");
}

// Start event loop lag measurement (only in Node.js environment)
if (typeof globalThis.process !== 'undefined' && globalThis.process.versions?.node) {
  setInterval(measureEventLoopLag, 1000);
}

// Register observable metrics (only if Node.js modules are available)
if (os && process) {
  cpuUsageGauge.addCallback((result) => {
    try {
      const cpus = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;

      cpus.forEach((cpu: any) => {
        for (const type in cpu.times) {
          totalTick += cpu.times[type as keyof typeof cpu.times];
        }
        totalIdle += cpu.times.idle;
      });

      const idle = totalIdle / cpus.length;
      const total = totalTick / cpus.length;
      const usage = 100 - ~~((100 * idle) / total);

      result.observe(usage, { unit: "percent" });
    } catch (error) {
      // Silently fail if metrics collection fails
    }
  });
}

if (os && process) {
  memoryUsageGauge.addCallback((result) => {
    try {
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;

      result.observe(usedMemory, { type: "used" });
      result.observe(freeMemory, { type: "free" });
      result.observe(totalMemory, { type: "total" });
    } catch (error) {
      // Silently fail if metrics collection fails
    }
  });
}

if (os && process) {
  heapUsageGauge.addCallback((result) => {
    try {
      const memUsage = process.memoryUsage();
      
      result.observe(memUsage.heapUsed, { type: "used" });
      result.observe(memUsage.heapTotal, { type: "total" });
      result.observe(memUsage.external, { type: "external" });
      result.observe(memUsage.rss, { type: "rss" });
      
      if (memUsage.arrayBuffers) {
        result.observe(memUsage.arrayBuffers, { type: "array_buffers" });
      }
    } catch (error) {
      // Silently fail if metrics collection fails
    }
  });

  eventLoopLagGauge.addCallback((result) => {
    result.observe(eventLoopLag);
  });

  processUptimeGauge.addCallback((result) => {
    try {
      result.observe(process.uptime());
    } catch (error) {
      // Silently fail if metrics collection fails
    }
  });

  activeHandlesGauge.addCallback((result) => {
    try {
      if ((process as any)._getActiveHandles) {
        result.observe((process as any)._getActiveHandles().length);
      }
    } catch (error) {
      // Silently fail if metrics collection fails
    }
  });

  activeRequestsGauge.addCallback((result) => {
    try {
      if ((process as any)._getActiveRequests) {
        result.observe((process as any)._getActiveRequests().length);
      }
    } catch (error) {
      // Silently fail if metrics collection fails
    }
  });
}

// Export additional metrics collection functions
export const collectCustomMetrics = () => {
  if (!os || !process) {
    console.log("System metrics not available - running in Edge Runtime");
    return;
  }

  try {
    const loadAverage = os.loadavg();
    const networkInterfaces = os.networkInterfaces();
    
    // Create additional gauges for load average
    const loadAverageGauge = meter.createObservableGauge("system_load_average", {
      description: "System load average",
    });
    
    loadAverageGauge.addCallback((result) => {
      try {
        const currentLoadAverage = os.loadavg();
        result.observe(currentLoadAverage[0], { period: "1m" });
        result.observe(currentLoadAverage[1], { period: "5m" });
        result.observe(currentLoadAverage[2], { period: "15m" });
      } catch (error) {
        // Silently fail if metrics collection fails
      }
    });
  } catch (error) {
    console.log("Error setting up additional metrics:", error);
  }
};

// Initialize custom metrics
collectCustomMetrics();

const systemMetricsExport = {
  gcStats,
  eventLoopLag,
  collectCustomMetrics,
};

export default systemMetricsExport; 