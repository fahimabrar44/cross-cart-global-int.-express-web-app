import connectDB from "@/config/db";
import { errorResponse, successResponse } from "@/server/common/response";
import { verifyAuth } from "@/middleware/auth";
import { LoginHistory, ILoginHistory } from "@/server/models/LoginHistory.model";
import { User } from "@/server/models/User.model";
import { NextRequest, NextResponse } from "next/server";

// GET - fetch login history for a user
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

    // Find the user (optional, since some records may not have user reference)
    const user = await User.findOne({ phone });
    if (!user) return errorResponse({ status: 404, message: "User not found", req });

    // Parse query params
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const total = await LoginHistory.countDocuments({ user: user._id });

    const histories: ILoginHistory[] = await LoginHistory.find({ user: user._id })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    return successResponse({
      status: 200,
      message: "Login histories fetched",
      data: histories,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch login history";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}

// POST - add a new login history record
export async function POST(
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

    const body: Partial<ILoginHistory> = await req.json();

    // Find the user (optional, for successful logins)
    const user = await User.findOne({ phone });

    const newHistory = new LoginHistory({
      ...body,
      user: user?._id || null,
      phone,
      timestamp: new Date(),
    });

    await newHistory.save();

    return successResponse({ status: 201, message: "Login history added", data: newHistory, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to add login history";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}
