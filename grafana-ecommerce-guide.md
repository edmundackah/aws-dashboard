# E-commerce Analytics Dashboard Guide

## Overview
This dashboard is specifically designed for monitoring e-commerce applications instrumented with Grafana Faro. It tracks the complete customer journey from product browsing to successful checkout, providing insights into conversion rates, performance, and user behavior.

## Key Metrics (Top Row)

### 1. Total Checkouts
- **What it shows**: Total number of successful checkout completions
- **Why it matters**: Direct measure of business success
- **Events tracked**: `app_checkout_succeeded`, `checkout_success`

### 2. Conversion Rate
- **What it shows**: Percentage of cart additions that result in successful checkouts
- **Formula**: `(Checkouts / Cart Additions) × 100`
- **Good range**: 20-40% for e-commerce
- **Actions**: If low, investigate checkout flow friction

### 3. Cart Additions
- **What it shows**: Total items added to cart
- **Events tracked**: `add_to_cart`
- **Insights**: Compare with product views to measure product appeal

### 4. Checkout Page Speed
- **What it shows**: Average page load time for cart and checkout pages
- **Target**: < 2 seconds
- **Impact**: Every second of delay can reduce conversions by 7%

### 5. Active Sessions
- **What it shows**: Currently active user sessions (5-minute window)
- **Use case**: Monitor real-time traffic and capacity needs

### 6. Checkout Errors
- **What it shows**: HTTP 4xx/5xx errors on checkout endpoints
- **Alert threshold**: > 10 errors
- **Common issues**: Payment failures, inventory issues, validation errors

## E-commerce Funnel Analysis

### Funnel Stages
1. **Home Page** → Entry point
2. **Product Views** → Browse products
3. **Add to Cart** → Purchase intent
4. **Cart Views** → Review items
5. **Checkout Started** → Begin purchase
6. **Checkout Complete** → Success!

### Analyzing Drop-offs
- **Product → Cart**: Low rate indicates pricing or product issues
- **Cart → Checkout**: High abandonment often due to:
  - Unexpected shipping costs
  - Complicated checkout process
  - Security concerns
- **Checkout → Complete**: Failed payments or technical errors

## Page Performance by Type

Monitors Core Web Vitals (LCP) for critical pages:
- **Product Detail Pages**: Must load fast for browsing
- **Cart Page**: Performance impacts decision-making
- **Checkout Pages**: Critical for conversion

**Action Items**:
- LCP > 2.5s: Optimize images, reduce JavaScript
- Consistent spikes: Check for backend issues

## E-commerce Event Stream

Real-time view of customer actions:
- **Session tracking**: Follow individual user journeys
- **Event sequence**: Understand user behavior patterns
- **Browser data**: Identify compatibility issues

**Use Cases**:
1. Debug failed checkouts by session ID
2. Analyze successful vs. abandoned sessions
3. Identify unusual patterns (e.g., rapid add/remove from cart)

## Performance Ratings Distribution

Shows Web Vitals ratings for checkout flow:
- **Good** (green): Optimal user experience
- **Needs Improvement** (yellow): Acceptable but should optimize
- **Poor** (red): Likely causing user frustration and abandonment

**Target**: > 75% of sessions rated "Good"

## Top Products Analysis

### Metrics Shown
- **Views**: Product detail page visits
- **Cart Adds**: Actual add-to-cart actions

### Key Insights
- **High views, low adds**: Product page issues or pricing concerns
- **High adds relative to views**: Strong product-market fit
- **Seasonal trends**: Plan inventory accordingly

## Pages per Session Distribution

Histogram showing user engagement:
- **1-2 pages**: Bounce or quick purchase
- **3-5 pages**: Normal browsing behavior
- **6+ pages**: Highly engaged users or navigation issues

## Key Performance Indicators (KPIs)

### Business Metrics
| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Conversion Rate | > 20% | < 10% |
| Checkout Success | > 95% | < 90% |
| Cart Abandonment | < 70% | > 85% |
| Average Order Value | Track trend | -20% drop |

