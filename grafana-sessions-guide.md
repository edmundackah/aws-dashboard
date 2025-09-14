# User Sessions Dashboard Guide

## Overview
This dashboard provides insights into user session behavior and navigation patterns in your web application. While it doesn't track individual session IDs (which would require additional Faro configuration), it approximates session activity using page views, browser information, and timing data.

## Dashboard Components

### 1. Sessions Overview (Top Panel)
- **Purpose**: Shows page activity over time with stacked bars for each page_id
- **Usage**: Identify traffic patterns, peak usage times, and which pages are most active
- **Interpretation**: Each color represents a different page; height shows concurrent activity

### 2. Sessions Table
- **Purpose**: Detailed view of page visits with browser and performance data
- **Columns**:
  - Page ID: The page identifier from your application
  - Route: The route template for the page
  - Browser: Browser used for the visit
  - Page Views: Number of visits in the time window
  - Errors: Count of errors on that page
  - Avg Load Time: Average page load time in seconds
- **Usage**: Sort by different columns to find problematic pages or browsers

### 3. Browser Distribution (Pie Chart)
- **Purpose**: Shows the browser market share of your users
- **Usage**: Identify which browsers to prioritize for testing and optimization

### 4. Top Pages by Traffic (Bar Chart)
- **Purpose**: Quick visual of the most visited pages
- **Usage**: Focus optimization efforts on high-traffic pages

### 5. Key Metrics (Stats Panels)
- **Active Sessions**: Approximation of currently active users (5-minute window)
- **Total Page Views**: Total navigation events in the selected time range
- **Avg Page Load Time**: Overall average page load performance
- **Error Rate %**: Percentage of page loads that resulted in errors

### 6. Session Activity by Browser (Time Series)
- **Purpose**: Track browser-specific usage patterns over time
- **Usage**: Identify browser-specific issues or usage trends

### 7. Page Load Time Distribution
- **Purpose**: Histogram showing load time distribution by page
- **Usage**: Identify which pages have performance issues

### 8. Error Heatmap
- **Purpose**: Visual representation of errors by page and status code
- **Usage**: Quickly spot problematic pages and error patterns
- **Color Scale**: Green (few errors) → Red (many errors)

## Dashboard Variables

- **$app**: Select which application to monitor
- **$page**: Filter by specific pages (supports multiple selection)
- **$browser**: Filter by specific browsers (supports multiple selection)

## Key Insights to Look For

### 1. User Flow Analysis
- Look at the Sessions Overview to understand common navigation patterns
- High activity on certain pages may indicate popular features or bottlenecks

### 2. Performance Issues
- Check the Sessions table for pages with high average load times
- Use the Page Load Time Distribution to see performance consistency

### 3. Error Patterns
- The Error Heatmap quickly shows which pages have the most errors
- Cross-reference with the Sessions table to see if errors correlate with specific browsers

### 4. Browser Compatibility
- Compare browser distribution with error rates by browser
- Look for browser-specific performance issues in the Session Activity chart

### 5. Traffic Patterns
- Identify peak usage times from the Sessions Overview
- Plan maintenance windows during low-traffic periods

## Limitations & Considerations

### Current Limitations
1. **No True Session Tracking**: This dashboard approximates sessions based on page views and browser combinations
2. **No User Journey Tracking**: Cannot track individual user paths through the application
3. **No Session Duration**: Cannot calculate true session duration without session IDs
4. **No Unique User Count**: Cannot distinguish between new and returning users

### To Enable Full Session Tracking
To get true session-level data, you would need to:

1. Configure Faro SDK to generate and track session IDs:
```javascript
Faro.init({
  // ... other config
  session: {
    // Enable session tracking
    trackSessions: true,
    // Session timeout in milliseconds
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
  }
});
```

2. Update your Alloy configuration to extract session_id:
```
stage.labels {
  values = {
    session_id = "session_id"
    // ... other labels
  }
}
```

3. Add session_id to label_keep to ensure it's preserved

## Recommended Alerts

```promql
# High error rate alert
100 * (sum(rate(loki_process_custom_faro_http_errors_total{app_name="$app"}[5m])) / sum(rate(loki_process_custom_faro_http_requests_total{app_name="$app"}[5m]))) > 10

# Sudden traffic drop (possible outage)
sum(rate(loki_process_custom_faro_http_requests_total{app_name="$app", event_name="faro.performance.navigation"}[5m])) < 0.5 * avg_over_time(sum(rate(loki_process_custom_faro_http_requests_total{app_name="$app", event_name="faro.performance.navigation"}[5m]))[1h:5m])

# Page performance degradation
histogram_quantile(0.75, sum by (le)(rate(loki_process_custom_faro_navigation_pageload_milliseconds_bucket{app_name="$app"}[5m]))) / 1000 > 5
```

## Best Practices

1. **Regular Monitoring**: Check the dashboard daily for anomalies
2. **Correlate Metrics**: Always look at errors in context with traffic and performance
3. **Browser Testing**: Use browser distribution data to prioritize testing
4. **Performance Budgets**: Set thresholds for acceptable page load times
5. **Error Investigation**: Use the heatmap to quickly identify problematic areas

## Next Steps

1. **Enhance Tracking**: Consider implementing true session tracking in Faro
2. **Custom Dimensions**: Add user segments, feature flags, or A/B test data
3. **Conversion Funnels**: Track specific user journeys (requires session IDs)
4. **Real User Monitoring**: Combine with synthetic monitoring for complete coverage
