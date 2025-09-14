# Session Explorer Dashboard Guide

## Overview
The Session Explorer Dashboard provides detailed insights into user sessions, tracking their navigation patterns, errors, and overall behavior within your Faro-instrumented application. This dashboard is specifically designed for understanding individual user journeys and identifying session-specific issues.

## Dashboard Components

### 1. Sessions Overview (Top Chart)
- **What**: Stacked bar chart showing session activity over time by page
- **Use case**: Visualize traffic patterns and page popularity
- **Colors**: Each page ID gets a unique color
- **Interaction**: Click on legend to filter specific pages

### 2. Key Metrics Row

#### Total Sessions
- **What**: Count of unique sessions in the selected time range
- **Use case**: Understand overall user engagement
- **Query**: Counts unique session_ids with activity

#### Avg Pages/Session
- **What**: Average number of pages viewed per session
- **Use case**: Measure user engagement depth
- **Insight**: Higher values indicate more engaged users

#### Sessions with Errors
- **What**: Count of sessions that experienced errors
- **Color coding**: 
  - Green: 0 errors
  - Yellow: 1+ error sessions
  - Red: 10+ error sessions
- **Action**: Click to investigate error patterns

### 3. Distribution Charts

#### Top Pages by Sessions
- **Type**: Pie chart
- **Shows**: Most visited pages by unique session count
- **Use case**: Identify popular entry/exit points
- **Top 10**: Shows only the top 10 pages

#### Browser Distribution
- **Type**: Donut chart
- **Shows**: Browser usage across all sessions
- **Use case**: Browser compatibility insights
- **Action**: Focus testing on popular browsers

### 4. Sessions Table
The main session tracking table with detailed information:

#### Columns:
- **Session ID**: Unique identifier (clickable for details)
- **Start Time**: When the session began
- **Errors**: Total error count (color-coded)
- **Page Views**: Number of pages visited
- **Browser**: Browser name and version
- **Last Page**: Most recent page visited
- **Session Lifecycle**: Status (Start/Active)

#### Features:
- **Sorting**: Default by Start Time (newest first)
- **Pagination**: Navigate through all sessions
- **Error highlighting**: Visual indicators for problematic sessions
- **Clickable IDs**: Deep-link to session details

### 5. Page Flow Analysis
- **What**: Shows navigation patterns between pages
- **Columns**:
  - From Page: Starting page
  - To Page: Destination page
  - Transitions: Number of times this path was taken
- **Use case**: Optimize user flows and identify drop-off points

### 6. Session Error Rates
- **Type**: Time series chart
- **Lines**:
  - Error Rate: Overall error percentage
  - Sessions with Errors %: Percentage of sessions experiencing errors
- **Use case**: Track error trends over time
- **Alert threshold**: Set alerts when error rate > 5%

## Using Dashboard Variables

### Application Selector
- Select the Faro application to analyze
- Automatically populated from available apps

### Session ID Filter
- Filter to specific session(s)
- Supports "All" for aggregate views
- Use for deep-dive investigation

### Time Range
- Default: Last 1 hour
- Adjust based on analysis needs
- Longer ranges for trend analysis

## Common Use Cases

### 1. Investigating User Complaints
1. Get session ID from user (or search by time)
2. Filter dashboard to that session
3. Check error count and pages visited
4. Review browser/platform information
5. Correlate with logs using session ID

### 2. Identifying Problem Pages
1. Look at Sessions table, sort by Errors
2. Check which pages have high error sessions
3. Review Page Flow Analysis for drop-offs
4. Focus testing on problematic pages

### 3. Browser-Specific Issues
1. Check Browser Distribution
2. Filter sessions table by browser
3. Compare error rates across browsers
4. Prioritize fixes for popular browsers

### 4. User Journey Analysis
1. Review Page Flow Analysis
2. Identify common navigation patterns
3. Find unexpected page transitions
4. Optimize popular user paths

## Metrics Used

### Session Metrics
- `faro_session_events_total`: All events per session
- `faro_session_pageviews_total`: Page views per session
- `faro_session_errors_total`: Errors per session (network, 4xx, 5xx)

### Labels
- `session_id`: Unique session identifier
- `page_id`: Page identifier
- `page_path`: URL path (without query/fragment)
- `browser_name`: Browser information
- `app_name`: Application name

## Best Practices

### 1. Session Investigation
- Start with high-level metrics
- Drill down to specific sessions
- Correlate with other dashboards
- Check both errors and performance

### 2. Performance Optimization
- Focus on high-traffic pages
- Monitor pages/session trends
- Track error rates by page
- Optimize common user paths

### 3. Error Management
- Set alerts for error spikes
- Investigate sessions with multiple errors
- Track browser-specific issues
- Monitor error trends over time

## Alerting Recommendations

### Critical Alerts
1. **High Error Rate**: > 10% sessions with errors
2. **Session Drop**: Sudden decrease in active sessions
3. **Page Errors**: Specific page error rate > 5%

### Warning Alerts
1. **Increased Errors**: Error rate trending up
2. **Low Engagement**: Pages/session < 2
3. **Browser Issues**: High errors for specific browser

## Integration with Other Dashboards

### Web Vitals Dashboard
- Correlate performance with user behavior
- Check if slow pages have high drop-off

### Production Support Dashboard
- Use session IDs to find traces
- Correlate backend errors with sessions

### Traces Dashboard
- Filter traces by session ID
- Analyze backend performance for user journeys

## Troubleshooting

### No Data Showing
1. Verify Faro is sending session IDs
2. Check Alloy configuration includes session metrics
3. Ensure Prometheus is scraping metrics
4. Verify app_name variable is set correctly

### Missing Sessions
1. Check time range selection
2. Verify session tracking is enabled
3. Look for gaps in data collection
4. Check Alloy processing pipeline

### High Memory Usage
1. Reduce time range
2. Limit number of sessions displayed
3. Use session ID filter for specific analysis
4. Consider data retention policies

