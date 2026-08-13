import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/config/db";
import { Track } from "@/server/models/Track.model";
import { createModeratorHandler } from "@/server/common/apiWrapper";
import { successResponse, errorResponse } from "@/server/common/response";
import { updateTrackStatus } from "@/server/services/trackingService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ trackID: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();

    const { trackID } = await params;

    const track = await Track.findOne({ trackId: trackID }).populate("order").lean();
    if (!track) return errorResponse({ status: 404, message: "Track not found", req });

    return successResponse({ status: 200, message: "Track fetched successfully", data: track, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch track";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}

export const PUT = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();

    const url = new URL(req.url);
    const trackID = url.pathname.split("/").filter(Boolean).pop();

    if (!trackID) {
      return errorResponse({ status: 400, message: "Track ID is required", req });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = (await req.json()) as any;

    if (!body.currentStatus) {
      return errorResponse({ status: 400, message: "currentStatus is required", req });
    }

    const result = await updateTrackStatus({
      trackId: trackID,
      status: body.currentStatus,
      description: body.description || "",
      location: body.location || { city: "", country: "" },
      updatedBy: body.updatedBy || null,
      estimatedDelivery: body.estimatedDelivery,
    });

    if (!result) return errorResponse({ status: 404, message: "Track not found", req });

    return successResponse({ status: 200, message: "Track updated successfully", data: result.track, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update track";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

export const DELETE = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();

    const url = new URL(req.url);
    const trackID = url.pathname.split("/").filter(Boolean).pop();

    const deleted = await Track.findOneAndDelete({ trackId: trackID });
    if (!deleted) return errorResponse({ status: 404, message: "Track not found", req });

    return successResponse({ status: 200, message: "Track deleted successfully", req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete track";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});
