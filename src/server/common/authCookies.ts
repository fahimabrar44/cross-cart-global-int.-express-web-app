import type { NextRequest, NextResponse } from "next/server";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";
/**
 * Readable (non-httpOnly) marker so the client knows a session cookie may
 * exist. Without it, guests trigger pointless /auth/me 401 + refresh 400
 * requests on every page load.
 */
export const SESSION_HINT_COOKIE = "cc_session";

const ACCESS_MAX_AGE = 15 * 60; // 15 minutes, matches the JWT lifetime
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

const baseOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

/**
 * Store JWTs in httpOnly cookies so browser JavaScript (and therefore XSS)
 * cannot read them. Bearer-token auth is still supported for API clients.
 */
export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
): void {
  response.cookies.set(ACCESS_COOKIE, accessToken, {
    ...baseOptions,
    maxAge: ACCESS_MAX_AGE,
  });
  response.cookies.set(REFRESH_COOKIE, refreshToken, {
    ...baseOptions,
    maxAge: REFRESH_MAX_AGE,
  });
  response.cookies.set(SESSION_HINT_COOKIE, "1", {
    ...baseOptions,
    httpOnly: false,
    maxAge: REFRESH_MAX_AGE,
  });
}

export function clearAuthCookies(response: NextResponse): void {
  response.cookies.set(ACCESS_COOKIE, "", { ...baseOptions, maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { ...baseOptions, maxAge: 0 });
  response.cookies.set(SESSION_HINT_COOKIE, "", {
    ...baseOptions,
    httpOnly: false,
    maxAge: 0,
  });
}

/** Authorization header wins (API clients), cookie is the browser fallback. */
export function getAccessToken(req: NextRequest): string | null {
  const authHeader =
    req.headers.get("authorization") || req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const headerToken = authHeader.slice(7).trim();
    // Older browser builds sent `Bearer null` when localStorage was empty.
    // Treat those placeholders as "no header" so the cookie still works.
    if (headerToken && headerToken !== "null" && headerToken !== "undefined") {
      return headerToken;
    }
  }
  return req.cookies.get(ACCESS_COOKIE)?.value || null;
}

export function getRefreshToken(req: NextRequest): string | null {
  return req.cookies.get(REFRESH_COOKIE)?.value || null;
}
