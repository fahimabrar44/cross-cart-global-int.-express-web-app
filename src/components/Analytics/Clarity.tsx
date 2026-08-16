"use client";

import { useEffect } from "react";
import { syncClarityConsent } from "@/lib/clarity";

export default function ClarityAnalytics() {
  useEffect(() => {
    syncClarityConsent();

    const onConsent = () => syncClarityConsent();
    window.addEventListener("ccg-consent-set", onConsent);
    return () => window.removeEventListener("ccg-consent-set", onConsent);
  }, []);

  return null;
}
