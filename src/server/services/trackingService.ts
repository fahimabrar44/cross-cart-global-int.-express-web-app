// Tracking Service
// Shared helpers for order/track status synchronization and
// carrier tracking API integration. Provider-agnostic; configure via env:
// TRACKING_API_URL, TRACKING_API_KEY, TRACKING_PROVIDER (greenweb-style / generic json)
import { Track } from "@/server/models/Track.model";
import { Order } from "@/server/models/Order.model";
import { Country } from "@/server/models/Country.model";
import { TrackSyncLog } from "@/server/models/TrackSyncLog.model";
import { getSettingString } from "@/server/services/settingsService";

export const TRACK_STATUSES = [
  "created",
  "pickup-pending",
  "picked-up",
  "in-transit",
  "arrived-at-hub",
  "customs-clearance",
  "out-for-delivery",
  "delivered",
  "failed",
  "cancelled",
  "returned",
] as const;

// Map Order.status -> Track.status
const ORDER_TO_TRACK_STATUS: Record<string, string> = {
  pending: "created",
  confirmed: "pickup-pending",
  "picked-up": "picked-up",
  "in-transit": "in-transit",
  "out-for-delivery": "out-for-delivery",
  delivered: "delivered",
  cancelled: "cancelled",
  returned: "returned",
};

// Map Track.status -> Order.status (reverse)
const TRACK_TO_ORDER_STATUS: Record<string, string> = {
  created: "pending",
  "pickup-pending": "confirmed",
  "picked-up": "picked-up",
  "in-transit": "in-transit",
  "arrived-at-hub": "in-transit",
  "customs-clearance": "in-transit",
  "out-for-delivery": "out-for-delivery",
  delivered: "delivered",
  failed: "pending",
  cancelled: "cancelled",
  returned: "returned",
};

export function trackStatusFromOrder(status?: string): string {
  return ORDER_TO_TRACK_STATUS[status || ""] || "created";
}

export function orderStatusFromTrack(status?: string): string {
  return TRACK_TO_ORDER_STATUS[status || ""] || "pending";
}

const STATUS_DESCRIPTIONS: Record<string, string> = {
  created: "Order has been created and is being processed",
  "pickup-pending": "Package is awaiting pickup",
  "picked-up": "Package has been picked up",
  "in-transit": "Package is in transit",
  "arrived-at-hub": "Package has arrived at the hub",
  "customs-clearance": "Package is undergoing customs clearance",
  "out-for-delivery": "Package is out for delivery",
  delivered: "Package has been delivered successfully",
  failed: "Delivery attempt failed",
  cancelled: "Order has been cancelled",
  returned: "Package has been returned to sender",
};

export function statusDescription(status: string): string {
  return STATUS_DESCRIPTIONS[status] || "Status updated";
}

export interface TimelineStep {
  status: string;
  description?: string;
  location?: { city?: string; country?: string };
  updatedBy?: string | null;
  timestamp?: Date | string;
}

// Append a step to a track's history (dedupe identical status+desc+time)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function appendHistory(track: any, step: TimelineStep): boolean {
  if (!track.history) return false;
  const ts = step.timestamp ? new Date(step.timestamp) : new Date();
  const last = track.history[track.history.length - 1];
  if (
    last &&
    last.status === step.status &&
    last.description === (step.description || "") &&
    Math.abs(new Date(last.timestamp).getTime() - ts.getTime()) < 60_000
  ) {
    return false;
  }
  track.history.push({
    status: step.status,
    description: step.description || statusDescription(step.status),
    location: {
      city: step.location?.city || "",
      country: step.location?.country || "",
    },
    updatedBy: step.updatedBy || null,
    timestamp: ts,
  });
  return true;
}

/**
 * Sync an Order's status into its Track (create track if missing),
 * pushing a timeline step when the status actually changes.
 */
export async function syncOrderToTrack(input: {
  orderId: string;
  status: string;
  updatedBy?: string | null;
  location?: { city?: string; country?: string };
  description?: string;
}): Promise<void> {
  const trackStatus = trackStatusFromOrder(input.status);

  let track = await Track.findOne({ order: input.orderId });
  if (!track) {
    const order = await Order.findById(input.orderId).select("trackId");
    if (!order) return;
    track = new Track({ order: input.orderId, trackId: order.trackId });
  }

  const changed = track.currentStatus !== trackStatus;
  track.currentStatus = trackStatus;
  if (changed) {
    appendHistory(track, {
      status: trackStatus,
      description: input.description,
      location: input.location,
      updatedBy: input.updatedBy || null,
    });
  }
  await track.save();
}

/**
 * Update a Track's status and mirror it to the linked Order.
 */
