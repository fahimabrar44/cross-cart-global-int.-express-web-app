import connectDB from "@/config/db";
import { errorResponse, successResponse } from "@/server/common/response";
import { verifyAuth } from "@/middleware/auth";
import { IReview, Review } from "@/server/models/Review.model";
import { User } from "@/server/models/User.model";
import { NextRequest, NextResponse } from "next/server";

// GET - fetch all reviews for a user
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

    const user = await User.findOne({ phone });
    if (!user) return errorResponse({ status: 404, message: "User not found", req });

    
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reviews: any[] = await Review.find({ user: user._id }).sort({ createdAt: -1 }).populate("user").lean();

    return successResponse({
      status: 200,
      message: "Reviews fetched",
      data: reviews,
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch reviews";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}

// POST - create a new review for a user
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

    const user = await User.findOne({ phone });
    if (!user) return errorResponse({ status: 404, message: "User not found", req });

    const body: Partial<IReview> = await req.json();

    const newReview = new Review({
      ...body,
      user: user._id,
    });

    await newReview.save();

    return successResponse({
      status: 201,
      message: "Review created successfully",
      data: newReview,
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create review";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}
