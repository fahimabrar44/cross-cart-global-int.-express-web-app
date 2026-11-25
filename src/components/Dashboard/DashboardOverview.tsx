"use client";

import { StatsCard } from "@/components/Dashboard/StatsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/AuthContext";
import { AnalyticsService } from "@/services/dashboardService";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Copy,
  Cpu,
  Database,
  DollarSign,
  Download,
  HardDrive,
  Package,
  RefreshCw,
  Server,
  Shield,
  ShieldCheck,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface HealthData {
  status: string;
  timestamp: string;
  uptime?: string;
  uptimeSeconds?: number;
  database: { status: string; pingMs?: number | null };
  memory?: {
    used: string;
    total: string;
    external: string;
    rss?: string;
    heapUsedPercent?: number;
  };
  system?: {
    platform?: string;
    arch?: string;
    nodeVersion?: string;
    pid?: number;
    cpuCount?: number;
    loadAverage?: number[];
    totalMemory?: string;
    freeMemory?: string;
    usedMemory?: string;
    memoryUsagePercent?: number;
  };
  environment?: string;
  version?: string;
  services?: Record<string, string>;
}

interface CountItem {
  _id: string | null;
  count: number;
}

interface RevenueSummary {
  totalRevenue: number;
  totalRefunds: number;
  avgOrderValue: number;
  totalOrders: number;
}

interface OrdersSummary {
  totalOrders?: Array<{ count: number }>;
  ordersByType?: CountItem[];
  ordersByStatus?: CountItem[];
  revenueSummary?: RevenueSummary[];
  monthlyRevenue?: Array<{
    year: number;
    month: number;
    revenue: number;
    orders: number;
  }>;
}

interface PeriodComparison {
  current: number;
  previous: number;
  changePercent: number;
}

interface AnalyticsData {
  totalUsers?: number;
  activeUsers?: number;
  activeUsersPeriod?: number;
  verifiedUsers?: number;
  newUsers?: number;
  roleBreakdown?: CountItem[];
  signupTrend?: Array<{ _id: string; count: number }>;
  dau?: Array<{ day: string; activeUsers: number }>;
  topFailedPhones?: CountItem[];
  topFailedIPs?: CountItem[];
  ordersSummary?: OrdersSummary;
  periodSummary?: OrdersSummary;
  comparison?: {
    users?: PeriodComparison;
    orders?: PeriodComparison;
    revenue?: PeriodComparison;
  };
  generatedAt?: string;
}

const AUTO_REFRESH_KEY = "crosscart:dashboard:autoRefreshSeconds";

function formatUptime(seconds?: number): string {
  if (!seconds || seconds <= 0) return "—";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatCurrency(value: number | undefined): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatChange(change?: PeriodComparison): string | undefined {
  if (!change) return undefined;
  if (change.current === 0 && change.previous === 0) return undefined;
  const sign = change.changePercent > 0 ? "+" : "";
  return `${sign}${change.changePercent}% vs previous 30d`;
}

function changeTrend(
  change?: PeriodComparison
): "up" | "down" | "neutral" {
  if (!change || change.changePercent === 0) return "neutral";
  return change.changePercent > 0 ? "up" : "down";
}

function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "Unknown";
  return phone.replace(/(\+\d{1,3})\d{3,}(\d{4})/, "$1****$2");
}