export async function updateTrackStatus(input: {
  trackId: string;
  status: string;
  description?: string;
  location?: { city?: string; country?: string };
  updatedBy?: string | null;
  estimatedDelivery?: Date | string;
}): Promise<{ track: unknown; orderUpdated: boolean } | null> {
  const track = await Track.findOne({ trackId: input.trackId });
  if (!track) return null;

  const changed = track.currentStatus !== input.status;
  track.currentStatus = input.status;
  if (changed) {
    appendHistory(track, {
      status: input.status,
      description: input.description,
      location: input.location,
      updatedBy: input.updatedBy || null,
    });
  }
  if (input.estimatedDelivery) {
    track.estimatedDelivery = new Date(input.estimatedDelivery);
  }
  await track.save();

  // Mirror to Order
  let orderUpdated = false;
  const orderStatus = orderStatusFromTrack(input.status);
  if (track.order) {
    const order = await Order.findById(track.order);
    if (order && order.status !== orderStatus) {
      order.status = orderStatus;
      if (input.location) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (order as any).assignment = order.assignment || {};
      }
      await order.save();
      orderUpdated = true;
    }
  }

  return { track, orderUpdated };
}

export interface CarrierEvent {
  status: string;
  description: string;
  location?: { city?: string; country?: string };
  timestamp?: Date | string;
}

interface CarrierResponse {
  events: CarrierEvent[];
  currentStatus?: string;
  estimatedDelivery?: Date | string;
}

// Statuses that are still "live" — auto-sync should keep polling these.
const ACTIVE_TRACK_STATUSES = [
  "created",
  "pickup-pending",
  "picked-up",
  "in-transit",
  "arrived-at-hub",
  "customs-clearance",
  "out-for-delivery",
  "failed",
];

export function isActiveTrackStatus(status?: string): boolean {
  return Boolean(status && ACTIVE_TRACK_STATUSES.includes(status));
}

/**
 * Merge carrier events into a Track timeline, update current status and
 * estimated delivery, mirror the final status to the linked Order, and send
 * status-change notifications when new events arrived.
 */
export async function mergeCarrierEventsInto(input: {
  track: unknown;
  events: CarrierEvent[];
  currentStatus?: string;
  estimatedDelivery?: Date | string;
  updatedBy?: string | null;
}): Promise<{ added: number; track: unknown }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const track = input.track as any;
  const previousStatus = track.currentStatus;

  let added = 0;
  for (const ev of input.events || []) {
    if (!ev.status) continue;
    const pushed = appendHistory(track, {
      status: ev.status,
      description: ev.description || statusDescription(ev.status),
      location: ev.location,
      updatedBy: input.updatedBy || null,
      timestamp: ev.timestamp || new Date(),
    });
    if (pushed) added += 1;
  }

  if (
    input.currentStatus &&
    track.currentStatus !== input.currentStatus
  ) {
    track.currentStatus = input.currentStatus;
    if (!(input.events || []).some((e) => e.status === input.currentStatus)) {
      const pushed = appendHistory(track, {
        status: input.currentStatus,
        updatedBy: input.updatedBy || null,
      });
      if (pushed) added += 1;
    }
  }

  if (input.estimatedDelivery) {
    track.estimatedDelivery = new Date(input.estimatedDelivery);
  }

  await track.save();

  // Mirror final status to Order
  const orderId = track.order?._id ?? track.order;
  if (orderId) {
    const orderStatus = orderStatusFromTrack(track.currentStatus);
    const o = await Order.findById(orderId);
    if (o && o.status !== orderStatus) {
      o.status = orderStatus;
      await o.save();
    }
  }

  // Status-change notifications (sender + receiver). Never break the main flow.
  if (added > 0 && orderId) {
    notifyTrackUpdate(track, previousStatus).catch(() => {});
  }

  return { added, track };
}

/**
 * Send a status-change notification to the parcel's sender and receiver.
 * Requires a sender/receiver phone matching an existing user account.
 */
