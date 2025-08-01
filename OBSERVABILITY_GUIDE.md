# Guide: Adding Comprehensive Observability to a Next.js App (Configurable)

This guide provides a step-by-step process for integrating a robust and configurable observability solution into any Next.js application, featuring traces, metrics, and logs, inspired by the capabilities of Spring Boot Actuator.

## 1. Install Dependencies

First, add all necessary libraries for OpenTelemetry, logging, and system metrics to your project's dependencies:

```bash
npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/exporter-trace-otlp-http @opentelemetry/exporter-metrics-otlp-http @opentelemetry/exporter-logs-otlp-http @opentelemetry/sdk-trace-node @opentelemetry/sdk-metrics @opentelemetry/sdk-logs @opentelemetry/host-metrics @opentelemetry/semantic-conventions @opentelemetry/resources pino pino-pretty dotenv
```

## 2. Configure Environment Variables

Create a `.env.local` file in your project root. This file will store all your observability configurations, making it easy to manage settings across different environments.

**.env.local**
```
# ----------------------------------------------------------------
# OpenTelemetry Exporter Configuration
# ----------------------------------------------------------------
# The endpoint for your OpenTelemetry Collector (e.g., http://localhost:4318)
OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318"

# ----------------------------------------------------------------
# Service Metadata Configuration
# ----------------------------------------------------------------
# The name of your service or application
OTEL_SERVICE_NAME="your-nextjs-app"

# The version of your service (e.g., 1.0.0)
OTEL_SERVICE_VERSION="1.0.0"

# The deployment environment (e.g., development, staging, production)
OTEL_ENVIRONMENT="development" 

# The name of the team responsible for the service
OTEL_TEAM_NAME="your-team-name"

# ----------------------------------------------------------------
# Logging Configuration
# ----------------------------------------------------------------
# The log level for the application (e.g., info, debug, warn, error)
LOG_LEVEL="info"
```

## 3. Set Up OpenTelemetry Instrumentation

Create an `instrumentation.ts` file in your project's root directory. This file initializes the OpenTelemetry SDK with the configurations from your `.env.local` file.

**instrumentation.ts**
```typescript
// instrumentation.ts
// Only initialize OpenTelemetry in Node.js runtime, not Edge Runtime
export function register() {
  // Check if we're in a Node.js environment (not Edge Runtime)
  if (typeof globalThis.process !== 'undefined' && globalThis.process.versions?.node) {
    try {
      const { NodeSDK } = require("@opentelemetry/sdk-node");
      const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-http");
      const { OTLPMetricExporter } = require("@opentelemetry/exporter-metrics-otlp-http");
      const { OTLPLogExporter } = require("@opentelemetry/exporter-logs-otlp-http");
      const { BatchSpanProcessor } = require("@opentelemetry/sdk-trace-node");
      const { PeriodicExportingMetricReader } = require("@opentelemetry/sdk-metrics");
      const { BatchLogRecordProcessor } = require("@opentelemetry/sdk-logs");
      const { HostMetrics } = require("@opentelemetry/host-metrics");
      const { Resource } = require("@opentelemetry/resources");
      const { SemanticResourceAttributes } = require("@opentelemetry/semantic-conventions");

      // Initialize system metrics
      require("./src/lib/system-metrics");

      const resource = new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'your-nextjs-app',
        [SemanticResourceAttributes.SERVICE_VERSION]: process.env.OTEL_SERVICE_VERSION || '1.0.0',
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.OTEL_ENVIRONMENT || process.env.NODE_ENV || 'development',
        'team.name': process.env.OTEL_TEAM_NAME || 'unknown'
      });


      // Create log exporter
      const logExporter = new OTLPLogExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT + '/v1/logs',
      });

      const logProcessor = new BatchLogRecordProcessor(logExporter, {
        maxExportBatchSize: 512,
        maxQueueSize: 2048,
        scheduledDelayMillis: 1000,
        exportTimeoutMillis: 30000,
      });

      // Store log processor globally for logger access
      const globalThis = require('util').getGlobalObject?.() || global;
      globalThis.__OTEL_LOG_PROCESSOR__ = logProcessor;

      const sdk = new NodeSDK({
        resource,
        spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter({
          url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT + '/v1/traces',
        })),
        metricReader: new PeriodicExportingMetricReader({
          exporter: new OTLPMetricExporter({
            url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT + '/v1/metrics',
          }),
          exportIntervalMillis: 5000, // Export every 5 seconds
        }),
        logRecordProcessor: logProcessor,
      });

      sdk.start();

      // Store SDK instance globally for logger access
      globalThis.__OTEL_SDK_INSTANCE__ = sdk;

      // Start host metrics collection
      const hostMetrics = new HostMetrics({
        meterProvider: sdk.metrics,
        name: `${process.env.OTEL_SERVICE_NAME}-host-metrics`,
      });
      hostMetrics.start();

      // Log a test message to verify logging works
      setTimeout(() => {
        console.log("OpenTelemetry instrumentation started with host metrics and logging");
        
        // Test log export
        try {
          const logger = require("./src/lib/logger").default;
          logger.info("OpenTelemetry logging test - this should appear in your OTEL collector", {
            test: true,
            component: "instrumentation",
            timestamp: new Date().toISOString()
          });
        } catch (e) {
          console.log("Could not send test log:", e);
        }
      }, 2000);
      
    } catch (error) {
      console.log("Failed to initialize OpenTelemetry:", error);
    }
  } else {
    console.log("Skipping OpenTelemetry initialization in Edge Runtime");
  }
}
```

