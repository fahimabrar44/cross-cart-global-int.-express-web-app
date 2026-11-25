import connectDB from "@/config/db";
import { createRateLimitedHandler } from "@/server/common/apiWrapper";
import { errorResponse, successResponse } from "@/server/common/response";
import { User } from "@/server/models/User.model";
import jwt, { Secret } from "jsonwebtoken";
import {
  clearAuthCookies,
  getRefreshToken,
  setAuthCookies,
} from "@/server/common/authCookies";

export const POST = createRateLimitedHandler(
  async ({ req }) => {
    const failAuth = (status: number, message: string) => {
      const response = errorResponse({ status, message, req });
      clearAuthCookies(response);
      return response;
    };

    try {
      await connectDB();

      // Web clients send the refresh token as an httpOnly cookie; API clients
      // may still send it in the JSON body.
      let refreshToken = getRefreshToken(req);
      const bodyText = await req.text().catch(() => "");
      if (bodyText.trim()) {
        try {
          const body = JSON.parse(bodyText) as { refreshToken?: string };
          if (body.refreshToken) refreshToken = body.refreshToken;
        } catch {
          // Ignore malformed bodies; the cookie fallback is still valid.
        }
      }

      if (!refreshToken) {
        return failAuth(400, "Refresh token is required");
      }

      const refreshSecret =
        process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;
      if (!refreshSecret || !process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET or REFRESH_TOKEN_SECRET not configured");
      }

      const decodedRaw = jwt.verify(refreshToken, refreshSecret as Secret);
      if (typeof decodedRaw === "string") {
        return failAuth(401, "Invalid refresh token format");
      }
      const decoded = decodedRaw as { id: string; type: string; role?: string };

      // Ensure token type
      if (decoded.type !== "refresh") {
        return failAuth(401, "Invalid token type");
      }

      // Fetch user with refresh tokens
      const user = await User.findById(decoded.id).select("+refreshTokens");
      if (!user) {
        return failAuth(401, "User not found");
      }

      if (!user.isActive) {
        return failAuth(403, "Account deactivated");
      }

      // Check if refresh token is still valid (exists in user's array)
      if (!user.refreshTokens.includes(refreshToken)) {
        return failAuth(401, "Refresh token revoked");
      }

      // Generate new access token
      const newAccessToken = jwt.sign(
        { id: user._id.toString(), role: user.role, type: "access" },
        process.env.JWT_SECRET as Secret,
        { expiresIn: "15m" }
      );

      // Rotate refresh token for enhanced security
      const newRefreshToken = jwt.sign(
        { id: user._id.toString(), role: user.role, type: "refresh" },
        refreshSecret as Secret,
        { expiresIn: "7d" }
      );

      // Update user's refresh tokens array
      user.refreshTokens = user.refreshTokens.filter((t:string) => t !== refreshToken);
      user.refreshTokens.push(newRefreshToken);
      if (user.refreshTokens.length > 5) {
        user.refreshTokens = user.refreshTokens.slice(-5); // keep last 5 tokens
      }

      // Update last login and rotated refresh tokens. Use updateOne (instead of
      // save()) so a concurrent account update (e.g. an admin editing this user)
      // cannot trigger a Mongoose VersionError on the stale document instance.
      await User.updateOne(
        { _id: user._id },
        { $set: { refreshTokens: user.refreshTokens, lastLogin: new Date() } }
      );

      // Respond with new tokens and user info
      const response = successResponse({
        status: 200,
        message: "Token refreshed successfully",
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            avatar: user.avatar || null,
            isVerified: user.isVerified,
            isActive: user.isActive,
            lastLogin: new Date(),
          },
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          expiresIn: "15m",
        },
        req,
      });

      setAuthCookies(response, newAccessToken, newRefreshToken);
      return response;
    } catch (error: unknown) {
      console.error("Refresh Token API Error:", error);

      if (error instanceof Error) {
        if (error.name === "JsonWebTokenError") {
          return failAuth(401, "Invalid refresh token format");
        }
        if (error.name === "TokenExpiredError") {
          return failAuth(401, "Refresh token expired");
        }
      }

      return errorResponse({
        status: 500,
        message: "Server error. Please sign in again.",
        req,
      });
    }
  },
  {
    max: 20, // max 20 requests per minute per IP
    windowMs: 60_000,
  }
);
