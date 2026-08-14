"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleGuard } from "@/middleware/roleGuard";
import { apiService } from "@/services/apiService";
import { KeyRound, Radar, RefreshCw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface SettingField {
  key: string;
  value: string | number | boolean;
  description: string;
  isSecret: boolean;
  masked: boolean;
}

const FIELD_META: Record<
  string,
  { label: string; hint: string; type: "password" | "text" | "select" | "number"; options?: string[] }
> = {
  TRACKINGMORE_API_KEY: {
    label: "TrackingMore API Key",
    hint: "v4 API key from https://www.trackingmore.com — powers carrier tracking sync",
    type: "password",
  },
  TRACKINGMORE_BASE_URL: {
    label: "TrackingMore Base URL",
    hint: "Defaults to https://api.trackingmore.com/v4",
    type: "text",
  },
  TRACKING_PROVIDER: {
    label: "Tracking Provider",
    hint: "Which upstream service provides live tracking events",
    type: "select",
    options: ["none", "trackingmore", "generic", "query"],
  },
  TRACKING_API_URL: {
    label: "Tracking API URL",
    hint: "Endpoint for generic/query providers (POST json body or GET ?tracking=)",
    type: "text",
  },
  TRACKING_API_KEY: {
    label: "Tracking API Key",
    hint: "Bearer token for generic/query providers (optional)",
    type: "password",
  },
};

export default function TrackingApiSettingsPage() {
  const [settings, setSettings] = useState<SettingField[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await apiService.get("/settings");
      if (response.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list = (response.data as any[]) || [];
        setSettings(list);
        const next: Record<string, string> = {};
        for (const s of list) {
          next[s.key] = s.masked || s.isSecret ? "" : String(s.value ?? "");
        }
        setValues(next);
      } else {
        toast.error(response.message || "Failed to load settings");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateValue = (key: string, v: string) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const saveSetting = async (key: string) => {
    const meta = FIELD_META[key];
    const raw = values[key] ?? "";

    // Don't save empty secret unless user typed a real value
    if (meta.type === "password" && !raw) {
      toast.info("Enter a value to update the key");
      return;
    }

    setSavingKey(key);
    try {
      const response = await apiService.put("/settings", { key, value: raw });
      if (response.success) {
        toast.success(`${meta.label} saved`);
        setValues((prev) => ({ ...prev, [key]: "" }));
        await fetchSettings();
      } else {
        toast.error(response.message || "Failed to save");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <RoleGuard allowedRoles={["admin", "moderator"]}>
      <div className="space-y-6" data-testid="tracking-api-settings-page">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tracking API</h1>
            <p className="text-muted-foreground">
              Configure carrier tracking integrations (TrackingMore, generic /
              query providers). Only admins can save.
            </p>
          </div>
          <Button variant="outline" onClick={fetchSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading settings...</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {settings.map((s) => {
              const meta = FIELD_META[s.key] || {
                label: s.key,
                hint: "",
                type: "text" as const,
              };
              const isSecret = s.isSecret || meta.type === "password";
              return (
                <Card key={s.key}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Radar className="h-4 w-4 text-primary" />
                      {meta.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground">{meta.hint}</p>

                    {meta.type === "select" ? (
                      <select
                        value={values[s.key] ?? String(s.value ?? "none")}
                        onChange={(e) => updateValue(s.key, e.target.value)}
                        className="w-full p-2 border border-border rounded-lg text-sm bg-background"
                      >
                        {(meta.options || []).map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={isSecret ? "password" : meta.type === "number" ? "number" : "text"}
                        value={values[s.key] ?? ""}
                        onChange={(e) => updateValue(s.key, e.target.value)}
                        placeholder={isSecret && s.masked ? "•••••••• (saved)" : "Enter value..."}
                        className="w-full p-2 border border-border rounded-lg text-sm bg-background"
                      />
                    )}

<div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {s.masked || s.isSecret ? "Currently saved (masked)" : s.value !== "" ? "Saved" : "Not saved"}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => saveSetting(s.key)}
                        disabled={savingKey === s.key}
                        className="flex items-center gap-1"
                      >
                        {savingKey === s.key ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                        Save
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card className="bg-soft-green border-0">
          <CardContent className="pt-6 flex items-start gap-3">
            <KeyRound className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              The TrackingMore API key is stored securely in the database (matching
              environment variables still work as a fallback). Couriers, label
              prints, and public tracking reads work without it — only live carrier
              event sync needs a valid key.
            </p>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}