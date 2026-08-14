// TrackingMore v4 Tracking API Service
// https://api.trackingmore.com/v4
// Requires: TRACKINGMORE_API_KEY saved in Settings (DB) or env.
// Optional: TRACKINGMORE_BASE_URL (defaults to production)

import { getSettingString, setSetting } from "@/server/services/settingsService";

const TRACKINGMORE_KEY_SETTING = "TRACKINGMORE_API_KEY";
const TRACKINGMORE_URL_SETTING = "TRACKINGMORE_BASE_URL";
const TRACKINGMORE_USAGE_KEY = "TRACKINGMORE_USAGE"; // JSON { date, count }
const TRACKINGMORE_LIMIT_KEY = "TRACKINGMORE_DAILY_LIMIT";
export const TRACKINGMORE_DEFAULT_DAILY_LIMIT = 500;
const USAGE_SETTLE_EVERY = 10; // persist counter to DB every N calls

// In-memory daily counter (single-instance deployment). Persisted to Settings
// periodically so a restart doesn't fully reset the daily budget.
let usageCache: { date: string; count: number } | null = null;

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

async function currentDailyLimit(): Promise<number> {
  const raw = await getSettingString(
    TRACKINGMORE_LIMIT_KEY,
    process.env.TRACKINGMORE_DAILY_LIMIT || String(TRACKINGMORE_DEFAULT_DAILY_LIMIT)
  );
  const n = parseInt(raw, 10);
  return Number.isNaN(n) || n < 1 ? TRACKINGMORE_DEFAULT_DAILY_LIMIT : n;
}

async function ensureUsageLoaded(): Promise<{ date: string; count: number }> {
  const today = todayStr();
  if (!usageCache || usageCache.date !== today) {
    try {
      const raw = await getSettingString(TRACKINGMORE_USAGE_KEY, "");
      const parsed = raw ? JSON.parse(raw) : null;
      usageCache =
        parsed && parsed.date === today
          ? { date: today, count: Number(parsed.count) || 0 }
          : { date: today, count: 0 };
    } catch {
      usageCache = { date: today, count: 0 };
    }
  }
  return usageCache;
}

async function persistUsage(): Promise<void> {
  if (!usageCache) return;
  try {
    await setSetting(TRACKINGMORE_USAGE_KEY, JSON.stringify(usageCache), {
      description: "TrackingMore daily usage counter (JSON {date, count})",
      isSecret: false,
    });
  } catch {
    // best-effort persistence
  }
}

/**
 * Current daily quota usage. Exposed via /api/v1/tracking/usage.
 */
export async function getTrackingMoreUsage(): Promise<{
  date: string;
  count: number;
  limit: number;
  remaining: number;
}> {
  const counter = await ensureUsageLoaded();
  const limit = await currentDailyLimit();
  return {
    date: counter.date,
    count: counter.count,
    limit,
    remaining: Math.max(0, limit - counter.count),
  };
}

async function assertUnderDailyQuota(): Promise<void> {
  const counter = await ensureUsageLoaded();
  const limit = await currentDailyLimit();
  if (counter.count >= limit) {
    throw new Error(
      `TrackingMore daily quota exceeded (${counter.count}/${limit}). Auto-sync will resume tomorrow.`
    );
  }
}

async function recordUsage(): Promise<void> {
  const counter = await ensureUsageLoaded();
  counter.count += 1;
  if (counter.count % USAGE_SETTLE_EVERY === 0) await persistUsage();
}

export interface TMCourier {
  courier_name?: string;
  courier_code?: string;
  courier_country_iso2?: string;
  courier_url?: string;
  courier_phone?: string;
  courier_type?: string;
  tracking_required_fields?: string[];
  optional_fields?: string[];
  default_language?: string;
  support_language?: string[];
  courier_logo?: string;
}

export interface TMTrackInfoEvent {
  status?: string;
  delivery_status?: string;
  tracking_detail?: string;
  location?: string;
  datetime?: string;
  date?: string;
  country?: string;
}

