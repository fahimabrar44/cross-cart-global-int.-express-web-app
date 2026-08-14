import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/config/db";
import { Track } from "@/server/models/Track.model";
import { Country } from "@/server/models/Country.model";
import { Order } from "@/server/models/Order.model";
import { Types } from "mongoose";
import { successResponse, errorResponse } from "@/server/common/response";
import { AuthMiddleware } from "@/middleware/auth";

// History locations sometimes store a Country ObjectId as a string;
// resolve any that look like one into the country name.
const normalizeCountry = async (value: string | unknown): Promise<string> => {
  if (typeof value !== "string" || !value.trim()) return "";
  if (Types.ObjectId.isValid(value)) {
    const country =
      value.length === 24 ? await Country.findById(value).select("name").lean() : null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (country as any)?.name ?? value;
  }
  return value;
};

const countryName = (value: unknown): string => {
  if (!value) return "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof value === "object" && (value as any).name) return (value as any).name;
  if (typeof value === "string") return value;
  return "";
};

const POPULATE = {
  path: "order",
  populate: [
    { path: "parcel.from" },
    { path: "parcel.to" },
    { path: "parcel.sender.address.country" },
    { path: "parcel.receiver.address.country" },
  ],
};

/**
 * Public Tracking API — designed for external websites / apps that registered a
 * CrossCart dashboard account and generated an API key (ApiConfig).
 *
 * GET /api/track/:trackID
 * Headers: X-API-Key: ccg_live_...
 *
 * Returns only the fields a reseller needs to show a clean tracking widget:
 *   trackId, orderId, receiver {name, country}, sender {name, city, country},
 *   currentStatus and full tracking history.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ trackID: string }> }
): Promise<NextResponse> {
  try {
    // API-key authentication is REQUIRED for this public integration router.
    const apiAuth = await AuthMiddleware.validateApiKey(req);
    if (!apiAuth.success && apiAuth.response) return apiAuth.response;

    await connectDB();

    const id = decodeURIComponent((await params).trackID);
    if (!id || !id.trim()) {
      return errorResponse({ status: 400, message: "Tracking number is required", req });
    }

    // 1) Look up the parcel in our own database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let track: any = await Track.findOne({ trackId: id }).populate(POPULATE).lean();

    // 2) Fallback: allow the COURIER tracking number too (orders store it in
    //    handover_by.tracking after being given to a carrier).
    if (!track) {
      const orderByCourierTracking = await Order.findOne({ "handover_by.tracking": id }).select("_id");
      if (orderByCourierTracking) {
        track = await Track.findOne({ order: orderByCourierTracking._id }).populate(POPULATE).lean();
      }
    }

    if (!track) {
      return errorResponse({
        status: 404,
        message: "Track not found. No local parcel matches this tracking number.",
        req,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order: any = track.order;

    // Normalize history: resolve country ObjectId strings to names.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let history: any[] = track.history || [];
    history = await Promise.all(
      history.map(async (step: { location?: { country?: string; city?: string }; status?: string; description?: string; timestamp?: string }) => {
        const loc = step.location?.country;
        if (loc && typeof loc === "string" && Types.ObjectId.isValid(loc)) {
          step.location!.country = await normalizeCountry(loc);
        }
        return {
          status: step.status,
          description: step.description,
          location: {
            city: step.location?.city || "",
            country: typeof step.location?.country === "string" ? step.location.country : "",
          },
          timestamp: step.timestamp,
        };
      })
    );

    const data = {
      trackId: track.trackId,
      orderId: order?._id ? String(order._id) : null,
      receiver: {
        name: order?.parcel?.receiver?.name || "",
        country: countryName(order?.parcel?.receiver?.address?.country),
      },
      sender: {
        name: order?.parcel?.sender?.name || "",
        city: order?.parcel?.sender?.address?.city || "",
        country: countryName(order?.parcel?.sender?.address?.country),
      },
      currentStatus: track.currentStatus,
      history,
    };

    return successResponse({
      status: 200,
      message: "Track fetched successfully",
      data,
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch track";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}