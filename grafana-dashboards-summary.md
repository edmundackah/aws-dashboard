# Grafana Dashboards for Faro Monitoring

## Created Dashboards

### 1. Web Vitals Performance Dashboard
**File**: `grafana-web-vitals-dashboard.json`
**Guide**: `grafana-web-vitals-guide.md`

**Purpose**: Monitor Core Web Vitals and performance metrics
- Real-time Core Web Vitals (LCP, FCP, CLS, INP, TTFB)
- Performance trends and distributions
- Browser-specific metrics
- Route-level performance analysis
- Error monitoring and network failures

**Key Features**:
- 14 comprehensive panels
- Color-coded thresholds based on Google standards
- Time series, stats, tables, and distribution charts
- Built-in filtering by application

### 2. User Sessions Dashboard
**File**: `grafana-sessions-dashboard.json`
**Guide**: `grafana-sessions-guide.md`

**Purpose**: Track user behavior and session patterns
- Session activity visualization (similar to Faro sessions view)
- Page navigation patterns
- Browser distribution
- Session-like metrics using available data
- Error patterns by page

**Key Features**:
- 11 panels focused on user behavior
- Sessions table with browser and performance data
- Activity heatmaps
- Multiple filtering options (app, page, browser)

### 3. Session Explorer Dashboard
**File**: `grafana-session-explorer-dashboard.json`
**Guide**: `grafana-session-explorer-guide.md`

**Purpose**: Detailed individual session tracking and analysis
- Real-time session monitoring with full details
- Individual session investigation capabilities
- Session error tracking and analysis
- Page flow and navigation patterns
- Browser and platform distribution

**Key Features**:
- 9 panels focused on session-level details
- Comprehensive sessions table with lifecycle tracking
- Session overview chart like native Faro UI
- Page flow analysis for user journeys
- Error rate tracking by session
- Direct session ID filtering

### 3. Application Traces Dashboard
**File**: `grafana-traces-dashboard.json`
**Guide**: `grafana-traces-guide.md`
**Setup**: `faro-traces-setup.md`

**Purpose**: Visualize distributed traces and backend performance
- Request rate and latency monitoring
- Interactive trace search
- Service dependency mapping
- Error analysis by operation
- Latency distribution histograms

**Key Features**:
- 11 panels for complete APM view
- Integration with Tempo for trace storage
- Automatic span metrics generation
- TraceQL search capabilities
- Service map visualization

### 4. E-commerce Analytics Dashboard
**File**: `grafana-ecommerce-dashboard.json`
**Guide**: `grafana-ecommerce-guide.md`

**Purpose**: Specialized dashboard for e-commerce applications
- Conversion funnel analysis
- Cart abandonment tracking
- Product performance metrics
- Checkout flow monitoring
- Revenue-impacting error tracking

**Key Features**:
- 12 panels focused on business metrics
- Real-time conversion rate tracking
- Product popularity analysis
- Customer journey visualization

### 5. Production Support Dashboard (Enhanced)
**File**: `grafana-production-support-dashboard.json`
**Guide**: `grafana-production-support-guide.md`

**Purpose**: Unified operational dashboard for any Faro app
- **Complete Web Vitals monitoring** (LCP, FCP, CLS, INP)
- **Full session tracking** with session IDs and paths
- Combined metrics and traces view
- Real-time health monitoring
- Error analysis and troubleshooting
- Performance bottleneck identification
- Live log streaming

**Key Features**:
- **20 panels** covering frontend, backend, and infrastructure
- **Core Web Vitals stat panels** with proper thresholds
- **Active sessions table** showing session metrics
- **Session path analysis** for user journey insights
- **Web Vitals trends** over time
- Interactive trace search with Tempo
- Integrated logs with Loki
- Works with any Faro-instrumented application

**Session Metrics Used**:
- `faro_session_events_total` - All events per session
- `faro_session_pageviews_total` - Page views per session
- `faro_session_errors_total` - Errors per session

### 6. Setup Guides
**Session Tracking**: `faro-session-tracking-setup.md`
**Traces Setup**: `faro-traces-setup.md`

**Purpose**: Detailed configuration instructions
- Faro SDK configuration
- Alloy configuration for logs and traces
- Tempo setup for trace storage
- Docker Compose examples
- Privacy and performance considerations

## Quick Start

1. **Import Dashboards**:
   ```bash
   # In Grafana UI
   Dashboards → Import → Upload JSON file
   ```

2. **Select Prometheus Datasource** when prompted

3. **Share Guides** with your UI engineering team

## Dashboard Variables

Both dashboards include:
- `$app`: Application selector
- `$datasource`: Prometheus datasource selector

