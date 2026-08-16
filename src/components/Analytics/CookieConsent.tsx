"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const CONSENT_COOKIE = "ccg_cookie_consent";

type Consent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
};

function readConsent(): Consent | null {
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

function saveConsent(c: Consent) {
  const value = encodeURIComponent(JSON.stringify(c));
  document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${
    60 * 60 * 24 * 365
  }; SameSite=Lax`;
  try {
    localStorage.setItem(CONSENT_COOKIE, value);
  } catch {
    // ignore storage errors
  }
}

const CATEGORIES: {
  key: keyof Omit<Consent, "necessary">;
  title: string;
  desc: string;
}[] = [
  {
    key: "analytics",
    title: "Analytics",
    desc: "Helps us understand how visitors use the site (pages visited, traffic sources) via tools like Microsoft Clarity.",
  },
  {
    key: "marketing",
    title: "Marketing",
    desc: "Used to show relevant ads and measure campaign performance across platforms.",
  },
  {
    key: "preferences",
    title: "Preferences",
    desc: "Remembers your choices such as language, currency and display settings.",
  },
];

export default function CookieConsent() {
  const [show, setShow] = useState(false);
  const [openPrefs, setOpenPrefs] = useState(false);
  const [prefs, setPrefs] = useState<Omit<Consent, "necessary">>({
    analytics: true,
    marketing: true,
    preferences: true,
  });

  useEffect(() => {
    const existing = readConsent();
    if (!existing) {
      setShow(true);
    } else {
      setPrefs({
        analytics: existing.analytics,
        marketing: existing.marketing,
        preferences: existing.preferences,
      });
    }
  }, []);

  const persist = (next: Omit<Consent, "necessary">) => {
    saveConsent({ necessary: true, ...next });
    setPrefs(next);
    setShow(false);
    setOpenPrefs(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("ccg-consent-set"));
    }
  };

  const acceptAll = () =>
    persist({ analytics: true, marketing: true, preferences: true });
  const rejectNonEssential = () =>
    persist({ analytics: false, marketing: false, preferences: false });

  if (!show) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-[120] flex justify-center p-4">
        <div className="w-full max-w-3xl rounded-xl border bg-background/95 p-5 shadow-2xl backdrop-blur">
          <h3 className="text-base font-semibold">We value your privacy</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            We use cookies to keep the site working, analyze traffic and
            personalize your experience. You can accept all cookies or manage
            your preferences. Necessary cookies are always active.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={acceptAll}>Accept All</Button>
            <Button variant="outline" onClick={rejectNonEssential}>
              Reject Non-Essential
            </Button>
            <Button
              variant="ghost"
              onClick={() => setOpenPrefs(true)}
              className="ml-auto"
            >
              Manage Preferences
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={openPrefs} onOpenChange={setOpenPrefs}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Cookie Preferences</DialogTitle>
            <DialogDescription>
              Choose which categories of cookies you allow. Necessary cookies
              cannot be disabled.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Necessary</p>
                <p className="text-xs text-muted-foreground">
                  Required for core functionality such as login, security and
                  cart.
                </p>
              </div>
              <Switch checked disabled />
            </div>

            {CATEGORIES.map((cat) => (
              <div
                key={cat.key}
                className="flex items-start justify-between gap-4 rounded-md border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{cat.title}</p>
                  <p className="text-xs text-muted-foreground">{cat.desc}</p>
                </div>
                <Switch
                  checked={prefs[cat.key]}
                  onCheckedChange={(v) =>
                    setPrefs((p) => ({ ...p, [cat.key]: v }))
                  }
                />
              </div>
            ))}
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={rejectNonEssential}>
              Reject Non-Essential
            </Button>
            <Button onClick={() => persist(prefs)}>Save Preferences</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
