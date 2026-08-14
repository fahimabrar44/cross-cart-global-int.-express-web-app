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
        "Trackingmore-Api-Key": key,
      },
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = (await res.json().catch(() => ({}))) as any;

    if (json.meta && json.meta.code !== 200) {
      throw new Error(
        json.meta.message || `TrackingMore error (${json.meta.code})`
      );
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

/**
 * POST /trackings/create — create a tracking (realtime query).
 */
export async function createTracking(
  payload: Record<string, unknown>
): Promise<TMTracking | null> {
  const res = await request<TMTracking>("/trackings/create", {
    method: "POST",
    body: payload,
  });
  return (res.data as TMTracking) || null;
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

  const res = await request<TMTracking[]>(
    `/trackings/get?${params.toString()}`
  );
  return Array.isArray(res.data) ? res.data : [];
}

/**
 * Map a TrackingMore delivery_status to the local Track.status enum.
 */
export function mapTMDeliveryStatus(tmStatus?: string): string {
  const s = (tmStatus || "").toLowerCase();
  switch (s) {
    case "pending":
      return "pickup-pending";
    case "inforeceived":
      return "created";
    case "transit":
      return "in-transit";
    case "pickup":
      return "out-for-delivery";
    case "delivered":
      return "delivered";
    case "exception":
      return "failed";
    case "undelivered":
      return "failed";
    case "expired":
      return "failed";
    case "notfound":
      return "failed";
    case "pending_requery":
      return "pickup-pending";
    default:
      return "created";
  }
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
      const status = mapTMDeliveryStatus(ev.delivery_status || ev.status);
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
        description:
          ev.tracking_detail ||
          (ev.status || "").replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
        location: { city: typeof rawLocation === "string" ? rawLocation : "", country: ev.country || "" },
        timestamp: new Date(ev.datetime || ev.date || Date.now()),
      });
    }
  }

  return events;
}