import connectDB from "@/config/db";
import { User } from "@/server/models/User.model";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/middleware/auth";
import { errorResponse, successResponse } from "@/server/common/response";

interface UpdateUserBody {
  name?: string;
  email?: string;
  role?: "user" | "admin" | "moderator";
  isActive?: boolean;
  isVerified?: boolean;
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

    // Only admin can update account details (privilege escalation guard)
    if (!authResult.user || authResult.user.role !== "admin") {
      return errorResponse({ status: 403, message: "Admin access required", req });
    }

    await connectDB();

    const { phone } = await params;
    if (!phone) {
      return errorResponse({ status: 400, message: "Phone parameter is required", req });
    }

    const body: UpdateUserBody = await req.json();

    // Validate role if provided
    if (body.role && !["user", "admin", "moderator"].includes(body.role)) {
      return errorResponse({ status: 400, message: "Invalid role", req });
    }

    // Ensure at least one field is provided for update
    if (!body.name && !body.email && !body.role && body.isActive === undefined && body.isVerified === undefined) {
      return errorResponse({ status: 400, message: "No update fields provided", req });
    }

    const updatedUser = await User.findOneAndUpdate(
      { phone },
      { $set: body },
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
