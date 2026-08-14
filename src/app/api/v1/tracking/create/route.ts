import { successResponse, errorResponse } from "@/server/common/response";
import { createModeratorHandler } from "@/server/common/apiWrapper";
import connectDB from "@/config/db";
import { Order } from "@/server/models/Order.model";
import { buildCreateTrackingPayload } from "@/server/services/trackingService";
import { createTracking } from "@/server/services/trackingMoreService";
import { Types } from "mongoose";

/**
 * POST /api/v1/tracking/create
 * Create a tracking on TrackingMore (realtime query).
 *
 * Body: { tracking_number, courier_code, orderId?, tracking_postal_code?,
 *         tracking_destination_country?, ... }
 *
 * The receiver ZIP/postal code and destination country are REQUIRED by some
 * couriers (DPD Germany etc.). They are auto-filled from the linked order's
 * receiver address when you pass `orderId` (or when the tracking number
 * matches an order's handover tracking number). Explicit fields in the body
 * always win over auto-filled values.
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

    await connectDB();

    // Locate the order: explicit orderId, or auto-match by courier tracking number.
    let orderId: unknown = body.orderId;
    if (orderId && !Types.ObjectId.isValid(String(orderId))) {
      return errorResponse({ status: 400, message: "orderId is invalid", req });
    }
    if (!orderId) {
      const matched = await Order.findOne({
        "handover_by.tracking": String(body.tracking_number),
      })
        .select("_id")
        .lean();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (matched) orderId = (matched as any)._id;
    }

    // Auto-fill receiver postal code + destination country from the order,
    // letting explicit body fields override the order's values.
    const built = await buildCreateTrackingPayload({
      trackingNumber: String(body.tracking_number),
      carrier: String(body.courier_code),
      orderId,
    });
    const payload: Record<string, unknown> = { ...built, ...body };

    const created = await createTracking(payload);
    return successResponse({
      status: 200,
      message: "Tracking created successfully",
      data: { ...created, orderId: orderId || null },
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
          `${msg} This courier requires the receiver postal code. Pass orderId (auto-filled from the order receiver), or send tracking_postal_code and tracking_destination_country explicitly.`,
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