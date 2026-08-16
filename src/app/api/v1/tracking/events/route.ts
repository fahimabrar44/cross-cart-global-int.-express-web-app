import connectDB from "@/config/db";
import { TrackingEvent } from "@/server/models/TrackingEvent.model";
import { successResponse, errorResponse } from "@/server/common/response";
import {
  createPublicHandler,
  createModeratorHandler,
} from "@/server/common/apiWrapper";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const POST = createPublicHandler(async ({ req }) => {
  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const visitorId =
      typeof body.visitorId === "string" && body.visitorId
        ? body.visitorId
        : uuid();
    const type = typeof body.type === "string" && body.type ? body.type : "event";
    const path =
      typeof body.path === "string" && body.path ? body.path : "/";

    const event = new TrackingEvent({
      visitorId,
      userId: typeof body.userId === "string" ? body.userId : undefined,
      type,
      path,
      title: typeof body.title === "string" ? body.title : undefined,
      referrer: typeof body.referrer === "string" ? body.referrer : undefined,
      userAgent: typeof body.userAgent === "string" ? body.userAgent : undefined,
      payload:
        body.payload && typeof body.payload === "object" ? body.payload : undefined,
    });
    await event.save();

    return successResponse({
      status: 201,
      message: "Event tracked",
      data: { visitorId },
      req,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to track event";
    return errorResponse({ status: 500, message, error, req });
  }
});

export const GET = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();
    const url = new URL(req.url);
    const q = Object.fromEntries(url.searchParams.entries());
    const page = Math.max(1, parseInt(q.page || "1", 10));
    const limit = Math.max(1, Math.min(200, parseInt(q.limit || "50", 10)));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (q.type) filter.type = q.type;
    if (q.visitorId) filter.visitorId = q.visitorId;
    if (q.userId) filter.userId = q.userId;
    if (q.path) filter.path = { $regex: q.path, $options: "i" };

    const total = await TrackingEvent.countDocuments(filter);
    const events = await TrackingEvent.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return successResponse({
      status: 200,
      message: "Tracking events fetched",
      data: events,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      req,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch events";
    return errorResponse({ status: 500, message, error, req });
  }
});
