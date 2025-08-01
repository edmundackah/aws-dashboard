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
                { key: 'service.name', value: { stringValue: process.env.OTEL_SERVICE_NAME || 'aws-dashboard' } },
                { key: 'service.version', value: { stringValue: process.env.OTEL_SERVICE_VERSION || '1.0.0' } },
                { key: 'telemetry.sdk.name', value: { stringValue: 'opentelemetry' } },
                { key: 'telemetry.sdk.language', value: { stringValue: 'nodejs' } }
              ]
            },
            scopeLogs: [
              {
                scope: {
                  name: 'aws-dashboard-logger',
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
                      'service.name': process.env.OTEL_SERVICE_NAME || 'aws-dashboard',
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
  
  const serviceName = process.env.OTEL_SERVICE_NAME || 'aws-dashboard';
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
              
              let formattedMessage = `${levelName} [${timestamp}] aws-dashboard - ${message}`;
              
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