import connectDB from "@/config/db";
import { errorResponse, successResponse } from "@/server/common/response";
import { User } from "@/server/models/User.model";
import { emailService } from "@/services/emailService";
import { NextRequest } from "next/server";

/**
 * POST /api/v1/auth/forgot-password
 * Generates a password-reset token and emails a reset link.
 * Always returns a generic success message to avoid account enumeration.
 * Rate limited to prevent abuse.
 */
const forgotAttempts = new Map<string, number>();
const FORGOT_RATE_LIMIT = 5; // Max 5 requests per identifier per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function getOrigin(req: NextRequest): string {
  try {
    const origin = req.nextUrl.origin;
    if (origin && origin.startsWith("http")) return origin;
  } catch {
    /* ignore */
  }
  return (process.env.PUBLIC_APP_URL || "https://ccg-web.vercel.app").replace(
    /\/+$/,
    ""
  );
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const headers = req.headers as unknown as {
      get: (k: string) => string | null;
    };
    const ipAddress =
      headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      headers.get("x-real-ip") ||
      "unknown";

    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return errorResponse({ status: 400, message: "Email address is required", req });
    }

    // Rate limit by ip + email
    const rateKey = `${ipAddress}:${email}`;
    const now = Date.now();
    forgotAttempts.forEach((timestamp, key) => {
      if (now - timestamp > RATE_LIMIT_WINDOW) forgotAttempts.delete(key);
    });
    const attempts = forgotAttempts.get(rateKey) || 0;
    if (attempts >= FORGOT_RATE_LIMIT) {
      return errorResponse({
        status: 429,
        message: "Too many requests. Please try again later.",
        req,
      });
    }

    // Always respond generically, whether or not the account exists.
    const user = await User.findOne({ email, isActive: true }).select(
      "+passwordReset"
    );

    if (user) {
      const token = user.generatePasswordResetToken();
      await user.save();

      const resetUrl = `${getOrigin(req)}/auth/reset-password?token=${token}`;
      try {
        await emailService.sendPasswordResetEmail({
          email: user.email,
          name: user.name,
          resetUrl,
        });
      } catch (err) {
        console.error("Password reset email error:", err);
      }
    }

    forgotAttempts.set(rateKey, now);

    return successResponse({
      status: 200,
      message:
        "If an account exists for that email, we have sent password reset instructions. Please check your inbox (and spam folder).",
      req,
    });
  } catch (error: unknown) {
    console.error("Forgot password API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Something went wrong";
    return errorResponse({ status: 500, message: errorMessage, error, req });
  }
}
