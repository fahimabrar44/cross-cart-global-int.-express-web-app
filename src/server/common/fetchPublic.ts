/**
 * Server-side data fetching for public (SSR) pages.
 * Always fetches fresh data on each request (`cache: "no-store"`) so the
 * server-rendered HTML includes current API data for SEO.
 */
import { headers } from "next/headers";

async function getBaseUrl(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("host");
    const proto = h.get("x-forwarded-proto") || "https";
    if (host) return `${proto}://${host}/`;
  } catch {
    // headers() throws when called outside a request scope (e.g. during build)
  }
  return process.env.PUBLIC_APP_URL || "http://localhost:3000/";
}

export async function fetchPublicData<T>(path: string): Promise<T[]> {
  try {
    const base = await getBaseUrl();
    const res = await fetch(`${base}api/v1/${path}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.data) ? (json.data as T[]) : [];
  } catch {
    return [];
  }
}

export async function fetchPublicObject<T>(path: string): Promise<T | null> {
  try {
    const base = await getBaseUrl();
    const res = await fetch(`${base}api/v1/${path}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data && !Array.isArray(json.data) ? (json.data as T) : null;
  } catch {
    return null;
  }
}
