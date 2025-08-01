import { NextResponse } from "next/server";
import logger from "@/lib/logger";

export async function GET() {
  const startTime = Date.now();
  
  try {
    logger.info("Test logs endpoint called", {
      endpoint: "/api/test-logs",
      timestamp: new Date().toISOString(),
      testType: "logging_verification"
    });
    
    // Generate different types of logs
    logger.debug("Debug level log test", { level: "debug", test: true });
    logger.info("Info level log test", { level: "info", test: true });
    logger.warn("Warning level log test", { level: "warn", test: true });
    logger.error("Error level log test", { level: "error", test: true });
    
    // Log with complex object
    logger.info("Complex object log test", {
      user: { id: 123, name: "test-user" },
      request: { method: "GET", path: "/api/test-logs" },
      metadata: { source: "test", version: "1.0.0" }
    });
    
    const duration = Date.now() - startTime;
    
    logger.info("Test logs completed", {
      duration: `${duration}ms`,
      logsGenerated: 5
    });
    
    return NextResponse.json({
      success: true,
      message: "Test logs generated successfully",
      logsGenerated: 5,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error("Test logs endpoint failed", {
      error: error instanceof Error ? error.message : String(error),
      duration: `${duration}ms`
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Test logs generation failed" 
      },
      { status: 500 }
    );
  }
} 