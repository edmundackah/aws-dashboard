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
  const formattedMessage = `${level} [${timestamp}] aws-dashboard.middleware - ${method} ${path} completed with status ${status} in ${duration}ms`;
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
            { key: 'service.name', value: { stringValue: process.env.OTEL_SERVICE_NAME || 'aws-dashboard-edge' } },
            { key: 'service.version', value: { stringValue: process.env.OTEL_SERVICE_VERSION || '1.0.0' } },
            { key: 'telemetry.sdk.name', value: { stringValue: 'opentelemetry' } },
            { key: 'telemetry.sdk.language', value: { stringValue: 'nodejs' } }
          ]
        },
        scopeLogs: [{
          scope: { name: 'aws-dashboard-middleware', version: '1.0.0' },
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