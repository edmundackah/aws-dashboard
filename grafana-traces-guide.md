# Application Traces Dashboard Guide

## Overview
This dashboard visualizes distributed traces from your application collected through OpenTelemetry and Grafana Faro. It provides insights into request flows, latencies, errors, and service dependencies.

## Prerequisites

### 1. Tempo (Trace Storage)
You need Tempo or a compatible tracing backend to store traces:
```yaml
# docker-compose.yml example
tempo:
  image: grafana/tempo:latest
  ports:
    - "3200:3200"   # Tempo query frontend
    - "4317:4317"   # OpenTelemetry gRPC
    - "4318:4318"   # OpenTelemetry HTTP
  volumes:
    - ./tempo-config.yaml:/etc/tempo/config.yaml
  command: ["-config.file=/etc/tempo/config.yaml"]
```

### 2. Span Metrics Generation
Configure Tempo to generate metrics from spans:
```yaml
# tempo-config.yaml
metrics_generator:
  registry:
    external_labels:
      source: tempo
      cluster: docker-compose
  storage:
    path: /var/tempo/generator/wal
    remote_write:
      - url: http://prometheus:9090/api/v1/write
        send_exemplars: true

  processor:
    service_graphs:
      histogram_buckets: [.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10]
    span_metrics:
      histogram_buckets: [.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10]
      dimensions:
        - name: http.method
        - name: http.status_code
        - name: http.target
```

### 3. Configure Faro to Send Traces
Your current Faro setup is already sending traces. The trace includes session IDs which is excellent for correlation.

## Dashboard Components

### Row 1: Overview Metrics
1. **Request Rate by Method**: Shows HTTP methods (GET, POST, etc.) request rates
2. **Latency Percentiles**: p50, p95, p99 response times

### Row 2: Trace Search
- **Interactive trace search table**
- Filter by service, HTTP method, status codes
- Click on traces to view detailed timeline

### Row 3: Key Performance Indicators
- **Success Rate**: Percentage of successful requests (non 4xx/5xx)
- **Average Latency**: Mean response time across all requests
- **Requests/sec**: Total throughput
- **Active Operations**: Number of unique endpoints being called

### Row 4: Operation Analysis
- **Top Operations by Volume**: Bar chart of most called endpoints
- **Operations with Errors**: Table showing error rates by operation

### Row 5: Latency Distribution
- **Histogram showing response time distribution**
- Helps identify if you have consistent performance or long tail latencies

### Row 6: Service Map
- **Visual dependency graph** showing how services connect
- Useful when you have multiple microservices

## Key Metrics Explained

### Span Metrics
All metrics are generated from trace spans with prefix `traces_spanmetrics_`:

- `traces_spanmetrics_calls_total`: Counter of requests
- `traces_spanmetrics_latency_bucket`: Histogram of response times
- `traces_spanmetrics_latency_sum/count`: For calculating averages

### Important Labels
- `service`: Service name (from trace resource)
- `span_name`: Operation name (usually HTTP endpoint)
- `http_method`: GET, POST, PUT, DELETE, etc.
- `http_status_code`: Response status code
- `status_code`: Span status (OK, ERROR)

## Using the Dashboard

### 1. Finding Slow Requests
- Check the Latency Percentiles chart for spikes
- Use Trace Search with filters to find specific slow traces
- Click on a trace to see the waterfall view

### 2. Investigating Errors
- Monitor the Success Rate gauge
- Check "Operations with Errors" table
- Filter traces by status code 4xx or 5xx

### 3. Performance Patterns
- Look for patterns in "Request Rate by Method"
- Check if certain operations dominate in "Top Operations"
- Use Latency Distribution to understand response time spread

### 4. Trace Search Queries
The dashboard uses TraceQL for searching:
```
{resource.service.name="aws-dashboard" && span.http.status_code>=400}
```

Common queries:
- Find errors: `{span.http.status_code>=400}`
- Slow requests: `{duration>1s}`
- Specific endpoint: `{span.http.target="/api/users"}`
- By session: `{span.session_id="EoGxufFMX8"}`

## Correlating with Other Dashboards

### With Web Vitals Dashboard
Since traces include session IDs, you can:
1. Find a slow page load in Web Vitals
2. Get the time range and page
3. Search traces for that session/time to see backend calls

### With Sessions Dashboard
1. Identify problematic sessions
2. Use session ID to find all traces for that user
3. Reconstruct the user journey with backend details

## Example Trace Attributes

From your example trace:
```json
{
  "session.id": "EoGxufFMX8",
  "http.method": "GET",
  "http.url": "http://localhost:3002/microservices?_rsc=1jrfo",
  "http.status_code": 200,
  "http.response_content_length": 2261,
  "browser.platform": "Mac OS 10.15.7",
  "service.name": "aws-dashboard"
}
```

## Setting Up Alerts

### High Error Rate
```promql
100 * (sum(rate(traces_spanmetrics_calls_total{service="aws-dashboard", status_code=~"5.."}[5m])) 
/ sum(rate(traces_spanmetrics_calls_total{service="aws-dashboard"}[5m]))) > 1
```

### High Latency
```promql
histogram_quantile(0.95, sum(rate(traces_spanmetrics_latency_bucket{service="aws-dashboard"}[5m])) by (le)) > 1000
```

### Traffic Drop
```promql
sum(rate(traces_spanmetrics_calls_total{service="aws-dashboard"}[5m])) < 10
```

## Best Practices

1. **Sampling**: For high-traffic apps, implement trace sampling
2. **Context Propagation**: Ensure trace context flows through all services
3. **Meaningful Span Names**: Use descriptive operation names
4. **Error Recording**: Always set span status on errors
5. **Custom Attributes**: Add business context (user ID, tenant, feature flags)

## Troubleshooting

### No Data in Dashboard
1. Verify Tempo is receiving traces: `curl http://tempo:3200/api/echo`
2. Check if span metrics are generated: Look for `traces_spanmetrics_*` in Prometheus
3. Verify Faro is sending traces: Check browser DevTools Network tab

### Missing Service Map
- Service map requires multiple services or at least client/server spans
- Ensure trace propagation is working between services

### High Cardinality Issues
If you see warnings about too many series:
- Reduce dimensions in span_metrics configuration
- Implement sampling
- Use recording rules for common queries

## Next Steps

1. **Add Custom Attributes**: Enhance traces with business context
2. **Implement SLOs**: Define latency and error rate objectives
3. **Trace Sampling**: Configure head-based or tail-based sampling
4. **Exemplars**: Link metrics to example traces
5. **Log Correlation**: Connect traces with application logs
