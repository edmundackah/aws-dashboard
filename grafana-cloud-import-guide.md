# Importing Faro Shop Dashboard to Grafana Cloud Playground

## Prerequisites
1. Access to Grafana Cloud playground (https://play.grafana.org/)
2. A Prometheus data source configured in your Grafana instance
3. Faro metrics being sent to your Prometheus instance

## Step-by-Step Import Process

### 1. Access Grafana Cloud Playground
```
https://play.grafana.org/
```
- Login with your Grafana account
- Or use the demo credentials if available

### 2. Configure Data Source (if needed)
1. Go to **Configuration** → **Data Sources**
2. Click **Add data source**
3. Select **Prometheus**
4. Configure:
   - Name: `prometheus` (or update the dashboard variable)
   - URL: Your Prometheus endpoint
   - Save & Test

### 3. Import the Dashboard

#### Method 1: Direct Import
1. Go to **Dashboards** → **Import**
2. Copy the entire content of `grafana-ecommerce-dashboard.json`
3. Paste into the "Import via panel json" text area
4. Click **Load**
5. Configure:
   - Name: Keep as "E-commerce Analytics Dashboard" or customize
   - Folder: Select or create "Faro Dashboards"
   - Data source: Select your Prometheus instance
6. Click **Import**

#### Method 2: Upload JSON File
1. Go to **Dashboards** → **Import**
2. Click **Upload JSON file**
3. Select `grafana-ecommerce-dashboard.json`
4. Configure import options
5. Click **Import**

### 4. Update Dashboard Variables
After import, you may need to update:

1. **Data Source Variable**:
   - Go to Dashboard Settings → Variables
   - Edit `datasource` variable
   - Ensure it points to your Prometheus instance

2. **Application Variable**:
   - The `$app` variable should auto-populate
   - If not, check the query: `label_values(loki_process_custom_faro_log_lines_total, app_name)`
   - Update to match your app name (e.g., `faro-shop-frontend`)

## Dashboard Modifications for Grafana Cloud

### 1. Update Metric Prefixes
If your metrics have different prefixes in Grafana Cloud:

```bash
# Original metrics use: loki_process_custom_
# You may need to update to your prefix, e.g.: faro_
```

### 2. Adjust Time Ranges
- Default is "Last 6 hours"
- Adjust based on your data retention

### 3. Panel Adjustments
Some panels may need tweaking:

#### Checkout Success Rate
Original query:
```promql
100 * (sum(increase(loki_process_custom_faro_checkout_success_total{app_name="$app"}[5m])) / sum(increase(loki_process_custom_faro_checkout_attempts_total{app_name="$app"}[5m])))
```

If metrics differ, update accordingly.

## Quick Panel Reference

The dashboard includes these e-commerce specific panels:
1. **Total Checkouts** - Successful checkout count
2. **Checkout Success Rate** - Conversion percentage
3. **Cart Additions** - Items added to cart
4. **Product Views** - Product page visits
5. **Top Selling Products** - Popular items
6. **Conversion Funnel** - User journey visualization
7. **Cart Abandonment Rate** - Drop-off tracking
8. **Revenue Impacting Errors** - Critical error monitoring
9. **Core Web Vitals by Page** - Performance metrics

## Troubleshooting

### No Data Showing
1. Verify metric names match your setup
2. Check time range selection
3. Ensure app_name variable is correct
4. Verify Prometheus is receiving data

### Missing Metrics
The dashboard expects these e-commerce events:
- `app_checkout_succeeded`
- `checkout_success`
- `add_to_cart`
- `product_detail`
- `change_quantity`

Ensure your Faro setup is tracking these events.

### Query Errors
1. Check metric prefixes
2. Verify label names (app_name, event_name, etc.)
3. Ensure histograms have `_bucket` suffix

## Alternative: Minimal E-commerce Dashboard

If you need a simpler version, here's a minimal dashboard focusing on key metrics:

```json
{
  "panels": [
    {
      "title": "Checkout Success Rate",
      "targets": [{
        "expr": "sum(rate(your_checkout_success_metric[5m]))"
      }]
    },
    {
      "title": "Cart Abandonment",
      "targets": [{
        "expr": "sum(rate(your_cart_abandon_metric[5m]))"
      }]
    }
  ]
}
```

## Using with Demo Data

If you want to test without real data:
1. Use Grafana's TestData datasource
2. Create sample metrics mimicking e-commerce patterns
3. Adjust queries to use TestData source

## Next Steps

1. **Customize for Your Needs**:
   - Add product-specific filters
   - Create user segment panels
   - Add revenue calculations

2. **Set Up Alerts**:
   - Low conversion rate
   - High cart abandonment
   - Checkout errors spike

3. **Create Additional Dashboards**:
   - User Session Explorer
   - Product Performance
   - Marketing Campaign Tracking

## Useful Links
- [Grafana Cloud Docs](https://grafana.com/docs/grafana-cloud/)
- [PromQL Basics](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Faro Documentation](https://grafana.com/docs/alloy/latest/reference/components/faro.receiver/)

