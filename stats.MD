

Faro → Prometheus Metrics Catalog (updated)

1) Data flow (quick refresher)
	1.	Faro JS emits browser events (navigation, resource/fetch, web-vitals…).
	2.	Alloy faro.receiver → loki.process "faro_metrics" parses logfmt, promotes fields to labels, derives a few helper fields, and mints Prometheus metrics via stage.metrics.
	3.	Alloy’s /metrics exposes these as loki_process_custom_*, scraped by Prometheus.

⸻

2) Labels / attributes

2.1 Common labels (on regular metrics)

These are intentionally low-cardinality and are kept for all non-session metrics:

Label	Source / Notes
app_name	Faro attribute (used by dashboard App picker)
app_namespace	Optional Faro attr (if present)
app_environment	Optional Faro attr (if present)
event_name	e.g. faro.performance.navigation, faro.performance.resource, faro.tracing.fetch
event_domain	Usually browser
browser_name	e.g. Chrome, Safari
http_method	From event_data_http.method (when present)
status_code	Full code from event_data_responseStatus or event_data_http.status_code (e.g. 200, 500, or 0 for network errors)
route_template	From event_data_url.template (canonicalized route)
page_id	Your own stable page identifier

We avoid high-cardinality labels like raw URLs. Use route_template / page_id instead.

2.2 Session-only labels (added temporarily)

These are attached only to the session tracking counters; they are dropped before the rest of the metrics to keep cardinality healthy.

Label	Source / Notes
session_id	Faro session id
page_path	Derived from page_url by stripping ?query and #hash via stage.regex (^(?P<page_path>[^?#]+))

Session counters still inherit the common labels (e.g., app_name, route_template, status_code, …), so you can slice by route, code, browser, etc., within a session.

2.3 Derived helpers used internally

Field	How it’s derived	Why
status_code	Regex from event_data_responseStatus or event_data_http.status_code	Full code for breakdowns
status_digit	Regex from status_code (first digit)	Build 4xx/5xx counters
page_path	Regex from page_url ([^?#]+)	Session page grouping without churn


⸻

3) Metrics catalog

All series are exposed with the loki_process_custom_ prefix by Alloy.

3.1 Sanity / health
	•	faro_log_lines_total (counter)
Count of all Faro lines processed (good for “is data flowing?” checks).
Example:
rate(loki_process_custom_faro_log_lines_total[5m])

⸻

3.2 Requests & Errors
	•	faro_http_requests_total (counter)
Count of browser request-like events:
	•	event_name="faro.performance.resource" (resource timing)
	•	event_name="faro.tracing.fetch" (fetch/XHR)
	•	event_name="faro.performance.navigation" (page load)
Labels: common labels (including status_code, http_method, route_template, page_id, browser_name).
Examples:
	•	Overall RPS:
sum by (event_name)(rate(loki_process_custom_faro_http_requests_total{app_name="$app"}[5m]))
	•	RPS by route & status:
sum by (route_template,status_code)(rate(loki_process_custom_faro_http_requests_total{app_name="$app"}[5m]))
	•	faro_http_errors_total (counter)
4xx/5xx counts derived from status_digit.
Example error rate:
sum(rate(loki_process_custom_faro_http_errors_total{app_name="$app"}[5m])) / sum(rate(loki_process_custom_faro_http_requests_total{app_name="$app"}[5m]))
	•	faro_http_network_errors_total (counter)
Network errors (status_code="0").
Example:
sum by (route_template,http_method)(rate(loki_process_custom_faro_http_network_errors_total{app_name="$app"}[5m]))

⸻

3.3 HTTP timing histograms (ms)
	•	faro_http_ttfb_milliseconds (histogram)
	•	faro_http_duration_milliseconds (histogram)

Examples (p95):

histogram_quantile(0.95,
  sum by (le)(
    rate(loki_process_custom_faro_http_ttfb_milliseconds_bucket{app_name="$app"}[5m])
  )
)

histogram_quantile(0.95,
  sum by (le, route_template)(
    rate(loki_process_custom_faro_http_duration_milliseconds_bucket{app_name="$app"}[5m])
  )
)


⸻

3.4 Navigation timing histograms (ms)
	•	faro_navigation_pageload_milliseconds (histogram)
	•	faro_navigation_dom_processing_milliseconds (histogram)

Examples (p75):

histogram_quantile(0.75,
  sum by (le)(
    rate(loki_process_custom_faro_navigation_pageload_milliseconds_bucket{app_name="$app"}[5m])
  )
)


⸻

3.5 Web-Vitals
	•	faro_web_vitals_fcp_milliseconds (histogram)
	•	faro_web_vitals_lcp_milliseconds (histogram)
	•	faro_web_vitals_cls (histogram)
	•	faro_web_vitals_inp_milliseconds (histogram)
	•	faro_web_vitals_fid_milliseconds (histogram)
	•	faro_web_vitals_ttfb_milliseconds (histogram)
	•	faro_web_vitals_rating_total (counter: good / needs-improvement / poor when context_rating is present)

Examples:

histogram_quantile(0.75,
  sum by (le)(
    rate(loki_process_custom_faro_web_vitals_lcp_milliseconds_bucket{app_name="$app"}[5m])
  )
) / 1000

sum by (context_rating)(
  rate(loki_process_custom_faro_web_vitals_rating_total{app_name="$app"}[5m])
)


⸻

3.6 Session tracking (new)

These preserve session_id and page_path (URL without query/fragment). Use them for funnels, per-session trails, and troubleshooting. They still include common labels (route, method, status, etc.).

	•	faro_session_events_total (counter)
All Faro events per session (sanity + activity).
	•	faro_session_pageviews_total (counter)
Page loads per session (event_name="faro.performance.navigation").
	•	faro_session_errors_total (counter)
Session errors broken into three counters in Alloy:
	•	network: status_code="0"
	•	4xx: status_digit="4"
	•	5xx: status_digit="5"

Session PromQL examples
	•	Active sessions (seen in last 30m):

count(
  sum by (session_id) (
    increase(loki_process_custom_faro_session_events_total{app_name="$app"}[30m])
  ) > bool 0
)


	•	Top pages per session (1h):

topk(5,
  sum by (session_id, page_path) (
    increase(loki_process_custom_faro_session_pageviews_total{app_name="$app"}[1h])
  )
)


	•	Errors by session (30m):

sum by (session_id) (
  increase(loki_process_custom_faro_session_errors_total{app_name="$app"}[30m])
)


	•	Session error rate (30m):

sum by (session_id) (increase(loki_process_custom_faro_session_errors_total{app_name="$app"}[30m]))
/
sum by (session_id) (increase(loki_process_custom_faro_session_events_total{app_name="$app"}[30m]))


	•	Funnel: unique sessions per route (visited in last 6h):

count(
  sum by (session_id, route_template) (
    increase(loki_process_custom_faro_session_pageviews_total{app_name="$app"}[6h])
  ) > bool 0
)


	•	Last N pages of a specific session (table; set a $session variable):

sum by (page_path) (
  increase(loki_process_custom_faro_session_pageviews_total{app_name="$app", session_id="$session"}[$__range])
)



⸻

4) Variable queries (Grafana)
	•	App:
label_values({__name__=~"loki_process_custom_.*"}, app_name)
	•	Session (optional Session Explorer dashboard):
label_values(loki_process_custom_faro_session_events_total{app_name="$app"}, session_id)
	•	Page (optional):
label_values(loki_process_custom_faro_session_pageviews_total{app_name="$app"}, page_path)

