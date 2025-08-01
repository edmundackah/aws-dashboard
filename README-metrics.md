# AWS Dashboard Metrics

This document describes the metrics exposed by the AWS Dashboard application, similar to Spring Boot's `/actuator/prometheus` endpoint.

## Metrics Endpoint

The application exposes metrics in Prometheus format at:

```
GET /api/metrics
```

This endpoint returns metrics in Prometheus text format, suitable for scraping by Prometheus or viewing directly.

## Available Metrics

### System Metrics

These metrics provide information about the system running the application:

| Metric Name | Type | Description | Labels |
|-------------|------|-------------|--------|
| `system_cpu_usage` | Gauge | System CPU usage percentage | `job` |
| `system_memory_usage_bytes` | Gauge | System memory usage in bytes | `job`, `type` |
| `system_load_average` | Gauge | System load average | `job`, `period` |

**Memory Types:**
- `total` - Total system memory
- `free` - Free system memory  
- `used` - Used system memory

**Load Average Periods:**
- `1m` - 1 minute load average
- `5m` - 5 minute load average
- `15m` - 15 minute load average

### Node.js Runtime Metrics

These metrics provide insights into the Node.js process:

| Metric Name | Type | Description | Labels |
|-------------|------|-------------|--------|
| `nodejs_heap_usage_bytes` | Gauge | Node.js heap usage in bytes | `job`, `type` |
| `nodejs_event_loop_lag_ms` | Gauge | Event loop lag in milliseconds | `job` |
| `nodejs_gc_runs_total` | Counter | Total garbage collection runs | `job` |
| `process_uptime_seconds` | Gauge | Process uptime in seconds | `job` |
| `nodejs_active_handles` | Gauge | Active handles in Node.js | `job` |
| `nodejs_active_requests` | Gauge | Active requests in Node.js | `job` |

**Heap Types:**
- `used` - Heap memory currently used
- `total` - Total heap memory allocated
- `external` - External memory usage
- `rss` - Resident Set Size
- `array_buffers` - Memory used by ArrayBuffers

### HTTP Metrics

These metrics track HTTP request performance:

| Metric Name | Type | Description | Labels |
|-------------|------|-------------|--------|
| `http_requests_total` | Counter | Total HTTP requests | `job`, `method`, `path`, `status` |
| `http_request_duration_ms` | Histogram | HTTP request duration in ms | `job`, `method`, `path`, `status` |
| `http_requests_in_flight` | Gauge | Current in-flight requests | `job` |

**Path Normalization:**
- UUIDs are replaced with `{uuid}`
- Numeric IDs are replaced with `{id}`
- API routes are grouped under `/api/*`
- Static files are grouped under `/_next/*`

### Application Metrics

These metrics track application-specific operations:

| Metric Name | Type | Description | Labels |
|-------------|------|-------------|--------|
| `page_renders_total` | Counter | Total page renders | `job`, `page`, `status` |
| `data_fetch_total` | Counter | Data fetch operations | `job`, `operation` |
| `data_fetch_duration_ms` | Histogram | Data fetch duration in ms | `job`, `operation`, `status` |
| `data_processing_duration_ms` | Histogram | Data processing duration in ms | `job`, `spa_count`, `microservice_count`, `team_count` |

**Page Types:**
- `overview` - Main dashboard page
- `spas` - Single Page Applications view
- `microservices` - Microservices view
- `teams` - Teams view

**Render/Operation Status:**
- `start` - Operation started
- `success` - Operation completed successfully
- `error` - Operation failed
- `no_data` - No data available

**Data Fetch Operations:**
- `fetch_start` - Fetch operation started
- `fetch_success` - Fetch completed successfully
- `fetch_error` - Fetch failed

### Application Info

| Metric Name | Type | Description | Labels |
|-------------|------|-------------|--------|
| `aws_dashboard_info` | Gauge | Application information | `job`, `version`, `service` |

This metric always has a value of `1` and provides metadata about the application.

## Histogram Buckets

Duration histograms use the following buckets:

**HTTP Request Duration:**
- 1ms, 5ms, 10ms, 25ms, 50ms, 100ms, 250ms, 500ms, 1s, 2.5s, 5s

**Data Fetch Duration:**
- 10ms, 50ms, 100ms, 250ms, 500ms, 1s, 2.5s, 5s, 10s

**Data Processing Duration:**
- 1ms, 5ms, 10ms, 25ms, 50ms, 100ms, 250ms, 500ms

## Example Queries

### Prometheus Queries

**Average CPU Usage:**
```promql
system_cpu_usage{job="aws-dashboard"}
```

**HTTP Request Rate:**
```promql
rate(http_requests_total{job="aws-dashboard"}[5m])
```

**95th Percentile Response Time:**
```promql
histogram_quantile(0.95, rate(http_request_duration_ms_bucket{job="aws-dashboard"}[5m]))
```

**Memory Usage:**
```promql
system_memory_usage_bytes{job="aws-dashboard", type="used"} / system_memory_usage_bytes{job="aws-dashboard", type="total"} * 100
```

**Page Render Rate by Page:**
```promql
rate(page_renders_total{job="aws-dashboard", status="success"}[5m])
```

## Grafana Dashboard

A complete Grafana dashboard configuration is available in `grafana-dashboard.json`. Import this dashboard to visualize all metrics with:

- System resource utilization
- Node.js runtime performance
- HTTP request metrics
- Application-specific metrics
- Performance trends and percentiles

## Integration with Monitoring

### Prometheus Configuration

Add the following to your Prometheus configuration:

```yaml
scrape_configs:
  - job_name: 'aws-dashboard'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 15s
```

### OpenTelemetry Collector

The application also sends metrics via OpenTelemetry to the configured OTLP endpoint. Configure your collector to receive metrics on the OTLP endpoint specified in your environment variables.

## Labels

All metrics include a `job="aws-dashboard"` label for easy filtering in Prometheus queries. Additional labels provide context-specific information for detailed analysis.

This metrics setup provides comprehensive observability similar to Spring Boot Actuator's metrics, enabling effective monitoring and alerting for your Next.js application. 