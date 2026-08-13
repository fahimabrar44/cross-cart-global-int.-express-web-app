import { successResponse, errorResponse } from "@/server/common/response";
import { createModeratorHandler } from "@/server/common/apiWrapper";
import { detectCourier } from "@/server/services/trackingMoreService";

/**
 * POST /api/v1/tracking/detect
 * Body: { tracking_number }
 * Returns matched couriers for the given tracking number.
 */
export const POST = createModeratorHandler(async ({ req }) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = (await req.json()) as any;
    const trackingNumber = String(body.tracking_number || "").trim();

    if (!trackingNumber) {
      return errorResponse({ status: 400, message: "tracking_number is required", req });
    }

    const couriers = await detectCourier(trackingNumber);
    return successResponse({
      status: 200,
      message: "Courier detected successfully",
      data: couriers,
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to detect courier";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});