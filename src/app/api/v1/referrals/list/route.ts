import { NextRequest } from "next/server";
import connectDB from "@/config/db";
import { Referral } from "@/server/models/Referral.model";
import { User } from "@/server/models/User.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { createModeratorHandler } from "@/server/common/apiWrapper";

type GetQuery = {
  status?: string;
  page?: string;
  limit?: string;
};

/**
 * GET /api/v1/referrals/list — moderator/admin view all referrals.
 */
export const GET = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();

    const url = new URL(req.url);
    const q = Object.fromEntries(url.searchParams.entries()) as GetQuery;

    const page = Math.max(1, parseInt(q.page || "1", 10));
    const limit = Math.max(1, Math.min(200, parseInt(q.limit || "50", 10)));
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (q.status) query.status = q.status;

    const total = await Referral.countDocuments(query);
    const referrals = await Referral.find(query)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort({ createdAt: -1 } as any)
      .skip(skip)
      .limit(limit)
      .populate("referrer", "name phone")
      .populate("referredUser", "name phone")
      .lean();

    return successResponse({
      status: 200,
      message: "Referrals fetched successfully",
      data: referrals,
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch referrals";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

/**
 * PUT /api/v1/referrals/list - mark a referral as rewarded
 * Body: { referralId }
 */
export const PUT = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();
    const body = await req.json();
    const id = body.referralId;

    if (!id) return errorResponse({ status: 400, message: "referralId is required", req });

    const referral = await Referral.findById(id);
    if (!referral) return errorResponse({ status: 404, message: "Referral not found", req });

    referral.status = "rewarded";
    referral.rewardPaid = true;
    await referral.save();

    await User.findByIdAndUpdate(referral.referrer, {
      $inc: { referralRewards: referral.rewardAmount || 1 },
    });

    return successResponse({ status: 200, message: "Referral marked as rewarded", data: referral, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update referral";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});