import connectDB from "@/config/db";
import { createApiHandler } from "@/server/common/apiWrapper";
import { errorResponse, successResponse } from "@/server/common/response";
import { Setting } from "@/server/models/Settings.model";
import { setSetting } from "@/server/services/settingsService";

// Keys the app understands. Admin panel shows only these.
const KNOWN_SETTING_KEYS = [
  "TRACKINGMORE_API_KEY",
  "TRACKINGMORE_BASE_URL",
  "TRACKING_PROVIDER",
  "TRACKING_API_URL",
  "TRACKING_API_KEY",
];

function sanitizeSetting(doc: {
  key: string;
  value: string | number | boolean;
  description?: string;
  isSecret?: boolean;
  updatedAt?: Date;
}): {
  key: string;
  value: string | number | boolean;
  description: string;
  isSecret: boolean;
  masked: boolean;
  updatedAt?: Date;
} {
  return {
    key: doc.key,
    value: doc.isSecret ? "••••••••" : doc.value,
    description: doc.description || "",
    isSecret: Boolean(doc.isSecret),
    masked: Boolean(doc.isSecret),
    updatedAt: doc.updatedAt,
  };
}

/**
 * GET /api/v1/settings — list known integration settings (moderator/admin).
 */
export const GET = createApiHandler(
  async () => {
    try {
      await connectDB();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const docs: any[] = await Setting.find({ key: { $in: KNOWN_SETTING_KEYS } })
        .select("key value description isSecret updatedAt")
        .lean();

      const found = new Map(docs.map((d) => [d.key, d]));
      const list = KNOWN_SETTING_KEYS.map((key) => {
        const doc = found.get(key);
        return doc
          ? sanitizeSetting(doc)
          : { key, value: "", description: "", isSecret: false, masked: false };
      });

      return successResponse({
        status: 200,
        message: "Settings retrieved",
        data: list,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to fetch settings";
      return errorResponse({ status: 500, message: msg });
    }
  },
  { requireModerator: true }
);

/**
 * PUT /api/v1/settings — upsert one known setting (admin only).
 * Body: { key, value, isSecret? }
 */
export const PUT = createApiHandler(
  async ({ req, user }) => {
    try {
      if (!user || user.role !== "admin") {
        return errorResponse({ status: 403, message: "Forbidden", req });
      }
      const body = await req.json();
      const key = String(body.key || "").trim().toUpperCase();
      if (!KNOWN_SETTING_KEYS.includes(key)) {
        return errorResponse({ status: 400, message: "Unknown setting key", req });
      }

      let value: string | number | boolean = body.value;
      if (key === "TRACKING_PROVIDER") {
        const v = String(body.value || "none").toLowerCase();
        if (!["none", "trackingmore", "generic", "query"].includes(v)) {
          return errorResponse({ status: 400, message: "Invalid TRACKING_PROVIDER", req });
        }
        value = v;
      } else {
        value = String(body.value || "").trim();
      }

      const isSecret = key === "TRACKINGMORE_API_KEY" || key === "TRACKING_API_KEY";
      await setSetting(key, value, {
        isSecret,
        description: body.description || "",
        updatedBy: user.id,
      });

      return successResponse({
        status: 200,
        message: "Setting saved",
        data: { key, value: isSecret ? "••••••••" : value, isSecret },
        req,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to save setting";
      return errorResponse({ status: 500, message: msg, req });
    }
  },
  { requireAdmin: true }
);