"use client";

import { getConsent } from "@/lib/visitor";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fbq?: (...args: any[]) => void;
    ttq?: {
      load: (id: string) => void;
      track: (event: string, params?: Record<string, unknown>) => void;
      page: () => void;
      identify?: (id: string) => void;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lintrk?: (...args: any[]) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pintrk?: (...args: any[]) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    twq?: (...args: any[]) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void;
  }
}

const GOOGLE_ADS_SEND_TO = process.env.NEXT_PUBLIC_GOOGLE_ADS_SEND_TO || "";

function marketingConsent(): boolean {
  const consent = getConsent();
  return Boolean(consent?.marketing);
}

/**
 * Fire a conversion event to every loaded ad pixel (Meta, TikTok, Pinterest,
 * Twitter/X) plus a Google Ads conversion. Respects the "marketing" cookie
 * consent category — does nothing until the visitor opts in.
 */
export function trackMarketingEvent(
  name: string,
  params?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  if (!marketingConsent()) return;

  const p = params || {};
  try {
    if (typeof window.fbq === "function") window.fbq("track", name, p);
  } catch {
    /* ignore */
  }
  try {
    if (typeof window.ttq?.track === "function") window.ttq.track(name, p);
  } catch {
    /* ignore */
  }
  try {
    if (typeof window.pintrk === "function") window.pintrk("track", name, p);
  } catch {
    /* ignore */
  }
  try {
    if (typeof window.twq === "function") window.twq("track", name, p);
  } catch {
    /* ignore */
  }
  try {
    if (typeof window.gtag === "function" && GOOGLE_ADS_SEND_TO) {
      window.gtag("event", "conversion", {
        send_to: GOOGLE_ADS_SEND_TO,
        event_name: name,
        ...p,
      });
    }
  } catch {
    /* ignore */
  }
  // LinkedIn Insight Tag is audience/retargeting only — no custom event API.
}
