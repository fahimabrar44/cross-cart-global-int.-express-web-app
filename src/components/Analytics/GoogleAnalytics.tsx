"use client";

import { useEffect } from "react";
import { syncGAConsent } from "@/lib/ga";

export default function GoogleAnalytics() {
  useEffect(() => {
    syncGAConsent();

    const onConsent = () => syncGAConsent();
    window.addEventListener("ccg-consent-set", onConsent);
    return () => window.removeEventListener("ccg-consent-set", onConsent);
  }, []);

  return null;
}
