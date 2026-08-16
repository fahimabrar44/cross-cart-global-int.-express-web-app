"use client";

import Clarity from "@microsoft/clarity";
import { getConsent } from "@/lib/visitor";

const projectId = process.env.NEXT_PUBLIC_CLARITY_ID || "y378uietdz";

let initialized = false;

export function getClarityProjectId(): string {
  return projectId;
}

export function isClarityInitialized(): boolean {
  return initialized;
}

export function initClarity(): void {
  if (typeof window === "undefined" || initialized) return;
  if (!projectId) return;
  try {
    Clarity.init(projectId);
    initialized = true;
  } catch {
    /* ignore init errors */
  }
}

export function clarityConsentGranted(): boolean {
  if (typeof window === "undefined") return false;
  const consent = getConsent();
  // No stored consent yet -> don't record until the visitor decides.
  if (!consent) return false;
  return Boolean(consent.analytics);
}

export function syncClarityConsent(): void {
  if (typeof window === "undefined") return;
  if (clarityConsentGranted()) {
    initClarity();
    try {
      Clarity.consent(true);
    } catch {
      /* ignore */
    }
  } else {
    try {
      Clarity.consent(false);
    } catch {
      /* ignore */
    }
  }
}

export function trackClarityEvent(name: string): void {
  if (typeof window === "undefined" || !initialized) return;
  try {
    Clarity.event(name);
  } catch {
    /* ignore */
  }
}

export function setClarityTag(key: string, value: string | string[]): void {
  if (typeof window === "undefined" || !initialized) return;
  try {
    Clarity.setTag(key, value);
  } catch {
    /* ignore */
  }
}

export function identifyClarity(customId: string, friendlyName?: string): void {
  if (typeof window === "undefined" || !initialized) return;
  try {
    Clarity.identify(customId, undefined, undefined, friendlyName);
  } catch {
    /* ignore */
  }
}
