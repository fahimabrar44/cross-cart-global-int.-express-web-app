import connectDB from "@/config/db";
import { Pickup } from "@/server/models/Pickup.model";
import { User } from "@/server/models/User.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { verifyAuth } from "@/middleware/auth";
import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";

// GET - fetch single pickup
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

    if (!Types.ObjectId.isValid(id)) return errorResponse({ status: 400, message: "Invalid pickup ID", req });

    const pickup = await Pickup.findOne({ _id: id, user: user._id }).populate("user").populate("moderator").populate("address").lean();
    if (!pickup) return errorResponse({ status: 404, message: "Pickup not found", req });

    return successResponse({ status: 200, message: "Pickup fetched", data: pickup, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch pickup";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}

// PUT - update pickup
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

    if (!Types.ObjectId.isValid(id)) return errorResponse({ status: 400, message: "Invalid pickup ID", req });

    const body: Partial<typeof Pickup> = await req.json();

    const updatedPickup = await Pickup.findOneAndUpdate(
      { _id: id, user: user._id },
      { $set: body },
      { new: true }
    );

    if (!updatedPickup) return errorResponse({ status: 404, message: "Pickup not found", req });

    return successResponse({ status: 200, message: "Pickup updated", data: updatedPickup, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update pickup";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}