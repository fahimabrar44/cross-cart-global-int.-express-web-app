/**
 * Server-side data fetching for public (SSR) pages.
 * Always fetches fresh data on each request (`cache: "no-store"`) so the
 * server-rendered HTML includes current API data for SEO.
 */
import { headers } from "next/headers";

function normalizeBaseUrl(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

/**
 * Candidate base URLs, in priority order.
 *
 * The request Host header is preferred so the fetch always targets the same
 * deployment the visitor is using. When a proxy does not forward
 * `x-forwarded-proto`, the other scheme is retried as well — this is what used
 * to leave public country/zone dropdowns empty on plain-HTTP deployments.
 */
async function getBaseUrlCandidates(): Promise<string[]> {
  const candidates: string[] = [];

  try {
    const h = await headers();
    const host = h.get("host");
    if (host) {
      const forwardedProto = h
        .get("x-forwarded-proto")
        ?.split(",")[0]
        ?.trim();
      const isLocalHost = /^(localhost|127\.0\.0\.1|\[::1\])(?::|$)/i.test(host);
      const preferredProto =
        forwardedProto ||
        (isLocalHost || process.env.NODE_ENV !== "production" ? "http" : "https");
      const alternateProto = preferredProto === "https" ? "http" : "https";

      candidates.push(normalizeBaseUrl(`${preferredProto}://${host}`));
      candidates.push(normalizeBaseUrl(`${alternateProto}://${host}`));
    }
  } catch {
    // headers() throws when called outside a request scope (e.g. during build)
  }

  const configured =
    process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (configured) candidates.push(normalizeBaseUrl(configured));

  candidates.push("http://localhost:3000/");

  return Array.from(new Set(candidates));
}

async function fetchPublicJson(path: string): Promise<unknown> {
  for (const base of await getBaseUrlCandidates()) {
    try {
      const res = await fetch(`${base}api/v1/${path}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) continue;
      return await res.json();
    } catch {
      // Try the next candidate (different scheme or configured URL).
    }
  }
  return null;
}

export async function fetchPublicData<T>(path: string): Promise<T[]> {
  const json = (await fetchPublicJson(path)) as { data?: unknown } | null;
  return Array.isArray(json?.data) ? (json.data as T[]) : [];
}

export async function fetchPublicObject<T>(path: string): Promise<T | null> {
  const json = (await fetchPublicJson(path)) as { data?: unknown } | null;
  return json?.data && !Array.isArray(json.data) ? (json.data as T) : null;
}
