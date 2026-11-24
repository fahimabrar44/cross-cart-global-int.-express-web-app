import connectDB from "@/config/db";
import { createAuthHandler, createAdminHandler } from "@/server/common/apiWrapper";
import { errorResponse, successResponse } from "@/server/common/response";
import { Order } from "@/server/models/Order.model";
import { syncOrderToTrack } from "@/server/services/trackingService";
import { Types } from "mongoose";

function toObjectIdOrNull(value: unknown): Types.ObjectId | null {
  if (value instanceof Types.ObjectId) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return Types.ObjectId.isValid(trimmed)
      ? new Types.ObjectId(trimmed)
      : null;
  }
  if (value && typeof value === "object") {
    const raw = value as { _id?: unknown; id?: unknown };
    return toObjectIdOrNull(raw._id ?? raw.id);
  }
  return null;
}

function toText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function toWholeNumber(value: unknown, max: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(Math.floor(parsed), max);
}

function toAmount(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100) / 100;
}

/** Whitelist line items so arbitrary client fields never reach Mongoose. */
function sanitizeItems(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.slice(0, 50).map((entry) => {
    const raw =
      entry && typeof entry === "object"
        ? (entry as Record<string, unknown>)
        : {};
    const quantity = toWholeNumber(raw.quantity, 10_000);
    const unitPrice = toAmount(raw.unitPrice);

    return {
      name: toText(raw.name, 200),
      hsCode: toText(raw.hsCode, 20),
      quantity,
      unitPrice,
      totalPrice: Math.round(quantity * unitPrice * 100) / 100,
    };
  });
}