Sessions dashboard also includes:
- `$page`: Multi-select page filter
- `$browser`: Multi-select browser filter

## Recommended Next Steps

1. **Set Up Alerts** based on the queries in the guides
2. **Enable Session Tracking** if you need true session analysis
3. **Create SLOs** based on Web Vitals thresholds
4. **Schedule Reviews** with UI team to analyze trends

## Observability Stack Architecture

```
┌─────────────┐
│  Browser    │
│ (Faro SDK)  │
└──────┬──────┘
       │ Sends: Logs, Metrics, Traces
       ▼
┌─────────────┐
│    Alloy    │ (Port 12347)
│ (Collector) │
└──────┬──────┘
       │ Routes to:
       ├─────────────┬─────────────┬
       ▼             ▼             ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│    Loki     │ │ Prometheus  │ │   Tempo     │
│   (Logs)    │ │  (Metrics)  │ │  (Traces)   │
└─────────────┘ └─────────────┘ └─────────────┘
       │             │             │
       └─────────────┴─────────────┘
                     ▼
              ┌─────────────┐
              │   Grafana   │
              │(Dashboards) │
              └─────────────┘
```

## Data Correlation

### Session ID Correlation
With session tracking enabled, you can correlate across all three data types:
- **Traces**: Include `session.id` attribute
- **Logs**: Include `session_id` label
- **Metrics**: Can be grouped by `session_id` (careful with cardinality)

### Example Correlation Flow
1. User reports slow checkout
2. Find session in Sessions Dashboard
3. Use session ID to find traces in Traces Dashboard
4. Check Web Vitals for that time period
5. Query logs for errors in that session

## Metrics Overview

Your current setup tracks:
- ✅ Page loads and navigation
- ✅ Core Web Vitals (LCP, FCP, CLS, INP, TTFB)
- ✅ HTTP performance (TTFB, duration)
- ✅ Error rates by status code
- ✅ Browser and page dimensions
- ✅ Distributed traces with OpenTelemetry
- ✅ Session IDs (visible in traces)
- ✅ Full session tracking in metrics (with `faro_session_*` metrics)
- ✅ Session path tracking (page_path label)
- ❌ User IDs (requires configuration)

## Complete Setup Commands

```bash
# 1. Start the observability stack
docker-compose up -d

# 2. Wait for services to be ready
sleep 30

# 3. Import all dashboards to Grafana
for dashboard in grafana-*.json; do
  curl -X POST http://localhost:3000/api/dashboards/db \
    -H "Content-Type: application/json" \
    -d @"$dashboard"
done

# 4. Verify data is flowing
curl http://localhost:12345/metrics | grep faro
curl http://localhost:9090/api/v1/query?query=up
curl http://localhost:3200/api/echo
```

## Dashboard Selection Guide

| Use Case | Recommended Dashboard | Key Features |
|----------|----------------------|--------------|
| Frontend Performance | Web Vitals | Core Web Vitals, browser metrics |
| User Behavior | Sessions | Navigation patterns, session tracking |
| API Performance | Traces | Distributed tracing, latency analysis |
| E-commerce Apps | E-commerce Analytics | Conversion funnel, revenue metrics |
| General Operations | Production Support | Unified view, logs + metrics + traces |

## Complete File List

### Dashboards (5)
- `grafana-web-vitals-dashboard.json` - Frontend performance monitoring
- `grafana-sessions-dashboard.json` - User session analytics  
- `grafana-traces-dashboard.json` - APM and distributed tracing
- `grafana-ecommerce-dashboard.json` - E-commerce specific metrics
- `grafana-production-support-dashboard.json` - Unified operational view

### Guides (5)
- `grafana-web-vitals-guide.md` - Web Vitals dashboard guide
- `grafana-sessions-guide.md` - Sessions dashboard guide
- `grafana-traces-guide.md` - Traces dashboard guide
- `grafana-ecommerce-guide.md` - E-commerce dashboard guide
- `grafana-production-support-guide.md` - Production support guide

### Setup Documentation (3)
- `faro-session-tracking-setup.md` - Enable session tracking
- `faro-traces-setup.md` - Configure distributed tracing
- `grafana-dashboards-summary.md` - This overview document

## Support

For questions about:
- **Metrics**: Refer to `stats.MD`
- **Web Vitals**: See `grafana-web-vitals-guide.md`
- **Sessions**: See `grafana-sessions-guide.md`
- **Traces**: See `grafana-traces-guide.md`
- **E-commerce**: See `grafana-ecommerce-guide.md`
- **Operations**: See `grafana-production-support-guide.md`
- **Session Setup**: See `faro-session-tracking-setup.md`
- **Traces Setup**: See `faro-traces-setup.md`
