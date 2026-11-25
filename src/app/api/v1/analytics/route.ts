import connectDB from "@/config/db";
import { createModeratorHandler } from "@/server/common/apiWrapper";
import { successResponse, errorResponse } from "@/server/common/response";
import { LoginHistory } from "@/server/models/LoginHistory.model";
import { Order } from "@/server/models/Order.model";
import { User } from "@/server/models/User.model";

interface OrderFacetResult {
  totalOrders?: Array<{ count: number }>;
  ordersByType?: Array<{ _id: string | null; count: number }>;
  ordersByStatus?: Array<{ _id: string | null; count: number }>;
  revenueSummary?: Array<{
    totalRevenue: number;
    totalRefunds: number;
    avgOrderValue: number;
    totalOrders: number;
    avgDeliveryHours: number | null;
    deliveredOrders: number;
    cancelledOrders: number;
  }>;
  monthlyRevenue?: Array<{
    year: number;
    month: number;
    revenue: number;
    orders: number;
  }>;
  dailyRevenue?: Array<{ day: string; revenue: number; orders: number }>;
  paymentMethods?: Array<{ _id: string | null; count: number; total: number }>;
}

/** Build the shared order aggregation used for all-time and period stats. */
function buildOrdersPipeline(match: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pipeline: any[] = [];

  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  pipeline.push(
    {
      $lookup: {
        from: "tracks",
        localField: "trackId",
        foreignField: "trackId",
        as: "track",
      },
    },
    { $addFields: { track: { $arrayElemAt: ["$track", 0] } } },
    {
      $addFields: {
        weightNum: {
          $convert: {
            input: { $ifNull: ["$parcel.weight", 0] },
            to: "double",
            onError: 0,
            onNull: 0,
          },
        },
      },
    },
    {
      $addFields: {
        _pickedAt: {
          $arrayElemAt: [
            {
              $map: {
                input: {
                  $filter: {
                    input: { $ifNull: ["$track.history", []] },
                    cond: { $eq: ["$$this.status", "picked-up"] },
                  },
                },
                as: "p",
                in: "$$p.timestamp",
              },
            },
            0,
          ],
        },
        _deliveredAt: {
          $arrayElemAt: [
            {
              $map: {
                input: {
                  $filter: {
                    input: { $ifNull: ["$track.history", []] },
                    cond: { $eq: ["$$this.status", "delivered"] },
                  },
                },
                as: "d",
                in: "$$d.timestamp",
              },
            },
            0,
          ],
        },
      },
    },
    {
      $addFields: {
        deliveryHours: {
          $cond: [
            { $and: ["$_pickedAt", "$_deliveredAt"] },
            {
              $divide: [
                { $subtract: ["$_deliveredAt", "$_pickedAt"] },
                1000 * 60 * 60,
              ],
            },
            null,
          ],
        },
      },
    },
    {
      $facet: {
        totalOrders: [{ $count: "count" }],
        ordersByType: [
          { $group: { _id: "$parcel.orderType", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        ordersByStatus: [
          { $group: { _id: "$status", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        revenueSummary: [
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: { $ifNull: ["$payment.pReceived", 0] } },
              totalRefunds: { $sum: { $ifNull: ["$payment.pRefunded", 0] } },
              avgOrderValue: { $avg: { $ifNull: ["$payment.pReceived", 0] } },
              totalOrders: { $sum: 1 },
              avgDeliveryHours: { $avg: "$deliveryHours" },
              deliveredOrders: {
                $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
              },
              cancelledOrders: {
                $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
              },
            },
          },
        ],
        monthlyRevenue: [
          {
            $group: {
              _id: {
                year: { $year: "$orderDate" },
                month: { $month: "$orderDate" },
              },
              revenue: { $sum: { $ifNull: ["$payment.pReceived", 0] } },
              orders: { $sum: 1 },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
          {
            $project: {
              _id: 0,
              year: "$_id.year",
              month: "$_id.month",
              revenue: 1,
              orders: 1,
            },
          },
        ],
        dailyRevenue: [
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$orderDate" },
              },
              revenue: { $sum: { $ifNull: ["$payment.pReceived", 0] } },
              orders: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, day: "$_id", revenue: 1, orders: 1 } },
        ],
        paymentMethods: [
          {
            $group: {
              _id: "$payment.pType",
              count: { $sum: 1 },
              total: { $sum: { $ifNull: ["$payment.pReceived", 0] } },
            },
          },
          { $sort: { count: -1 } },
        ],
      },
    }
  );

  return pipeline;
}

function percentChange(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

export const GET = createModeratorHandler(async ({ req, user }) => {
  try {
    await connectDB();

    // Only admin and moderator can access analytics
    if (!user || (user.role !== "admin" && user.role !== "moderator")) {
      return errorResponse({
        status: 403,
        message: "Admin or moderator access required for analytics",
        req,
      });
    }

    const url = new URL(req.url);
    const params = url.searchParams;

    const startDateParam = params.get("startDate");
    const endDateParam = params.get("endDate");
    const days = Math.min(
      Math.max(parseInt(params.get("days") || "30", 10) || 30, 1),
      365
    );
    const months = Math.min(
      Math.max(parseInt(params.get("months") || "12", 10) || 12, 1),
      36
    );
    const limit = Math.min(
      Math.max(parseInt(params.get("limit") || "10", 10) || 10, 1),
      100
    );

    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setDate(defaultStart.getDate() - days + 1);

    const explicitStart = startDateParam ? new Date(startDateParam) : null;
    const explicitEnd = endDateParam ? new Date(endDateParam) : null;
    if (explicitEnd) explicitEnd.setHours(23, 59, 59, 999);

    const periodStart = explicitStart || defaultStart;
    const periodEnd = explicitEnd || now;
    const periodMs = Math.max(
      24 * 60 * 60 * 1000,
      periodEnd.getTime() - periodStart.getTime()
    );
    const previousStart = new Date(periodStart.getTime() - periodMs);
    const previousEnd = periodStart;

    const periodMatch = {
      $gte: periodStart,
      $lte: periodEnd,
    };

    // Users Section
    const totalUsersP = User.countDocuments();
    const activeUsersP = User.countDocuments({ isActive: true });
    const verifiedUsersP = User.countDocuments({ isVerified: true });
    const currentSignupsP = User.countDocuments({ createdAt: periodMatch });
    const previousSignupsP = User.countDocuments({
      createdAt: { $gte: previousStart, $lt: previousEnd },
    });
    const roleBreakdownP = User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const notificationPrefsP = User.aggregate([
      {
        $group: {
          _id: null,
          emailOn: {
            $sum: { $cond: ["$preferences.notifications.email", 1, 0] },
          },
          smsOn: { $sum: { $cond: ["$preferences.notifications.sms", 1, 0] } },
          total: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          emailOn: 1,
          smsOn: 1,
          total: 1,
          emailOff: { $subtract: ["$total", "$emailOn"] },
          smsOff: { $subtract: ["$total", "$smsOn"] },
        },
      },
    ]);

    // Signup trend
    const signupTrendP = User.aggregate([
      { $match: { createdAt: periodMatch } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Security / Login Analytics
    const loginPeriodMatch = {
      success: true,
      timestamp: periodMatch,
    };

    const dauP = LoginHistory.aggregate([
      { $match: loginPeriodMatch },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          },
          users: { $addToSet: "$user" },
        },
      },
      {
        $project: {
          _id: 0,
          day: "$_id.day",
          activeUsers: { $size: "$users" },
        },
      },
      { $sort: { day: 1 } },
    ]);

    const activeUsersPeriodP = LoginHistory.aggregate([
      {
        $match: {
          ...loginPeriodMatch,
          user: { $ne: null },
        },
      },
      { $group: { _id: "$user" } },
      { $count: "count" },
    ]);

    const loginStatsP = LoginHistory.aggregate([
      { $match: { timestamp: periodMatch } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          successful: { $sum: { $cond: ["$success", 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
          successful: 1,
          failed: { $subtract: ["$total", "$successful"] },
          successRate: {
            $cond: [
              { $gt: ["$total", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$successful", "$total"] },
                      100,
                    ],
                  },
                  1,
                ],
              },
              0,
            ],
          },
        },
      },
    ]);

    const failedLoginMatch = {
      success: false,
      timestamp: periodMatch,
    };

    const topFailedPhonesP = LoginHistory.aggregate([
      { $match: failedLoginMatch },
      { $group: { _id: "$phone", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: Math.max(limit, 10) },
    ]);

    const topFailedIPsP = LoginHistory.aggregate([
      { $match: failedLoginMatch },
      { $group: { _id: "$ipAddress", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: Math.max(limit, 10) },
    ]);

    const topIPsP = LoginHistory.aggregate([
      { $match: { timestamp: periodMatch } },
      { $group: { _id: "$ipAddress", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: Math.max(limit, 10) },
    ]);

    // Orders / Revenue Analytics
    const previousOrdersP = Order.aggregate([
      {
        $match: {
          orderDate: { $gte: previousStart, $lt: previousEnd },
        },
      },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          revenue: { $sum: { $ifNull: ["$payment.pReceived", 0] } },
        },
      },
    ]);

    // Execute all analytics queries
    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      currentSignups,
      previousSignups,
      roleBreakdown,
      notificationPrefs,
      signupTrend,
      dau,
      activeUsersPeriodResult,
      loginStatsResult,
      topFailedPhones,
      topFailedIPs,
      topIPs,
      allTimeOrders,
      periodOrders,
      previousOrders,
    ] = await Promise.all([
      totalUsersP,
      activeUsersP,
      verifiedUsersP,
      currentSignupsP,
      previousSignupsP,
      roleBreakdownP,
      notificationPrefsP,
      signupTrendP,
      dauP,
      activeUsersPeriodP,
      loginStatsP,
      topFailedPhonesP,
      topFailedIPsP,
      topIPsP,
      Order.aggregate(buildOrdersPipeline({})),
      Order.aggregate(
        buildOrdersPipeline({
          orderDate: { $gte: periodStart, $lte: periodEnd },
        })
      ),
      previousOrdersP,
    ]);

    const allTimeSummary = (allTimeOrders[0] || {}) as OrderFacetResult;
    const periodSummary = (periodOrders[0] || {}) as OrderFacetResult;
    const activeUsersPeriod =
      activeUsersPeriodResult[0]?.count ?? 0;
    const loginStats = loginStatsResult[0] || {
      total: 0,
      successful: 0,
      failed: 0,
      successRate: 0,
    };

    const currentOrderCount =
      periodSummary.revenueSummary?.[0]?.totalOrders ??
      periodSummary.totalOrders?.[0]?.count ??
      0;
    const currentRevenue =
      periodSummary.revenueSummary?.[0]?.totalRevenue ?? 0;
    const previousOrderCount = previousOrders[0]?.orders ?? 0;
    const previousRevenue = previousOrders[0]?.revenue ?? 0;

    const analyticsData = {
      // User analytics
      totalUsers,
      activeUsers,
      activeUsersPeriod,
      verifiedUsers,
      roleBreakdown,
      notificationPrefs,
      signupTrend,
      newUsers: currentSignups,
      dau,

      // Security analytics
      topFailedPhones,
      topFailedIPs,
      topIPs,
      loginStats,

      // Order analytics
      ordersSummary: allTimeSummary,
      periodSummary: {
        ...periodSummary,
        startDate: periodStart.toISOString(),
        endDate: periodEnd.toISOString(),
        days,
      },

      // Period-over-period comparison for real trend labels
      comparison: {
        users: {
          current: currentSignups,
          previous: previousSignups,
          changePercent: percentChange(currentSignups, previousSignups),
        },
        orders: {
          current: currentOrderCount,
          previous: previousOrderCount,
          changePercent: percentChange(currentOrderCount, previousOrderCount),
        },
        revenue: {
          current: currentRevenue,
          previous: previousRevenue,
          changePercent: percentChange(currentRevenue, previousRevenue),
        },
      },

      // Metadata
      generatedAt: new Date().toISOString(),
      generatedBy: {
        userId: user.id,
        role: user.role,
        name: user.name,
      },
      filters: {
        startDate: startDateParam,
        endDate: endDateParam,
        days,
        months,
        limit,
      },
    };

    return successResponse({
      status: 200,
      message: "Analytics data fetched successfully",
      data: analyticsData,
      req,
    });
  } catch (error) {
    console.error("Analytics API Error:", error);
    return errorResponse({
      status: 500,
      message: "Failed to fetch analytics data",
      error,
      req,
    });
  }
});
