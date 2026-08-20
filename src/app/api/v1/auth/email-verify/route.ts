import connectDB from "@/config/db";
import { errorResponse, successResponse } from "@/server/common/response";
import { User } from "@/server/models/User.model";
import { NextRequest } from "next/server";

/**
 * POST /api/v1/auth/email-verify
 * Verify user's email using verification code
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, code } = await req.json();

    // Validate input
    if (!email || !code) {
      return errorResponse({
        status: 400,
        message: "Email and verification code are required",
        req,
      });
    }

    // Find user by email (explicitly include the select:false code field)
    const user = await User.findOne({ email }).select(
      "+emailVerification.code +emailVerification.expires +emailVerification.attempts"
    );
    if (!user) {
      return errorResponse({
        status: 404,
        message: "User not found",
        req,
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return successResponse({
        status: 200,
        message: "User already verified",
        data: { email: user.email },
        req,
      });
    }

    // Enforce the 5-attempt cap to prevent brute-forcing the 6-digit code
    const attempts = user.emailVerification.attempts || 0;
    if (attempts >= 5) {
      user.emailVerification.code = null;
      user.emailVerification.expires = null;
      await user.save().catch(() => undefined);
      return errorResponse({
        status: 429,
        message: "Too many verification attempts. Request a new code.",
        req,
      });
    }

    // Check code and expiry
    const now = new Date();
    if (
      user.emailVerification.code !== code ||
      !user.emailVerification.expires ||
      user.emailVerification.expires < now
    ) {
      user.emailVerification.attempts = attempts + 1;
      await user.save().catch(() => undefined);
      return errorResponse({
        status: 400,
        message: "Invalid or expired verification code",
        req,
      });
    }

    // Verify user
    user.isVerified = true;
    user.emailVerification.code = null;
    user.emailVerification.expires = null;
    user.emailVerification.attempts = 0;
    await user.save();

    return successResponse({
      status: 200,
      message: "Email verified successfully",
      data: { email: user.email },
      req,
    });
  } catch (error: unknown) {
    console.error("Email Verification API Error:", error);

    let errorMessage = "Something went wrong";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return errorResponse({
      status: 500,
      message: errorMessage,
      error,
      req,
    });
  }
}
