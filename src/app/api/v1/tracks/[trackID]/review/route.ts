import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/config/db";
import { Track } from "@/server/models/Track.model";
import { Review } from "@/server/models/Review.model";
import { successResponse, errorResponse } from "@/server/common/response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ trackID: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();

    const { trackID } = await params;

    const track = await Track.findOne({ trackId: trackID }).lean();
    if (!track) return errorResponse({ status: 404, message: "Track not found", req });

    // Reviews are allowed only after the shipment is delivered
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tracked = track as any;
    if (tracked.currentStatus !== "delivered") {
      return errorResponse({
        status: 400,
        message: "You can submit a review only after your shipment has been delivered",
        req,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = (await req.json()) as any;

    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return errorResponse({ status: 400, message: "Name is required", req });
    }
    if (!body.rating || Number(body.rating) < 1 || Number(body.rating) > 5) {
      return errorResponse({ status: 400, message: "Rating must be between 1 and 5", req });
    }
    if (!body.comment || typeof body.comment !== "string" || !body.comment.trim()) {
      return errorResponse({ status: 400, message: "Review details are required", req });
    }

    const existing = await Review.findOne({ trackId: trackID });
    if (existing) {
      return errorResponse({
        status: 400,
        message: "You have already submitted a review for this shipment",
        req,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderId = (track as any).order;

    const review = new Review({
      name: body.name.trim(),
      phone: body.phone ? String(body.phone).trim() : "",
      email: body.email ? String(body.email).trim() : "",
      order: orderId || null,
      trackId: trackID,
      rating: Number(body.rating),
      comment: body.comment.trim(),
      status: "pending",
    });

    await review.save();

    return successResponse({
      status: 201,
      message: "Review submitted successfully. Thank you for your feedback!",
      data: review,
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to submit review";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}