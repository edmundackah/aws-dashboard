import { NextResponse } from "next/server";
import { incrementHttpRequests, observeHttpDuration } from "@/lib/metrics-collector";
import logger from "@/lib/logger";

export async function GET() {
  const startTime = Date.now();
  
  try {
    logger.info("Health check endpoint called", {
      endpoint: "/api/health",
      method: "GET",
      timestamp: new Date().toISOString()
    });
    
    // Increment HTTP request metric
    incrementHttpRequests("GET", "/api/health", "200");
    
    const healthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: typeof process !== 'undefined' ? process.uptime() : 0,
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      otelEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "not configured"
    };
    
    const duration = Date.now() - startTime;
    observeHttpDuration("GET", "/api/health", "200", duration);
    
    logger.info("Health check completed successfully", {
      duration: `${duration}ms`,
      status: "healthy",
      uptime: healthData.uptime
    });
    
    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    const duration = Date.now() - startTime;
    observeHttpDuration("GET", "/api/health", "500", duration);
    incrementHttpRequests("GET", "/api/health", "500");
    
    logger.error("Health check failed", {
      error: error instanceof Error ? error.message : String(error),
      duration: `${duration}ms`,
      endpoint: "/api/health"
    });
    
    return NextResponse.json(
      { status: "unhealthy", error: "Internal server error" },
      { status: 500 }
    );
  }
} 