import { getPublicMarketingConfig } from "@/server/services/marketingConfigService";
import { successResponse, errorResponse } from "@/server/common/response";

// GET /api/v1/marketing-config/public — public, non-secret pixel IDs for the
// client to load after marketing consent. NEVER returns the CAPI token.
export async function GET() {
  try {
    const data = await getPublicMarketingConfig();
    return successResponse({
      status: 200,
      message: "Public marketing configuration retrieved",
      data,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error
        ? error.message
        : "Failed to fetch public marketing configuration";
    return errorResponse({ status: 500, message: msg });
  }
}
