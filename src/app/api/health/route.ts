import { NextRequest, NextResponse } from "next/server";
import os from "os";
import mongoose from "mongoose";
import { successResponse } from "@/server/common/response";
import connectDB from "@/config/db";
import { authenticateToken } from "@/middleware/apiAuth";

function formatUptime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024))
  );
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent >= 3 ? 1 : 0)} ${units[exponent]}`;
}

/**
 * GET /api/health
 *
 * Public health checks expose only what a monitor needs (overall status and
 * database/service availability). Uptime, memory, runtime and host details are
 * returned only to an authenticated admin/moderator so the admin dashboard can
 * show real infrastructure metrics without leaking them publicly.
 */
export async function GET(req: NextRequest) {
  let dbStatus = "disconnected";
  let pingMs: number | null = null;
  let dbError: string | undefined;

  try {
    await connectDB();
    dbStatus = "connected";

    // `connectDB` is cached, so ping the server for a real latency number.
    const db = mongoose.connection.db;
    if (db) {
      const started = Date.now();
      await db.admin().ping();
      pingMs = Date.now() - started;
    }
  } catch (error) {
    dbStatus = "error";
    dbError = error instanceof Error ? error.message : "Database connection failed";
    console.error("Health check database error:", dbError);
  }

  // Optional authentication. A failed token simply means "public viewer".
  let canViewDetails = false;
  try {
    const viewer = await authenticateToken(req);
    canViewDetails =
      viewer?.role === "admin" || viewer?.role === "moderator";
  } catch {
    canViewDetails = false;
  }

  const dbReady = dbStatus === "connected";

  const healthData: Record<string, unknown> = {
    status: dbReady ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      ...(canViewDetails && pingMs !== null ? { pingMs } : {}),
    },
    // Non-sensitive service map used by the dashboard.
    services: {
      api: "running",
      database: dbStatus,
      auth: dbReady ? "active" : "degraded",
      notifications: dbReady ? "active" : "degraded",
    },
  };

  if (canViewDetails) {
    const memory = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = Math.max(0, totalMemory - freeMemory);

    healthData.uptime = formatUptime(process.uptime());
    healthData.uptimeSeconds = Math.round(process.uptime());
    healthData.memory = {
      used: formatBytes(memory.heapUsed),
      total: formatBytes(memory.heapTotal),
      external: formatBytes(memory.external),
      rss: formatBytes(memory.rss),
      heapUsedPercent:
        memory.heapTotal > 0
          ? Math.round((memory.heapUsed / memory.heapTotal) * 100)
          : 0,
    };
    healthData.system = {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      pid: process.pid,
      cpuCount: os.cpus().length,
      loadAverage: os.loadavg().map((value) => Number(value.toFixed(2))),
      totalMemory: formatBytes(totalMemory),
      freeMemory: formatBytes(freeMemory),
      usedMemory: formatBytes(usedMemory),
      memoryUsagePercent: Math.round((usedMemory / totalMemory) * 100),
    };
    healthData.environment = process.env.NODE_ENV || "development";
    healthData.version = process.env.npm_package_version || "1.0.0";
    if (dbError) healthData.databaseError = dbError;
  }

  return successResponse({
    status: 200,
    message: dbReady ? "System is healthy" : "System is degraded",
    data: healthData,
    req,
  });
}

export function OPTIONS() {
  return NextResponse.json({ success: true }, { status: 204 });
}
