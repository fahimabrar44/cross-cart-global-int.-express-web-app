import { NextRequest } from "next/server";
import connectDB from "@/config/db";
import { User } from "@/server/models/User.model";
import { Referral } from "@/server/models/Referral.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { createAuthHandler } from "@/server/common/apiWrapper";

/**
 * Register a referral when a new user signs up (or via dashboard form).
 * Body: { referralCode }
 */
export const POST = createAuthHandler(async ({ req, user }) => {
  try {
    await connectDB();
    const body = await req.json();

    const code = String(body.referralCode || "").trim().toUpperCase();
    if (!code) return errorResponse({ status: 400, message: "referralCode is required", req });

    const referrer = await User.findOne({ referralCode: code });
    if (!referrer) return errorResponse({ status: 404, message: "Invalid referral code", req });
    if (referrer._id.toString() === user?.id) {
      return errorResponse({ status: 400, message: "You cannot refer yourself", req });
    }

    const existing = await Referral.findOne({ referredUser: user?.id });
    if (existing) {
      return errorResponse({ status: 400, message: "Referral already registered for this account", req });
    }

    const dbUser = await User.findById(user?.id);
    if (!dbUser) return errorResponse({ status: 404, message: "User not found", req });

    const referral = new Referral({
      referrer: referrer._id,
      referralCode: code,
      referredUser: user?.id,
      referredPhone: dbUser.phone,
      status: "pending",
    });
    await referral.save();

    dbUser.referredBy = code;
    await dbUser.save();

    return successResponse({ status: 201, message: "Referral registered successfully", data: referral, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to register referral";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});