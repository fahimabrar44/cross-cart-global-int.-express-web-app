/**
 * Rate limiting that works in serverless / multi-instance deployments.
 *
 * When Upstash Redis REST credentials are configured we use Redis so every
 * instance shares the same counters. Without Redis we fall back to an
 * in-memory fixed window (fine for local development and single-instance
 * deployments, but not shared across instances).
 */

type MemoryEntry = { count: number; resetAt: number };

const memoryStore = new Map<string, MemoryEntry>();
const MEMORY_MAX_KEYS = 10_000;

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

function upstashUrl(): string | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return url.replace(/\/+$/, "");
}

async function redisCommand(
  command: string,
  ...args: Array<string | number>
): Promise<unknown> {
  const base = upstashUrl();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!base || !token) return null;

  try {
    const path = [command, ...args]
      .map((part) => encodeURIComponent(String(part)))
      .join("/");
    const response = await fetch(`${base}/${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(1500),
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { result?: unknown; error?: string };
    if (json.error) return null;
    return json.result ?? null;
  } catch {
    // Redis being unavailable must never take the API down.
    return null;
  }
}

function consumeMemory(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();

  // Opportunistic cleanup so the map cannot grow forever.
  if (memoryStore.size > MEMORY_MAX_KEYS) {
    for (const [k, entry] of memoryStore.entries()) {
      if (entry.resetAt <= now) memoryStore.delete(k);
    }
  }

  const existing = memoryStore.get(key);
  if (!existing || existing.resetAt <= now) {
    const entry: MemoryEntry = { count: 1, resetAt: now + windowMs };
    memoryStore.set(key, entry);
    return {
      allowed: limit >= 1,
      limit,
      remaining: Math.max(0, limit - 1),
      resetAt: entry.resetAt,
    };
  }

  existing.count += 1;
  return {
    allowed: existing.count <= limit,
    limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
}

/**
 * Consume one unit from a fixed-window rate limit bucket.
 *
 * @param key      Unique bucket name, e.g. `signup:1.2.3.4`
 * @param limit    Maximum requests allowed in the window
 * @param windowMs Window length in milliseconds
 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (limit <= 0) {
    return { allowed: true, limit: 0, remaining: 0, resetAt: Date.now() };
  }

  if (upstashUrl()) {
    const redisKey = `ratelimit:${key}`;
    const count = await redisCommand("incr", redisKey);

    if (typeof count === "number") {
      if (count === 1) {
        // First hit in this window: start the expiry. If this call fails the
        // key would live forever, so fall back to a short safety expiry.
        await redisCommand("pexpire", redisKey, windowMs);
      }
      return {
        allowed: count <= limit,
        limit,
        remaining: Math.max(0, limit - count),
        resetAt: Date.now() + windowMs,
      };
    }
    // Redis configured but unreachable -> use the local fallback.
  }

  return consumeMemory(key, limit, windowMs);
}

/** Test helper: clear the in-memory fallback store. */
export function resetInMemoryRateLimits(): void {
  memoryStore.clear();
}
