import crypto from "crypto";
import { getMarketingConfig } from "@/server/services/marketingConfigService";

function sha256(value?: string): string | undefined {
  if (!value) return undefined;
  return crypto
    .createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex");
}

function normalizePhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  return phone.replace(/[^\d+]/g, "");
}

function getCookie(headers: Headers, name: string): string | undefined {
  const raw = headers.get("cookie") || "";
  const match = raw.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? match[1] : undefined;
}

export interface MetaCapiUser {
  email?: string;
  phone?: string;
}

export interface MetaCapiOptions {
  customData?: Record<string, unknown>;
  req?: Request;
  eventSourceUrl?: string;
}

/**
 * Server-side Meta Conversions API event. No-op when the access token or pixel
 * id is not configured, and never throws (errors are logged only).
 */
export async function sendMetaCapiEvent(
  eventName: string,
  user: MetaCapiUser,
  options?: MetaCapiOptions
): Promise<void> {
  try {
    const cfg = await getMarketingConfig();
    const PIXEL_ID =
      cfg?.metaPixelId ||
      process.env.NEXT_PUBLIC_META_PIXEL_ID ||
      "26093014930391502";
    const ACCESS_TOKEN =
      cfg?.metaCapiToken || process.env.META_CAPI_ACCESS_TOKEN || "";
    if (!ACCESS_TOKEN || !PIXEL_ID) return;

    const req = options?.req as Request | undefined;
    const headers = req?.headers;
    const userAgent = headers?.get("user-agent") || undefined;
    const forwarded = headers?.get("x-forwarded-for");
    const ip = forwarded
      ? forwarded.split(",")[0].trim()
      : headers?.get("x-real-ip") || undefined;
    const fbp = headers ? getCookie(headers, "_fbp") : undefined;
    const fbc = headers ? getCookie(headers, "_fbc") : undefined;

    const phone = normalizePhone(user.phone);

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          event_source_url:
            options?.eventSourceUrl || headers?.get("referer") || undefined,
          user_data: {
            em: sha256(user.email),
            ph: phone ? sha256(phone) : undefined,
            client_user_agent: userAgent,
            client_ip_address: ip,
            fbp,
            fbc,
          },
          custom_data: options?.customData || {},
        },
      ],
    };

    const url = `https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn("Meta CAPI non-OK response:", res.status, text.slice(0, 200));
    }
  } catch (err) {
    console.error("Meta CAPI error:", err);
  }
}
