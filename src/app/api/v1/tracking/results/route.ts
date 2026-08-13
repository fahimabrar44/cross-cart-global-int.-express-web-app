import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/server/common/response";
import { createModeratorHandler } from "@/server/common/apiWrapper";
import { getTrackings } from "@/server/services/trackingMoreService";

/**
 * POST /api/v1/tracking/results
 * Get tracking results from TrackingMore for one or more tracking numbers.
 * Body: { tracking_numbers: string[] | string, courier_code?: string, lang?: string }
 */
export const POST = createModeratorHandler(async ({ req }) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = (await req.json()) as any;

    const numbers = Array.isArray(body.tracking_numbers)
      ? body.tracking_numbers.map((n: unknown) => String(n).trim()).filter(Boolean)
      : String(body.tracking_numbers || "")
          .split(",")
          .map((n: string) => n.trim())
          .filter(Boolean);

    if (numbers.length === 0) {
      return errorResponse({ status: 400, message: "tracking_numbers is required", req });
    }

    const trackings = await getTrackings(numbers, {
      courierCode: body.courier_code,
      lang: body.lang,
    });

    return successResponse({
      status: 200,
      message: "Tracking results fetched successfully",
      data: trackings,
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch tracking results";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});