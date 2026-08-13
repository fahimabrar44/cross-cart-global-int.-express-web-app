import { NextRequest } from "next/server";
import connectDB from "@/config/db";
import { User } from "@/server/models/User.model";
import { Referral } from "@/server/models/Referral.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { createAuthHandler } from "@/server/common/apiWrapper";

/**
 * GET /api/v1/referrals/me
 * Returns the current user's referral code + stats + referrals.
 */
export const GET = createAuthHandler(async ({ req, user }) => {
  try {
    await connectDB();

    const dbUser = await User.findById(user?.id);
    if (!dbUser) return errorResponse({ status: 404, message: "User not found", req });

    if (!dbUser.referralCode) {
      const namePart = (dbUser.name || "USER")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase()
        .slice(0, 5);
      const digits = Date.now().toString().slice(-4);
      dbUser.referralCode = `${namePart}${digits}`;
      await dbUser.save();
    }

    const referrals = await Referral.find({ referrer: dbUser._id })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort({ createdAt: -1 } as any)
      .lean();

    return successResponse({
      status: 200,
      message: "Referral info fetched successfully",
      data: {
        referralCode: dbUser.referralCode,
        rewards: dbUser.referralRewards || 0,
        referralCount: referrals.length,
        pendingCount: referrals.filter((r) => r.status === "pending").length,
        referrals,
      },
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch referral info";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});