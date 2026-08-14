import { NextRequest, NextResponse } from "next/server";
import { AuthMiddleware } from "@/middleware/auth";

/**
 * Accept either public access or API-key authenticated access.
 * - No X-API-Key header  => public access (success).
 * - X-API-Key present    => must be a valid, active key (usage/rate-limit
 *   tracking applied via ApiConfig); otherwise returns the error response.
 */
export async function verifyApiKeyIfProvided(
  req: NextRequest
): Promise<{ success: boolean; response?: NextResponse }> {
  const apiKey =
    req.headers.get("X-API-Key") || req.headers.get("x-api-key");
  if (!apiKey) return { success: true };

  return AuthMiddleware.validateApiKey(req);
}