export interface TMTracking {
  id?: string;
  tracking_number?: string;
  courier_code?: string;
  order_number?: string;
  delivery_status?: string;
  substatus?: string;
  status_info?: string;
  latest_event?: string;
  latest_checkpoint_time?: string;
  estimated_delivery?: string;
  scheduled_delivery_date?: string;
  destination_country?: string | null;
  destination_city?: string | null;
  origin_country?: string | null;
  origin_city?: string | null;
  signed_by?: string;
  service_code?: string;
  weight_kg?: string;
  origin_info?: {
    trackinfo?: TMTrackInfoEvent[];
  };
  destination_info?: {
    trackinfo?: TMTrackInfoEvent[];
  };
}

interface TMResponse<T> {
  meta?: { code?: number; message?: string };
  data?: T;
}

function baseUrl(): string {
  return process.env.TRACKINGMORE_BASE_URL || "https://api.trackingmore.com/v4";
}

// Resolved key is read from Settings (DB) first, falling back to env.
async function apiKey(): Promise<string> {
  return getSettingString(TRACKINGMORE_KEY_SETTING, process.env.TRACKINGMORE_API_KEY || "");
}

async function resolvedBaseUrl(): Promise<string> {
  return getSettingString(TRACKINGMORE_URL_SETTING, baseUrl());
}

export async function isTrackingMoreConfigured(): Promise<boolean> {
  const key = await apiKey();
  return Boolean(key && key.length > 0 && key !== "YOUR_TRACKINGMORE_API_KEY");
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<TMResponse<T>> {
  const key = await apiKey();
  if (!key || key.length === 0 || key === "YOUR_TRACKINGMORE_API_KEY") {
    throw new Error(
      "TrackingMore API key not configured. Save TRACKINGMORE_API_KEY in Settings or set it in .env"
    );
  }

  await assertUnderDailyQuota();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(`${await resolvedBaseUrl()}${path}`, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        "Tracking-Api-Key": key,
      },
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = (await res.json().catch(() => ({}))) as any;

    if (json.meta && json.meta.code !== 200) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err: any = new Error(
        json.meta.message || `TrackingMore error (${json.meta.code})`
      );
      err.code = json.meta.code;
      throw err;
    }
    if (!res.ok) {
      throw new Error(`TrackingMore HTTP ${res.status}`);
    }
    return json;
  } finally {
    clearTimeout(timeout);
    await recordUsage();
  }
}

/**
 * GET /couriers/all — list all supported couriers.
 */
