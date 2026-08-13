import { successResponse, errorResponse } from "@/server/common/response";
import { createModeratorHandler } from "@/server/common/apiWrapper";
import { getAllCouriers } from "@/server/services/trackingMoreService";

/**
 * GET /api/v1/tracking/couriers
 * Returns all supported couriers from TrackingMore.
 * Optional query: ?search=... (client-side filter)
 */
export const GET = createModeratorHandler(async ({ req }) => {
  try {
    const couriers = await getAllCouriers();
    return successResponse({
      status: 200,
      message: "Couriers fetched successfully",
      data: couriers,
      meta: { total: couriers.length },
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch couriers";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});