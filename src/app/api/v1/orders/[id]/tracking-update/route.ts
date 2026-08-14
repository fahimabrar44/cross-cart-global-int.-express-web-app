import connectDB from "@/config/db";
import { createModeratorHandler } from "@/server/common/apiWrapper";
import { errorResponse, successResponse } from "@/server/common/response";
import { Order } from "@/server/models/Order.model";
import { Track } from "@/server/models/Track.model";
import { fetchAndStoreTracking, logTrackSyncResult } from "@/server/services/trackingService";
import { Types } from "mongoose";

/**
 * POST /api/v1/orders/[id]/tracking-update
 * Attach an external courier's tracking number to an order and pull that
 * courier's timeline into the local Track (so the public tracking page shows
 * both our stored order data and the carrier's live tracking events).
 * Body: { company?: string, tracking: string }
 */
export const POST = createModeratorHandler(async ({ req, user }) => {
  let company = "";
  let tracking = "";
  try {
    await connectDB();

    const orderId = new URL(req.url).pathname
      .split("/")
      .filter(Boolean)
      .slice(-2, -1)[0];

    if (!orderId || !Types.ObjectId.isValid(orderId)) {
      return errorResponse({ status: 400, message: "Invalid order ID", req });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = (await req.json()) as any;
    company = String(body?.company || "").trim();
    tracking = String(body?.tracking || "").trim();

    if (!tracking) {
      return errorResponse({
        status: 400,
        message: "Courier tracking number is required",
        req,
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return errorResponse({ status: 404, message: "Order not found", req });
    }

    order.handover_by = order.handover_by || { company: "", tracking: "", payment: 0 };
    order.handover_by.company = company;
    order.handover_by.tracking = tracking;
    await order.save();

    // Make sure a Track exists for this order
    let track = await Track.findOne({ order: order._id });
    if (!track) {
      track = new Track({ order: order._id, trackId: order.trackId });
      await track.save();
    }

    // Pull the external courier's timeline and merge it into the local Track
    const result = await fetchAndStoreTracking({
      trackId: order.trackId,
      carrier: company,
      trackingNumber: tracking,
      updatedBy: user?.id || null,
    });

    const updatedOrder = await Order.findById(orderId)
      .populate("parcel.from")
      .populate("parcel.to")
      .lean();

    return successResponse({
      status: 200,
      message: "Tracking update saved successfully",
      data: {
        order: updatedOrder,
        track: result.track,
        fetched: result.fetched,
        added: result.added,
        syncMessage: result.message,
      },
      req,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to update tracking";
    await logTrackSyncResult({
      trackId: tracking || "",
      trackingNumber: tracking || "",
      courier: company,
      source: "manual",
      status: "failed",
      message: msg,
    });
    return errorResponse({ status: 500, message: msg, error, req });
  }
});
