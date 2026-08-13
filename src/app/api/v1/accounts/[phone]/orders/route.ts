import connectDB from "@/config/db";
import { errorResponse, successResponse } from "@/server/common/response";
import { verifyAuth } from "@/middleware/auth";
import { Order } from "@/server/models/Order.model";
import { User } from "@/server/models/User.model";
import { NextRequest, NextResponse } from "next/server";

// GET - fetch all orders for a user by phone
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return errorResponse({ status: 401, message: "Unauthorized", req });
    }

    await connectDB();

    const { phone } = await params;
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

    // Find the user by phone
    const user = await User.findOne({ phone });
    if (!user) return errorResponse({ status: 404, message: "User not found", req });

    // Fetch all orders where the user is sender or receiver
    const orders = await Order.find({
      $or: [
        { "parcel.sender.phone": phone },
        { "parcel.receiver.phone": phone }
      ]
    }).sort({ orderDate: -1 });

    return successResponse({ status: 200, message: "Orders fetched", data: orders, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch orders";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}
