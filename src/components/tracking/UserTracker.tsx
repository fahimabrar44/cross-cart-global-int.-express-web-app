"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/AuthContext";
import { CountryPhoneInput } from "@/components/ui/phone-input";
import { validatePhone } from "@/lib/phoneCountries";
import { hasConsent } from "@/lib/visitor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LEAD_KEY = "ccg_visitor_lead";
const VISIT_KEY = "ccg_visit_tracking";

const SERVICE_TYPES = [
  "International Courier",
  "Parcel / Document Delivery",
  "E-commerce Shipping",
  "Corporate / Business Logistics",
  "Warehousing / Fulfillment",
  "Other",
];

interface LeadData {
  name: string;
  phone: string;
  email: string;
  serviceType: string;
  submittedAt: string;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// Track how many times the visitor entered the site per day (anonymous, localStorage only).
function trackVisit(): void {
  try {
    const raw = localStorage.getItem(VISIT_KEY);
    const today = todayStr();
    let data = raw ? JSON.parse(raw) : null;
    if (!data || data.date !== today) {
      data = { date: today, count: 1 };
    } else {
      data.count = (data.count || 0) + 1;
    }
    localStorage.setItem(VISIT_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors (private mode, etc.)
  }
}

export default function UserTracker() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Track visits per page entry (independent of consent gating).
  useEffect(() => {
    trackVisit();
  }, [pathname]);

  // Wait for cookie consent before showing the lead modal so the cookie
  // banner appears first. For returning visitors consent already exists.
  const [consentDecided, setConsentDecided] = useState(false);
  useEffect(() => {
    setConsentDecided(hasConsent());
    const onConsent = () => setConsentDecided(true);
    window.addEventListener("ccg-consent-set", onConsent);
    return () => window.removeEventListener("ccg-consent-set", onConsent);
  }, []);

  useEffect(() => {
    // Don't show for logged-in users, on the dashboard, or on auth pages,
    // and only after the visitor has responded to the cookie banner.
    const isDashboard = pathname?.startsWith("/dashboard");
    const isAuth = pathname?.startsWith("/auth");

    let submitted = false;
    try {
      submitted = Boolean(localStorage.getItem(LEAD_KEY));
    } catch {
      submitted = false;
    }

    if (loading || user || submitted || isDashboard || isAuth || !consentDecided) {
      setShow(false);
      return;
    }
    setShow(true);
  }, [pathname, user, loading, consentDecided]);

  // Lock background scroll while the mandatory modal is open.
  useEffect(() => {
    if (!show) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!validatePhone(phone).valid) {
      setError("Please enter a valid phone number");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!serviceType) {
      setError("Please select a service type");
      return;
    }

    setSubmitting(true);
    const data: LeadData = {
      name: name.trim(),
      phone,
      email: email.trim(),
      serviceType,
      submittedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(LEAD_KEY, JSON.stringify(data));
      try {
        const res = await fetch("/api/v1/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const result = await res.json().catch(() => null);
        if (!res.ok || !result?.success) {
          console.warn(
            "Lead backend capture failed:",
            result?.message || res.status
          );
        }
      } catch (err) {
        console.warn("Lead backend capture error:", err);
      }
    } catch {
      // ignore storage errors
    }
    setSubmitting(false);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-xl bg-background p-6 shadow-2xl"
      >
        <div>
          <h2 className="text-lg font-bold">Welcome to Cross Cart Global</h2>
          <p className="text-sm text-muted-foreground">
            Please share a few details so we can serve you better.
          </p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="Your name"
          />
        </div>

        <div className="space-y-2">
          <Label>Phone Number</Label>
          <CountryPhoneInput
            value={phone}
            onChange={(v) => {
              setPhone(v);
              setError("");
            }}
            placeholder="1XXXXXXXXX"
          />
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label>Service Type</Label>
          <Select
            value={serviceType}
            onValueChange={(v) => {
              setServiceType(v);
              setError("");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a service" />
            </SelectTrigger>
            <SelectContent className="z-[200]">
              {SERVICE_TYPES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Submitting…" : "Submit"}
        </Button>
      </form>
    </div>
  );
}
