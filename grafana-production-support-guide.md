# Production Support Dashboard Guide

## Overview
This unified dashboard provides a comprehensive view of any Faro-instrumented application, combining real-time metrics, distributed traces, Core Web Vitals, session tracking, and application logs. It's designed for production support teams to quickly identify and troubleshoot issues while monitoring user experience.

**Note**: This dashboard uses Faro's session tracking metrics (`faro_session_*`) which include session IDs and page paths. Make sure your Alloy configuration includes session metric processing as documented in stats.MD.

## Dashboard Layout

### Row 1: Health & Key Metrics
A comprehensive overview of application health, errors, active sessions, and performance.

### Row 2: Core Web Vitals
All essential frontend performance metrics at a glance.

### Row 3: Traffic & Session Activity
Request patterns and session page view visualization.

### Row 4: Web Vitals Trends
Historical view of frontend performance over time.

### Row 5: Session Details
Active sessions table and session path analysis.

### Row 6: Trace Analysis
Interactive trace search for backend investigation.

### Row 7: Error Analysis
Detailed error breakdowns by endpoint and type.

### Row 8: Application Logs
Real-time log streaming with search capabilities.

## Dashboard Sections

### 1. Health & Key Metrics (Top Row)

#### Application Health Score (Gauge)
- **What it shows**: Overall health based on success rate (100% - error rate)
- **Thresholds**: 
  - Green: > 95% (healthy)
  - Orange: 90-95% (degraded)
  - Red: < 90% (critical)
- **Action**: If < 95%, check error panels below

#### Error Rate %
- **Formula**: (Errors / Total Requests) × 100
- **Color coding**:
  - Green: < 1%
  - Yellow: 1-5%
  - Red: > 5%
- **Drill down**: Check "Errors by Status Code" panel

#### Active Sessions
- **What**: Number of unique sessions with activity in last 30 minutes
- **Use case**: Real-time user activity monitoring
- **Correlate with**: Request rate for per-session metrics
- **Query**: Uses `faro_session_events_total` metric

#### Average Latency
- **Source**: Page load metrics from navigation events
- **Thresholds**:
  - Green: < 300ms
  - Yellow: 300-1000ms
  - Red: > 1000ms

#### Requests/sec
- **What**: Total HTTP requests per second
- **Use case**: Traffic monitoring and capacity planning
- **Alert on**: Sudden drops or spikes

### 2. Core Web Vitals (Stat Panels)

#### LCP (Largest Contentful Paint)
- **Target**: < 2.5s (green), 2.5-4s (yellow), > 4s (red)
- **Impact**: Loading performance
- **Action**: Optimize images, server response time

#### FCP (First Contentful Paint)
- **Target**: < 1.8s (green), 1.8-3s (yellow), > 3s (red)
- **Impact**: Perceived load speed
- **Action**: Reduce render-blocking resources

#### CLS (Cumulative Layout Shift)
- **Target**: < 0.1 (green), 0.1-0.25 (yellow), > 0.25 (red)
- **Impact**: Visual stability
- **Action**: Set size attributes on images/videos

#### INP (Interaction to Next Paint)
- **Target**: < 200ms (green), 200-500ms (yellow), > 500ms (red)
- **Impact**: Responsiveness to user input
- **Action**: Optimize JavaScript execution

### 3. Traffic & Session Monitoring

#### Request Rate (Time Series)
- **Total RPS**: All HTTP requests from Faro metrics
- **Use case**: Detect traffic anomalies and patterns

#### Session Page Views
- **What**: Time series showing session page views over time by page path
- **Use case**: Understand user navigation patterns
- **Insight**: Identify popular paths and user flows
- **Query**: Uses `faro_session_pageviews_total` metric

#### Page Load Time Percentiles
- **p50**: Median page load time
- **p95**: 95th percentile
- **p99**: 99th percentile
- **Target**: p95 < 2 seconds for good UX
- **Note**: Measured from navigation timing events

### 4. Web Vitals Trends
- **Purpose**: Track Core Web Vitals over time
- **Metrics**: LCP, FCP, CLS, INP with threshold lines
- **Use case**: Identify performance regressions
- **Action**: Correlate with deployments or traffic changes

