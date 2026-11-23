import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * CORS is opt-in and configured with a comma-separated allowlist:
 *   CORS_ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
 *
 * Leaving it unset keeps the API same-origin only, which is the safe default
 * for cookie-authenticated browser sessions. API clients using Bearer tokens
 * do not need CORS at all.
 */
const configuredOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowAll = configuredOrigins.includes("*");
const allowedOrigins = configuredOrigins.filter((origin) => origin !== "*");

const ALLOWED_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
const ALLOWED_HEADERS = "Content-Type, Authorization, X-Requested-With";

function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin) return {};

  const allowed = allowAll || allowedOrigins.includes(origin);
  if (!allowed) return {};

  // Credentials (cookies) cannot be combined with a wildcard origin.
  if (allowAll) {
    return { "Access-Control-Allow-Origin": "*" };
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
}

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        ...headers,
        "Access-Control-Allow-Methods": ALLOWED_METHODS,
        "Access-Control-Allow-Headers": ALLOWED_HEADERS,
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = { matcher: "/api/:path*" };
