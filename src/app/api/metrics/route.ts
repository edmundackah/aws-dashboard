import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import { getSimpleMetrics } from "@/lib/metrics-collector";

export async function GET(request: NextRequest) {
  try {
    logger.info("Metrics endpoint accessed", {
      userAgent: request.headers.get("user-agent"),
      ip: request.headers.get("x-forwarded-for") || "unknown"
    });
    
    // Get simple metrics
    const metricsText = await getSimpleMetrics();
    
    // Add edge metrics if available
    let edgeMetricsText = "";
    try {
      const { getEdgeMetrics } = await import("@/lib/edge-metrics");
      const edgeMetrics = getEdgeMetrics();
      
      const lines: string[] = [];
      lines.push("");
      lines.push("# Edge Runtime HTTP Metrics");
      
      Object.entries(edgeMetrics.httpRequestCounts).forEach(([key, count]) => {
        const [method, path, status] = key.split(':');
        lines.push(`http_requests_edge_total{method="${method}",path="${path}",status="${status}"} ${count}`);
      });
      
      lines.push(`http_requests_in_flight_edge ${edgeMetrics.httpInFlight}`);
      
      Object.entries(edgeMetrics.httpDurationSamples).forEach(([key, sample]) => {
        const [method, path, status] = key.split(':');
        if (sample.count > 0) {
          lines.push(`http_request_duration_avg_ms_edge{method="${method}",path="${path}",status="${status}"} ${sample.avg.toFixed(2)}`);
        }
      });
      
      edgeMetricsText = lines.join("\n");
    } catch {
      edgeMetricsText = "\n# Edge metrics not available";
    }
    
    // Combine metrics
    const combinedMetrics = metricsText + edgeMetricsText;
    
    // Return metrics
    return new NextResponse(combinedMetrics, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    });
  } catch (error) {
    logger.error({ error }, "Error generating metrics endpoint");
    
    return new NextResponse("# Error generating metrics\n", {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8"
      }
    });
  }
}

// Also support POST for compatibility
export async function POST(request: NextRequest) {
  return GET(request);
} 