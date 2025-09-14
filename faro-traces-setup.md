# Setting Up Faro Traces with Tempo

## Complete Observability Stack

This guide shows how to set up the complete observability stack for Faro traces:
- **Faro SDK** → **Alloy** → **Tempo** (traces) + **Prometheus** (metrics)

## 1. Alloy Configuration for Traces

Add trace receiving and forwarding to your Alloy config:

```hcl
# alloy-config.river

// Existing Faro receiver for logs
faro.receiver "integrations_app_agent_receiver" {
  server {
    listen_address = "0.0.0.0"
    listen_port = 12347
  }

  output {
    logs   = [loki.process.faro_process.receiver]
    traces = [otelcol.processor.batch.default.input]  // Add trace output
  }
}

// Batch processor for traces
otelcol.processor.batch "default" {
  output {
    traces = [otelcol.processor.attributes.default.input]
  }
}

// Add common attributes to all traces
otelcol.processor.attributes "default" {
  attributes {
    key = "deployment.environment"
    value = "production"
    action = "insert"
  }

  attributes {
    key = "cluster"
    value = "main"
    action = "insert"
  }

  output {
    traces = [otelcol.processor.tail_sampling.default.input]
  }
}

// Tail sampling - sample 10% of normal traces, 100% of errors
otelcol.processor.tail_sampling "default" {
  decision_wait = "10s"
  
  policies {
    name = "errors"
    type = "status_code"
    status_code {
      status_codes = ["ERROR"]
    }
  }
  
  policies {
    name = "default"
    type = "probabilistic"
    probabilistic {
      sampling_percentage = 10
    }
  }

  output {
    traces = [otelcol.exporter.otlp.tempo.input]
  }
}

// Export traces to Tempo
otelcol.exporter.otlp "tempo" {
  client {
    endpoint = "tempo:4317"
    tls {
      insecure = true
      insecure_skip_verify = true
    }
  }
}

// Optional: Generate span metrics locally
otelcol.connector.spanmetrics "default" {
  histogram {
    explicit {
      buckets = [0ms, 5ms, 10ms, 25ms, 50ms, 100ms, 250ms, 500ms, 1s, 2.5s, 5s, 10s]
    }
  }

  dimensions {
    name = "http.method"
    default = "GET"
  }

  dimensions {
    name = "http.status_code"
  }

  dimensions {
    name = "http.target"
  }

  output {
    metrics = [otelcol.exporter.prometheus.spanmetrics.input]
  }
}

// Export span metrics to Prometheus
otelcol.exporter.prometheus "spanmetrics" {
  forward_to = [prometheus.remote_write.metrics_service.receiver]
}
```

## 2. Tempo Configuration

Create a Tempo configuration that generates span metrics:

```yaml
# tempo.yaml
server:
  http_listen_port: 3200

distributor:
  receivers:
    otlp:
      protocols:
        grpc:
          endpoint: 0.0.0.0:4317
        http:
          endpoint: 0.0.0.0:4318

ingester:
  max_block_length: 5m

compactor:
  compaction:
    block_retention: 48h

metrics_generator:
  registry:
    external_labels:
      source: tempo
      cluster: docker-compose
  storage:
    path: /tmp/tempo/generator/wal
    remote_write:
      - url: http://prometheus:9090/api/v1/write
        send_exemplars: true

  processor:
    service_graphs:
      histogram_buckets: [.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10]
      dimensions:
        - http.method
        - http.status_code
        - http.target
    span_metrics:
      histogram_buckets: [.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10]
      dimensions:
        - name: http.method
        - name: http.status_code
        - name: http.target
        - name: session.id  # Include session ID for correlation

storage:
  trace:
    backend: local
    local:
      path: /tmp/tempo/blocks
    wal:
      path: /tmp/tempo/wal

overrides:
  defaults:
    metrics_generator:
      processors: [service-graphs, span-metrics]
```

## 3. Docker Compose Setup

Complete stack with all components:

```yaml
# docker-compose.yml
version: '3.8'

services:
  alloy:
    image: grafana/alloy:latest
    ports:
      - "12345:12345"  # Alloy UI
      - "12347:12347"  # Faro receiver
    volumes:
      - ./alloy-config.river:/etc/alloy/config.river
    command: run --server.http.listen-addr=0.0.0.0:12345 /etc/alloy/config.river
    environment:
      - HOSTNAME=alloy
    depends_on:
      - tempo
      - prometheus
      - loki

  tempo:
    image: grafana/tempo:latest
    command: ["-config.file=/etc/tempo.yaml"]
    volumes:
      - ./tempo.yaml:/etc/tempo.yaml
      - tempo-data:/tmp/tempo
    ports:
      - "3200:3200"   # Tempo UI
      - "4317:4317"   # OTLP gRPC
      - "4318:4318"   # OTLP HTTP
    depends_on:
      - prometheus

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--enable-feature=exemplar-storage'
      - '--enable-feature=remote-write-receiver'
    ports:
      - "9090:9090"

  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./loki-config.yaml:/etc/loki/local-config.yaml
      - loki-data:/loki

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_AUTH_ANONYMOUS_ENABLED=true
      - GF_AUTH_ANONYMOUS_ORG_ROLE=Admin
      - GF_FEATURE_TOGGLES_ENABLE=traceqlEditor
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana-provisioning:/etc/grafana/provisioning
    depends_on:
      - prometheus
      - loki
      - tempo

volumes:
  tempo-data:
  prometheus-data:
  loki-data:
  grafana-data:
```

