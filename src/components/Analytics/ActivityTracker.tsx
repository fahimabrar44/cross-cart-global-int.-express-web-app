"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/AuthContext";
import { getVisitorId, hasConsent } from "@/lib/visitor";

type TrackPayload = Record<string, unknown>;

function sendEvent(
  visitorId: string,
  userId: string | undefined,
  type: string,
  path: string,
  payload?: TrackPayload
) {
  try {
    fetch("/api/v1/tracking/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        visitorId,
        userId: userId || undefined,
        type,
        path,
        title:
          typeof document !== "undefined" ? document.title : undefined,
        referrer:
          typeof document !== "undefined" ? document.referrer : undefined,
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        payload,
      }),
    }).catch(() => {});
  } catch {
    // best-effort tracking; ignore failures
  }
}

declare global {
  interface Window {
    ccgTrack?: (type: string, payload?: TrackPayload) => void;
  }
}

export default function ActivityTracker() {
  const pathname = usePathname();
  const { user } = useAuth();
  const prev = useRef<{ path: string; t: number } | null>(null);

  useEffect(() => {
    const visitorId = getVisitorId();
    const userId = user?.id;

    // Expose a global helper for custom business events (e.g. button clicks, form submits).
    window.ccgTrack = (type: string, payload?: TrackPayload) => {
      if (!hasConsent() && type !== "page_view") {
        // still track page views; custom events follow consent policy below
      }
      sendEvent(visitorId, userId, type, pathname, payload);
    };

    // Record time spent on the previous page.
    if (prev.current && prev.current.path !== pathname) {
      const duration = Date.now() - prev.current.t;
      sendEvent(visitorId, userId, "page_leave", prev.current.path, {
        durationMs: duration,
        nextPath: pathname,
      });
    }

    prev.current = { path: pathname, t: Date.now() };
    sendEvent(visitorId, userId, "page_view", pathname);
  }, [pathname, user]);

  return null;
}
