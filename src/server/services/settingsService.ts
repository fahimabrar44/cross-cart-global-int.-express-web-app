import connectDB from "@/config/db";
import { Setting } from "@/server/models/Settings.model";

// In-memory cache so tracking calls don't hit the DB on every request.
// Sensible for single-instance deployments; TTL keeps it fresh.
interface CacheEntry {
  value: string | number | boolean | null;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const TTL_MS = 60_000; // 1 minute

function cacheKey(k: string): string {
  return `setting:${k}`;
}

function readCache(k: string): string | number | boolean | null {
  const entry = cache.get(cacheKey(k));
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(cacheKey(k));
    return null;
  }
  return entry.value;
}

function writeCache(k: string, value: string | number | boolean | null) {
  cache.set(cacheKey(k), { value, expiresAt: Date.now() + TTL_MS });
}

function invalidateCache(k: string) {
  cache.delete(cacheKey(k));
}

/**
 * Read a setting. Order: DB > env fallback.
 * @example getSetting("TRACKINGMORE_API_KEY")
 */
export async function getSetting(
  key: string,
  envFallback?: string
): Promise<string | number | boolean | null> {
  const cached = readCache(key);
  if (cached !== null) return cached;

  let value: string | number | boolean | null = null;
  try {
    await connectDB();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = (await Setting.findOne({ key }).lean()) as any;
    value = doc ? (doc.value as string | number | boolean) : null;
  } catch {
    value = null;
  }

  if (value === null && envFallback !== undefined) {
    value = envFallback;
  }

  writeCache(key, value);
  return value;
}

/** Read a setting as string, with env fallback. */
export async function getSettingString(
  key: string,
  envFallback?: string
): Promise<string> {
  const v = await getSetting(key, envFallback);
  if (v === null || v === undefined) return "";
  return String(v);
}

/** Read a setting as boolean. */
export async function getSettingBoolean(key: string, envFallback?: string): Promise<boolean> {
  const v = await getSetting(key, envFallback);
  if (v === null || v === undefined) return Boolean(envFallback);
  if (typeof v === "boolean") return v;
  return String(v).toLowerCase() === "true" || String(v) === "1";
}

/**
 * Upsert a setting (admin only).
 */
export async function setSetting(
  key: string,
  value: string | number | boolean,
  options: { description?: string; isSecret?: boolean; updatedBy?: string } = {}
): Promise<void> {
  await connectDB();
  await Setting.findOneAndUpdate(
    { key },
    {
      $set: {
        value,
        description: options.description ?? "",
        isSecret: options.isSecret ?? false,
        updatedBy: (options.updatedBy as unknown as import("mongoose").Types.ObjectId) ?? null,
      },
    },
    { upsert: true, new: true }
  );
  invalidateCache(key);
}

/** Clear a single key from cache (after writes/upserts happen elsewhere). */
export function invalidateSetting(key: string): void {
  invalidateCache(key);
}

/** Clear the whole settings cache. */
export function clearSettingsCache(): void {
  cache.clear();
}