function PanelEmpty({
  icon: Icon = BarChart3,
  title,
  description,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/60 px-4 py-8 text-center">
      <Icon className="h-7 w-7 text-gray-300" />
      <p className="mt-2 text-sm font-medium text-gray-700">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}

function HealthStatus({
  health,
  loading,
  error,
  onRefresh,
  isRefreshing,
  autoRefreshSeconds,
  onAutoRefreshChange,
  onCopy,
  onDownload,
}: {
  health: HealthData | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  autoRefreshSeconds: number;
  onAutoRefreshChange: (value: number) => void;
  onCopy: () => void;
  onDownload: () => void;
}) {
  const overall = (health?.status || "").toLowerCase();
  const isHealthy = overall === "healthy";
  const isDegraded = overall === "degraded" || overall === "warning";
  const isUnavailable = !health;

  const cardClasses = isHealthy
    ? "border-green-200 bg-gradient-to-br from-green-50 via-white to-white"
    : isDegraded
      ? "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white"
      : "border-red-200 bg-gradient-to-br from-red-50 via-white to-white";

  const iconClasses = isHealthy
    ? "bg-green-100 text-green-700"
    : isDegraded
      ? "bg-amber-100 text-amber-700"
      : "bg-red-100 text-red-700";

  const statusLabel = isHealthy
    ? "All systems operational"
    : isDegraded
      ? "Degraded performance"
      : "Status unavailable";

  const statusBadgeClass = isHealthy
    ? "bg-green-600 text-white hover:bg-green-600"
    : isDegraded
      ? "bg-amber-500 text-white hover:bg-amber-500"
      : "bg-red-600 text-white hover:bg-red-600";

  const serviceColor = (status: string) => {
    const normalized = status.toLowerCase();
    if (["active", "running", "connected", "healthy"].includes(normalized)) {
      return "bg-green-500";
    }
    if (["degraded", "warning", "starting"].includes(normalized)) {
      return "bg-amber-500";
    }
    return "bg-red-500";
  };

  const serviceTextColor = (status: string) => {
    const normalized = status.toLowerCase();
    if (["active", "running", "connected", "healthy"].includes(normalized)) {
      return "text-green-700";
    }
    if (["degraded", "warning", "starting"].includes(normalized)) {
      return "text-amber-700";
    }
    return "text-red-700";
  };

  return (
    <Card className={`overflow-hidden shadow-sm ${cardClasses}`}>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className={`rounded-xl p-2.5 ${iconClasses}`}>
              {isUnavailable ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <ShieldCheck className="h-5 w-5" />
              )}
            </div>
            <div>
              <CardTitle className="flex flex-wrap items-center gap-2 text-lg text-foreground">
                System Health
                <Badge className={statusBadgeClass}>{statusLabel}</Badge>
              </CardTitle>
              <CardDescription>
                Live infrastructure status for the admin panel
                {health ? ` · checked ${new Date(health.timestamp).toLocaleTimeString()}` : ""}
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="health-auto-refresh">
              Auto refresh interval
            </label>
            <select
              id="health-auto-refresh"
              value={autoRefreshSeconds}
              onChange={(event) => onAutoRefreshChange(Number(event.target.value))}
              className="h-9 rounded-md border border-gray-300 bg-white px-2.5 text-sm text-gray-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              title="Auto refresh interval"
            >
              <option value={0}>Auto refresh: Off</option>
              <option value={30}>Auto refresh: 30s</option>
              <option value={60}>Auto refresh: 1m</option>
              <option value={300}>Auto refresh: 5m</option>
            </select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="bg-white/80"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onCopy}
              className="bg-white/80"
              title="Copy health summary"
              aria-label="Copy health summary"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onDownload}
              className="bg-white/80"
              title="Download diagnostics report"
              aria-label="Download diagnostics report"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>
              Live health check failed. Showing the last known status.
              <span className="ml-1 text-amber-700">{error}</span>
            </span>
          </div>
        )}

        {!health && loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-lg border border-gray-200 bg-white/70"
              />
            ))}
          </div>
        ) : !health ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-white/80 px-4 py-8 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <p className="mt-2 text-sm font-medium text-red-800">
              Health check unavailable
            </p>
            <p className="mt-1 max-w-md text-xs text-red-600">
              The server did not return a health response. Use Refresh to try
              again, or download the diagnostics report for support.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="mt-3 bg-white"
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Try again
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-lg border border-white/80 bg-white/80 p-3 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                  <Server className="h-3.5 w-3.5" />
                  Uptime
                </div>
                <p className="mt-1 truncate text-lg font-semibold text-foreground">
                  {health.uptime || formatUptime(health.uptimeSeconds)}
                </p>
              </div>

              <div className="rounded-lg border border-white/80 bg-white/80 p-3 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                  <Database className="h-3.5 w-3.5" />
                  Database
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      health.database.status === "connected"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  />
                  <p className="truncate text-lg font-semibold capitalize text-foreground">
                    {health.database.status}
                  </p>
                  {typeof health.database.pingMs === "number" && (
                    <span className="text-xs text-gray-500">
                      {health.database.pingMs} ms
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-white/80 bg-white/80 p-3 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                  <Zap className="h-3.5 w-3.5" />
                  Memory
                </div>
                <p className="mt-1 truncate text-lg font-semibold text-foreground">
                  {health.memory
                    ? `${health.memory.used} / ${health.memory.total}`
                    : "Admin only"}
                </p>
                {typeof health.memory?.heapUsedPercent === "number" && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-1.5 rounded-full bg-primary"
                      style={{
                        width: `${Math.min(100, health.memory.heapUsedPercent)}%`,
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-white/80 bg-white/80 p-3 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                  <HardDrive className="h-3.5 w-3.5" />
                  Environment
                </div>
                <p className="mt-1 truncate text-lg font-semibold capitalize text-foreground">
                  {health.environment || "production"}
                </p>
                <p className="text-xs text-gray-500">
                  v{health.version || "1.0.0"}
                </p>
              </div>
            </div>

            {health.system && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-white/80 bg-white/70 px-3 py-2 text-xs text-gray-600">
                <span className="inline-flex items-center gap-1">
                  <Cpu className="h-3.5 w-3.5" />
                  {health.system.platform} / {health.system.arch}
                </span>
                <span>{health.system.cpuCount ?? "—"} CPU cores</span>
                <span>{health.system.nodeVersion}</span>
                {typeof health.system.memoryUsagePercent === "number" && (
                  <span>
                    System memory: {health.system.usedMemory} /{" "}
                    {health.system.totalMemory} (
                    {health.system.memoryUsagePercent}%)
                  </span>
                )}
              </div>
            )}

            <Separator className="bg-black/5" />

            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Services
              </h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(health.services || {}).map(
                  ([service, status]) => (
                    <span
                      key={service}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/80 px-2.5 py-1 text-xs font-medium shadow-sm"
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${serviceColor(status)}`}
                      />
                      <span className="capitalize text-gray-700">{service}</span>
                      <span className={serviceTextColor(status)}>
                        {status}
                      </span>
                    </span>
                  )
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardOverview() {
  const { user } = useAuth();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefreshSeconds, setAutoRefreshSeconds] = useState(60);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTO_REFRESH_KEY);
      if (raw === null) return;
      const stored = Number(raw);
      if ([0, 30, 60, 300].includes(stored)) {
        setAutoRefreshSeconds(stored);
      }
    } catch {
      // localStorage may be unavailable in private mode; keep the default.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(AUTO_REFRESH_KEY, String(autoRefreshSeconds));
    } catch {
      // Ignore storage failures.
    }
  }, [autoRefreshSeconds]);

  const fetchHealthData = useCallback(async () => {
    try {
      const response = await fetch("/api/health", {
        cache: "no-store",
        credentials: "include",
      });
      const data = await response.json();

      if (response.ok && data?.success && data?.data) {
        setHealth(data.data);
        setHealthError(null);
        return;
      }

      throw new Error(data?.message || `Health check failed (${response.status})`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch health data";
      setHealthError(message);
      throw error;
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await AnalyticsService.getOverview({ days: 30 });
      if (response.success && response.data) {
        setAnalytics(response.data);
        setAnalyticsError(null);
        return;
      }
      throw new Error(response.message || "Failed to fetch analytics");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch analytics";
      setAnalyticsError(message);
      throw error;
    }
  }, []);

  const refreshData = useCallback(
    async (showToast = false) => {
      setIsRefreshing(true);
      const results = await Promise.allSettled([
        fetchHealthData(),
        fetchAnalytics(),
      ]);
      setLastRefresh(new Date());
      setIsRefreshing(false);

      if (showToast) {
        if (results.some((result) => result.status === "rejected")) {
          toast.error("Some dashboard data could not be refreshed");
        } else {
          toast.success("Dashboard refreshed");
        }
      }
    },
    [fetchHealthData, fetchAnalytics]
  );

  useEffect(() => {
    let active = true;
    const load = async () => {
      await refreshData(false);
      if (active) setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, [refreshData]);

  useEffect(() => {
    if (!autoRefreshSeconds) return;
    const interval = setInterval(
      () => refreshData(false),
      autoRefreshSeconds * 1000
    );
    return () => clearInterval(interval);
  }, [autoRefreshSeconds, refreshData]);

  const handleCopyHealth = async () => {
    if (!health) {
      toast.error("Health data is not available yet");
      return;
    }
    const summary = [
      `System status: ${health.status}`,
      `Database: ${health.database.status}${
        typeof health.database.pingMs === "number"
          ? ` (${health.database.pingMs} ms)`
          : ""
      }`,
      `Uptime: ${health.uptime || formatUptime(health.uptimeSeconds)}`,
      `Memory: ${
        health.memory
          ? `${health.memory.used} / ${health.memory.total}`
          : "Unavailable"
      }`,
      `Environment: ${health.environment || "production"}`,
      `Version: ${health.version || "1.0.0"}`,
      `Services: ${Object.entries(health.services || {})
        .map(([name, status]) => `${name}=${status}`)
        .join(", ")}`,
      `Checked: ${new Date(health.timestamp).toISOString()}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(summary);
      toast.success("Health summary copied");
    } catch {
      toast.error("Could not copy the health summary");
    }
  };

  const handleDownloadHealth = () => {
    if (!health) {
      toast.error("Health data is not available yet");
      return;
    }

    const report = {
      generatedAt: new Date().toISOString(),
      health,
      analytics: analytics
        ? {
            generatedAt: analytics.generatedAt,
            totalUsers: analytics.totalUsers,
            activeUsers: analytics.activeUsers,
            activeUsersPeriod: analytics.activeUsersPeriod,
            totalOrders:
              analytics.periodSummary?.revenueSummary?.[0]?.totalOrders ?? 0,
            revenue:
              analytics.periodSummary?.revenueSummary?.[0]?.totalRevenue ?? 0,
          }
        : null,
      browser:
        typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `crosscart-health-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, "-")}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success("Diagnostics report downloaded");
  };

  const allTimeSummary = analytics?.ordersSummary ?? {};
  const periodSummary = analytics?.periodSummary ?? allTimeSummary;
  const periodRevenue = periodSummary.revenueSummary?.[0];
  const totalOrders =
    periodRevenue?.totalOrders ?? periodSummary.totalOrders?.[0]?.count ?? 0;
  const totalRevenue = periodRevenue?.totalRevenue ?? 0;
  const avgOrderValue = periodRevenue?.avgOrderValue ?? 0;
  const activeUsersPeriod = analytics?.activeUsersPeriod ?? 0;
  const roleBreakdown = analytics?.roleBreakdown ?? [];
  const ordersByType = periodSummary.ordersByType ?? [];
  const dau = analytics?.dau ?? [];
  const failedPhones = analytics?.topFailedPhones ?? [];
  const failedIPs = analytics?.topFailedIPs ?? [];

  const maxRoleCount = Math.max(1, ...roleBreakdown.map((role) => role.count));
  const maxTypeCount = Math.max(1, ...ordersByType.map((type) => type.count));
  const maxDau = Math.max(1, ...dau.map((day) => day.activeUsers));
  const recentDau = dau.slice(-7);

  const usersChange = analytics?.comparison?.users
    ? `+${analytics.comparison.users.current} new in 30d`
    : undefined;
  const revenueChange = formatChange(analytics?.comparison?.revenue);
  const ordersChange = formatChange(analytics?.comparison?.orders);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-foreground">
              Admin Dashboard
            </h1>
            <Badge
              variant="outline"
              className="hidden border-primary/20 bg-primary/5 text-primary sm:inline-flex"
            >
              Live
            </Badge>
          </div>
          <p className="mt-1 text-gray-600">
            Welcome back, {user?.name || "Admin"}! Here{"'"}s what{"'"}s
            happening with your courier service.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm text-gray-500">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <Button
            onClick={() => refreshData(true)}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health */}
      <HealthStatus
        health={health}
        loading={loading}
        error={healthError}
        onRefresh={() => refreshData(true)}
        isRefreshing={isRefreshing}
        autoRefreshSeconds={autoRefreshSeconds}
        onAutoRefreshChange={setAutoRefreshSeconds}
        onCopy={handleCopyHealth}
        onDownload={handleDownloadHealth}
      />

      {analyticsError && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>
            {analytics
              ? `Analytics refresh failed. Showing the last successful data: ${analyticsError}`
              : `Analytics could not be loaded: ${analyticsError}`}
          </span>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={analytics?.totalUsers ?? 0}
          description={`${analytics?.verifiedUsers ?? 0} verified · ${
            analytics?.activeUsers ?? 0
          } enabled`}
          change={usersChange}
          trend={usersChange ? "up" : "neutral"}
          icon={Users}
        />
        <StatsCard
          title="Revenue (30d)"
          value={formatCurrency(totalRevenue)}
          description={`Avg: ${formatCurrency(avgOrderValue)} per order`}
          change={revenueChange}
          trend={changeTrend(analytics?.comparison?.revenue)}
          icon={DollarSign}
        />
        <StatsCard
          title="Orders (30d)"
          value={totalOrders}
          description={`${periodRevenue?.totalOrders ?? totalOrders} orders in the last 30 days`}
          change={ordersChange}
          trend={changeTrend(analytics?.comparison?.orders)}
          icon={Package}
        />
        <StatsCard
          title="Active Users (30d)"
          value={activeUsersPeriod}
          description="Unique users who signed in during the last 30 days"
          icon={Activity}
        />
      </div>

      {/* User roles + security */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-primary" />
              User Role Distribution
            </CardTitle>
            <CardDescription>
              Account mix across admins, moderators and users
            </CardDescription>
          </CardHeader>
          <CardContent>
            {roleBreakdown.length === 0 ? (
              <PanelEmpty
                icon={Users}
                title="No users yet"
                description="User roles will appear here after the first account is created."
              />
            ) : (
              <div className="space-y-4">
                {roleBreakdown.map((role) => (
                  <div key={role._id ?? "unknown"}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium capitalize text-gray-700">
                        {role._id || "Unknown"}
                      </span>
                      <span className="font-semibold text-foreground">
                        {role.count}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{
                          width: `${(role.count / maxRoleCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-primary" />
              Security Overview
            </CardTitle>
            <CardDescription>
              Failed login attempts in the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {failedPhones.length === 0 && failedIPs.length === 0 ? (
              <PanelEmpty
                icon={ShieldCheck}
                title="No security issues detected"
                description="No failed login attempts were recorded in the last 30 days."
              />
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-700">
                    Top Failed Login Attempts
                  </h4>
                  <div className="space-y-2">
                    {failedPhones.slice(0, 3).map((phone) => (
                      <div
                        key={phone._id ?? "unknown-phone"}
                        className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/60 px-3 py-2 text-sm"
                      >
                        <span className="font-mono text-gray-700">
                          {maskPhone(phone._id)}
                        </span>
                        <Badge variant="destructive" className="text-xs">
                          {phone.count} failed
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-700">
                    Suspicious IPs
                  </h4>
                  <div className="space-y-2">
                    {failedIPs.slice(0, 3).map((ip) => (
                      <div
                        key={ip._id ?? "unknown-ip"}
                        className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2 text-sm"
                      >
                        <span className="truncate font-mono text-gray-700">
                          {ip._id || "Unknown"}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {ip.count} attempts
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orders, DAU, quick actions */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-5 w-5 text-primary" />
              Order Types (30d)
            </CardTitle>
            <CardDescription>
              Shipment categories created in the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ordersByType.length === 0 ? (
              <PanelEmpty
                icon={Package}
                title="No orders in the last 30 days"
                description="Create an order to see the category breakdown."
              />
            ) : (
              <div className="space-y-4">
                {ordersByType.map((type) => (
                  <div key={type._id ?? "unknown-type"}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium capitalize text-gray-700">
                        {type._id || "Unknown"}
                      </span>
                      <span className="font-semibold text-foreground">
                        {type.count}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-[#F5C400]"
                        style={{
                          width: `${(type.count / maxTypeCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-primary" />
              Daily Active Users
            </CardTitle>
            <CardDescription>Last 7 days of successful sign-ins</CardDescription>
          </CardHeader>
          <CardContent>
            {recentDau.length === 0 ? (
              <PanelEmpty
                icon={Activity}
                title="No activity yet"
                description="Daily active users will appear after successful sign-ins."
              />
            ) : (
              <div>
                <div className="flex h-32 items-end gap-2">
                  {recentDau.map((day) => (
                    <div
                      key={day.day}
                      className="flex min-w-0 flex-1 flex-col items-center gap-1"
                      title={`${new Date(day.day).toLocaleDateString()} · ${
                        day.activeUsers
                      } users`}
                    >
                      <div className="flex h-24 w-full items-end">
                        <div
                          className="w-full rounded-t bg-primary/80 transition-all hover:bg-primary"
                          style={{
                            height: `${Math.max(
                              8,
                              (day.activeUsers / maxDau) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="truncate text-[10px] text-gray-500">
                        {new Date(day.day).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {recentDau[recentDau.length - 1]?.activeUsers ?? 0} active
                  users on the latest recorded day
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm md:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>Jump to the most-used admin tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              {
                href: "/dashboard/analytics",
                label: "View Detailed Analytics",
                icon: BarChart3,
              },
              {
                href: "/dashboard/orders",
                label: "Manage Orders",
                icon: Package,
              },
              {
                href: "/dashboard/rate-charts",
                label: "Manage Rate Charts",
                icon: TrendingUp,
              },
              {
                href: "/dashboard/items",
                label: "Manage Item Catalog",
                icon: Package,
              },
            ].map((action) => (
              <Button
                key={action.href}
                asChild
                variant="outline"
                className="w-full justify-between border-gray-200 hover:border-primary/30 hover:bg-soft-green"
              >
                <Link href={action.href}>
                  <span className="flex items-center">
                    <action.icon className="mr-2 h-4 w-4 text-primary" />
                    {action.label}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-gray-400" />
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t pt-4 text-center text-xs text-gray-500">
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
          System Version: {health?.version || "1.0.0"}
        </span>
        <span className="hidden sm:inline">•</span>
        <span className="inline-flex items-center gap-1">
          <Server className="h-3.5 w-3.5" />
          Environment: {health?.environment || "production"}
        </span>
        <span className="hidden sm:inline">•</span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          Generated:{" "}
          {analytics?.generatedAt
            ? new Date(analytics.generatedAt).toLocaleString()
            : "N/A"}
        </span>
      </div>
    </div>
  );
}
