import connectDB from "@/config/db";
import { Order } from "@/server/models/Order.model";
import { errorResponse, successResponse } from "@/server/common/response";
import { createModeratorHandler } from "@/server/common/apiWrapper";

/**
 * GET /api/v1/orders/stats
 * Moderator/admin only. Aggregated order statistics.
 */
export const GET = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      total,
      pending,
      confirmed,
      pickedUp,
      inTransit,
      outForDelivery,
      delivered,
      cancelled,
      returned,
      todayOrders,
      weeklyOrders,
      monthlyOrders,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: "confirmed" }),
      Order.countDocuments({ status: "picked-up" }),
      Order.countDocuments({ status: "in-transit" }),
      Order.countDocuments({ status: "out-for-delivery" }),
      Order.countDocuments({ status: "delivered" }),
      Order.countDocuments({ status: "cancelled" }),
      Order.countDocuments({ status: "returned" }),
      Order.countDocuments({ createdAt: { $gte: todayStart } }),
      Order.countDocuments({ createdAt: { $gte: weekAgo } }),
      Order.countDocuments({ createdAt: { $gte: monthAgo } }),
    ]);

    return successResponse({
      status: 200,
      message: "Order statistics fetched",
      data: {
        total,
        pending,
        processing: confirmed + pickedUp,
        shipped: inTransit + outForDelivery,
        delivered,
        cancelled,
        returned,
        todayOrders,
        weeklyOrders,
        monthlyOrders,
      },
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch order statistics";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});