// Debug script for OpenTelemetry logging
require('dotenv').config({ path: '.env.local' });

console.log('=== OpenTelemetry Logging Debug ===');
console.log('OTEL Endpoint:', process.env.OTEL_EXPORTER_OTLP_ENDPOINT);
console.log('Node.js Version:', process.version);
console.log('Process ID:', process.pid);

// Initialize OpenTelemetry with debug output
process.env.OTEL_LOG_LEVEL = 'debug';
console.log('\nInitializing OpenTelemetry...');

try {
  require('./instrumentation').register();
  console.log('✓ OpenTelemetry SDK initialized');
} catch (error) {
  console.error('✗ Failed to initialize OpenTelemetry:', error);
  process.exit(1);
}

// Test the OTEL collector endpoint
setTimeout(async () => {
  console.log('\n=== Testing OTEL Collector Connection ===');
  
  try {
    const response = await fetch(process.env.OTEL_EXPORTER_OTLP_ENDPOINT);
    console.log('✓ OTEL Collector reachable, status:', response.status);
  } catch (error) {
    console.log('✗ OTEL Collector connection failed:', error.message);
    console.log('Make sure your OTEL collector is running on:', process.env.OTEL_EXPORTER_OTLP_ENDPOINT);
  }
  
  console.log('\n=== Testing Log Export ===');
  
  const logger = require('./src/lib/logger').default;
  
  // Test with detailed monitoring
  console.log('Sending test logs...');
  
  logger.info('DEBUG: Test log message for OTEL collector verification', {
    debug: true,
    timestamp: new Date().toISOString(),
    service: 'aws-dashboard',
    test_id: 'debug-001',
    endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT
  });
  
  console.log('✓ Test log sent through Pino -> OpenTelemetry');
  console.log('\nWaiting for log export...');
  
  setTimeout(() => {
    console.log('\n=== Debug Complete ===');
    console.log('If logs are not appearing in your collector, check:');
    console.log('1. OTEL collector is running and accessible');
    console.log('2. Collector configuration accepts OTLP logs on /v1/logs');
    console.log('3. Collector logs for any error messages');
    console.log('4. Network connectivity between app and collector');
    
    process.exit(0);
  }, 8000);
}, 2000); 