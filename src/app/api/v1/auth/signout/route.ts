import connectDB from "@/config/db";
import { successResponse } from "@/server/common/response";
import { LoginHistory } from "@/server/models/LoginHistory.model";
import { User } from "@/server/models/User.model";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import { NextRequest } from "next/server";
import {
  clearAuthCookies,
  getAccessToken,
  getRefreshToken,
} from "@/server/common/authCookies";
import { getClientIp } from "@/server/common/requestIp";

/**
 * POST /api/v1/auth/signout
 *
 * Idempotent logout: clears the httpOnly cookies even if the access token is
 * already expired, and revokes the refresh token when it can be identified.
 */
export async function POST(req: NextRequest) {
  const ipAddress = getClientIp(req);
  const userAgent = req.headers.get("user-agent") || "unknown";

  const accessToken = getAccessToken(req);
  let refreshToken = getRefreshToken(req);

  // API clients may send the refresh token in the body instead of a cookie.
  try {
    const bodyText = await req.text();
    if (bodyText.trim()) {
      const body = JSON.parse(bodyText) as { refreshToken?: string };
      if (body.refreshToken) refreshToken = body.refreshToken;
    }
  } catch {
    // Empty or malformed body is fine for logout.
  }

  const accessSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET || accessSecret;

  let userId: string | undefined;

  if (accessToken && accessSecret) {
    try {
      const verified = jwt.verify(accessToken, accessSecret as Secret);
      if (typeof verified !== "string" && (verified as JwtPayload).id) {
        userId = String((verified as JwtPayload).id);
      }
    } catch {
      // Expired/invalid access token: still clear the cookies below.
    }
  }

  if (!userId && refreshToken && refreshSecret) {
    try {
      const verified = jwt.verify(refreshToken, refreshSecret as Secret);
      if (typeof verified !== "string" && (verified as JwtPayload).id) {
        userId = String((verified as JwtPayload).id);
      }
    } catch {
      // Invalid refresh token: nothing to revoke.
    }
  }

  try {
    await connectDB();

    if (userId) {
      const user = await User.findById(userId);

      if (user) {
        if (refreshToken) {
          await User.updateOne(
            { _id: user._id },
            { $pull: { refreshTokens: refreshToken } }
          );
        } else {
          // No refresh token supplied: invalidate every stored session.
          await User.updateOne(
            { _id: user._id },
            { $set: { refreshTokens: [] } }
          );
        }

        await LoginHistory.create({
          user: user._id,
          phone: user.phone || "unknown",
          ipAddress,
          userAgent,
          success: true,
          action: "logout",
          timestamp: new Date(),
        }).catch(() => undefined);
      }
    }
  } catch (error) {
    // Logout must not fail because the database is temporarily unavailable.
    console.error("Signout cleanup failed (ignored):", error);
  }

  const response = successResponse({
    status: 200,
    message: "Signed out successfully",
    data: {},
    req,
  });
  clearAuthCookies(response);
  return response;
}
