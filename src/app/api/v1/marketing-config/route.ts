import connectDB from "@/config/db";
import { createApiHandler } from "@/server/common/apiWrapper";
import { errorResponse, successResponse } from "@/server/common/response";
import {
  getMarketingConfig,
  updateMarketingConfig,
} from "@/server/services/marketingConfigService";

const MASK = "••••••••";

// GET /api/v1/marketing-config — current config (moderator/admin). Token masked.
export const GET = createApiHandler(
  async () => {
    try {
      await connectDB();
      const doc = await getMarketingConfig();
      const data = doc
        ? {
            metaPixelId: doc.metaPixelId || "",
            metaCapiToken: doc.metaCapiToken ? MASK : "",
            tiktokPixelId: doc.tiktokPixelId || "",
            linkedinPartnerId: doc.linkedinPartnerId || "",
            pinterestTagId: doc.pinterestTagId || "",
            twitterPixelId: doc.twitterPixelId || "",
            googleAdsSendTo: doc.googleAdsSendTo || "",
          }
        : {
            metaPixelId: "",
            metaCapiToken: "",
            tiktokPixelId: "",
            linkedinPartnerId: "",
            pinterestTagId: "",
            twitterPixelId: "",
            googleAdsSendTo: "",
          };
      return successResponse({
        status: 200,
        message: "Marketing configuration retrieved",
        data,
      });
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : "Failed to fetch marketing configuration";
      return errorResponse({ status: 500, message: msg });
    }
  },
  { requireModerator: true }
);

// PUT /api/v1/marketing-config — upsert config (admin only).
export const PUT = createApiHandler(
  async ({ req, user }) => {
    try {
      if (!user || user.role !== "admin") {
        return errorResponse({ status: 403, message: "Forbidden", req });
      }
      const body = await req.json();
      const current = await getMarketingConfig();

      // Preserve the existing token when the client only sent the mask back.
      let metaCapiToken = String(body.metaCapiToken ?? "").trim();
      if (metaCapiToken === MASK && current?.metaCapiToken) {
        metaCapiToken = current.metaCapiToken;
      }

      const doc = await updateMarketingConfig(
        {
          metaPixelId: String(body.metaPixelId ?? "").trim(),
          metaCapiToken,
          tiktokPixelId: String(body.tiktokPixelId ?? "").trim(),
          linkedinPartnerId: String(body.linkedinPartnerId ?? "").trim(),
          pinterestTagId: String(body.pinterestTagId ?? "").trim(),
          twitterPixelId: String(body.twitterPixelId ?? "").trim(),
          googleAdsSendTo: String(body.googleAdsSendTo ?? "").trim(),
        },
        user.id
      );

      return successResponse({
        status: 200,
        message: "Marketing configuration saved",
        data: {
          metaPixelId: doc.metaPixelId,
          metaCapiToken: doc.metaCapiToken ? MASK : "",
          tiktokPixelId: doc.tiktokPixelId,
          linkedinPartnerId: doc.linkedinPartnerId,
          pinterestTagId: doc.pinterestTagId,
          twitterPixelId: doc.twitterPixelId,
          googleAdsSendTo: doc.googleAdsSendTo,
        },
        req,
      });
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : "Failed to save marketing configuration";
      return errorResponse({ status: 500, message: msg, req });
    }
  },
  { requireAdmin: true }
);