export async function getAllCouriers(): Promise<TMCourier[]> {
  const res = await request<TMCourier[] | { items?: TMCourier[] }>(
    "/couriers/all"
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = (res as any).data;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
}

/**
 * POST /couriers/detect — detect matching couriers for a tracking number.
 */
export async function detectCourier(
  trackingNumber: string
): Promise<TMCourier[]> {
  const res = await request<TMCourier[] | { items?: TMCourier[] }>(
    "/couriers/detect",
    { method: "POST", body: { tracking_number: trackingNumber } }
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = res.data;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
}

// /couriers/all payload is large; cache it briefly to avoid an extra API call
// on every detect. 6-hour TTL keeps required-fields info fresh.
const COURIERS_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
let couriersCache: TMCourier[] | null = null;
let couriersCacheLoadedAt = 0;

export async function getCouriersCached(): Promise<TMCourier[]> {
  if (
    couriersCache &&
    Date.now() - couriersCacheLoadedAt < COURIERS_CACHE_TTL_MS
  ) {
    return couriersCache;
  }
  try {
    const all = await getAllCouriers();
    if (Array.isArray(all) && all.length) {
      couriersCache = all;
      couriersCacheLoadedAt = Date.now();
    }
  } catch {
    // keep using any existing cache; never block courier resolution
  }
  return couriersCache || [];
}

// Human-friendly metadata for TrackingMore special required fields so the UI
// can render an input for each missing field.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function requiredFieldMeta(fields: string[]): any[] {
  const known: Record<string, { label: string; placeholder: string }> = {
    tracking_postal_code: {
      label: "Receiver ZIP / Postal Code",
      placeholder: "e.g. 10115",
    },
    tracking_destination_country: {
      label: "Destination Country code (2 letters)",
      placeholder: "e.g. DE",
    },
    tracking_ship_date: {
      label: "Shipment date (YYYY-MM-DD)",
      placeholder: "e.g. 2026-08-15",
    },
    tracking_phone: {
      label: "Receiver phone",
      placeholder: "e.g. +49...",
    },
    tracking_email: {
      label: "Receiver email",
      placeholder: "e.g. name@email.com",
    },
    order_number: {
      label: "Order number",
      placeholder: "e.g. CCG-12345",
    },
  };
  return (fields || [])
    .filter((f) => known[f])
    .map((f) => ({ name: f, ...known[f] }));
}

/**
 * Pick the best courier when detect returns several matches (common for DPD:
 * "dpd" + "dpd-de" + "dpd-uk" ...). Priority:
 *  1. a courier whose code matches the destination country ("dpd-de" for DE)
 *  2. a courier that needs NO special required fields (e.g. no postal code)
 *  3. the first detected courier
 */
export async function selectCourier(
  detected: Array<{ courier_code?: string }>,
  destinationCountryIso2?: string
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const codes = (detected || [])
    .map((c) => c?.courier_code)
    .filter((c): c is string => Boolean(c));
  if (codes.length === 0) return "";
  if (codes.length === 1) return codes[0];

  const dest = (destinationCountryIso2 || "").toLowerCase();

  // 1) destination-country match, e.g. code "dpd-de" for a DE parcel
  if (dest) {
    const countryMatch = codes.find((c) =>
      c.toLowerCase().endsWith(`-${dest}`)
    );
    if (countryMatch) return countryMatch;
  }

  // 2) prefer a courier with no mandatory special fields so the create won't
  //    be rejected for missing postal codes etc.
  try {
    const all = await getCouriersCached();
    if (all.length) {
      const required = new Map(
        all.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (c) => [c.courier_code, (c.tracking_required_fields || []) as string[]]
        )
      );
      const noRequired = codes.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (c) => !(required.get(c) || ([] as string[])).length
      );
      if (noRequired) return noRequired;
    }
  } catch {
    // fall through to first candidate
  }

  return codes[0];
}

/**
 * POST /trackings/create — create a tracking (realtime query).
 * Falls back to POST /trackings for accounts/API revisions where the
 * legacy /trackings/create path is rejected (HTTP 4130).
 */
export async function createTracking(
  payload: Record<string, unknown>
): Promise<TMTracking | null> {
  const pickData = (d: unknown): TMTracking | null => {
    if (!d) return null;
    if (Array.isArray(d)) return (d[0] as TMTracking) || null;
    return d as TMTracking;
  };

  try {
    const res = await request<TMTracking | TMTracking[]>("/trackings/create", {
      method: "POST",
      body: payload,
    });
    const created = pickData(res.data);
    if (created?.tracking_number) return created;
    // Success HTTP but no tracking object — account cannot persist creates.
    return handleEmptyCreate(payload);
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const code = (error as any)?.code;
    // /trackings/create is the legacy/deprecated path on some API revisions and
    // is rejected with 413x even for perfectly valid fields — fall back.
    if (typeof code === "number" && code >= 4130 && code < 4140) {
      const fallback = await request<TMTracking | TMTracking[]>("/trackings", {
        method: "POST",
        body: payload,
      });
      const created = pickData(fallback.data);
      if (created?.tracking_number) return created;
      return handleEmptyCreate(payload);
    }
    throw error;
  }
}

/**
 * POST /trackings can answer 200 with an EMPTY data array when the account is
 * not allowed to create trackings (unactivated/read-only plan). Turn that
 * silent failure into a clear, catchable error so callers can surface it
 * instead of appearing to succeed.
 */
async function handleEmptyCreate(payload: Record<string, unknown>): Promise<never> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const err: any = new Error(
    `TrackingMore accepted the request but returned no tracking object. The API key/account may not be authorised to create trackings.`
  );
  err.code = 4199;
  err.logPayload = {
    tracking_number: payload.tracking_number,
    courier_code: payload.courier_code,
    tracking_postal_code: payload.tracking_postal_code,
    tracking_destination_country: payload.tracking_destination_country,
  };
  throw err;
}