async function notifyTrackUpdate(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  track: any,
  previousStatus?: string
): Promise<void> {
  const { notificationService } = await import("@/services/notificationService");
  if (!track) return;

  const orderId = track.order?._id ?? track.order;
  if (!orderId) return;
  const order = await Order.findById(orderId).lean();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parcel = (order as any)?.parcel;
  if (!parcel) return;

  const lastStep =
    Array.isArray(track.history) && track.history.length > 0
      ? track.history[track.history.length - 1]
      : null;
  const isDelivered = track.currentStatus === "delivered";
  const label = (track.currentStatus || "").replace(/-/g, " ");
  const message = isDelivered
    ? `Your parcel ${track.trackId} has been delivered successfully.`
    : `Your parcel ${track.trackId} is now: ${label}.${
        lastStep?.description ? ` ${lastStep.description}` : ""
      }`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recipients: any[] = [];
  if (parcel?.sender?.phone) {
    recipients.push({
      phone: parcel.sender.phone,
      email: parcel.sender.email || "",
      title: `Parcel ${isDelivered ? "Delivered" : "Status Update"} (${track.trackId})`,
      type: isDelivered ? ("success" as const) : ("info" as const),
    });
  }
  if (parcel?.receiver?.phone) {
    recipients.push({
      phone: parcel.receiver.phone,
      email: parcel.receiver.email || "",
      title: `Parcel ${isDelivered ? "Delivered" : "Status Update"} (${track.trackId})`,
      type: isDelivered ? ("success" as const) : ("info" as const),
    });
  }

  await Promise.allSettled(
    recipients.map((r) =>
      notificationService.sendNotification({
        phone: r.phone,
        email: r.email || undefined,
        title: r.title,
        message,
        type: r.type,
        category: "order",
        priority: isDelivered ? "high" : "normal",
        actionUrl: `/tracking/${track.trackId}`,
        actionText: "View tracking",
        channels: isDelivered ? ["inapp", "sms", "email"] : ["inapp", "email"],
        data: { trackId: track.trackId, status: track.currentStatus, previousStatus },
      })
    )
  );
}

/**
 * Append a record to the carrier-sync log. Fire-and-forget; never throws.
 */
export async function logTrackSyncResult(input: {
  trackId?: string;
  trackingNumber?: string;
  courier?: string;
  source: "cron" | "webhook" | "manual" | "public";
  status: "success" | "failed";
  message?: string;
  added?: number;
}): Promise<void> {
  try {
    await TrackSyncLog.create({
      trackId: input.trackId || "",
      trackingNumber: input.trackingNumber || "",
      courier: input.courier || "",
      source: input.source,
      status: input.status,
      message: (input.message || "").slice(0, 1000),
      added: input.added || 0,
      runAt: new Date(),
    });
  } catch (error) {
    console.error("Failed to write tracking sync log:", error);
  }
}

/**
 * Build a TrackingMore create-tracking payload enriched with the receiver's
 * postal code + destination country. Several couriers (DPD Germany, DPD BE,
 * etc.) REQUIRE tracking_postal_code — without it TrackingMore rejects the
 * create with code 4122.
 */
