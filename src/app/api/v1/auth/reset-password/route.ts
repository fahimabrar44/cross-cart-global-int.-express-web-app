import connectDB from "@/config/db";
import { errorResponse, successResponse } from "@/server/common/response";
import { User } from "@/server/models/User.model";
import { emailService } from "@/services/emailService";
import { NextRequest } from "next/server";

/**
 * POST /api/v1/auth/reset-password
 * Validates the reset token and sets a new password.
 * Rate limited and brute-force protected via passwordReset.attempts.
 */
const resetAttempts = new Map<string, number>();
const RESET_RATE_LIMIT = 10; // Max 10 reset attempts per IP per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

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
    const token = typeof body.token === "string" ? body.token : "";
    const password = typeof body.password === "string" ? body.password : "";
    const confirmPassword =
      typeof body.confirmPassword === "string" ? body.confirmPassword : "";

    if (!token) {
      return errorResponse({ status: 400, message: "Reset token is required", req });
    }
    if (!password) {
      return errorResponse({ status: 400, message: "New password is required", req });
    }
    if (password !== confirmPassword) {
      return errorResponse({
        status: 400,
        message: "Passwords do not match",
        req,
      });
    }
    if (password.length < 8) {
      return errorResponse({
        status: 400,
        message: "Password must be at least 8 characters long",
        req,
      });
    }
    if (!PASSWORD_REGEX.test(password)) {
      return errorResponse({
        status: 400,
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        req,
      });
    }

    // Rate limit by IP
    const now = Date.now();
    resetAttempts.forEach((timestamp, key) => {
      if (now - timestamp > RATE_LIMIT_WINDOW) resetAttempts.delete(key);
    });
    const attempts = resetAttempts.get(ipAddress) || 0;
    if (attempts >= RESET_RATE_LIMIT) {
      return errorResponse({
        status: 429,
        message: "Too many attempts. Please request a new reset link.",
        req,
      });
    }

    const user = await User.findOne({
      "passwordReset.token": token,
      "passwordReset.expires": { $gt: new Date() },
    }).select("+passwordReset");

    if (!user) {
      resetAttempts.set(ipAddress, now);
      return errorResponse({
        status: 400,
        message: "This reset link is invalid or has expired. Please request a new one.",
        req,
      });
    }

    // Brute-force protection on the token itself
    if ((user.passwordReset.attempts || 0) >= 5) {
      user.passwordReset.token = null;
      user.passwordReset.expires = null;
      user.passwordReset.attempts = 0;
      await user.save();
      return errorResponse({
        status: 400,
        message: "Too many attempts on this link. Please request a new reset link.",
        req,
      });
    }

    // Set the new password (pre-save hook re-hashes it)
    user.password = password;
    // Invalidate all existing sessions
    user.refreshTokens = [];
    // Clear reset token
    user.passwordReset.token = null;
    user.passwordReset.expires = null;
    user.passwordReset.attempts = 0;
    user.lastLogin = new Date();

    try {
      await user.save();
    } catch (saveErr) {
      console.error("Reset password save error:", saveErr);
      const message =
        saveErr instanceof Error ? saveErr.message : "Failed to update password";
      return errorResponse({ status: 400, message, req });
    }

    // Notify the user (best-effort)
    try {
      await emailService.sendPasswordChangedEmail({
        email: user.email,
        name: user.name,
      });
    } catch (err) {
      console.error("Password changed notification error:", err);
    }

    resetAttempts.set(ipAddress, now);

    return successResponse({
      status: 200,
      message:
        "Your password has been reset successfully. You can now sign in with your new password.",
      req,
    });
  } catch (error: unknown) {
    console.error("Reset password API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Something went wrong";
    return errorResponse({ status: 500, message: errorMessage, error, req });
  }
}
