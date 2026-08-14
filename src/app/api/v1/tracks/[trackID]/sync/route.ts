import connectDB from "@/config/db";
import { createModeratorHandler } from "@/server/common/apiWrapper";
import { successResponse, errorResponse } from "@/server/common/response";
import {
  fetchAndStoreTracking,
  logTrackSyncResult,
} from "@/server/services/trackingService";

/**
 * POST /api/v1/tracks/[trackID]/sync
 * Fetches the latest tracking events from the configured carrier tracking API
 * and stores them into the local Track timeline.
 * Body (optional): { carrier, trackingNumber }
 */
export const POST = createModeratorHandler(async ({ req, user }) => {
  let trackID = "";
  let body: { carrier?: string; trackingNumber?: string } = {};
  try {
    await connectDB();

    const url = new URL(req.url);
    trackID = url.pathname.split("/").filter(Boolean).pop() || "";

    if (!trackID) {
      return errorResponse({ status: 400, message: "Track ID is required", req });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed = (await req.json().catch(() => ({}))) as any;
    body = parsed || {};

    const result = await fetchAndStoreTracking({
      trackId: trackID,
      carrier: body?.carrier,
      trackingNumber: body?.trackingNumber,
      updatedBy: user?.id || null,
    });

    await logTrackSyncResult({
      trackId: trackID,
      trackingNumber: body?.trackingNumber || trackID,
      courier: body?.carrier || "",
      source: "manual",
      status: "success",
      added: result.added,
      message: result.message,
    });

    return successResponse({
      status: 200,
      message: result.message,
      data: {
        track: result.track,
        fetched: result.fetched,
        added: result.added,
      },
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to sync tracking";
    await logTrackSyncResult({
      trackId: trackID,
      trackingNumber: body?.trackingNumber,
      courier: body?.carrier,
      source: "manual",
      status: "failed",
      message: msg,
    });
    return errorResponse({ status: 500, message: msg, error, req });
  }
});
