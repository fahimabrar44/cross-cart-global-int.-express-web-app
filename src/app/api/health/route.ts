import { NextRequest, NextResponse } from "next/server";
import { successResponse } from "@/server/common/response";
import connectDB from "@/config/db";

/**
 * GET /api/health
 *
 * Public health checks expose only what a monitor needs. Memory usage,
 * environment names, versions and uptime are omitted in production so the
 * endpoint cannot be used for reconnaissance.
 */
export async function GET(req: NextRequest) {
  const isProduction = process.env.NODE_ENV === "production";

  try {
    let dbStatus = "disconnected";
    try {
      await connectDB();
      dbStatus = "connected";
    } catch {
      dbStatus = "error";
    }

    const dbReady = dbStatus === "connected";

    const healthData: Record<string, unknown> = {
      status: dbReady ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      database: { status: dbStatus },
      // Non-sensitive service map for the dashboard. Memory/uptime/version are
      // still only exposed outside production.
      services: {
        api: "running",
        database: dbStatus,
        auth: dbReady ? "active" : "degraded",
        notifications: dbReady ? "active" : "degraded",
      },
    };

    if (!isProduction) {
      const memoryUsage = process.memoryUsage();
      healthData.uptime = `${Math.floor(process.uptime() / 60)} minutes`;
      healthData.uptimeSeconds = process.uptime();
      healthData.memory = {
        used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`,
      };
      healthData.environment = process.env.NODE_ENV || "development";
      healthData.version = process.env.npm_package_version || "1.0.0";
    }

    return successResponse({
      status: 200,
      message: "System is healthy",
      data: healthData,
      req,
    });
  } catch (error) {
    console.error("Health check error:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
