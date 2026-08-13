import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/config/db";
import { Review } from "@/server/models/Review.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { createModeratorHandler } from "@/server/common/apiWrapper";
import { Types } from "mongoose";

const extractId = (req: Request): string => {
  const segments = new URL(req.url).pathname.split("/").filter(Boolean);
  return segments[segments.length - 1];
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{  id: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) return errorResponse({ status: 400, message: "Invalid ID", req });

    const review = await Review.findById(id).populate("user").lean();
    if (!review) return errorResponse({ status: 404, message: "Review not found", req });

    return successResponse({ status: 200, message: "Review fetched successfully", data: review, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch review";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}

export const PUT = createModeratorHandler(async ({ req, user }) => {
  try {
    await connectDB();

    const id = extractId(req);

    if (!Types.ObjectId.isValid(id)) return errorResponse({ status: 400, message: "Invalid ID", req });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = (await req.json()) as any;

    const review = await Review.findById(id);
    if (!review) return errorResponse({ status: 404, message: "Review not found", req });

    if (body.rating && (Number(body.rating) < 1 || Number(body.rating) > 5)) return errorResponse({ status: 400, message: "rating must be between 1 and 5", req });
    if (body.comment && typeof body.comment !== "string") return errorResponse({ status: 400, message: "comment must be a string", req });

    // Update fields
    if (body.user && Types.ObjectId.isValid(body.user)) review.user = body.user;
    if (body.rating) review.rating = Number(body.rating);
    if (body.comment) review.comment = body.comment;
    if (body.isVerified !== undefined) review.isVerified = !!body.isVerified;
    if (body.isFeatured !== undefined) review.isFeatured = !!body.isFeatured;
    if (body.helpfulCount !== undefined) review.helpfulCount = Number(body.helpfulCount);
    if (body.status) review.status = body.status;

    await review.save();

    return successResponse({ status: 200, message: "Review updated successfully", data: review, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update review";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

export const DELETE = createModeratorHandler(async ({ req, user }) => {
  try {
    await connectDB();

    const id = extractId(req);

    if (!Types.ObjectId.isValid(id)) return errorResponse({ status: 400, message: "Invalid ID", req });

    const deleted = await Review.findByIdAndDelete(id);
    if (!deleted) return errorResponse({ status: 404, message: "Review not found", req });

    return successResponse({ status: 200, message: "Review deleted successfully", req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete review";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});