## 4. Configure Logging

Create a file at `src/lib/logger.ts` for logging. This setup provides Spring SLF4J-style text logs in the console while sending structured JSON logs to your OTEL collector via HTTP.

**src/lib/logger.ts**
```typescript
import pino from "pino";

// Global reference to OpenTelemetry log processor
let globalLogProcessor: unknown = null;
let otelInitialized = false;

// Function to get the log processor directly from the SDK
function getLogProcessor() {
  if (globalLogProcessor) {
    return globalLogProcessor;
  }
  
  if (typeof window === 'undefined' && !otelInitialized) {
    try {
      // Get the global log processor reference
      const globalThis = require('util').getGlobalObject?.() || global;
      
      if (globalThis.__OTEL_LOG_PROCESSOR__) {
        globalLogProcessor = globalThis.__OTEL_LOG_PROCESSOR__;
        otelInitialized = true;
        console.log("✓ Connected to OpenTelemetry log processor");
        return globalLogProcessor;
      }
      
      // Fallback: try to get from SDK instance
      if (globalThis.__OTEL_SDK_INSTANCE__) {
        const sdk = globalThis.__OTEL_SDK_INSTANCE__;
        if (sdk._loggerProvider?._sharedState?.processors?.[0]) {
          globalLogProcessor = sdk._loggerProvider._sharedState.processors[0];
          otelInitialized = true;
          console.log("✓ Connected to OpenTelemetry log processor via SDK");
          return globalLogProcessor;
        }
      }
      
    } catch (error) {
      // Silent fail - OTEL not ready yet
    }
  }
  
  return null;
}

function sendLogToOtel(message: string, level: number, attributes: Record<string, unknown> = {}) {
  if (typeof window === 'undefined' && process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    // Send logs directly to OTEL collector via HTTP
    const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT + '/v1/logs';
    
    try {
      const now = Date.now();
      const timeUnixNano = now * 1000000; // Convert to nanoseconds
      
      // Create OTLP logs payload that matches the expected format
      const otlpPayload = {
        resourceLogs: [
          {
            resource: {
              attributes: [
                { key: 'service.name', value: { stringValue: process.env.OTEL_SERVICE_NAME} },
                { key: 'service.version', value: { stringValue: process.env.OTEL_SERVICE_VERSION} },
                { key: 'telemetry.sdk.name', value: { stringValue: 'opentelemetry' } },
                { key: 'telemetry.sdk.language', value: { stringValue: 'nodejs' } }
              ]
            },
            scopeLogs: [
              {
                scope: {
                  name: 'nextjs-otel-logger',
                  version: '1.0.0'
                },
                logRecords: [
                  {
                    timeUnixNano: timeUnixNano.toString(),
                    observedTimeUnixNano: timeUnixNano.toString(),
                    severityNumber: level,
                    severityText: pino.levels.labels[level],
                    body: {
                      stringValue: message
                    },
                    attributes: Object.entries({
                      'log.source': 'pino',
                      'timestamp': new Date(now).toISOString(),
                      'service.name': process.env.OTEL_SERVICE_NAME,
                      ...attributes
                    }).map(([key, value]) => ({
                      key,
                      value: { stringValue: String(value) }
                    }))
                  }
                ]
              }
            ]
          }
        ]
      };
      
      // Send to OTEL collector asynchronously (don't block the application)
      fetch(otlpEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(otlpPayload)
      }).then(response => {
        if (!response.ok && !globalThis.__OTEL_HTTP_ERROR_LOGGED__) {
          console.log(`OTEL HTTP log failed: ${response.status} ${response.statusText}`);
          globalThis.__OTEL_HTTP_ERROR_LOGGED__ = true;
        } else if (response.ok && !globalThis.__OTEL_HTTP_SUCCESS_LOGGED__) {
          console.log("✅ Logs successfully sent to OTEL collector via HTTP");
          globalThis.__OTEL_HTTP_SUCCESS_LOGGED__ = true;
        }
      }).catch(error => {
        if (!globalThis.__OTEL_HTTP_ERROR_LOGGED__) {
          console.log("OTEL HTTP log error:", error.message);
          globalThis.__OTEL_HTTP_ERROR_LOGGED__ = true;
        }
      });
      
    } catch (error) {
      if (!globalThis.__OTEL_LOG_ERROR_LOGGED__) {
        console.log("Failed to prepare OTEL HTTP log:", error);
        globalThis.__OTEL_LOG_ERROR_LOGGED__ = true;
      }
    }
  }
}

// Custom Spring SLF4J style formatter (Next.js compatible)
function springFormatter(obj: any) {
  // Handle different timestamp formats
  let timestamp: string;
  try {
    if (obj.time) {
      // If time is already a number (Unix timestamp in ms)
      const timeValue = typeof obj.time === 'number' ? obj.time : 
                       typeof obj.time === 'string' ? new Date(obj.time).getTime() : 
                       Date.now();
      timestamp = new Date(timeValue).toISOString().replace('T', ' ').replace('Z', '');
    } else {
      timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');
    }
  } catch (error) {
    // Fallback to current time if timestamp parsing fails
    timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');
  }
  
  const level = obj.level === 30 ? 'INFO' : 
               obj.level === 40 ? 'WARN' : 
               obj.level === 50 ? 'ERROR' : 
               obj.level === 20 ? 'DEBUG' : 'INFO';
  
  const serviceName = process.env.OTEL_SERVICE_NAME;
  let message = `${level} [${timestamp}] ${serviceName} - ${obj.msg}`;
  
  // Add attributes if present
  if (obj && typeof obj === 'object') {
    const attrs = Object.keys(obj).filter(key => 
      !['level', 'time', 'msg', 'pid', 'hostname'].includes(key)
    );
    
    if (attrs.length > 0) {
      const attrStr = attrs.map(key => `${key}=${JSON.stringify(obj[key])}`).join(', ');
      message += ` [${attrStr}]`;
    }
  }
  
  return message;
}

// Create a Pino logger with Spring SLF4J style format (Next.js compatible)
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  // Use custom formatter instead of pino-pretty to avoid worker issues
  formatters: {
    log: springFormatter
  },
  hooks: {
    logMethod(inputArgs, method, level) {
      // Send logs to OpenTelemetry (server-side only)
      if (typeof window === 'undefined') {
        try {
          const [messageOrObj, ...rest] = inputArgs;
          let message: string;
          let attributes: Record<string, unknown> = {};
          
          if (typeof messageOrObj === 'string') {
            message = messageOrObj;
            // Extract additional data from rest of arguments
            if (rest.length > 0 && typeof rest[0] === 'object' && rest[0] !== null) {
              attributes = rest[0] as Record<string, unknown>;
            }
          } else if (typeof messageOrObj === 'object' && messageOrObj !== null) {
            // Extract message and attributes from object
            const obj = messageOrObj as Record<string, unknown>;
            message = obj.msg as string || JSON.stringify(messageOrObj);
            attributes = { ...obj };
            delete attributes.msg;
          } else {
            message = JSON.stringify(messageOrObj);
          }
          
          // Format message in Spring SLF4J style for OTEL as well
          const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');
          const levelName = level === 30 ? 'INFO' : 
                          level === 40 ? 'WARN' : 
                          level === 50 ? 'ERROR' : 
                          level === 20 ? 'DEBUG' : 'INFO';
          
          let formattedMessage = `${levelName} [${timestamp}] `${process.env.OTEL_SERVICE_NAME}` - ${message}`;
          
          // Add attributes to the formatted message if present
          if (Object.keys(attributes).length > 0) {
            const attrStr = Object.entries(attributes)
              .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
              .join(', ');
            formattedMessage += ` [${attrStr}]`;
          }
          
          // Send formatted message to OpenTelemetry
          sendLogToOtel(formattedMessage, level, attributes);
        } catch (error) {
          // Only log error once to avoid recursion
          if (!globalThis.__PINO_OTEL_ERROR_LOGGED__) {
            console.log("Error processing log for OTEL:", error);
            globalThis.__PINO_OTEL_ERROR_LOGGED__ = true;
          }
        }
      }
      
      // Call the original method
      return method.apply(this, inputArgs);
    }
  }
});

// Retry connection to OTEL every few seconds until successful
if (typeof window === 'undefined') {
  const retryConnection = () => {
    if (!otelInitialized) {
      getLogProcessor();
      if (!otelInitialized) {
        setTimeout(retryConnection, 2000);
      }
    }
  };
  
  // Start retry after a delay to let OTEL initialize
  setTimeout(retryConnection, 1000);
}

export default logger;
```

