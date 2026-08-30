"use client";

import { useEffect } from "react";
import { syncClarityConsent } from "@/lib/clarity";

function whenIdle(fn: () => void) {
  const w = typeof window !== "undefined" ? window : undefined;
  if (w && "requestIdleCallback" in w) {
    w.requestIdleCallback(() => fn(), { timeout: 4000 });
  } else {
    setTimeout(fn, 3500);
  }
}

export default function ClarityAnalytics() {
  useEffect(() => {
    // Defer Clarity's initial load so it doesn't compete with LCP/interactivity.
    whenIdle(() => syncClarityConsent());

    const onConsent = () => syncClarityConsent();
    window.addEventListener("ccg-consent-set", onConsent);
    return () => window.removeEventListener("ccg-consent-set", onConsent);
  }, []);

  return null;
}