/**
 * POST /trackings/batch — create up to 40 trackings in one call.
 */
export async function createTrackingsBatch(
  items: Array<Record<string, unknown>>
): Promise<{ success?: unknown[]; error?: unknown[] }> {
  const res = await request<{ success?: unknown[]; error?: unknown[] }>(
    "/trackings/batch",
    { method: "POST", body: { items } }
  );
  return (res.data as { success?: unknown[]; error?: unknown[] }) || {};
}

/**
 * GET /trackings/get — get tracking results for tracking numbers (comma-separated).
 */
export async function getTrackings(
  trackingNumbers: string[],
  options: { courierCode?: string; lang?: string } = {}
): Promise<TMTracking[]> {
  const numbers = trackingNumbers.slice(0, 40).join(",");
  const params = new URLSearchParams({ tracking_numbers: numbers });
  if (options.courierCode) params.set("courier_code", options.courierCode);
  if (options.lang) params.set("lang", options.lang);

  try {
    const res = await request<TMTracking[]>(
      `/trackings/get?${params.toString()}`
    );
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    // TrackingMore returns 4102/4103 etc when a number hasn't been created
    // yet in this account — that's a normal "empty" state, not a real error.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const code = (error as any)?.code;
    if (code === 4102 || code === 4103 || code === 4104 || code === 4106) {
      return [];
    }
    throw error;
  }
}

/**
 * Map a TrackingMore delivery_status to the local Track.status enum.
 * Handles the vendor status vocabulary (incl. separators like "out_for_delivery"
 * and "out for delivery") as well as the TM summary statuses.
 */
