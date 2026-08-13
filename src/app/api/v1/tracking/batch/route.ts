import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/server/common/response";
import { createModeratorHandler } from "@/server/common/apiWrapper";
import { createTrackingsBatch } from "@/server/services/trackingMoreService";

/**
 * POST /api/v1/tracking/batch
 * Create multiple trackings on TrackingMore (max 40).
 * Body: { items: [{ tracking_number, courier_code, ... }, ...] }
 */
export const POST = createModeratorHandler(async ({ req }) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = (await req.json()) as any;
    const items = Array.isArray(body.items) ? body.items : [];

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return errorResponse({ status: 400, message: "items array is required", req });
    }
    if (body.items.length > 40) {
      return errorResponse({ status: 400, message: "Maximum 40 trackings per batch request", req });
    }

    const result = await createTrackingsBatch(items);
    return successResponse({
      status: 200,
      message: "Batch tracking request processed",
      data: result,
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create batch tracking";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});