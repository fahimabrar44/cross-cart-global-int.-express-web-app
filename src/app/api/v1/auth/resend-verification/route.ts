import connectDB from "@/config/db";
import { errorResponse, successResponse } from "@/server/common/response";
import { User } from "@/server/models/User.model";
import { emailService } from "@/services/emailService";
import { NextRequest } from "next/server";

/**
 * POST /api/v1/auth/resend-verification
 * Resend a fresh 6-digit email verification code.
 * Rate limited to prevent abuse.
 */
const resentAttempts = new Map<string, number>();
const RESEND_RATE_LIMIT = 3; // Max 3 resends per email per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const headers = req.headers as any;
    const ipAddress =
      headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      headers.get("x-real-ip") ||
      "unknown";

    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return errorResponse({
        status: 400,
        message: "Email address is required",
        req,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Rate limit by ip + email
    const rateKey = `${ipAddress}:${normalizedEmail}`;
    const now = Date.now();
    resentAttempts.forEach((timestamp, key) => {
      if (now - timestamp > RATE_LIMIT_WINDOW) resentAttempts.delete(key);
    });
    const attempts = resentAttempts.get(rateKey) || 0;
    if (attempts >= RESEND_RATE_LIMIT) {
      return errorResponse({
        status: 429,
        message: "Too many resend attempts. Please try again later.",
        req,
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return errorResponse({
        status: 404,
        message: "User not found",
        req,
      });
    }

    if (user.isVerified) {
      return errorResponse({
        status: 400,
        message: "This email is already verified",
        req,
      });
    }

    // Generate a fresh code (overwrites previous code/expiry)
    const verificationCode = user.generateVerificationCode();
    await user.save();

    // Await so serverless doesn't drop the email
    try {
      await emailService.sendVerificationEmail({
        email: user.email,
        name: user.name,
        code: verificationCode,
      });
    } catch (err) {
      console.error("Resend email error:", err);
    }

    resentAttempts.set(rateKey, now);

    return successResponse({
      status: 200,
      message: "Verification code has been sent to your email",
      data: { email: user.email },
      req,
    });
  } catch (error: unknown) {
    console.error("Resend verification API Error:", error);

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