### 5. Session Tracking

#### Active Sessions Table
- **Columns**:
  - Session ID: Unique session identifier
  - Page Views: Number of pages visited in session
  - Total Events: All events in session
  - Errors: Total errors (color-coded)
  - Error Rate: Percentage of errors (color-coded)
- **Sorting**: By total events to find most active sessions
- **Use case**: Investigate specific user sessions
- **Time window**: Last 30 minutes

#### Session Path Analysis Table
- **Columns**:
  - Page Path: URL path (without query/fragment)
  - Unique Sessions: Count of sessions visiting this path
  - Total Views: Total page views across all sessions
  - Views per Session: Average views per session
- **Sorting**: By unique sessions to find most popular paths
- **Use case**: Understand common user journeys
- **Query**: Uses `faro_session_pageviews_total` with page_path label

### 6. Trace Analysis

#### Recent Traces (Interactive Table)
- **Purpose**: Find and analyze specific requests
- **Filters**:
  - Status code range (use variables)
  - Minimum duration (find slow requests)
  - Service name
- **Workflow**:
  1. Set filters for problematic requests
  2. Click trace ID to view waterfall
  3. Analyze span details and timing

### 7. Error Analysis

#### Errors by Status Code (Time Series)
- **Breakdown**: Stacked view of all error types
- **Common patterns**:
  - 4xx spikes: Client issues, validation failures
  - 5xx spikes: Server errors, backend issues
  - 0 (network): Connectivity problems, timeouts

#### Top Error Endpoints (Table)
- **Shows**: Routes with highest error rates
- **Columns**:
  - Endpoint: The route template
  - Status Code: Color-coded (4xx=yellow, 5xx=red, 0=dark red)
  - Error Rate: Requests per second
- **Action**: Focus on endpoints with highest rates

#### Slowest Routes (Table)
- **Shows**: Routes with highest p95 page load times
- **Columns**:
  - Route: The page route template
  - p95 Load Time: 95th percentile load time
  - Traffic: Number of page views
  - Avg Load Time: Average load time
- **Use cases**:
  - Identify slow-loading pages
  - Prioritize optimization efforts
- **Threshold colors**:
  - Green: < 2s
  - Yellow: 2-5s
  - Red: > 5s

### 8. Application Logs

#### Live Log Stream
- **Features**:
  - Real-time log tailing
  - Search functionality (`$search` variable)
  - Level filtering (`$log_level` variable)
- **Best practices**:
  - Start with error level for issues
  - Use search for specific error messages
  - Correlate with trace IDs when available

## Common Troubleshooting Scenarios

### Scenario 1: High Error Rate Alert

1. **Check Health Score**: Confirm degradation
2. **View "Errors by Status Code"**: Identify error type
3. **Check "Top Error Endpoints"**: Find affected routes
4. **Search traces**: Filter by error status codes
5. **Check logs**: Search for error messages
6. **Correlate timing**: When did errors start?

### Scenario 2: Performance Degradation

1. **Check Page Load Time Percentiles**: Confirm slowdown
2. **View "Slowest Routes"**: Identify bottleneck pages
3. **Filter traces**: Set `min_duration` to find slow backend requests
4. **Check Core Web Vitals**: Frontend performance details
5. **Analyze patterns**: Specific routes or global issue?

### Scenario 3: User Complaints

1. **Check Active Sessions Table**: Find user's session ID
2. **Review Session Path Analysis**: See user's journey
3. **Check error rate**: Look for high error sessions
4. **Search logs**: Use session ID for detailed events
5. **View traces**: Filter by time range
6. **Analyze Core Web Vitals**: Check performance for visited pages

### Scenario 4: Traffic Anomalies

1. **View Request Rate**: Confirm spike/drop
2. **Check Active Sessions**: Real users or bots?
3. **Check Error Rate**: Correlate with failures
4. **View Top Error Endpoints**: DDoS patterns?
5. **Check traces**: Analyze request patterns

## Data Sources Configuration

The dashboard uses three separate data sources for different telemetry types:

