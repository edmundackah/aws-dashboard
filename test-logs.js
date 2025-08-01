// Test script to verify OpenTelemetry logging
require('dotenv').config({ path: '.env.local' });

console.log('Starting OpenTelemetry logging test...');
console.log('OTEL Endpoint:', process.env.OTEL_EXPORTER_OTLP_ENDPOINT);

// Initialize OpenTelemetry manually (since we can't require .ts directly)
try {
  // Set up OTEL similar to instrumentation.ts
  process.env.OTEL_LOG_LEVEL = 'debug';
  
  const { NodeSDK } = require("@opentelemetry/sdk-node");
  const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-http");
  const { OTLPMetricExporter } = require("@opentelemetry/exporter-metrics-otlp-http");
  const { OTLPLogExporter } = require("@opentelemetry/exporter-logs-otlp-http");
  const { BatchSpanProcessor } = require("@opentelemetry/sdk-trace-node");
  const { PeriodicExportingMetricReader } = require("@opentelemetry/sdk-metrics");
  const { BatchLogRecordProcessor } = require("@opentelemetry/sdk-logs");

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
    serviceName: "aws-dashboard",
    spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT + '/v1/traces',
    })),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT + '/v1/metrics',
      }),
      exportIntervalMillis: 5000,
    }),
    logRecordProcessor: logProcessor,
  });

  sdk.start();
  
  // Store SDK instance globally for logger access
  globalThis.__OTEL_SDK_INSTANCE__ = sdk;
  
  console.log('✓ OpenTelemetry SDK initialized manually');
} catch (error) {
  console.error('✗ Failed to initialize OpenTelemetry:', error);
  process.exit(1);
}

// Wait for OTEL to initialize then test logging
setTimeout(() => {
  console.log('Testing logger...');
  
  const logger = require('./src/lib/logger').default;
  
  // Test different log levels
  logger.info('Test info log - should appear in OTEL collector', {
    test: 'logging',
    level: 'info',
    timestamp: new Date().toISOString()
  });
  
  logger.warn('Test warning log - should appear in OTEL collector', {
    test: 'logging',
    level: 'warn',
    component: 'test-script'
  });
  
  logger.error('Test error log - should appear in OTEL collector', {
    test: 'logging',
    level: 'error',
    errorCode: 'TEST_ERROR'
  });
  
  console.log('Logs sent! Check your OTEL collector for these test messages.');
  
  // Wait a bit more for logs to be processed and exported
  setTimeout(() => {
    console.log('Test complete. Logs should now be visible in your collector.');
    process.exit(0);
  }, 5000);
}, 3000); 