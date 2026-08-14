import connectDB from "@/config/db";
import { createModeratorHandler } from "@/server/common/apiWrapper";
import { errorResponse, successResponse } from "@/server/common/response";
import { getTrackingMoreUsage } from "@/server/services/trackingMoreService";

/**
 * GET /api/v1/tracking/usage
 * Admin/moderator view of today's TrackingMore API usage vs daily quota.
 */
export const GET = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();
    const usage = await getTrackingMoreUsage();
    return successResponse({
      status: 200,
      message: "Tracking usage fetched",
      data: usage,
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch usage";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});