## 5. Add System and Application Metrics

This setup uses a combination of files to collect metrics from both the Node.js server environment and the Edge Runtime.

#### System Metrics (Node.js)

Create `src/lib/system-metrics.ts` to collect detailed system metrics.

**src/lib/system-metrics.ts**
```typescript
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
const meter = metrics.getMeter(`${process.env.OTEL_SERVICE_NAME}-system`, "1.0.0");

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
let eventLoopLag = 0;
let eventLoopStart: [number, number] | undefined;
if (process?.hrtime) {
    eventLoopStart = process.hrtime();
}


const measureEventLoopLag = () => {
    if(!eventLoopStart) return;
  const delta = process.hrtime(eventLoopStart);
  const nanosec = delta[0] * 1e9 + delta[1];
  const millisec = nanosec / 1e6;
  eventLoopLag = Math.max(0, millisec - 1); // Subtract 1ms as baseline
  eventLoopStart = process.hrtime();
};

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
  gcStats: { count: 0 },
  eventLoopLag,
  collectCustomMetrics,
};

export default systemMetricsExport;
```

#### Application Metrics

Create `src/lib/metrics-collector.ts` to define and export functions for tracking application-specific and HTTP metrics.

**src/lib/metrics-collector.ts**
```typescript
import { metrics } from "@opentelemetry/api";

// Create a meter for this service
const meter = metrics.getMeter(`${process.env.OTEL_SERVICE_NAME}`, "1.0.0");

// Create OpenTelemetry metrics instruments
const systemMetrics = {
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

let requestsInFlight = 0;

// Export functions for HTTP and application metrics
export function incrementHttpRequests(method: string, path: string, status: string) {
  systemMetrics.httpRequestsTotal.add(1, { 
    job: `${process.env.OTEL_SERVICE_NAME}`, 
    method, 
    path, 
    status 
  });
}

export function observeHttpDuration(method: string, path: string, status: string, duration: number) {
  systemMetrics.httpRequestDuration.record(duration, { 
    job: `${process.env.OTEL_SERVICE_NAME}`, 
    method, 
    path, 
    status 
  });
}

export function setHttpInFlight(count: number) {
  const change = count - requestsInFlight;
  if (change !== 0) {
    systemMetrics.httpRequestsInFlight.add(change, { job: `${process.env.OTEL_SERVICE_NAME}` });
    requestsInFlight = count;
  }
}

export function incrementPageRenders(page: string, status: string) {
  systemMetrics.pageRendersTotal.add(1, { 
    job: `${process.env.OTEL_SERVICE_NAME}`, 
    page, 
    status 
  });
}

export function incrementDataFetch(operation: string) {
  systemMetrics.dataFetchTotal.add(1, { 
    job: `${process.env.OTEL_SERVICE_NAME}`, 
    operation 
  });
}

export function observeDataFetchDuration(operation: string, status: string, duration: number) {
  systemMetrics.dataFetchDuration.record(duration, { 
    job: `${process.env.OTEL_SERVICE_NAME}`, 
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
    job: `${process.env.OTEL_SERVICE_NAME}`,
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
    lines.push(`# Service: ${process.env.OTEL_SERVICE_NAME}`);
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
```

#### Edge Runtime Metrics

Create `src/lib/edge-metrics.ts` for middleware running in the Edge Runtime.

**src/lib/edge-metrics.ts**
```typescript
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
```

## 6. Middleware for HTTP Metrics

Create `src/middleware.ts` to automatically track all incoming HTTP requests.

**src/middleware.ts**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { 
  incrementHttpRequests, 
  observeHttpDuration, 
  setHttpInFlight,
  normalizePath
} from "./lib/edge-metrics";

// Simple console logging for middleware (Edge Runtime compatible) - Spring SLF4J style
function logRequest(method: string, path: string, status: number, duration: number) {
  const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');
  const level = status >= 400 ? 'ERROR' : status >= 300 ? 'WARN' : 'INFO';
  
  // Spring SLF4J style: LEVEL [timestamp] logger-name - message
  const formattedMessage = `${level} [${timestamp}] `${process.env.OTEL_SERVICE_NAME}`.middleware - ${method} ${path} completed with status ${status} in ${duration}ms`;
  console.log(formattedMessage);
  
  // Also send to OTEL collector if possible (create structured log manually for middleware)
  if (typeof fetch !== 'undefined' && process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT + '/v1/logs';
    const now = Date.now();
    const timeUnixNano = now * 1000000;
    
    const severityNumber = status >= 400 ? 50 : status >= 300 ? 40 : 30; // ERROR : WARN : INFO
    
    const otlpPayload = {
      resourceLogs: [{
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: process.env.OTEL_SERVICE_NAME } },
            { key: 'service.version', value: { stringValue: process.env.OTEL_SERVICE_VERSION} },
            { key: 'telemetry.sdk.name', value: { stringValue: 'opentelemetry' } },
            { key: 'telemetry.sdk.language', value: { stringValue: 'nodejs' } }
          ]
        },
        scopeLogs: [{
          scope: { name: `${process.env.OTEL_SERVICE_NAME}-middleware`, version: '1.0.0' },
          logRecords: [{
            timeUnixNano: timeUnixNano.toString(),
            observedTimeUnixNano: timeUnixNano.toString(),
            severityNumber: severityNumber,
            severityText: level,
            body: { stringValue: formattedMessage },
            attributes: [
              { key: 'log.source', value: { stringValue: 'middleware' } },
              { key: 'http.method', value: { stringValue: method } },
              { key: 'http.path', value: { stringValue: path } },
              { key: 'http.status', value: { stringValue: status.toString() } },
              { key: 'http.duration', value: { stringValue: `${duration}ms` } }
            ]
          }]
        }]
      }]
    };
    
    // Send asynchronously without blocking
    fetch(otlpEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(otlpPayload)
    }).catch(() => {
      // Silently ignore errors to avoid affecting middleware performance
    });
  }
}

let requestsInFlight = 0;

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  
  // Increment in-flight requests
  requestsInFlight++;
  setHttpInFlight(requestsInFlight);
  
  // Continue with the request
  const response = NextResponse.next();
  
  // Track metrics after response (in a non-blocking way)
  const endTime = Date.now();
  
  // Use setTimeout to avoid blocking the response
  setTimeout(() => {
    const duration = endTime - startTime;
    const method = request.method;
    const path = normalizePath(request.nextUrl.pathname);
    const status = response.status.toString();
    
    // Log the request
    logRequest(method, path, parseInt(status), duration);
    
    // Record metrics
    incrementHttpRequests(method, path, status);
    observeHttpDuration(method, path, status, duration);
    
    // Decrement in-flight requests
    requestsInFlight--;
    setHttpInFlight(requestsInFlight);
  }, 0);
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

## 7. How to Use in Your Application

To add logging to any server-side component (pages, API routes, etc.), simply import the logger and use it.

**Example: src/app/some-page/page.tsx**
```tsx
import logger from '@/lib/logger';
import { incrementPageRenders } from '@/lib/metrics-collector';

export default async function SomePage() {
  logger.info("Rendering SomePage", { page: "some-page" });
  incrementPageRenders("some-page", "success");

  // Your page logic here
  
  return <div>Hello from SomePage!</div>;
}
```

This setup provides a complete, robust, and configurable observability solution for your Next.js application, giving you deep insights into its performance and behavior.