export function mapTMDeliveryStatus(tmStatus?: string): string {
  const s = (tmStatus || "")
    .toLowerCase()
    .replace(/[_\-/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  switch (s) {
    case "pending":
    case "picked":
    case "picked up":
    case "shipping information received":
    case "inforeceived":
      return "pickup-pending";
    case "transit":
    case "in transit":
    case "intransit":
    case "on the way":
    case "arriving":
      return "in-transit";
    case "arrived":
    case "arrived at facility":
      return "arrived-at-hub";
    case "customs":
    case "custom clearance":
    case "customs clearance":
    case "customclearance":
      return "customs-clearance";
    case "pickup":
    case "outfordelivery":
    case "out for delivery":
    case "on vehicle for delivery":
      return "out-for-delivery";
    case "delivered":
      return "delivered";
    case "exception":
    case "undelivered":
    case "notfound":
    case "not found":
    case "expired":
    case "undeliverable":
    case "delivery failed":
    case "failed":
      return "failed";
    case "pending_requery":
      return "pickup-pending";
    default:
      return "created";
  }
}

/**
 * When TrackingMore trackinfo events don't carry a delivery_status field
 * (common with DHL, FedEx, Aramex, UPS and several other carriers), fall back
 * to inferring the pipeline stage from the canonical scan text used across
 * the major global carriers.
 */
export function inferStatusFromText(description?: string): string {
  const t = (description || "").toLowerCase();
  if (!t) return "created";

  // Our own order-placement event ("Order has been placed and is being
  // processed") must stay "created" — never misclassified as transit.
  if (/^order has been placed|^order created|^order placed/.test(t)) {
    return "created";
  }

  // ---- Delivery complete ----
  if (
    /delivered|delivery completed|successful(ly)? delivered|signed for|delivered to recipient|delivery done|final delivery/.test(
      t
    )
  ) {
    return "delivered";
  }
  // ---- Failed / exceptions / returns / address issues ----
  if (
    /undeliverable|not delivered|delivery failed|failed delivery|return to sender|being returned|returning|returned|sent back|exception|damaged|could not deliver|held .*customs.*unpaid|insufficient address|address problem|address unknown|delivery attempted.*unsuccessful|attempted to deliver|delivery attempted|missed delivery|delivery rescheduled|rescheduled|not home|no such number|not available|unclaimed|delivery refused|refused|no delivery attempted|business closed|recipient not available|unable to deliver/.test(
      t
    )
  ) {
    return "failed";
  }
  // ---- Out for delivery ----
  if (
    /out for delivery|out with courier|with courier for delivery|on vehicle for delivery|on delivery vehicle|loaded on .*vehicle|loaded for delivery|loaded for depart|out for shipment|scheduled for delivery|for delivery|ready for pickup|available for pickup|available for collection|delivery champion|doorstep|out on delivery|on the way to the customer|soon with .*customer/.test(
      t
    )
  ) {
    return "out-for-delivery";
  }
  // ---- Customs ----
  if (
    /customs|custom clearance|clearance processing|custom cleared|customs cleared|released from customs|clearance complete|clearance event|international shipment release|release .*import|import (release|clearance)|available for clearance|awaiting clearance|at the clearing agency|customs hold|customs inspection|customs pending|under customs/.test(
      t
    )
  ) {
    return "customs-clearance";
  }
  // ---- Arrived at a hub / sort facility / depot / transit office ----
  if (
    /arrived at .*(facility|hub|depot|station|terminal|center|centre|office|destination|sorting|post office|location|airport)|arrived .*delivery facility|received at|reached .*(office|depot|facility|hub|station)|unload|unloaded|scanned at|\bat .*(facility|hub|depot|sort facility|station|terminal|post office)\b|\barrived\b/.test(
      t
    )
  ) {
    return "arrived-at-hub";
  }
  // ---- In transit / departed / en route ----
  if (
    /departed|departure|in transit|transit to destination|en route|on the way|on its way|shipped|outbound|processed at|being processed|processing|handed over|tendered|forwarded|forwarded by|left .*(facility|hub|depot|office|station)|on the move|in transit company|processed through facility|transporting|arriving|destination scan|heading .*(to|for)|bound for|leaving|leaves|moved to|international dispatch|outbound delivery|dispatched|dispatched by|in transit to/.test(
      t
    )
  ) {
    return "in-transit";
  }
  // ---- Picked up / accepted / label created / info received ----
  if (
    /accepted|picked up|pickup|received by carrier|shipment accepted|info received|information received|label created|label printed|shipper created|manifest|pre-advice|information sent|shipment information|electronic shipping|collected from the shipper|collected|preparing your|preparing shipment|we'?re preparing|usps awaiting item|pending shipment pickup|waiting for carrier|shipment picked/.test(
      t
    )
  ) {
    return "pickup-pending";
  }
  // ---- Default ----
  return "created";
}

/**
 * Extract normalized timeline steps from a TrackingMore tracking object.
 */
export function extractTimelineEvents(
  tracking: TMTracking
): Array<{
  status: string;
  description: string;
  location: { city: string; country: string };
  timestamp: Date;
}> {
  const events: Array<{
    status: string;
    description: string;
    location: { city: string; country: string };
    timestamp: Date;
  }> = [];

  const sections = [
    tracking.origin_info?.trackinfo,
    tracking.destination_info?.trackinfo,
  ].filter(Boolean);

  for (const section of sections) {
    for (const rawEv of section || []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ev = rawEv as any;
      const description = String(
        ev.tracking_detail ||
          (ev.status || "").replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
      );
      let status = mapTMDeliveryStatus(ev.delivery_status || ev.status);
      // Many carriers omit the per-event status field — infer it from the text
      // so the timeline shows real stages (in-transit, arrived-at-hub, ...)
      // instead of "created" everywhere.
      if (status === "created" && description) {
        status = inferStatusFromText(description);
      }
      const rawLocation =
        Array.isArray(ev.location) ?
          ev.location
            .filter((l: { city?: string }) => l?.city)
            .map((l: { city?: string }) => l.city)
            .join(", ")
          : typeof ev.location === "string"
            ? ev.location
            : typeof ev.location === "object" && ev.location?.city
              ? ev.location.city
              : "";
      events.push({
        status,
        description,
        location: { city: typeof rawLocation === "string" ? rawLocation : "", country: ev.country || "" },
        timestamp: new Date(ev.datetime || ev.date || Date.now()),
      });
    }
  }

  return events;
}