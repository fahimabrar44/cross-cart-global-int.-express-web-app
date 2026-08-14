import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/config/db";
import { Track } from "@/server/models/Track.model";
import { Country } from "@/server/models/Country.model";
import { Types } from "mongoose";
import { createModeratorHandler } from "@/server/common/apiWrapper";
import { successResponse, errorResponse } from "@/server/common/response";
import { updateTrackStatus } from "@/server/services/trackingService";
import { verifyApiKeyIfProvided } from "@/server/common/apiKeyAuth";

// History locations sometimes store a Country ObjectId as a string;
// resolve any that look like one into the country name.
const normalizeCountry = async (value: string | unknown): Promise<string> => {
  if (typeof value !== "string" || !value.trim()) return "";
  if (Types.ObjectId.isValid(value)) {
    const country =
      value.length === 24
        ? await Country.findById(value).select("name").lean()
        : null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (country as any)?.name ?? value;
  }
  return value;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ trackID: string }> }
): Promise<NextResponse> {
  try {
    // API-key access when X-API-Key header is supplied; otherwise public
    const apiAuth = await verifyApiKeyIfProvided(req);
    if (!apiAuth.success && apiAuth.response) {
      return apiAuth.response;
    }

    await connectDB();

    const { trackID } = await params;

    const track = await Track.findOne({ trackId: trackID })
      .populate({
        path: "order",
        populate: [
          { path: "parcel.from" },
          { path: "parcel.to" },
          { path: "parcel.sender.address.country" },
          { path: "parcel.receiver.address.country" },
        ],
      })
      .lean();
    if (!track) return errorResponse({ status: 404, message: "Track not found", req });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tracked = track as any;
    if (Array.isArray(tracked.history)) {
      tracked.history = await Promise.all(
        tracked.history.map(async (step: { location?: { country?: string } }) => {
          if (step.location?.country) {
            step.location.country = await normalizeCountry(step.location.country);
          }
          return step;
        })
      );
    }

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
