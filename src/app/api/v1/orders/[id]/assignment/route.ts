import connectDB from "@/config/db";
import { Order } from "@/server/models/Order.model";
import { Rider } from "@/server/models/Rider.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { createModeratorHandler } from "@/server/common/apiWrapper";

/**
 * PUT /api/v1/orders/[id]/assignment?path suffix
 * Body: { rider? }
 * Assign a rider to an order.
 */
export const PUT = createModeratorHandler(async ({ req, user }) => {
  try {
    await connectDB();

    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const id = segments[segments.length - 2];

    const body = await req.json();

    const order = await Order.findById(id);
    if (!order) return errorResponse({ status: 404, message: "Order not found", req });

    if (body.rider) {
      const rider = await Rider.findById(body.rider);
      if (!rider) return errorResponse({ status: 404, message: "Rider not found", req });
      order.assignment.rider = rider._id;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (rider as any).status = "on-delivery";
      await rider.save();
    }

    if (user?.id) order.assignment.assignedBy = user.id as never;
    order.assignment.assignedAt = new Date() as never;
    order.markModified("assignment");
    await order.save();

    return successResponse({ status: 200, message: "Order assignment updated successfully", data: order, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to assign order";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

/**
 * DEL /api/v1/orders/[id]/assignment — release the rider (back to available)
 */
export const DELETE = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();

    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const id = segments[segments.length - 2];

    const order = await Order.findById(id);
    if (!order) return errorResponse({ status: 404, message: "Order not found", req });

    const prevRider = order.assignment.rider;
    if (prevRider) {
      const rider = await Rider.findById(prevRider);
      if (rider) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (rider as any).status = "available";
        await rider.save();
      }
    }

    order.assignment.rider = null;
    order.markModified("assignment");
    await order.save();

    return successResponse({ status: 200, message: "Rider released successfully", data: order, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to release rider";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});