// GET: Users can view their own orders, Admin/Moderator can view all
export const GET = createAuthHandler(async ({ req, user }) => {
  try {
    await connectDB();

    const url = new URL(req.url);
    const orderId = url.pathname.split('/').pop();

    if (!orderId || !Types.ObjectId.isValid(orderId)) {
      return errorResponse({
        status: 400,
        message: "Invalid order ID",
        req,
      });
    }

    // Build query based on user role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { _id: new Types.ObjectId(orderId) };
    
    // Users can only see their own orders
    if (user?.role === "user") {
      query.$or = [
        { "parcel.sender.phone": user.phone },
        { "parcel.sender.email": user.email }
      ];
    }
    // Admin and moderator can see all orders

    const order = await Order.findOne(query).lean();

    if (!order) {
      return errorResponse({
        status: 404,
        message: "Order not found or access denied",
        req,
      });
    }

    return successResponse({
      status: 200,
      message: "Order fetched successfully",
      data: order,
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch order";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

// PUT: Users can update their own orders, Moderators can update any order
export const PUT = createAuthHandler(async ({ req, user }) => {
  try {
    await connectDB();

    const url = new URL(req.url);
    const orderId = url.pathname.split('/').pop();

    if (!orderId || !Types.ObjectId.isValid(orderId)) {
      return errorResponse({
        status: 400,
        message: "Invalid order ID",
        req,
      });
    }

    const body = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body) {
      return errorResponse({
        status: 400,
        message: "A valid JSON body is required",
        req,
      });
    }

    // Edit forms may send populated country documents. Normalize them to ids
    // before they reach Mongoose, otherwise the cast fails with
    // "Cast to ObjectId failed for value \"[object Object]\"".
    const parcelBody = body.parcel;
    if (parcelBody && typeof parcelBody === "object") {
      const parcel = parcelBody as Record<string, unknown>;

      for (const key of ["from", "to"] as const) {
        if (parcel[key] !== undefined) {
          parcel[key] = toObjectIdOrNull(parcel[key]);
        }
      }

      for (const key of ["sender", "receiver"] as const) {
        const person = parcel[key];
        if (person && typeof person === "object") {
          const personObj = person as Record<string, unknown>;
          const address = personObj.address;
          if (address && typeof address === "object") {
            const addressObj = address as Record<string, unknown>;
            if (addressObj.country !== undefined) {
              addressObj.country = toObjectIdOrNull(addressObj.country);
            }
          }
        }
      }
    }

    // Build query based on user role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { _id: new Types.ObjectId(orderId) };
    
    // Users can only update their own orders
    if (user?.role === "user") {
      query.$or = [
        { "parcel.sender.phone": user.phone },
        { "parcel.sender.email": user.email }
      ];
    }
    // Admin and moderator can update any order

    const existingOrder = await Order.findOne(query);

    if (!existingOrder) {
      return errorResponse({
        status: 404,
        message: "Order not found or access denied",
        req,
      });
    }

    // Restrict what users can update vs admin/moderator
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allowedUpdates: Record<string, any> = {};

    const parcelUpdates =
      body.parcel && typeof body.parcel === "object"
        ? (body.parcel as Record<string, unknown>)
        : undefined;

    if (user?.role === "user") {
      // Users can only update the receiver and the item list.
      if (parcelUpdates?.receiver !== undefined) {
        allowedUpdates["parcel.receiver"] = parcelUpdates.receiver;
      }
      if (parcelUpdates?.item !== undefined) {
        allowedUpdates["parcel.item"] = sanitizeItems(parcelUpdates.item);
      }
    } else {
      // Admin/Moderator: merge parcel fields instead of replacing the whole
      // subdocument, so fields the edit form doesn't show (insurance, coupon,
      // box) are preserved.
      if (parcelUpdates) {
        for (const [key, value] of Object.entries(parcelUpdates)) {
          if (value !== undefined) {
            allowedUpdates[`parcel.${key}`] =
              key === "item" ? sanitizeItems(value) : value;
          }
        }
      }

      const restrictedFields = new Set([
        "_id",
        "trackId",
        "createdAt",
        "parcel",
      ]);
      for (const [key, value] of Object.entries(body)) {
        if (!restrictedFields.has(key) && value !== undefined) {
          allowedUpdates[key] = value;
        }
      }
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return errorResponse({
        status: 400,
        message: "No update fields provided",
        req,
      });
    }

    // Update the order
    const updatedOrder = await Order.findOneAndUpdate(
      query,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    ).lean();

    // Sync status change to tracking timeline (moderator/admin only)
    if (user?.role !== "user" && allowedUpdates.status) {
      try {
        await syncOrderToTrack({
          orderId: orderId,
          status: allowedUpdates.status,
          updatedBy: user?.id || null,
          location: {
            city: allowedUpdates["parcel.receiver"]?.address?.city || "",
            country: allowedUpdates["parcel.receiver"]?.address?.country || "",
          },
        });
      } catch (syncErr) {
        console.error("Failed to sync order status to track:", syncErr);
      }
    }

    return successResponse({
      status: 200,
      message: "Order updated successfully",
      data: updatedOrder,
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update order";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

// PATCH: Update order status (admin/moderator any order, users only their own)
const ALLOWED_STATUSES = new Set([
  "pending",
  "confirmed",
  "picked-up",
  "in-transit",
  "out-for-delivery",
  "delivered",
  "cancelled",
  "returned",
]);

export const PATCH = createAuthHandler(async ({ req, user }) => {
  try {
    await connectDB();

    const url = new URL(req.url);
    const orderId = url.pathname.split('/').pop();

    if (!orderId || !Types.ObjectId.isValid(orderId)) {
      return errorResponse({
        status: 400,
        message: "Invalid order ID",
        req,
      });
    }

    const body = await req.json();
    const { status, notes } = body as { status?: string; notes?: string };

    if (status === undefined && notes === undefined) {
      return errorResponse({
        status: 400,
        message: "At least one of status or notes is required",
        req,
      });
    }

    if (status !== undefined && !ALLOWED_STATUSES.has(status)) {
      return errorResponse({
        status: 400,
        message: `Invalid status. Allowed: ${[...ALLOWED_STATUSES].join(", ")}`,
        req,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { _id: new Types.ObjectId(orderId) };

    // Users can only update their own orders
    if (user?.role === "user") {
      query.$or = [
        { "parcel.sender.phone": user.phone },
        { "parcel.sender.email": user.email }
      ];
    }

    const existingOrder = await Order.findOne(query);
    if (!existingOrder) {
      return errorResponse({
        status: 404,
        message: "Order not found or access denied",
        req,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateSet: any = {};
    if (status !== undefined) updateSet.status = status;
    if (notes !== undefined) updateSet["parcel.notes"] = notes;

    const updatedOrder = await Order.findOneAndUpdate(
      query,
      { $set: updateSet },
      { new: true, runValidators: true }
    ).lean();

    // Sync status change to tracking timeline (moderator/admin only)
    if (status !== undefined && user?.role !== "user") {
      try {
        await syncOrderToTrack({
          orderId: orderId,
          status,
          updatedBy: user?.id || null,
          location: {
            city: existingOrder.parcel?.receiver?.address?.city || "",
            country: existingOrder.parcel?.receiver?.address?.country || "",
          },
        });
      } catch (syncErr) {
        console.error("Failed to sync order status to track:", syncErr);
      }
    }

    return successResponse({
      status: 200,
      message: "Order status updated successfully",
      data: updatedOrder,
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update order status";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

// DELETE: Only Admin can delete orders
export const DELETE = createAdminHandler(async ({ req, user }) => {
  try {
    await connectDB();

    const url = new URL(req.url);
    const orderId = url.pathname.split('/').pop();

    if (!orderId || !Types.ObjectId.isValid(orderId)) {
      return errorResponse({
        status: 400,
        message: "Invalid order ID",
        req,
      });
    }

    const deletedOrder = await Order.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      return errorResponse({
        status: 404,
        message: "Order not found",
        req,
      });
    }

    return successResponse({
      status: 200,
      message: "Order deleted successfully",
      data: {
        deletedOrderId: orderId,
        trackId: deletedOrder.trackId,
        deletedBy: {
          userId: user?.id,
          role: user?.role,
          name: user?.name,
        },
        deletedAt: new Date().toISOString(),
      },
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete order";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});