import crypto from "crypto";
import connectDB from "@/config/db";
import { User } from "@/server/models/User.model";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/middleware/auth";
import { errorResponse, successResponse } from "@/server/common/response";

// Generate a random password satisfying the User model's strength rules
function generatePassword(): string {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const special = "@$!%*?&";
  const all = lower + upper + digits + special;

  const pick = (chars: string, n: number) =>
    Array.from(crypto.randomBytes(n)).map((b) => chars[b % chars.length]).join("");

  // Ensure at least one of each required class, then fill the rest
  const password =
    pick(lower, 3) + pick(upper, 3) + pick(digits, 3) + pick(special, 2) + pick(all, 3);

  return password
    .split("")
    .sort(() => crypto.randomInt(0, 2) - 1)
    .join("");
}

// POST: Admin/Moderator resets a user's password
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return errorResponse({ status: 401, message: "Unauthorized", req });
    }

    if (!authResult.user || (authResult.user.role !== "admin" && authResult.user.role !== "moderator")) {
      return errorResponse({ status: 403, message: "Admin or moderator access required", req });
    }

    await connectDB();

    const { phone } = await params;
    if (!phone) {
      return errorResponse({ status: 400, message: "Phone parameter is required", req });
    }

    const user = await User.findOne({ phone }).select("+password");
    if (!user) {
      return errorResponse({ status: 404, message: "User not found", req });
    }

    const newPassword = generatePassword();
    user.password = newPassword; // re-hashed in pre-save middleware
    await user.save();

    return successResponse({
      status: 200,
      message: "Password reset successfully",
      data: {
        phone: user.phone,
        temporaryPassword: newPassword,
        note: "Share the temporary password securely with the user.",
      },
      req,
    });
  } catch (error) {
    console.error("POST /accounts/[phone]/reset-password error:", error);
    return errorResponse({ status: 500, message: "Internal server error", error, req });
  }
}