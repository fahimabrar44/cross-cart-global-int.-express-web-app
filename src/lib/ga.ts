"use client";

import { getConsent } from "@/lib/visitor";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-554K530WCW";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void;
    dataLayer?: unknown[];
  }
}

export function getGAMeasurementId(): string {
  return GA_ID;
}

export function gaEvent(
  name: string,
  params?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  try {
    window.gtag("event", name, params || {});
  } catch {
    /* ignore */
  }
}

export function gaSetUserId(userId: string): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  try {
    window.gtag("config", GA_ID, { user_id: userId });
  } catch {
    /* ignore */
  }
}

export function gaSetUserProperty(key: string, value: string): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  try {
    window.gtag("set", { [key]: value });
  } catch {
    /* ignore */
  }
}

export function gaSetConsent(granted: boolean): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  try {
    window.gtag("consent", "update", {
      analytics_storage: granted ? "granted" : "denied",
    });
  } catch {
    /* ignore */
  }
}

export function syncGAConsent(): void {
  if (typeof window === "undefined") return;
  const consent = getConsent();
  // No stored consent yet -> keep analytics storage denied.
  const granted = Boolean(consent?.analytics);
  gaSetConsent(granted);
}
