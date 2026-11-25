"use client";

import { DashboardChart } from "@/components/Dashboard/DashboardChart";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoleGuard } from "@/middleware/roleGuard";
import { AnalyticsService } from "@/services/dashboardService";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Bell,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Loader2,
  Package,
  RefreshCw,
  Shield,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Truck,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface CountItem {
  _id: string | null;
  count: number;
}

interface RevenueSummary {
  totalRevenue: number;
  totalRefunds: number;
  avgOrderValue: number;
  totalOrders: number;
  avgDeliveryHours?: number | null;
  deliveredOrders?: number;
  cancelledOrders?: number;
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
  dailyRevenue?: Array<{ day: string; revenue: number; orders: number }>;
  paymentMethods?: Array<{ _id: string | null; count: number; total: number }>;
  startDate?: string;
  endDate?: string;
  days?: number;
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
  notificationPrefs?: Array<{
    emailOn: number;
    emailOff: number;
    smsOn: number;
    smsOff: number;
    total: number;
  }>;
  loginStats?: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  };
  ordersSummary?: OrdersSummary;
  periodSummary?: OrdersSummary;
  comparison?: {
    users?: PeriodComparison;
    orders?: PeriodComparison;
    revenue?: PeriodComparison;
  };
  generatedAt?: string;
}

const PERIOD_OPTIONS = [
  { value: "7d", days: 7, label: "7 Days" },
  { value: "30d", days: 30, label: "30 Days" },
  { value: "90d", days: 90, label: "90 Days" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500",
  confirmed: "bg-blue-500",
  "picked-up": "bg-cyan-500",
  "in-transit": "bg-indigo-500",
  "out-for-delivery": "bg-violet-500",
  delivered: "bg-green-600",
  cancelled: "bg-red-500",
  returned: "bg-gray-500",
};

function formatCurrency(value: number | undefined, digits = 0): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(Number(value) || 0);
}

function formatNumber(value: number | undefined): string {
  return (Number(value) || 0).toLocaleString();
}

function formatPercent(value: number | undefined): string {
  return `${(Number(value) || 0).toFixed(1)}%`;
}

function humanize(value: string | null | undefined): string {
  if (!value) return "Unknown";
  return value.replace(/-/g, " ");
}

function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "Unknown";
  return phone.replace(/(\+\d{1,3})\d{3,}(\d{4})/, "$1****$2");
}