## 4. Grafana Data Source Configuration

Create provisioning files for Grafana:

```yaml
# grafana-provisioning/datasources/datasources.yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    jsonData:
      exemplarTraceIdDestinations:
        - datasourceUid: tempo
          name: trace_id

  - name: Tempo
    type: tempo
    access: proxy
    url: http://tempo:3200
    jsonData:
      tracesToLogs:
        datasourceUid: loki
        filterByTraceID: true
        filterBySpanID: true
      tracesToMetrics:
        datasourceUid: prometheus
      serviceMap:
        datasourceUid: prometheus
      search:
        hide: false
      nodeGraph:
        enabled: true

  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
    jsonData:
      derivedFields:
        - datasourceUid: tempo
          matcherRegex: "trace_id=(\\w+)"
          name: trace_id
          url: "$${__value.raw}"
```

## 5. Faro SDK Configuration for Traces

Ensure your Faro SDK is configured to send traces:

```typescript
import { getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';

const faro = initializeFaro({
  url: 'http://localhost:12347/collect',
  app: {
    name: 'aws-dashboard',
    version: '1.0.0',
  },
  
  instrumentations: [
    ...getWebInstrumentations(),
    
    // Add tracing instrumentation
    new TracingInstrumentation({
      instrumentationOptions: {
        propagateTraceHeaderCorsUrls: [
          // Add your API URLs here for trace propagation
          /^https:\/\/api\.example\.com\/.*/,
          /^http:\/\/localhost:3002\/.*/,
        ],
      },
    }),
  ],

  // Ensure session tracking is enabled for correlation
  sessionTracking: {
    enabled: true,
    persistent: true,
  },
});
```

## 6. Verifying the Setup

### Check Alloy is Receiving Traces
```bash
curl http://localhost:12345/metrics | grep traces_receiver
```

### Check Tempo is Receiving Traces
```bash
# Search for recent traces
curl "http://localhost:3200/api/search?tags=service.name%3Daws-dashboard&limit=20"

# Get a specific trace
curl "http://localhost:3200/api/traces/{traceId}"
```

### Check Span Metrics in Prometheus
```bash
# Query Prometheus for span metrics
curl "http://localhost:9090/api/v1/query?query=traces_spanmetrics_calls_total"
```

## 7. Advanced Configuration

### Custom Trace Attributes
Add custom attributes to all spans:

```typescript
// In your app
faro.api.pushTraces([
  {
    // Trace context
    context: {
      user_id: currentUser.id,
      tenant_id: currentTenant.id,
      feature_flag: getFeatureFlag('new-feature'),
    },
  },
]);
```

### Sampling Strategies

#### Head Sampling (in Faro)
```typescript
new TracingInstrumentation({
  instrumentationOptions: {
    // Sample 10% of traces
    traceSampler: () => Math.random() < 0.1,
  },
}),
```

#### Tail Sampling (in Alloy)
Already configured above - samples 100% of errors, 10% of normal traces.

### Trace to Logs Correlation
Add trace IDs to your logs:

```typescript
// When using console logs
const span = faro.api.getActiveSpan();
console.log(`[${span?.spanContext().traceId}] Processing request...`);
```

## 8. Performance Considerations

1. **Batching**: Alloy batches traces before sending to Tempo
2. **Sampling**: Use appropriate sampling rates for your traffic
3. **Retention**: Configure Tempo retention based on storage capacity
4. **Cardinality**: Limit span metric dimensions to avoid high cardinality

## 9. Troubleshooting

### No Traces in Tempo
1. Check Faro Network tab for `/collect` calls
2. Verify Alloy logs: `docker logs alloy`
3. Check Tempo logs: `docker logs tempo`

### No Span Metrics
1. Verify metrics_generator is enabled in Tempo
2. Check Prometheus for `traces_spanmetrics_*` metrics
3. Ensure remote_write URL is correct

### Missing Service Map
1. Service map requires multiple services or database spans
2. Check if trace propagation headers are being sent
3. Verify service.name is set in traces

## Next Steps

1. **Import the dashboards** created earlier
2. **Set up alerts** based on span metrics
3. **Implement custom instrumentation** for key business transactions
4. **Add trace exemplars** to your existing metrics
5. **Configure log correlation** for full observability
