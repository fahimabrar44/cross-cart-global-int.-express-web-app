// SMS Gateway Service
// Supports GreenWeb.biz style API by default. Override via env:
// SMS_PROVIDER=greenweb|twilio|custom
// SMS_API_URL, SMS_API_KEY, SMS_SENDER_ID for custom/greenweb style.

interface SmsOptions {
  phone: string;
  message: string;
}

function normalizePhone(phone: string): string {
  let p = phone.replace(/[^\d+]/g, "");
  if (p.startsWith("+88")) p = p.slice(3);
  if (p.startsWith("880")) p = p.slice(3);
  if (p.startsWith("01") && p.length === 11) p = p.slice(1); // -> 1XXXXXXXXX
  return p;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function postJson(url: string, body: any): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return await response.json().catch(() => ({}));
  } finally {
    clearTimeout(timeout);
  }
}

async function sendGreenWeb({ phone, message }: SmsOptions) {
  const apiUrl =
    process.env.SMS_API_URL || "http://api.greenweb.com.bd/api.php";
  const smsApiKey = process.env.SMS_API_KEY || "";
  const senderId = process.env.SMS_SENDER_ID || "CROSSCART";

  const params = new URLSearchParams({
    token: smsApiKey,
    to: normalizePhone(phone),
    message,
  });
  if (senderId) params.set("senderid", senderId);

  const response = await fetch(`${apiUrl}?${params.toString()}`);
  const text = await response.text();
  return { ok: response.ok, raw: text };
}

function isConfigured(): boolean {
  const key = process.env.SMS_API_KEY;
  return Boolean(key && key.length > 0 && key !== "YOUR_SMS_API_KEY");
}

export async function sendSms(options: SmsOptions): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!isConfigured()) {
      console.log(
        `[SMS][DEV] SMS_API_KEY not configured. Skipping send to ${options.phone}: ${options.message}`
      );
      return { success: true };
    }

    const provider = process.env.SMS_PROVIDER || "greenweb";

    if (provider === "greenweb") {
      const result = await sendGreenWeb(options);
      return { success: result.ok };
    }

    if (provider === "custom") {
      const apiUrl = process.env.SMS_API_URL;
      if (!apiUrl) return { success: false, error: "SMS_API_URL missing" };
      const result = await postJson(apiUrl, {
        phone: options.phone,
        message: options.message,
        apiKey: process.env.SMS_API_KEY,
        senderId: process.env.SMS_SENDER_ID,
      });
      return { success: !result.error };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (provider === "twilio") {
      return {
        success: false,
        error: "Twilio SMS provider not implemented yet.",
      };
    }

    return { success: false, error: `Unknown SMS provider: ${provider}` };
  } catch (error) {
    console.error("SMS error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "SMS send failed",
    };
  }
}

export function getNormalizedPhone(phone: string): string {
  return normalizePhone(phone);
}