### Prometheus (`${datasource}`)
Used for all metrics panels:
- Application health metrics
- Web Vitals (LCP, FCP, CLS, INP)
- Request rates and error counts
- Session metrics
- All histogram data

### Tempo (`${traces_datasource}`)
Used for distributed tracing:
- Recent traces table
- Trace search with TraceQL
- Service dependency mapping

### Loki (`${loki_datasource}`)
Used for logs:
- Application logs panel
- Log search and filtering
- Session event correlation

**Important**: Ensure all three data sources are properly configured in Grafana before importing the dashboard.

## Dashboard Variables

| Variable | Purpose | Usage |
|----------|---------|--------|
| `$app` | Application selector | Choose which app to monitor |
| `$min_status` | Trace filter | Set to 400 for errors only |
| `$max_status` | Trace filter | Set to 499 for client errors |
| `$min_duration` | Trace filter | e.g., "1s" for slow requests |
| `$search` | Log search | Free text search |
| `$log_level` | Log filter | e.g., "error" or "info\|warn\|error" |

## Setting Up Alerts

### Critical Alerts

```promql
# Application health below 90%
100 * (1 - (sum(rate(loki_process_custom_faro_http_errors_total{app_name="$app"}[5m])) 
/ sum(rate(loki_process_custom_faro_http_requests_total{app_name="$app"}[5m])))) < 90

# Error rate above 5%
100 * (sum(rate(loki_process_custom_faro_http_errors_total{app_name="$app"}[5m])) 
/ sum(rate(loki_process_custom_faro_http_requests_total{app_name="$app"}[5m]))) > 5

# p95 latency above 2 seconds
histogram_quantile(0.95, sum(rate(traces_spanmetrics_latency_bucket{service="$app"}[5m])) by (le)) > 2000

# No traffic (possible outage)
sum(rate(loki_process_custom_faro_http_requests_total{app_name="$app"}[5m])) == 0
```

### Warning Alerts

```promql
# Degraded Web Vitals
100 * (sum(rate(loki_process_custom_faro_web_vitals_lcp_milliseconds_bucket{app_name="$app", le="2500"}[5m])) 
/ sum(rate(loki_process_custom_faro_web_vitals_lcp_milliseconds_count{app_name="$app"}[5m]))) < 75

# Increased error rate
100 * (sum(rate(loki_process_custom_faro_http_errors_total{app_name="$app"}[5m])) 
/ sum(rate(loki_process_custom_faro_http_requests_total{app_name="$app"}[5m]))) > 2
```

## Best Practices

### 1. Regular Health Checks
- Monitor health score throughout the day
- Set up alerts for degradation
- Review top errors weekly

### 2. Proactive Monitoring
- Watch for gradual performance degradation
- Monitor error patterns before they escalate
- Track Web Vitals trends

### 3. Incident Response
- Use trace search to find specific issues
- Correlate logs with traces using trace IDs
- Document recurring patterns

### 4. Performance Optimization
- Focus on operations in "Slowest Operations"
- Improve endpoints with poor Web Vitals
- Track improvement after deployments

## Integration Points

### With Tempo (Traces)
- Click trace IDs to see waterfall view
- Use TraceQL for complex queries
- Link from logs to traces via trace ID

### With Loki (Logs)
- Search across all application logs
- Filter by level, time, or content
- Correlate with metrics and traces

### With Prometheus (Metrics)
- All panels use Prometheus queries
- Can add custom metrics as needed
- Use recording rules for complex queries

## Quick Reference

### Status Code Meanings
- **0**: Network error, timeout
- **4xx**: Client errors (400=bad request, 404=not found, 403=forbidden)
- **5xx**: Server errors (500=internal error, 502=bad gateway, 503=unavailable)

### Performance Targets
- **Request Rate**: Baseline varies by app
- **Error Rate**: < 1% ideal, < 5% acceptable
- **p95 Latency**: < 1 second
- **LCP**: < 2.5 seconds
- **Active Sessions**: Depends on app scale

### Time Windows
- **Real-time**: Last 5 minutes for current state
- **Trending**: Last 1 hour for patterns
- **Historical**: Last 24 hours for comparisons

This dashboard provides everything needed for effective production support, combining infrastructure metrics with user experience data for complete observability.