### Technical Metrics
| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Checkout Page Speed | < 2s | > 4s |
| Checkout Error Rate | < 0.5% | > 2% |
| Payment Gateway Success | > 98% | < 95% |
| Web Vitals "Good" | > 75% | < 50% |

## Common E-commerce Issues

### 1. High Cart Abandonment
**Symptoms**: Low conversion rate, high cart views
**Common Causes**:
- Unexpected shipping costs
- Account creation requirement
- Security concerns
- Technical errors

**Investigation**:
1. Check event stream for error patterns
2. Analyze checkout page performance
3. Review session recordings (if available)

### 2. Payment Failures
**Symptoms**: High checkout errors, incomplete transactions
**Common Causes**:
- Gateway timeouts
- Invalid card handling
- 3D Secure issues

**Investigation**:
1. Filter errors by status code
2. Check specific session traces
3. Monitor gateway response times

### 3. Performance Issues
**Symptoms**: High page load times, poor Web Vitals
**Impact**: -7% conversion per second of delay
**Common Causes**:
- Large product images
- Slow API responses
- Third-party scripts

**Investigation**:
1. Check performance by page type
2. Analyze resource timing
3. Review Core Web Vitals trends

## Optimization Strategies

### 1. Conversion Rate Optimization
- **A/B test** checkout flows
- **Reduce form fields** to minimum
- **Display security badges** prominently
- **Offer guest checkout** option

### 2. Performance Optimization
- **Optimize images**: Use WebP, lazy loading
- **Reduce JavaScript**: Code split by route
- **Cache API responses**: Especially product data
- **Preload critical resources**: Fonts, CSS

### 3. Error Reduction
- **Implement retry logic** for payments
- **Graceful degradation** for third-party failures
- **Clear error messages** for users
- **Monitor and alert** on error spikes

## Setting Up Alerts

### Critical Business Alerts
```promql
# Conversion rate drop
(sum(rate(loki_process_custom_faro_log_lines_total{event_name="checkout_success"}[1h])) 
/ sum(rate(loki_process_custom_faro_log_lines_total{event_name="add_to_cart"}[1h]))) < 0.1

# Checkout errors spike
sum(rate(loki_process_custom_faro_http_errors_total{route_template=~".*checkout.*"}[5m])) > 0.1

# No checkouts in 30 minutes
sum(increase(loki_process_custom_faro_log_lines_total{event_name=~"checkout_success|app_checkout_succeeded"}[30m])) == 0
```

### Performance Alerts
```promql
# Checkout page slowdown
histogram_quantile(0.75, sum(rate(loki_process_custom_faro_navigation_pageload_milliseconds_bucket{page_id=~"cart|checkout.*"}[5m])) by (le)) > 4000

# Web Vitals degradation
sum(rate(loki_process_custom_faro_log_lines_total{context_rating="poor", page_id=~"cart|checkout.*|product_detail"}[5m])) 
/ sum(rate(loki_process_custom_faro_log_lines_total{kind="measurement", page_id=~"cart|checkout.*|product_detail"}[5m])) > 0.25
```

## Dashboard Variables

- **$app**: Select which application to monitor
- **$datasource**: Prometheus datasource for metrics
- **$loki_datasource**: Loki datasource for event logs

## Best Practices

1. **Monitor continuously**: Set up automated reports
2. **Correlate metrics**: Business KPIs with technical metrics
3. **Act on insights**: Regular optimization sprints
4. **Track experiments**: A/B test impact on conversion
5. **Seasonal planning**: Prepare for traffic spikes

## Integration with Other Dashboards

### With Web Vitals Dashboard
- Deep dive into performance issues
- Analyze all pages, not just checkout flow

### With Sessions Dashboard  
- Track complete user journeys
- Identify navigation patterns

### With Traces Dashboard
- Debug specific API failures
- Analyze backend performance impact

This dashboard provides a complete view of your e-commerce application's health, combining business metrics with technical performance to drive optimization decisions.
