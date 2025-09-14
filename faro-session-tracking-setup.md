# Enabling Full Session Tracking in Faro

## Overview
To achieve session tracking similar to the Grafana Faro example dashboard, you need to configure Faro SDK to generate and track session IDs. This guide shows how to set up proper session tracking.

## 1. Update Faro SDK Configuration

### Basic Session Configuration
```typescript
import { getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk';

initializeFaro({
  url: 'YOUR_COLLECTOR_URL',
  app: {
    name: 'your-app-name',
    version: '1.0.0',
    environment: 'production'
  },
  
  // Enable session tracking
  sessionTracking: {
    enabled: true,
    // Session timeout in milliseconds (30 minutes)
    persistent: true,
    timeout: 30 * 60 * 1000,
    // Maximum session duration (4 hours)
    maxDuration: 4 * 60 * 60 * 1000,
  },
  
  // Include session context in all events
  beforeSend: (item) => {
    // Session ID will be automatically included
    return item;
  },
  
  instrumentations: [
    ...getWebInstrumentations({
      captureConsole: true,
      captureConsoleDisabledLevels: ['debug'],
    }),
  ],
});
```

### Advanced Session Configuration with User Tracking
```typescript
import { getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk';

const faro = initializeFaro({
  url: 'YOUR_COLLECTOR_URL',
  app: {
    name: 'your-app-name',
    version: '1.0.0',
    environment: 'production'
  },
  
  sessionTracking: {
    enabled: true,
    persistent: true,
    timeout: 30 * 60 * 1000,
    maxDuration: 4 * 60 * 60 * 1000,
    
    // Custom session ID generator (optional)
    generateSessionId: () => {
      return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },
    
    // Session sampling (optional) - track only 50% of sessions
    samplingRate: 0.5,
  },
  
  // User identification
  user: {
    id: 'user-id', // Set this when user logs in
    username: 'username',
    email: 'user@example.com',
    attributes: {
      subscription: 'premium',
      cohort: 'beta-users'
    }
  },
  
  instrumentations: [...getWebInstrumentations()],
});

// Update user info after login
export function onUserLogin(user) {
  faro.api.setUser({
    id: user.id,
    username: user.username,
    email: user.email,
    attributes: {
      subscription: user.subscriptionType,
      registrationDate: user.registeredAt,
    }
  });
}

// Clear user info on logout
export function onUserLogout() {
  faro.api.resetUser();
  // Optionally start a new session
  faro.api.resetSession();
}
```

## 2. Update Alloy Configuration

Add session tracking fields to your Alloy configuration:

```hcl
loki.process "faro_metrics" {
  forward_to = [loki.write.logs_service.receiver]

  stage.logfmt {
    mapping = {
      # Existing mappings...
      
      # Session tracking fields
      session_id        = "session.id"
      session_start     = "session.startTime"
      session_duration  = "session.duration"
      session_page_views = "session.pageViews"
      
      # User fields
      user_id          = "user.id"
      user_username    = "user.username"
      user_email       = "user.email"
      
      # Additional context
      session_referrer = "session.referrer"
      session_entry_page = "session.entryPage"
      session_exit_page = "session.exitPage"
    }
  }

  stage.labels {
    values = {
      # Existing labels...
      
      # Add session labels (keep cardinality in mind)
      session_id = ""
      user_id = ""
      session_entry_page = ""
    }
  }

  # Add session-specific metrics
  stage.metrics {
    metric.counter {
      name = "faro_sessions_total"
      source = "session_id"
      prefix = "session_"
      action = "inc"
      match_all = true
      count_entry_bytes = false
      max_idle_duration = "24h"
    }
  }

  stage.metrics {
    metric.histogram {
      name = "faro_session_duration_seconds"
      source = "session_duration"
      prefix = ""
      buckets = [30, 60, 120, 300, 600, 1200, 1800, 3600, 7200]
      max_idle_duration = "24h"
    }
  }

  stage.metrics {
    metric.histogram {
      name = "faro_session_page_views"
      source = "session_page_views"
      prefix = ""
      buckets = [1, 2, 3, 5, 10, 20, 50, 100]
      max_idle_duration = "24h"
    }
  }

  # Keep only specific labels to manage cardinality
  stage.label_keep {
    values = [
      "app_name",
      "app_namespace", 
      "app_environment",
      "event_name",
      "event_domain",
      "browser_name",
      "http_method",
      "status_code",
      "status_digit",
      "route_template",
      "page_id",
      "session_id",  # Add this carefully - high cardinality!
      "user_id",     # Add this carefully - high cardinality!
      "session_entry_page"
    ]
  }
}
```

