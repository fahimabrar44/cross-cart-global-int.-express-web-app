import type { NextRequest } from "next/server";

/** Best-effort client IP extraction for rate limiting and audit logs. */
export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();

  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("x-vercel-forwarded-for") ||
    req.headers.get("x-remote-addr") ||
    "unknown"
  );
}
