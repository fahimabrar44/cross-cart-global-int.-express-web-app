import connectDB from "@/config/db";
import { User } from "@/server/models/User.model";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/middleware/auth";
import { errorResponse, successResponse } from "@/server/common/response";
import bcrypt from "bcryptjs";

interface UpdateUserBody {
  name?: string;
  email?: string;
  phone?: string;
  role?: "user" | "admin" | "moderator";
  isActive?: boolean;
  isVerified?: boolean;
  password?: string;
  avatar?: string | null;
  preferences?: {
    notifications?: { email?: boolean; sms?: boolean; push?: boolean };
    privacy?: { profileVisibility?: "public" | "private"; dataSharing?: boolean };
  };
  nid?: {
    front?: string | null;
    back?: string | null;
    verified?: boolean;
  };
  referralCode?: string | null;
  referredBy?: string | null;
  referralRewards?: number;
  loginAttempts?: number;
  lockUntil?: string | null;
  profileCompletion?: {
    basicInfo?: boolean;
    contactVerified?: boolean;
    identityVerified?: boolean;
    percentage?: number;
  };
  emailVerification?: {
    attempts?: number;
    expires?: string | null;
  };
  registrationIP?: string | null;
}

// GET: fetch account information by phone (self, admin, or moderator)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return errorResponse({ status: 401, message: "Unauthorized", req });
    }

    await connectDB();

    const { phone } = await params;
    if (!phone) {
      return errorResponse({ status: 400, message: "Phone parameter is required", req });
    }

    // Access control: users can only fetch their own account; admins and moderators can fetch any
    if (
      authResult.user &&
      authResult.user.role !== "admin" &&
      authResult.user.role !== "moderator" &&
      authResult.user.phone !== phone
    ) {
      return errorResponse({ status: 403, message: "Access denied", req });
    }

    const user = await User.findOne({ phone })
      .select("-password -refreshTokens")
      .lean();

    if (!user) {
      return errorResponse({ status: 404, message: "User not found", req });
    }

    return successResponse({ status: 200, message: "User fetched successfully", data: user, req });
  } catch (error) {
    console.error("GET /accounts/[phone] error:", error);
    return errorResponse({ status: 500, message: "Internal server error", error, req });
  }
}

// PUT: Update account information by phone (Admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
): Promise<NextResponse>  {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return errorResponse({ status: 401, message: "Unauthorized", req });
    }

    await connectDB();

    const { phone } = await params;
    if (!phone) {
      return errorResponse({ status: 400, message: "Phone parameter is required", req });
    }

    // Admins may update any account; non-admins may only update their own profile.
    if (!authResult.user) {
      return errorResponse({ status: 401, message: "Unauthorized", req });
    }
    const isAdmin = authResult.user.role === "admin";
    const isSelf = authResult.user.phone === phone;
    if (!isAdmin && !isSelf) {
      return errorResponse({ status: 403, message: "Admin access required", req });
    }

    const body: UpdateUserBody = await req.json();

    // Validate role if provided
    if (body.role && !["user", "admin", "moderator"].includes(body.role)) {
      return errorResponse({ status: 400, message: "Invalid role", req });
    }

    // If an admin is changing the phone (the lookup key), make sure the new
    // value is not already taken by another account.
    if (body.phone !== undefined && body.phone !== phone) {
      if (!isAdmin) {
        return errorResponse({ status: 403, message: "Admin access required", req });
      }
      const existing = await User.findOne({ phone: body.phone }).select("_id").lean();
      if (existing) {
        return errorResponse({ status: 409, message: "Phone number already in use", req });
      }
    }

    // Build a sanitized flat update object. Unknown/extra fields are ignored.
    // Privileged fields are admin-only so users cannot escalate their own
    // permissions via self-service updates.
    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.email !== undefined) update.email = body.email;
    if (body.avatar !== undefined) update.avatar = body.avatar;
    if (body.preferences?.notifications !== undefined) update["preferences.notifications"] = body.preferences.notifications;
    if (body.preferences?.privacy !== undefined) update["preferences.privacy"] = body.preferences.privacy;

    // Self-service password change is intentionally NOT allowed here; admins can
    // set a password directly, everyone else uses the reset-password flow.
    if (isAdmin) {
      if (body.phone !== undefined) update.phone = body.phone;
      if (body.role !== undefined) update.role = body.role;
      if (body.isActive !== undefined) update.isActive = body.isActive;
      if (body.isVerified !== undefined) update.isVerified = body.isVerified;
      if (body.password) {
        // findOneAndUpdate bypasses the pre("save") hook, so hash here (12 rounds,
        // matching the signup flow) to avoid storing plaintext passwords.
        update.password = await bcrypt.hash(body.password, 12);
      }
      if (body.nid !== undefined) {
        if (body.nid.front !== undefined) update["nid.front"] = body.nid.front;
        if (body.nid.back !== undefined) update["nid.back"] = body.nid.back;
        if (body.nid.verified !== undefined) update["nid.verified"] = body.nid.verified;
      }
      if (body.referralCode !== undefined) update.referralCode = body.referralCode;
      if (body.referredBy !== undefined) update.referredBy = body.referredBy;
      if (body.referralRewards !== undefined) update.referralRewards = body.referralRewards;
      if (body.loginAttempts !== undefined) update.loginAttempts = body.loginAttempts;
      if (body.lockUntil !== undefined) update.lockUntil = body.lockUntil ? new Date(body.lockUntil) : null;
      if (body.profileCompletion !== undefined) {
        if (body.profileCompletion.basicInfo !== undefined) update["profileCompletion.basicInfo"] = body.profileCompletion.basicInfo;
        if (body.profileCompletion.contactVerified !== undefined) update["profileCompletion.contactVerified"] = body.profileCompletion.contactVerified;
        if (body.profileCompletion.identityVerified !== undefined) update["profileCompletion.identityVerified"] = body.profileCompletion.identityVerified;
        if (body.profileCompletion.percentage !== undefined) update["profileCompletion.percentage"] = body.profileCompletion.percentage;
      }
      if (body.emailVerification !== undefined) {
        if (body.emailVerification.attempts !== undefined) update["emailVerification.attempts"] = body.emailVerification.attempts;
        if (body.emailVerification.expires !== undefined) update["emailVerification.expires"] = body.emailVerification.expires ? new Date(body.emailVerification.expires) : null;
      }
      if (body.registrationIP !== undefined) update.registrationIP = body.registrationIP;
    }

    if (Object.keys(update).length === 0) {
      return errorResponse({ status: 400, message: "No update fields provided", req });
    }

    const updatedUser = await User.findOneAndUpdate(
      { phone },
      { $set: update },
      { new: true, runValidators: true }
    ).select("-password -refreshTokens").lean();

    if (!updatedUser) {
      return errorResponse({ status: 404, message: "User not found", req });
    }

    return successResponse({ status: 200, message: "User updated successfully", data: updatedUser, req });

  } catch (error) {
    console.error("PUT /accounts/[phone] error:", error);
    return errorResponse({ status: 500, message: "Internal server error", error, req });
  }
}

