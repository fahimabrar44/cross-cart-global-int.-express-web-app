import connectDB from "@/config/db";
import { createModeratorHandler } from "@/server/common/apiWrapper";
import { errorResponse, successResponse } from "@/server/common/response";
import { TrackSyncLog } from "@/server/models/TrackSyncLog.model";

/**
 * GET /api/v1/tracking/sync-logs
 * Admin/moderator view of recent carrier-sync attempts (success + failures).
 */
export const GET = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();

    const url = new URL(req.url);
    const limit = Math.min(
      200,
      Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10) || 50)
    );
    const status = (url.searchParams.get("status") || "").trim();

    const filter: { status?: string } = {};
    if (status === "success" || status === "failed") filter.status = status;

    const logs = await TrackSyncLog.find(filter)
      .sort({ runAt: -1 })
      .limit(limit)
      .lean();

    return successResponse({
      status: 200,
      message: "Sync logs fetched",
      data: logs,
      meta: { total: logs.length },
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch sync logs";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});