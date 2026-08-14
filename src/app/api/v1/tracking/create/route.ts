import { successResponse, errorResponse } from "@/server/common/response";
import { createModeratorHandler } from "@/server/common/apiWrapper";
import { createTracking } from "@/server/services/trackingMoreService";

/**
 * POST /api/v1/tracking/create
 * Create a tracking on TrackingMore (realtime query).
 * Body: { tracking_number, courier_code, tracking_postal_code, tracking_destination_country, ... }
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const code = (error as any)?.code as number | undefined;

    if (code === 4122) {
      return errorResponse({
        status: 400,
        message:
          `${msg} This courier requires special required fields — pass tracking_postal_code (receiver ZIP) and tracking_destination_country (receiver country ISO2).`,
        req,
      });
    }
    if (code === 4124) {
      return errorResponse({
        status: 400,
        message: `${msg} The tracking number format is invalid for this courier.`,
        req,
      });
    }
    if (code === 4082 || code === 4083 || code === 4084 || code === 4085) {
      return errorResponse({
        status: 429,
        message: `${msg} TrackingMore usage limit reached — try again later.`,
        req,
      });
    }
    return errorResponse({ status: 500, message: msg, error, req });
  }
});