import { successResponse, errorResponse } from "@/server/common/response";
import { createModeratorHandler } from "@/server/common/apiWrapper";
import { createTracking } from "@/server/services/trackingMoreService";

/**
 * POST /api/v1/tracking/create
 * Create a tracking on TrackingMore (realtime query).
 * Body: { tracking_number, courier_code, origin_country_iso2, destination_country_iso2, ... }
 */
export const POST = createModeratorHandler(async ({ req }) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = (await req.json()) as any;

    if (!body.tracking_number) {
      return errorResponse({ status: 400, message: "tracking_number is required", req });
    }
    if (!body.courier_code) {
      return errorResponse({ status: 400, message: "courier_code is required", req });
    }

    const created = await createTracking(body);
    return successResponse({
      status: 200,
      message: "Tracking created successfully",
      data: created,
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create tracking";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});