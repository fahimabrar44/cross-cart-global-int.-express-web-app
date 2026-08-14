"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleGuard } from "@/middleware/roleGuard";
import { apiService } from "@/services/apiService";
import { Gauge, KeyRound, Radar, RefreshCw, Save, ScrollText, Webhook } from "lucide-react";
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
  TRACKINGMORE_DAILY_LIMIT: {
    label: "TrackingMore Daily Call Limit",
    hint: "Hard cap on TrackingMore API calls per day (defaults to 500). Sync pauses when reached and resumes the next day.",
    type: "number",
  },
  TRACKINGMORE_WEBHOOK_SECRET: {
    label: "TrackingMore Webhook Secret",
    hint: "Optional. When set, webhook pushes must send ?token=<secret> (append to the webhook URL) or a x-webhook-secret header.",
    type: "password",
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

// Keys we want to surface even before a first save (so admins see + can set them).
const ALWAYS_SHOW_KEYS = ["TRACKINGMORE_DAILY_LIMIT", "TRACKINGMORE_WEBHOOK_SECRET"];

interface SyncLogEntry {
  _id: string;
  trackId: string;
  trackingNumber: string;
  courier: string;
  source: string;
  status: string;
  message: string;
  added?: number;
  runAt: string;
}

interface UsageEntry {
  date: string;
  count: number;
  limit: number;
  remaining: number;
}

export default function TrackingApiSettingsPage() {
  const [settings, setSettings] = useState<SettingField[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [usage, setUsage] = useState<UsageEntry | null>(null);
  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchUsage = async () => {
    try {
      const response = await apiService.get("/tracking/usage");
      if (response.success) setUsage(response.data as UsageEntry);
    } catch {
      // non-blocking
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const response = await apiService.get("/tracking/sync-logs?limit=30");
      if (response.success) setLogs(response.data as SyncLogEntry[]);
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await apiService.get("/settings");
      if (response.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list = (response.data as any[]) || [];
        // Surface "always show" keys even if they were never saved yet.
        for (const key of ALWAYS_SHOW_KEYS) {
          if (!list.some((s) => s.key === key)) {
            list.push({ key, value: "", description: "", isSecret: false, masked: false });
          }
        }
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
    fetchUsage();
    fetchLogs();
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Daily usage */}
          <Card data-testid="tracking-usage-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Gauge className="h-4 w-4 text-primary" />
                Today{"'"}s TrackingMore Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usage ? (
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <span className="text-3xl font-bold">
                      {usage.count}
                      <span className="text-sm font-normal text-muted-foreground">
                        {" "}
                        / {usage.limit}
                      </span>
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {usage.remaining} calls left today
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${
                        usage.remaining === 0
                          ? "bg-destructive"
                          : usage.remaining < usage.limit * 0.2
                            ? "bg-amber-500"
                            : "bg-primary"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((usage.count / usage.limit) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Reset automatically on {usage.date} —{" "}
                    {usage.remaining === 0
                      ? "sync is paused until tomorrow"
                      : "auto-sync and polling will pause when the quota is exhausted"}
                    .
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Usage data unavailable (only visible to admins / moderators).
                </p>
              )}
            </CardContent>
          </Card>

          {/* Webhook URL */}
          <Card data-testid="tracking-webhook-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Webhook className="h-4 w-4 text-primary" />
                TrackingMore Webhook
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Register this URL in TrackingMore (Dashboard →{" "}
                <code>Webhook Settings</code>) so pushes update tracking instantly
                instead of waiting for polls:
              </p>
              <code className="block break-all rounded-md border border-border bg-muted px-3 py-2 text-xs">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/api/v1/tracking/webhook`
                  : "/api/v1/tracking/webhook"}
              </code>
              <p className="text-xs text-muted-foreground">
                Tip: enable <code>TRACKINGMORE_WEBHOOK_SECRET</code> above and append{" "}
                <code>?token=&#123;secret&#125;</code> to the URL for verification.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent sync logs */}
        <Card data-testid="tracking-sync-logs-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <ScrollText className="h-4 w-4 text-primary" />
                Recent Sync Activity
              </CardTitle>
              <CardDescription>
                Latest carrier-sync attempts (cron, webhook, manual sync, public
                lookups) — useful for diagnosing failed syncs.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={logsLoading}>
              <RefreshCw className={`mr-2 h-3.5 w-3.5 ${logsLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {logsLoading ? "Loading sync logs..." : "No sync activity recorded yet."}
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-3">Status</th>
                    <th className="pb-2 pr-3">Source</th>
                    <th className="pb-2 pr-3">Track / Tracking #</th>
                    <th className="pb-2 pr-3">Message</th>
                    <th className="pb-2 text-right">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id} className="border-b last:border-0">
                      <td className="py-2 pr-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            log.status === "success"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                          }`}
                        >
                          {log.status === "success" ? "OK" : "FAILED"}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-xs uppercase text-muted-foreground">
                        {log.source}
                      </td>
                      <td className="py-2 pr-3">
                        <span className="font-medium">{log.trackId || "—"}</span>
                        <span className="block text-xs text-muted-foreground">
                          {log.trackingNumber || ""}
                          {log.courier ? ` · ${log.courier}` : ""}
                        </span>
                      </td>
                      <td className="max-w-xs truncate py-2 pr-3 text-xs" title={log.message}>
                        {log.message || "—"}
                      </td>
                      <td className="py-2 text-right text-xs text-muted-foreground">
                        {new Date(log.runAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}