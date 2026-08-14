"use client";
import { DashboardChart } from "@/components/Dashboard/DashboardChart";
import { StatsCard } from "@/components/Dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoleGuard } from "@/middleware/roleGuard";
import { AnalyticsService } from "@/services/dashboardService";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Bell,
  DollarSign,
  Download,
  Filter,
  Loader2,
  Package,
  RefreshCw,
  Shield,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface AnalyticsData {
  totalUsers?: number;
  activeUsers?: number;
  verifiedUsers?: number;
  totalOrders?: number;
  ordersByType?: Array<{ _id: string; count: number }>;
  revenueSummary?: Array<{
    totalRevenue: number;
    totalRefunds: number;
    avgOrderValue: number;
    totalOrders: number;
  }>;
  monthlyRevenue?: Array<{
    year: number;
    month: number;
    revenue: number;
    orders: number;
  }>;
  signupTrend?: Array<{
    _id: string;
    count: number;
  }>;
  dau?: Array<{
    day: string;
    activeUsers: number;
  }>;
  topFailedPhones?: Array<{
    _id: string;
    count: number;
  }>;
  roleBreakdown?: Array<{
    _id: string;
    count: number;
  }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const days =
        selectedPeriod === "7d" ? 7 : selectedPeriod === "30d" ? 30 : 90;
      const response = await AnalyticsService.getOverview({ days });

      if (response.status == 200) {
        setData(response.data);
        toast.success("Analytics data refreshed successfully");
      } else {
        setError(response.message || "Failed to fetch analytics");
        toast.error("Failed to fetch analytics data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      toast.error("An error occurred while fetching analytics");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAnalytics();
  };

  const handleExport = () => {
    toast.info("Exporting analytics data...");
    // Implement export functionality
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-80 bg-gray-200 rounded animate-pulse mt-2"></div>
          </div>
          <div className="flex space-x-2">
            <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-32 bg-gray-200 rounded-lg animate-pulse"
            ></div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="h-96 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-96 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-red-800 mb-2">
                Error Loading Analytics
              </h3>
              <p className="text-red-600 mb-4 max-w-md">{error}</p>
              <button
                onClick={handleRefresh}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const revenueSummary = data.revenueSummary?.[0];

  return (
    <RoleGuard allowedRoles={["admin", "moderator"]}>
      <div className="space-y-6" data-testid="analytics-page">
        {/* Header with improved layout and actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive insights into your business performance
            </p>
          </div>
          <div className="flex flex-wrap items-center space-x-2">
            <button
              onClick={handleRefresh}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isRefreshing
                  ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              disabled={isRefreshing}
              data-testid="refresh-btn"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="flex items-center px-3 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-[#087F4F] transition-colors"
              data-testid="export-btn"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Period selector with improved styling */}
        <div className="bg-white p-1 rounded-lg shadow-sm border">
          <div className="flex space-x-1">
            <button
              onClick={() => setSelectedPeriod("7d")}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                selectedPeriod === "7d"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-700 hover:bg-soft-green"
              }`}
              data-testid="period-7d"
            >
              7 Days
            </button>
            <button
              onClick={() => setSelectedPeriod("30d")}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                selectedPeriod === "30d"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-700 hover:bg-soft-green"
              }`}
              data-testid="period-30d"
            >
              30 Days
            </button>
            <button
              onClick={() => setSelectedPeriod("90d")}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                selectedPeriod === "90d"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-700 hover:bg-soft-green"
              }`}
              data-testid="period-90d"
            >
              90 Days
            </button>
          </div>
        </div>

        {/* Tabs with improved styling */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
            >
              Users
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
            >
              Orders
            </TabsTrigger>
            <TabsTrigger
              value="revenue"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
            >
              Revenue
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
            >
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics with improved cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Total Users"
                value={data.totalUsers || 0}
                change="+12% from last period"
                trend="up"
                icon={Users}
                className="hover:shadow-md transition-shadow"
              />
              <StatsCard
                title="Active Users"
                value={data.activeUsers || 0}
                change="+5% from last period"
                trend="up"
                icon={Activity}
                className="hover:shadow-md transition-shadow"
              />
              <StatsCard
                title="Total Revenue"
                value={`$${
                  revenueSummary?.totalRevenue?.toLocaleString() || 0
                }`}
                change="+18% from last period"
                trend="up"
                icon={DollarSign}
                className="hover:shadow-md transition-shadow"
              />
              <StatsCard
                title="Total Orders"
                value={revenueSummary?.totalOrders || 0}
                change="+8% from last period"
                trend="up"
                icon={Package}
                className="hover:shadow-md transition-shadow"
              />
            </div>

            {/* Charts with improved cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {data.monthlyRevenue && data.monthlyRevenue.length > 0 && (
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        <span>Revenue Trend</span>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Filter className="h-4 w-4" />
                      </button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DashboardChart
                      title="Revenue Trend"
                      description="Monthly revenue performance"
                      type="area"
                      data={data.monthlyRevenue.map((item) => ({
                        name: `${item.month}/${item.year}`,
                        value: item.revenue,
                        orders: item.orders,
                      }))}
                      dataKey="value"
                      color="#3b82f6"
                    />
                  </CardContent>
                </Card>
              )}

              {data.ordersByType && data.ordersByType.length > 0 && (
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="h-5 w-5 text-green-600" />
                        <span>Orders by Type</span>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Filter className="h-4 w-4" />
                      </button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DashboardChart
                      title="Orders by Type"
                      description="Distribution of order categories"
                      type="bar"
                      data={data.ordersByType.map((item) => ({
                        name: item._id || "Unknown",
                        value: item.count,
                      }))}
                      dataKey="value"
                      color="#10b981"
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <StatsCard
                title="Total Users"
                value={data.totalUsers || 0}
                icon={Users}
                className="hover:shadow-md transition-shadow"
              />
              <StatsCard
                title="Active Users"
                value={data.activeUsers || 0}
                icon={Activity}
                className="hover:shadow-md transition-shadow"
              />
              <StatsCard
                title="Verified Users"
                value={data.verifiedUsers || 0}
                icon={Shield}
                className="hover:shadow-md transition-shadow"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {data.signupTrend && data.signupTrend.length > 0 && (
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-orange-600" />
                      <span>User Registrations</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DashboardChart
                      data={data.signupTrend.map((item) => ({
                        name: item._id,
                        value: item.count,
                      }))}
                      title="User Registrations"
                      description="New users per month"
                      type="bar"
                      dataKey="value"
                      color="#f97316"
                    />
                  </CardContent>
                </Card>
              )}

              {data.roleBreakdown && data.roleBreakdown.length > 0 && (
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      <span>Users by Role</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DashboardChart
                      title="Users by Role"
                      description="System user distribution"
                      type="pie"
                      dataKey="value"
                      data={data.roleBreakdown.map((role) => ({
                        name: role._id,
                        value: role.count,
                      }))}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            {data.dau && data.dau.length > 0 && (
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    <span>Daily Active Users</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DashboardChart
                    title="Daily Active Users"
                    description="Number of users active each day"
                    type="line"
                    data={data.dau.map((item) => ({
                      name: item.day,
                      value: item.activeUsers,
                    }))}
                    dataKey="value"
                    color="#10b981"
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <StatsCard
                title="Total Orders"
                value={revenueSummary?.totalOrders || 0}
                icon={Package}
                className="hover:shadow-md transition-shadow"
              />
              <StatsCard
                title="Average Order Value"
                value={`$${
                  revenueSummary?.avgOrderValue?.toFixed(2) || "0.00"
                }`}
                icon={DollarSign}
                className="hover:shadow-md transition-shadow"
              />
              <StatsCard
                title="Order Growth"
                value="+12%"
                trend="up"
                icon={TrendingUp}
                className="hover:shadow-md transition-shadow"
              />
            </div>

            {data.ordersByType && data.ordersByType.length > 0 && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Package className="h-5 w-5 text-blue-600" />
                      <span>Orders by Type</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.ordersByType.map((type, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-3 rounded-lg bg-section hover:bg-soft-green transition-colors"
                        >
                          <span className="capitalize font-medium">
                            {type._id}
                          </span>
                          <span className="text-2xl font-bold text-blue-600">
                            {type.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                      <span>Order Type Distribution</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                    {/* @ts-expect-error */}
                    <DashboardChart
                      data={data.ordersByType.map((item) => ({
                        name: item._id,
                        value: item.count,
                      }))}
                      dataKey="value"
                      color="#3b82f6"
                    />
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <StatsCard
                title="Total Revenue"
                value={`$${
                  revenueSummary?.totalRevenue?.toLocaleString() || 0
                }`}
                icon={DollarSign}
                className="hover:shadow-md transition-shadow"
              />
              <StatsCard
                title="Total Refunds"
                value={`$${
                  revenueSummary?.totalRefunds?.toLocaleString() || 0
                }`}
                icon={TrendingDown}
                className="hover:shadow-md transition-shadow"
              />
              <StatsCard
                title="Average Order Value"
                value={`$${
                  revenueSummary?.avgOrderValue?.toFixed(2) || "0.00"
                }`}
                icon={Package}
                className="hover:shadow-md transition-shadow"
              />
              <StatsCard
                title="Net Revenue"
                value={`$${(
                  (revenueSummary?.totalRevenue || 0) -
                  (revenueSummary?.totalRefunds || 0)
                ).toLocaleString()}`}
                icon={DollarSign}
                className="hover:shadow-md transition-shadow"
              />
            </div>

            {data.monthlyRevenue && data.monthlyRevenue.length > 0 && (
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span>Monthly Revenue Trend</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                    {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                    {/* @ts-expect-error */}
                  <DashboardChart
                    title="Monthly Revenue Trend"
                    data={data.monthlyRevenue.map((item) => ({
                      name: `${item.month}/${item.year}`,
                      value: item.revenue,
                      orders: item.orders,
                    }))}
                    dataKey="value"
                    color="#10b981"
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <StatsCard
                title="Failed Login Attempts"
                value={
                  data.topFailedPhones?.reduce(
                    (sum, item) => sum + item.count,
                    0
                  ) || 0
                }
                icon={Shield}
                className="hover:shadow-md transition-shadow"
              />
              <StatsCard
                title="Security Alerts"
                value="0"
                icon={Bell}
                className="hover:shadow-md transition-shadow"
              />
              <StatsCard
                title="Blocked IPs"
                value="0"
                icon={Activity}
                className="hover:shadow-md transition-shadow"
              />
            </div>

            {data.topFailedPhones && data.topFailedPhones.length > 0 && (
              <>
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-red-600" />
                      <span>Top Failed Phones</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DashboardChart
                      title="Top Failed Phones"
                      description="Most frequent failed login attempts"
                      type="bar"
                      data={data.topFailedPhones.slice(0, 10).map((item) => ({
                        name: item._id,
                        value: item.count,
                      }))}
                      dataKey="value"
                      color="#ef4444"
                    />
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <span>Failed Login Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.topFailedPhones.slice(0, 10).map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                              <span className="text-red-600 font-medium text-sm">
                                {index + 1}
                              </span>
                            </div>
                            <span className="font-medium text-foreground">
                              {item._id}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-red-600 font-bold">
                              {item.count}
                            </span>
                            <span className="text-gray-500 text-sm">
                              attempts
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  );
}
