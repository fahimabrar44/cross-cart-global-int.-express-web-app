import connectDB from "@/config/db";
import { errorResponse, successResponse } from "@/server/common/response";
import { verifyAuth } from "@/middleware/auth";
import { Order, IOrder } from "@/server/models/Order.model";
import { User } from "@/server/models/User.model";
import { NextRequest, NextResponse } from "next/server";

// GET - fetch a single order by ID for a user
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ phone: string, id: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return errorResponse({ status: 401, message: "Unauthorized", req });
    }

    await connectDB();

    const { phone, id } = await params;
    if (!phone) {
      return errorResponse({ status: 400, message: "Phone parameter is required", req });
    }

    // Access control: users can only access their own account; admins and moderators can access any
    if (
      authResult.user &&
      authResult.user.role !== "admin" &&
      authResult.user.role !== "moderator" &&
      authResult.user.phone !== phone
    ) {
      return errorResponse({ status: 403, message: "Access denied - You can only access your own account data", req });
    }

    const user = await User.findOne({ phone });
    if (!user) return errorResponse({ status: 404, message: "User not found", req });

    const order = await Order.findById(id).lean<IOrder>();
    if (!order) return errorResponse({ status: 404, message: "Order not found", req });

    // Ensure the order belongs to the user (sender or receiver)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (order.parcel.sender?.phone !== phone && order.parcel.receiver?.phone !== phone) {
      return errorResponse({ status: 403, message: "Access denied", req });
    }

    return successResponse({ status: 200, message: "Order fetched", data: order, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch order";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}

// PUT - update an order by ID for a user
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ phone: string, id: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return errorResponse({ status: 401, message: "Unauthorized", req });
    }

    await connectDB();

    const { phone, id } = await params;
    if (!phone) {
      return errorResponse({ status: 400, message: "Phone parameter is required", req });
    }

    // Access control: users can only access their own account; admins and moderators can access any
    if (
      authResult.user &&
      authResult.user.role !== "admin" &&
      authResult.user.role !== "moderator" &&
      authResult.user.phone !== phone
    ) {
      return errorResponse({ status: 403, message: "Access denied - You can only access your own account data", req });
    }

    const user = await User.findOne({ phone });
    if (!user) return errorResponse({ status: 404, message: "User not found", req });

    const order = await Order.findById(id);
    if (!order) return errorResponse({ status: 404, message: "Order not found", req });

    // Ensure the order belongs to the user (sender or receiver)
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parcel = order.parcel as any; // Cast to any or define proper type for nested schema
    if (parcel.sender?.phone !== phone && parcel.receiver?.phone !== phone) {
      return errorResponse({ status: 403, message: "Access denied", req });
    }

    const body: Partial<IOrder> = await req.json();

    const updatedOrder = await Order.findByIdAndUpdate(id, { $set: body }, { new: true });
    return successResponse({ status: 200, message: "Order updated", data: updatedOrder, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update order";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}