// PATCH: Partial account update (activate/deactivate/verify/NID verification) — Admin or Moderator
export async function PATCH(
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

    const body: {
      name?: string;
      email?: string;
      isActive?: boolean;
      isVerified?: boolean;
      nid?: { verified?: boolean };
    } = await req.json();

    if (
      body.name === undefined &&
      body.email === undefined &&
      body.isActive === undefined &&
      body.isVerified === undefined &&
      (body.nid === undefined || body.nid.verified === undefined)
    ) {
      return errorResponse({ status: 400, message: "No update fields provided", req });
    }

    // Build flat update object so nested nid fields are set individually (avoids wiping documents)
    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.email !== undefined) update.email = body.email;
    if (body.isActive !== undefined) update.isActive = body.isActive;
    if (body.isVerified !== undefined) update.isVerified = body.isVerified;
    if (body.nid && body.nid.verified !== undefined) update["nid.verified"] = body.nid.verified;

    const updatedUser = await User.findOneAndUpdate(
      { phone },
      { $set: update },
      { new: true, runValidators: true }
    ).select("-password -refreshTokens").lean();

    if (!updatedUser) {
      return errorResponse({ status: 404, message: "User not found", req });
    }

    return successResponse({ status: 200, message: "User updated successfully", data: updatedUser, req });
  } catch (error) {
    console.error("PATCH /accounts/[phone] error:", error);
    return errorResponse({ status: 500, message: "Internal server error", error, req });
  }
}

// DELETE: remove a user account (Admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return errorResponse({ status: 401, message: "Unauthorized", req });
    }

    if (!authResult.user || authResult.user.role !== "admin") {
      return errorResponse({ status: 403, message: "Admin access required", req });
    }

    await connectDB();

    const { phone } = await params;
    if (!phone) {
      return errorResponse({ status: 400, message: "Phone parameter is required", req });
    }

    const deletedUser = await User.findOneAndDelete({ phone }).lean();
    if (!deletedUser) {
      return errorResponse({ status: 404, message: "User not found", req });
    }

    return successResponse({ status: 200, message: "User deleted successfully", req });
  } catch (error) {
    console.error("DELETE /accounts/[phone] error:", error);
    return errorResponse({ status: 500, message: "Internal server error", error, req });
  }
}
