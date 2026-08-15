/**
 * Server-side data fetching for public (SSR) pages.
 * Always fetches fresh data on each request (`cache: "no-store"`) so the
 * server-rendered HTML includes current API data for SEO.
 */
export async function fetchPublicData<T>(path: string): Promise<T[]> {
  const base = process.env.PUBLIC_APP_URL || "http://localhost:3000/";
  try {
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
