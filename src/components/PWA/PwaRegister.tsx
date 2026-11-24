"use client";
import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // In development a stale service worker can serve old chunks and make
    // hot reload/debugging unreliable, so remove any registered worker.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(registrations.map((registration) => registration.unregister()))
        )
        .catch(() => {
          /* ignore */
        });
      return;
    }

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          // Check for a newer worker on every full page load so deploys do
          // not keep serving an old cached build.
          registration.update().catch(() => {
            /* ignore */
          });
        })
        .catch(() => {
          /* SW registration failed; the app still works without it */
        });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
