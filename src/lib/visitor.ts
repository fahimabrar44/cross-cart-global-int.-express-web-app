"use client";

const VISITOR_COOKIE = "ccg_vid";
const CONSENT_COOKIE = "ccg_cookie_consent";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getVisitorId(): string {
  if (typeof document === "undefined") return uuid();
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(VISITOR_COOKIE + "="));
  if (match) return match.split("=")[1];
  const id = uuid();
  document.cookie = `${VISITOR_COOKIE}=${id}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  return id;
}

export function hasConsent(): boolean {
  if (typeof document === "undefined") return false;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(CONSENT_COOKIE + "="));
  return Boolean(match);
}

export function getConsent(): Record<string, boolean> | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(CONSENT_COOKIE + "="));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match.split("=")[1]));
  } catch {
    return null;
  }
}