## 3. Enhanced Session Queries

With proper session tracking, you can create more sophisticated queries:

### Count Active Sessions
```promql
count(count by (session_id)(
  increase(loki_process_custom_faro_http_requests_total{app_name="$app"}[5m]) > 0
))
```

### Average Session Duration
```promql
histogram_quantile(0.5, 
  sum(rate(loki_process_custom_faro_session_duration_seconds_bucket[5m]))
)
```

### Pages per Session
```promql
histogram_quantile(0.5,
  sum(rate(loki_process_custom_faro_session_page_views_bucket[5m]))
)
```

### User Journey Analysis
```promql
# Most common entry pages
topk(10, 
  sum by (session_entry_page)(
    increase(loki_process_custom_faro_sessions_total[1h])
  )
)
```

### Session Conversion Funnel
```promql
# Sessions that reached checkout
count(count by (session_id)(
  loki_process_custom_faro_http_requests_total{
    app_name="$app",
    page_id="checkout"
  }
)) 
/ 
count(count by (session_id)(
  loki_process_custom_faro_http_requests_total{app_name="$app"}
))
```

## 4. Managing Cardinality

⚠️ **Warning**: Adding session_id and user_id as labels can significantly increase cardinality!

### Best Practices:
1. **Use recording rules** for high-cardinality queries
2. **Implement sampling** for session tracking (e.g., track 10% of sessions)
3. **Set appropriate retention** policies
4. **Consider using Loki** for raw session logs instead of Prometheus metrics

### Alternative: Log-based Session Analysis
Instead of adding session_id as a Prometheus label, query Loki directly:

```logql
{app_name="your-app"} 
  | logfmt 
  | session_id != ""
  | __error__=""
```

## 5. Privacy Considerations

When implementing session tracking:

1. **Anonymize PII**: Hash user emails, avoid storing sensitive data
2. **Implement consent**: Respect user privacy preferences
3. **Data retention**: Set appropriate retention policies
4. **GDPR compliance**: Provide data export/deletion capabilities

### Example Privacy-Conscious Setup
```typescript
initializeFaro({
  // ... other config
  
  beforeSend: (item) => {
    // Anonymize sensitive data
    if (item.meta?.user?.email) {
      item.meta.user.email = hashEmail(item.meta.user.email);
    }
    
    // Remove PII from URLs
    if (item.meta?.page?.url) {
      item.meta.page.url = sanitizeUrl(item.meta.page.url);
    }
    
    return item;
  },
  
  // Only track sessions if user consented
  sessionTracking: {
    enabled: hasUserConsent(),
    // ... other settings
  }
});
```

## 6. Testing Session Tracking

### Verify in Browser DevTools
```javascript
// Check if Faro is tracking sessions
window.__faro__.api.getSession()

// Manually trigger a new session
window.__faro__.api.resetSession()

// Check current session data
window.__faro__.api.getSessionMeta()
```

### Verify in Grafana Explore
```promql
# Check if session metrics are being collected
loki_process_custom_faro_sessions_total{app_name="your-app"}

# Verify session duration tracking
loki_process_custom_faro_session_duration_seconds_bucket{app_name="your-app"}
```

## Next Steps

1. Start with basic session tracking
2. Monitor cardinality impact
3. Gradually add more session context
4. Build custom dashboards for user journeys
5. Implement alerting for session anomalies