function monthLabel(year: number, month: number): string {
  return new Date(year, Math.max(0, month - 1), 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function dayLabel(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function changeLabel(change?: PeriodComparison): string | undefined {
  if (!change) return undefined;
  if (change.current === 0 && change.previous === 0) return undefined;
  const sign = change.changePercent > 0 ? "+" : "";
  return `${sign}${change.changePercent}% vs previous period`;
}

function changeTrend(
  change?: PeriodComparison
): "up" | "down" | "neutral" {
  if (!change || change.changePercent === 0) return "neutral";
  return change.changePercent > 0 ? "up" : "down";
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/60 px-4 py-10 text-center">
      <BarChart3 className="h-8 w-8 text-gray-300" />
      <p className="mt-2 text-sm font-medium text-gray-700">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [activeTab, setActiveTab] = useState("overview");
  const hasLoadedRef = useRef(false);

  const selectedDays =
    PERIOD_OPTIONS.find((option) => option.value === selectedPeriod)?.days ?? 30;
  const periodLabel = `${selectedDays} days`;

  const fetchAnalytics = useCallback(
    async (showToast = false) => {
      const isFirstLoad = !hasLoadedRef.current;
      if (isFirstLoad) setLoading(true);
      else setIsRefreshing(true);

      try {
        setError(null);
        const response = await AnalyticsService.getOverview({
          days: selectedDays,
        });

        if (response.success && response.data) {
          setData(response.data);
          if (showToast) {
            toast.success("Analytics refreshed successfully");
          }
        } else {
          const message = response.message || "Failed to fetch analytics";
          setError(message);
          if (showToast) toast.error(message);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch analytics";
        setError(message);
        if (showToast) toast.error(message);
      } finally {
        hasLoadedRef.current = true;
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedDays]
  );

  useEffect(() => {
    fetchAnalytics(false);
  }, [fetchAnalytics]);

  const handleRefresh = () => {
    fetchAnalytics(true);
  };

  const handleExport = () => {
    const summary = data.periodSummary ?? data.ordersSummary ?? {};
    const revenue = summary.revenueSummary?.[0];
    const rows: Array<Array<string | number>> = [
      ["CrossCart Analytics Export"],
      ["Period", periodLabel],
      ["Generated At", new Date().toISOString()],
      [],
      ["Summary", "Value"],
      ["Total Users", data.totalUsers ?? 0],
      ["Active Users (period)", data.activeUsersPeriod ?? 0],
      ["Verified Users", data.verifiedUsers ?? 0],
      ["New Users (period)", data.newUsers ?? 0],
      ["Total Orders (period)", revenue?.totalOrders ?? 0],
      ["Revenue (period)", revenue?.totalRevenue ?? 0],
      ["Refunds (period)", revenue?.totalRefunds ?? 0],
      ["Average Order Value", Number(revenue?.avgOrderValue ?? 0).toFixed(2)],
      [],
      ["Order Status", "Count"],
      ...(summary.ordersByStatus ?? []).map((item) => [
        humanize(item._id),
        item.count,
      ]),
      [],
      ["Day", "Revenue", "Orders"],
      ...(summary.dailyRevenue ?? []).map((item) => [
        item.day,
        item.revenue,
        item.orders,
      ]),
      [],
      ["Month", "Revenue", "Orders"],
      ...(summary.monthlyRevenue ?? []).map((item) => [
        monthLabel(item.year, item.month),
        item.revenue,
        item.orders,
      ]),
      [],
      ["Payment Method", "Orders", "Collected"],
      ...(summary.paymentMethods ?? []).map((item) => [
        humanize(item._id),
        item.count,
        item.total,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `crosscart-analytics-${selectedPeriod}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success("Analytics exported as CSV");
  };

  const summary: OrdersSummary = data.periodSummary ?? data.ordersSummary ?? {};
  const revenueSummary = summary.revenueSummary?.[0];
  const totalOrders =
    revenueSummary?.totalOrders ?? summary.totalOrders?.[0]?.count ?? 0;
  const totalRevenue = revenueSummary?.totalRevenue ?? 0;
  const totalRefunds = revenueSummary?.totalRefunds ?? 0;
  const avgOrderValue = revenueSummary?.avgOrderValue ?? 0;
  const ordersByType = summary.ordersByType ?? [];
  const ordersByStatus = summary.ordersByStatus ?? [];
  const monthlyRevenue = summary.monthlyRevenue ?? [];
  const paymentMethods = summary.paymentMethods ?? [];

  const statusCounts = new Map(
    ordersByStatus.map((item) => [item._id ?? "unknown", item.count])
  );
  const deliveredOrders =
    statusCounts.get("delivered") ?? revenueSummary?.deliveredOrders ?? 0;
  const cancelledOrders =
    statusCounts.get("cancelled") ?? revenueSummary?.cancelledOrders ?? 0;
  const inTransitOrders = ["picked-up", "in-transit", "out-for-delivery"].reduce(
    (sum, status) => sum + (statusCounts.get(status) ?? 0),
    0
  );

  const revenueChange = changeLabel(data.comparison?.revenue);
  const ordersChange = changeLabel(data.comparison?.orders);
  const usersChange = data.comparison?.users
    ? `+${data.comparison.users.current} new in ${periodLabel}`
    : undefined;

  const signupData = (data.signupTrend ?? []).map((item) => ({
    name: dayLabel(item._id),
    value: item.count,
  }));
  const dauData = (data.dau ?? []).map((item) => ({
    name: dayLabel(item.day),
    value: item.activeUsers,
  }));
  const dailyRevenue = summary.dailyRevenue ?? [];
  const revenueData =
    dailyRevenue.length > 0
      ? dailyRevenue.map((item) => ({
          name: dayLabel(item.day),
          value: item.revenue,
          orders: item.orders,
        }))
      : monthlyRevenue.map((item) => ({
          name: monthLabel(item.year, item.month),
          value: item.revenue,
          orders: item.orders,
        }));
  const typeData = ordersByType.map((item) => ({
    name: humanize(item._id),
    value: item.count,
  }));
  const roleData = (data.roleBreakdown ?? []).map((item) => ({
    name: humanize(item._id),
    value: item.count,
  }));
  const failedPhoneData = (data.topFailedPhones ?? []).slice(0, 10).map((item) => ({
    name: maskPhone(item._id),
    value: item.count,
  }));
  const loginStats = data.loginStats ?? {
    total: 0,
    successful: 0,
    failed: 0,
    successRate: 0,
  };
  const notificationPrefs = data.notificationPrefs?.[0];
  const maxStatusCount = Math.max(1, ...ordersByStatus.map((item) => item.count));

  if (loading) {
    return (
      <RoleGuard allowedRoles={["admin", "moderator"]}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 w-56 animate-pulse rounded bg-gray-200" />
              <div className="mt-2 h-4 w-80 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-10 w-24 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
          <div className="h-14 animate-pulse rounded-lg bg-gray-200" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-lg bg-gray-200"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="h-96 animate-pulse rounded-lg bg-gray-200" />
            <div className="h-96 animate-pulse rounded-lg bg-gray-200" />
          </div>
        </div>
      </RoleGuard>
    );
  }

  if (error && !data.generatedAt) {
    return (
      <RoleGuard allowedRoles={["admin", "moderator"]}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="mt-1 text-muted-foreground">
              Comprehensive insights into your business performance
            </p>
          </div>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
                <h3 className="mb-2 text-lg font-medium text-red-800">
                  Error Loading Analytics
                </h3>
                <p className="mb-4 max-w-md text-red-600">{error}</p>
                <Button onClick={handleRefresh} variant="destructive">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["admin", "moderator"]}>
      <div className="space-y-6" data-testid="analytics-page">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Analytics Dashboard
            </h1>
            <p className="mt-1 text-muted-foreground">
              Comprehensive insights into your business performance
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Last updated:{" "}
              {data.generatedAt
                ? new Date(data.generatedAt).toLocaleString()
                : "Not available"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              disabled={isRefreshing}
              data-testid="refresh-btn"
            >
              {isRefreshing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
            <Button onClick={handleExport} data-testid="export-btn">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {error && data.generatedAt && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>
              Showing the last successful data. Refresh failed: {error}
            </span>
          </div>
        )}

        {/* Period selector */}
        <div className="rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm">
          <div className="flex flex-col gap-1 sm:flex-row">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedPeriod(option.value)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  selectedPeriod === option.value
                    ? "bg-primary text-white shadow-sm"
                    : "text-gray-700 hover:bg-soft-green"
                }`}
                aria-pressed={selectedPeriod === option.value}
                data-testid={`period-${option.value}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1 sm:grid-cols-5">
            {[
              ["overview", "Overview"],
              ["users", "Users"],
              ["orders", "Orders"],
              ["revenue", "Revenue"],
              ["security", "Security"],
            ].map(([value, label]) => (
              <TabsTrigger
                key={value}
                value={value}
                className="rounded-md transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Total Users"
                value={data.totalUsers ?? 0}
                description={`${formatNumber(data.verifiedUsers)} verified · ${formatNumber(
                  data.activeUsers
                )} enabled`}
                change={usersChange}
                trend={usersChange ? "up" : "neutral"}
                icon={Users}
              />
              <StatsCard
                title="Active Users"
                value={data.activeUsersPeriod ?? 0}
                description={`Unique users active in the last ${periodLabel}`}
                icon={Activity}
              />
              <StatsCard
                title={`Revenue (${periodLabel})`}
                value={formatCurrency(totalRevenue)}
                description={`Avg order ${formatCurrency(avgOrderValue, 2)}`}
                change={revenueChange}
                trend={changeTrend(data.comparison?.revenue)}
                icon={DollarSign}
              />
              <StatsCard
                title={`Orders (${periodLabel})`}
                value={totalOrders}
                description={`${formatNumber(deliveredOrders)} delivered · ${formatNumber(
                  inTransitOrders
                )} in transit`}
                change={ordersChange}
                trend={changeTrend(data.comparison?.orders)}
                icon={Package}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <DashboardChart
                title="Revenue Trend"
                description={`Collected revenue for the last ${periodLabel}`}
                type="area"
                data={revenueData}
                dataKey="value"
                color="#0B7A4B"
                height={300}
                emptyMessage="No revenue recorded in this period yet."
                className="xl:col-span-2"
              />
              <DashboardChart
                title="Orders by Type"
                description="Distribution of shipment categories"
                type="pie"
                data={typeData}
                dataKey="value"
                height={300}
                emptyMessage="No orders in this period yet."
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Truck className="h-4 w-4 text-primary" />
                    Order Status Breakdown
                  </CardTitle>
                  <CardDescription>
                    Where orders from the last {periodLabel} stand right now
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {ordersByStatus.length === 0 ? (
                    <EmptyState
                      title="No order activity yet"
                      description="Order statuses will appear here as soon as orders are created."
                    />
                  ) : (
                    <div className="space-y-4">
                      {ordersByStatus.map((status) => (
                        <div key={status._id ?? "unknown"}>
                          <div className="mb-1.5 flex items-center justify-between text-sm">
                            <span className="font-medium capitalize text-gray-700">
                              {humanize(status._id)}
                            </span>
                            <span className="font-semibold text-foreground">
                              {formatNumber(status.count)}
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={`h-2 rounded-full ${
                                STATUS_COLORS[status._id ?? ""] ?? "bg-primary"
                              }`}
                              style={{
                                width: `${(status.count / maxStatusCount) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <DashboardChart
                title="Daily Active Users"
                description={`Unique users signing in during the last ${periodLabel}`}
                type="line"
                data={dauData}
                dataKey="value"
                color="#2563EB"
                height={260}
                emptyMessage="No successful sign-ins recorded in this period."
              />
            </div>
          </TabsContent>

          {/* Users */}
          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Total Users"
                value={data.totalUsers ?? 0}
                description="All registered accounts"
                icon={Users}
              />
              <StatsCard
                title="Active in Period"
                value={data.activeUsersPeriod ?? 0}
                description={`Signed in during the last ${periodLabel}`}
                icon={Activity}
              />
              <StatsCard
                title="Verified Users"
                value={data.verifiedUsers ?? 0}
                description={`${formatPercent(
                  ((data.verifiedUsers ?? 0) / Math.max(1, data.totalUsers ?? 0)) *
                    100
                )} of all users`}
                icon={UserCheck}
              />
              <StatsCard
                title="New Signups"
                value={data.newUsers ?? 0}
                description={`Accounts created in the last ${periodLabel}`}
                change={usersChange}
                trend={usersChange ? "up" : "neutral"}
                icon={UserPlus}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <DashboardChart
                title="User Registrations"
                description="New accounts created per day"
                type="bar"
                data={signupData}
                dataKey="value"
                color="#F5C400"
                emptyMessage="No new registrations in this period."
              />
              <DashboardChart
                title="Daily Active Users"
                description="Unique users signing in per day"
                type="line"
                data={dauData}
                dataKey="value"
                color="#2563EB"
                emptyMessage="No successful sign-ins recorded in this period."
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <DashboardChart
                title="Users by Role"
                description="Account distribution across roles"
                type="pie"
                data={roleData}
                dataKey="value"
                emptyMessage="No users found."
              />
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Bell className="h-4 w-4 text-primary" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    How users want to receive updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!notificationPrefs || notificationPrefs.total === 0 ? (
                    <EmptyState
                      title="No preference data yet"
                      description="Notification settings will appear once users configure their accounts."
                    />
                  ) : (
                    <div className="space-y-6">
                      {[
                        {
                          label: "Email notifications",
                          on: notificationPrefs.emailOn,
                          off: notificationPrefs.emailOff,
                        },
                        {
                          label: "SMS notifications",
                          on: notificationPrefs.smsOn,
                          off: notificationPrefs.smsOff,
                        },
                      ].map((pref) => {
                        const total = Math.max(1, pref.on + pref.off);
                        const percent = Math.round((pref.on / total) * 100);
                        return (
                          <div key={pref.label}>
                            <div className="mb-2 flex items-center justify-between text-sm">
                              <span className="font-medium text-gray-700">
                                {pref.label}
                              </span>
                              <span className="text-muted-foreground">
                                {pref.on} on · {pref.off} off
                              </span>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                              <div
                                className="h-2.5 rounded-full bg-primary"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {percent}% enabled
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Orders */}
          <TabsContent value="orders" className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title={`Orders (${periodLabel})`}
                value={totalOrders}
                description="All orders created in this period"
                change={ordersChange}
                trend={changeTrend(data.comparison?.orders)}
                icon={Package}
              />
              <StatsCard
                title="Delivered"
                value={deliveredOrders}
                description={`${formatPercent(
                  (deliveredOrders / Math.max(1, totalOrders)) * 100
                )} completion rate`}
                icon={CheckCircle2}
              />
              <StatsCard
                title="In Transit"
                value={inTransitOrders}
                description="Picked up or moving to destination"
                icon={Truck}
              />
              <StatsCard
                title="Cancelled"
                value={cancelledOrders}
                description={`${formatPercent(
                  (cancelledOrders / Math.max(1, totalOrders)) * 100
                )} of period orders`}
                icon={XCircle}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <DashboardChart
                title="Orders by Type"
                description="Document, parcel and e-commerce shipments"
                type="pie"
                data={typeData}
                dataKey="value"
                emptyMessage="No orders in this period yet."
              />
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-4 w-4 text-primary" />
                    Status Overview
                  </CardTitle>
                  <CardDescription>
                    Live distribution of shipment statuses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {ordersByStatus.length === 0 ? (
                    <EmptyState
                      title="No orders to display"
                      description="Create an order to start tracking status performance."
                    />
                  ) : (
                    <div className="space-y-4">
                      {ordersByStatus.map((status) => (
                        <div key={status._id ?? "unknown"}>
                          <div className="mb-1.5 flex items-center justify-between text-sm">
                            <span className="font-medium capitalize text-gray-700">
                              {humanize(status._id)}
                            </span>
                            <span className="font-semibold text-foreground">
                              {formatNumber(status.count)}
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={`h-2 rounded-full ${
                                STATUS_COLORS[status._id ?? ""] ?? "bg-primary"
                              }`}
                              style={{
                                width: `${(status.count / maxStatusCount) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Revenue */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title={`Revenue (${periodLabel})`}
                value={formatCurrency(totalRevenue)}
                description="Collected payments in this period"
                change={revenueChange}
                trend={changeTrend(data.comparison?.revenue)}
                icon={DollarSign}
              />
              <StatsCard
                title="Refunds"
                value={formatCurrency(totalRefunds)}
                description="Refunded amount in this period"
                icon={TrendingDown}
              />
              <StatsCard
                title="Average Order"
                value={formatCurrency(avgOrderValue, 2)}
                description="Average collected per order"
                icon={Wallet}
              />
              <StatsCard
                title="Net Revenue"
                value={formatCurrency(totalRevenue - totalRefunds)}
                description="Revenue after refunds"
                icon={TrendingUp}
              />
            </div>

            <DashboardChart
              title="Revenue by Day"
              description={`Revenue collected during the last ${periodLabel}`}
              type="area"
              data={revenueData}
              dataKey="value"
              color="#0B7A4B"
              height={320}
              emptyMessage="No revenue recorded in this period yet."
            />

            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Payment Methods
                </CardTitle>
                <CardDescription>
                  How customers paid in this period
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paymentMethods.length === 0 ? (
                  <EmptyState
                    title="No payment data yet"
                    description="Payment method performance will appear after the first order is paid."
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {paymentMethods.map((method) => (
                      <div
                        key={method._id ?? "unknown"}
                        className="rounded-lg border border-gray-200 bg-gray-50/60 p-4"
                      >
                        <p className="text-sm font-medium capitalize text-gray-700">
                          {humanize(method._id)}
                        </p>
                        <p className="mt-1 text-xl font-bold text-foreground">
                          {formatCurrency(method.total)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatNumber(method.count)} orders
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Failed Logins"
                value={loginStats.failed}
                description={`Attempts in the last ${periodLabel}`}
                icon={ShieldAlert}
              />
              <StatsCard
                title="Login Success Rate"
                value={formatPercent(loginStats.successRate)}
                description={`${formatNumber(loginStats.successful)} of ${formatNumber(
                  loginStats.total
                )} attempts`}
                icon={Shield}
              />
              <StatsCard
                title="Suspicious IPs"
                value={data.topFailedIPs?.length ?? 0}
                description="IPs with failed login attempts"
                icon={AlertCircle}
              />
              <StatsCard
                title="Failed Phones"
                value={data.topFailedPhones?.length ?? 0}
                description="Numbers with failed attempts"
                icon={XCircle}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <DashboardChart
                title="Top Failed Login Numbers"
                description="Masked phone numbers with the most failed attempts"
                type="bar"
                data={failedPhoneData}
                dataKey="value"
                color="#ef4444"
                emptyMessage="No failed login attempts in this period."
              />
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShieldAlert className="h-4 w-4 text-red-500" />
                    Suspicious IP Addresses
                  </CardTitle>
                  <CardDescription>
                    IPs with the most failed login attempts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!data.topFailedIPs || data.topFailedIPs.length === 0 ? (
                    <EmptyState
                      title="No suspicious IPs"
                      description="No failed login attempts were recorded in this period."
                    />
                  ) : (
                    <div className="space-y-2">
                      {data.topFailedIPs.slice(0, 10).map((ip, index) => (
                        <div
                          key={`${ip._id}-${index}`}
                          className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/60 px-3 py-2.5"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700">
                              {index + 1}
                            </span>
                            <span className="truncate font-mono text-sm text-gray-700">
                              {ip._id || "Unknown"}
                            </span>
                          </div>
                          <Badge variant="destructive" className="ml-2 text-xs">
                            {ip.count} attempts
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4 text-primary" />
                  Login Activity
                </CardTitle>
                <CardDescription>
                  Successful and failed authentication attempts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loginStats.total === 0 ? (
                  <EmptyState
                    title="No login activity"
                    description="Authentication attempts will appear here as users sign in."
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">
                        Successful sign-ins
                      </span>
                      <span className="text-muted-foreground">
                        {formatNumber(loginStats.successful)} /{" "}
                        {formatNumber(loginStats.total)}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-3 rounded-full bg-green-600"
                        style={{ width: `${loginStats.successRate}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                        <p className="text-xs text-green-700">Successful</p>
                        <p className="text-xl font-bold text-green-800">
                          {formatNumber(loginStats.successful)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                        <p className="text-xs text-red-700">Failed</p>
                        <p className="text-xl font-bold text-red-800">
                          {formatNumber(loginStats.failed)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  );
}
