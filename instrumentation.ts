// instrumentation.ts
// Only initialize OpenTelemetry in Node.js runtime, not Edge Runtime
import {SemanticResourceAttributes} from "@opentelemetry/semantic-conventions";

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
      const { logs } = require("@opentelemetry/api");

      const { Resource } = require("@opentelemetry/resources");
      const { SemanticResourceAttributes } = require("@opentelemetry/semantic-conventions");

      // Initialize system metrics
      require("./src/lib/system-metrics");

      const resource = new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'aws-dashboard',
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
        name: "aws-dashboard-host-metrics",
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