async function buildCreateTrackingPayload(input: {
  trackingNumber: string;
  carrier?: string;
  orderId?: unknown;
}): Promise<Record<string, unknown>> {
  const payload: Record<string, unknown> = {
    tracking_number: input.trackingNumber,
  };
  if (input.carrier) payload.courier_code = input.carrier;
  if (!input.orderId) return payload;

  try {
    const order = await Order.findById(input.orderId).select(
      "parcel.receiver parcel.to"
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const receiver: any = (order as any)?.parcel?.receiver;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const address = receiver?.address || {};

    const postal = String(address?.zipCode || "").trim();

    let countryCode = "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const countryField: any = address?.country || (order as any)?.parcel?.to;
    if (countryField) {
      if (typeof countryField === "string" && /^[A-Za-z]{2}$/.test(countryField)) {
        countryCode = countryField;
      } else if (countryField?.code) {
        countryCode = String(countryField.code);
      } else if (typeof countryField === "string" && countryField.length === 24) {
        const c = await Country.findById(countryField).select("code").lean();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        countryCode = String((c as any)?.code || "");
      }
    }

    if (postal) payload["tracking_postal_code"] = postal;
    if (countryCode) payload["tracking_destination_country"] = countryCode;
  } catch {
    // enrichment must never break the create
  }
  return payload;
}

/**
 * Fetch tracking events from the configured carrier tracking API
 * and merge them into the local Track timeline.
 * Override behavior per provider via TRACKING_PROVIDER:
 *  - "generic": posts {trackingNumber, carrier} to TRACKING_API_URL and reads {events, currentStatus}
 *  - "query":  GET TRACKING_API_URL?tracking=... returns same shape
 *  - default:  returns empty events when not configured (dev noop)
 */
export async function fetchAndStoreTracking(input: {
  trackId: string;
  carrier?: string;
  trackingNumber?: string;
  updatedBy?: string | null;
}): Promise<{
  fetched: number;
  added: number;
  track: unknown;
  message: string;
}> {
  const track = await Track.findOne({ trackId: input.trackId }).populate("order");
  if (!track) throw new Error("Track not found");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order: any = (track as any).order;
  const carrier = input.carrier || order?.handover_by?.company || "";
  const trackingNumber =
    input.trackingNumber || order?.handover_by?.tracking || track.trackId;

  const providerSetting = await getSettingString(
    "TRACKING_PROVIDER",
    process.env.TRACKING_PROVIDER || "none"
  );
  const provider = providerSetting || process.env.TRACKING_PROVIDER || "none";

  let payload: CarrierResponse | null = null;

  if (provider === "trackingmore") {
    // TrackingMore v4 integration — get (and if needed create) tracking, then
    // normalize its origin/destination trackinfo events into our timeline.
    const {
      isTrackingMoreConfigured,
      getTrackings,
      createTracking,
      extractTimelineEvents,
      mapTMDeliveryStatus,
    } = await import("@/server/services/trackingMoreService");

    if (!(await isTrackingMoreConfigured())) {
      return {
        fetched: 0,
        added: 0,
        track,
        message:
          "TrackingMore API key not configured. Save TRACKINGMORE_API_KEY from Settings or set it in .env",
      };
    }

    // getTrackings returns [] when the number hasn't been created yet (4102)
    // so we transparently fall through to create below.
    let tmTrackings = await getTrackings([trackingNumber], {
      courierCode: carrier || undefined,
    });

    if (!tmTrackings || tmTrackings.length === 0) {
      // Not created yet on TrackingMore — create then fetch.
      // Some couriers require the receiver postal code (+ destination country);
      // enrich the payload from the order so those creates succeed.
      try {
        const createPayload = await buildCreateTrackingPayload({
          trackingNumber,
          carrier,
          orderId: track.order?._id ?? track.order,
        });
        const created = await createTracking(createPayload);
        if (created?.tracking_number) {
          tmTrackings = await getTrackings([created.tracking_number], {
            courierCode: carrier || undefined,
          });
        }
      } catch (error) {
        return {
          fetched: 0,
          added: 0,
          track,
          message:
            error instanceof Error
              ? `Create tracking failed: ${error.message}`
              : "Failed to create tracking on TrackingMore.",
        };
      }
    }

    const tm = tmTrackings?.[0];
    if (!tm) {
      return {
        fetched: 0,
        added: 0,
        track,
        message: "TrackingMore returned no data for this tracking number.",
      };
    }

    const events: CarrierEvent[] = extractTimelineEvents(tm).map((e) => ({
      status: e.status,
      description: e.description,
      location: e.location,
      timestamp: e.timestamp,
    }));
    const tmCurrent = tm.delivery_status
      ? mapTMDeliveryStatus(tm.delivery_status)
      : undefined;

    payload = {
      events,
      currentStatus: tmCurrent,
      estimatedDelivery:
        tm.scheduled_delivery_date || tm.estimated_delivery || undefined,
    };
  } else if (provider === "generic") {
    const apiUrl = await getSettingString("TRACKING_API_URL", process.env.TRACKING_API_URL || "");
    const apiKey = await getSettingString("TRACKING_API_KEY", process.env.TRACKING_API_KEY || "");
    if (apiUrl) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
          body: JSON.stringify({ trackingNumber, carrier }),
          signal: controller.signal,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payload = (await res.json()) as any;
      } finally {
        clearTimeout(timeout);
      }
    }
  } else if (provider === "query") {
    const apiUrl = await getSettingString("TRACKING_API_URL", process.env.TRACKING_API_URL || "");
    const apiKey = await getSettingString("TRACKING_API_KEY", process.env.TRACKING_API_KEY || "");
    if (apiUrl) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const url = new URL(apiUrl);
        url.searchParams.set("tracking", trackingNumber);
        if (carrier) url.searchParams.set("carrier", carrier);
        const res = await fetch(url.toString(), {
          headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
          signal: controller.signal,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payload = (await res.json()) as any;
      } finally {
        clearTimeout(timeout);
      }
    }
  }

  // Dev / unconfigured: return informative noop (no throw)
  if (!payload) {
    return {
      fetched: 0,
      added: 0,
      track,
      message:
        "No tracking API configured. Set TRACKING_PROVIDER=trackingmore (TRACKINGMORE_API_KEY) or TRACKING_API_URL + TRACKING_PROVIDER=generic|query.",
    };
  }

  const events: CarrierEvent[] = Array.isArray(payload.events) ? payload.events : [];
  const merged = await mergeCarrierEventsInto({
    track,
    events,
    currentStatus: payload.currentStatus,
    estimatedDelivery: payload.estimatedDelivery,
    updatedBy: input.updatedBy || null,
  });

  return {
    fetched: events.length,
    added: merged.added,
    track: merged.track,
    message:
      merged.added > 0
        ? `${merged.added} new tracking event(s) stored`
        : "Tracking is up to date",
  };
}
