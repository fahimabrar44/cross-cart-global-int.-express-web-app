import connectDB from "@/config/db";
import { createAuthHandler } from "@/server/common/apiWrapper";
import { errorResponse, successResponse } from "@/server/common/response";
import { User } from "@/server/models/User.model";

/**
 * GET /api/v1/auth/me
 * Returns the signed-in user for the current httpOnly session cookie.
 */
export const GET = createAuthHandler(async ({ req, user }) => {
  try {
    await connectDB();

    if (!user) {
      return errorResponse({ status: 401, message: "Authentication required", req });
    }

    const dbUser = (await User.findById(user.id)
      .select("name email phone role avatar isVerified isActive lastLogin")
      .lean()) as unknown as {
      _id: unknown;
      name?: string;
      email?: string;
      phone?: string;
      role?: string;
      avatar?: string | null;
      isVerified?: boolean;
      isActive?: boolean;
      lastLogin?: Date | null;
    } | null;

    if (!dbUser) {
      return errorResponse({ status: 401, message: "Session is no longer valid", req });
    }

    return successResponse({
      status: 200,
      message: "Authenticated user fetched",
      data: {
        user: {
          id: dbUser._id,
          name: dbUser.name,
          email: dbUser.email,
          phone: dbUser.phone,
          role: dbUser.role,
          avatar: dbUser.avatar || null,
          isVerified: dbUser.isVerified,
          isActive: dbUser.isActive,
          lastLogin: dbUser.lastLogin || null,
        },
      },
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch user";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});
