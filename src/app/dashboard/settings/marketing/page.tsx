"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RoleGuard } from "@/middleware/roleGuard";
import { apiService } from "@/services/apiService";
import { KeyRound, Save, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const MASK = "••••••••";

interface MarketingConfig {
  metaPixelId: string;
  metaCapiToken: string;
  tiktokPixelId: string;
  linkedinPartnerId: string;
  pinterestTagId: string;
  twitterPixelId: string;
  googleAdsSendTo: string;
}

const FIELDS: {
  key: keyof MarketingConfig;
  label: string;
  hint: string;
  secret?: boolean;
  placeholder?: string;
}[] = [
  {
    key: "metaPixelId",
    label: "Meta Pixel ID",
    hint: "Meta (Facebook) Pixel ID, e.g. 26093014930391502",
    placeholder: "1234567890",
  },
  {
    key: "metaCapiToken",
    label: "Meta Conversions API Token",
    hint: "Server-side access token (kept secret). Used for Purchase / Lead / SignUp CAPI events.",
    secret: true,
    placeholder: "EAAxxxx…",
  },
  {
    key: "tiktokPixelId",
    label: "TikTok Pixel ID",
    hint: "TikTok Ads Manager pixel id",
    placeholder: "C1ABC12345XYZ",
  },
  {
    key: "linkedinPartnerId",
    label: "LinkedIn Partner ID",
    hint: "LinkedIn Insight Tag partner id (audience / retargeting)",
    placeholder: "1234567",
  },
  {
    key: "pinterestTagId",
    label: "Pinterest Tag ID",
    hint: "Pinterest business tag id",
    placeholder: "1234567890123",
  },
  {
    key: "twitterPixelId",
    label: "Twitter / X Pixel ID",
    hint: "Twitter Ads pixel id",
    placeholder: "oabc1234",
  },
  {
    key: "googleAdsSendTo",
    label: "Google Ads Conversion (send_to)",
    hint: "Format: AW-XXXXXXXXX/YYYYYYYYYYY",
    placeholder: "AW-123456789/AbCdEfGhIj",
  },
];

export default function MarketingSettingsPage() {
  const [form, setForm] = useState<MarketingConfig>({
    metaPixelId: "",
    metaCapiToken: "",
    tiktokPixelId: "",
    linkedinPartnerId: "",
    pinterestTagId: "",
    twitterPixelId: "",
    googleAdsSendTo: "",
  });
  const [currentToken, setCurrentToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await apiService.get<MarketingConfig>("/marketing-config");
        if (res.success && res.data) {
          setForm({
            ...res.data,
            metaCapiToken: res.data.metaCapiToken ? MASK : "",
          });
          setCurrentToken(res.data.metaCapiToken || "");
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleChange = (key: keyof MarketingConfig, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, string> = { ...form };
      // Don't overwrite the stored token if the user left the mask untouched.
      if (form.metaCapiToken === MASK && currentToken) {
        payload.metaCapiToken = currentToken;
      }
      const res = await apiService.put("/marketing-config", payload);
      if (res.success) {
        toast.success("Marketing configuration saved");
        const data = (res.data || {}) as Partial<MarketingConfig>;
        setForm((prev) => ({
          ...prev,
          ...data,
          metaCapiToken: data.metaCapiToken ? MASK : "",
        }));
        setCurrentToken(data.metaCapiToken || currentToken);
      } else {
        toast.error(res.message || "Failed to save configuration");
      }
    } catch {
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["admin", "moderator"]}>
      <div className="w-full h-auto bg-section py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#12352A]">
              Marketing Tools
            </h1>
            <p className="text-gray-600 mt-1">
              Manage advertising &amp; communication pixels (Meta, TikTok, LinkedIn,
              Pinterest, Twitter/X, Google Ads). Pixels only load after a visitor
              accepts the <strong>Marketing</strong> cookie.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Tracking Pixels &amp; Credentials
              </CardTitle>
              <CardDescription>
                Saved securely in the database. The CAPI token is never exposed to
                the browser.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {loading ? (
                <p className="text-sm text-gray-400">Loading…</p>
              ) : (
                FIELDS.map((f) => (
                  <div key={f.key} className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                      {f.secret && <KeyRound className="w-3.5 h-3.5 text-gray-400" />}
                      {f.label}
                    </label>
                    <input
                      type={f.secret ? "password" : "text"}
                      value={form[f.key]}
                      placeholder={f.placeholder}
                      onChange={(e) => handleChange(f.key, e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                    />
                    <p className="text-xs text-muted-foreground">{f.hint}</p>
                  </div>
                ))
              )}

              <div className="pt-2 flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={loading || saving}
                  className="bg-primary text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving…" : "Save Configuration"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}
