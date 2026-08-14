import connectDB from "@/config/db";
import { errorResponse } from "@/server/common/response";
import { Track } from "@/server/models/Track.model";
import { Order } from "@/server/models/Order.model";
import { getSettingString } from "@/server/services/settingsService";
import {
  mergeCarrierEventsInto,
  logTrackSyncResult,
  statusDescription,
} from "@/server/services/trackingService";
import {
  mapTMDeliveryStatus,
  extractTimelineEvents,
} from "@/server/services/trackingMoreService";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/v1/tracking/webhook
 * TrackingMore v4 webhook endpoint. TrackingMore pushes a payload every time a
 * tracked shipment updates; we merge it into the local Track timeline.
 *
 * Optional security: set TRACKINGMORE_WEBHOOK_SECRET (Settings or .env), then
 * append ?token=<secret> to the webhook URL, or send it as a
 * `x-webhook-secret` header. When a secret is configured it is REQUIRED.
 *
 * Always responds 200 for valid payloads so TrackingMore doesn't retry spam.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();

    // ---- Secret verification (optional but recommended) ----
    const secret = await getSettingString(
      "TRACKINGMORE_WEBHOOK_SECRET",
      process.env.TRACKINGMORE_WEBHOOK_SECRET || ""
    ).catch(() => process.env.TRACKINGMORE_WEBHOOK_SECRET || "");
    if (secret) {
      const url = new URL(req.url);
      const provided =
        url.searchParams.get("token") ||
        req.headers.get("x-webhook-secret") ||
        req.headers.get("trackingmore-token") ||
        "";
      if (!provided || provided !== secret) {
        return errorResponse({ status: 401, message: "Invalid webhook secret", req });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = await req.json().catch(() => null);
    if (!raw) {
      return NextResponse.json({ message: "Empty payload" }, { status: 200 });
    }

    // Normalize incoming shape (single object, array, or { data: ... })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = Array.isArray(raw)
      ? raw
      : Array.isArray(raw.data)
        ? raw.data
        : [raw.data || raw];

    let processed = 0;
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      processed += await handleWebhookItem(item);
    }

    return NextResponse.json(
      { message: `ok (${processed} tracking(s) processed)` },
      { status: 200 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Webhook error";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}

async function handleWebhookItem(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any
): Promise<number> {
  const trackingNumber = String(
    item.tracking_number || item.trackingNumber || item.id || ""
  ).trim();
  const courierCode = String(item.courier_code || "").trim();
  const deliveryStatus = item.delivery_status || item.status || "";
  const descriptionText =
    item.latest_event || item.last_event || item.status_info || "";
  const eventTime = item.last_event_time || item.latest_checkpoint_time || item.datetime;
  const scheduled = item.scheduled_delivery_date || item.estimated_delivery || "";

  // ---- Find the local Track for this parcel ----
  let track = await Track.findOne({ trackId: trackingNumber });
  if (!track && trackingNumber) {
    const order = await Order.findOne({ "handover_by.tracking": trackingNumber });
    if (order) track = await Track.findOne({ order: order._id });
  }
  if (!track) {
    if (trackingNumber) {
      await logTrackSyncResult({
        trackingNumber,
        courier: courierCode,
        source: "webhook",
        status: "failed",
        message: "Webhook received but no matching parcel in this system",
      });
    }
    return 0;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trackDoc = track as any;

  // ---- Build events from the push payload ----
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let events: any[] = [];
  // Full origin/destination trackinfo sometimes accompanies the push
  if (item.origin_info?.trackinfo || item.destination_info?.trackinfo) {
    events = extractTimelineEvents(item).map((e) => ({
      status: e.status,
      description: e.description,
      location: e.location,
      timestamp: e.timestamp,
    }));
  } else if (deliveryStatus) {
    const mapped = mapTMDeliveryStatus(String(deliveryStatus));
    events.push({
      status: mapped,
      description:
        descriptionText || statusDescription(mapped),
      location: item.location
        ? {
            city:
              typeof item.location === "string" ? item.location : item.location.city || "",
            country: item.country || "",
          }
        : { city: "", country: "" },
      timestamp: eventTime ? new Date(eventTime) : new Date(),
    });
  }

  if (events.length === 0) {
    return 0;
  }

  const merged = await mergeCarrierEventsInto({
    track: trackDoc,
    events,
    currentStatus: deliveryStatus
      ? mapTMDeliveryStatus(String(deliveryStatus))
      : undefined,
    estimatedDelivery: scheduled || undefined,
    updatedBy: null,
  });

  // The push is fresher than any poll — reset the polling TTL
  await Track.updateOne(
    { _id: trackDoc._id },
    { $set: { lastExternalSync: new Date() } }
  );

  await logTrackSyncResult({
    trackId: trackDoc.trackId,
    trackingNumber,
    courier: courierCode,
    source: "webhook",
    status: "success",
    added: merged.added,
    message: merged.added > 0 ? "Merged webhook events" : "Webhook received, no new events",
  });

  return 1;
}