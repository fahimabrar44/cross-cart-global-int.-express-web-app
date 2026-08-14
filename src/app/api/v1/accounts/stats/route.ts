import connectDB from "@/config/db";
import { User } from "@/server/models/User.model";
import { NextRequest } from "next/server";
import { verifyAuth } from "@/middleware/auth";
import { errorResponse, successResponse } from "@/server/common/response";

const startOfToday = (): Date => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
};

// GET: aggregate user statistics (Admin/Moderator only)
export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return errorResponse({ status: 401, message: "Unauthorized", req });
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (authResult.user.role !== "admin" && authResult.user.role !== "moderator") {
      return errorResponse({ status: 403, message: "Admin or moderator access required", req });
    }

    await connectDB();

    const now = new Date();
    const today = startOfToday();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      total,
      active,
      inactive,
      verified,
      unverified,
      adminCount,
      moderatorCount,
      userCount,
      todayRegistrations,
      weeklyRegistrations,
      monthlyRegistrations,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ isVerified: false }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "moderator" }),
      User.countDocuments({ role: "user" }),
      User.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
      User.countDocuments({ createdAt: { $gte: monthAgo } }),
    ]);

    return successResponse({
      status: 200,
      message: "User statistics fetched",
      data: {
        total,
        active,
        inactive,
        verified,
        unverified,
        adminCount,
        moderatorCount,
        userCount,
        todayRegistrations,
        weeklyRegistrations,
        monthlyRegistrations,
      },
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch user statistics";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}