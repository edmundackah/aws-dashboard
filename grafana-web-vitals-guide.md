# Web Vitals Dashboard Guide

## Overview
This dashboard monitors Core Web Vitals and performance metrics for your web applications using data from Grafana Faro SDK collected through Alloy/Loki.

## Core Web Vitals Thresholds

### Good / Needs Improvement / Poor Ranges:

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | < 2.5s | 2.5-4s | > 4s |
| **FCP** (First Contentful Paint) | < 1.8s | 1.8-3s | > 3s |
| **CLS** (Cumulative Layout Shift) | < 0.1 | 0.1-0.25 | > 0.25 |
| **INP** (Interaction to Next Paint) | < 200ms | 200-500ms | > 500ms |
| **TTFB** (Time to First Byte) | < 800ms | 800-1800ms | > 1800ms |

## Dashboard Sections

### Row 1: Core Web Vitals Stats
- **Purpose**: At-a-glance view of current performance
- **Metrics**: LCP, FCP, CLS, INP, TTFB, Good LCP Score %
- **Usage**: Monitor real-time performance against thresholds

### Row 2: Traffic & Errors
- **Page Load & Error Rate**: Track overall traffic patterns and error trends
- **Usage**: Correlate performance issues with traffic spikes or error increases

### Row 3: Web Vitals Trends
- **Purpose**: Historical view of all Core Web Vitals
- **Usage**: Identify performance degradation over time

### Row 4: Browser & Route Analysis
- **LCP by Browser**: Identify browser-specific issues
- **Top Routes Table**: Find worst-performing pages
- **Usage**: Prioritize optimization efforts

### Row 5: Performance Distribution & Errors
- **LCP Distribution**: Track % of users with good/poor experience
- **Top Error Endpoints**: Identify problematic APIs/routes
- **Usage**: Set SLOs and track error sources

### Row 6: Network & Error Monitoring
- **Network Errors**: Track connectivity issues by route
- **Overall Error Rate %**: Monitor site reliability
- **Usage**: Detect infrastructure or network problems

## Key Actions for UI Engineers

### 1. Daily Monitoring
- Check Row 1 stats panels for any red/yellow indicators
- Review error rate trends in Row 6

### 2. Performance Investigation
- If stats are yellow/red, check:
  - Web Vitals Trends (Row 3) for when degradation started
  - Top Routes Table (Row 4) to identify problematic pages
  - Browser breakdown to see if it's browser-specific

### 3. Error Investigation
- Check Top Error Endpoints table for 4xx/5xx errors
- Review Network Errors chart for connectivity issues
- Correlate with Page Load & Error Rate chart

### 4. Setting Alerts
Recommended alerts based on these queries:
```promql
# Alert when LCP p75 > 2.5s for 5 minutes
histogram_quantile(0.75, sum by (le)(rate(loki_process_custom_faro_web_vitals_lcp_milliseconds_bucket{app_name="$app"}[5m]))) / 1000 > 2.5

# Alert when error rate > 5%
100 * (sum(rate(loki_process_custom_faro_http_errors_total{app_name="$app"}[5m])) / sum(rate(loki_process_custom_faro_http_requests_total{app_name="$app"}[5m]))) > 5

# Alert when Good LCP Score < 75%
100 * (sum(rate(loki_process_custom_faro_web_vitals_lcp_milliseconds_bucket{app_name="$app", le="2500"}[5m])) / sum(rate(loki_process_custom_faro_web_vitals_lcp_milliseconds_count{app_name="$app"}[5m]))) < 75
```

## Best Practices

1. **Focus on p75 (75th percentile)** - This is the standard for Core Web Vitals assessment
2. **Monitor trends, not just current values** - Performance can vary by time of day
3. **Investigate browser-specific issues** - Some optimizations may only affect certain browsers
4. **Track both performance and errors** - They're often related
5. **Set up alerts** for sustained poor performance, not momentary spikes

## Troubleshooting Common Issues

### High LCP Values
- Check TTFB first - slow server response affects LCP
- Review largest images/resources on affected routes
- Consider lazy loading or image optimization

### High CLS Values
- Look for dynamic content insertion
- Ensure images have width/height attributes
- Check for web fonts causing layout shift

### High INP Values
- Profile JavaScript execution on affected pages
- Look for blocking main thread operations
- Consider code splitting or web workers

### Network Errors (Status 0)
- Often indicates CORS issues or network timeouts
- Check affected routes for API configuration
- Review client-side timeout settings

## Dashboard Variables

- **$app**: Select which application to monitor
- **$datasource**: Select Prometheus datasource

## Data Freshness
- Metrics use 5-minute rate windows
- Dashboard auto-refreshes every 30 seconds
- Historical data retention depends on your Prometheus configuration
