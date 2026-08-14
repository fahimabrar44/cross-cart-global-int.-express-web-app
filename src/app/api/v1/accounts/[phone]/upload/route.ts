import connectDB from "@/config/db";
import { User } from "@/server/models/User.model";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/middleware/auth";
import { errorResponse, successResponse } from "@/server/common/response";
import { uploadBase64ToCloudinary } from "@/server/common/cloudinary";

const ALLOWED_TYPES = ["avatar", "nid-front", "nid-back"] as const;
type UploadType = (typeof ALLOWED_TYPES)[number];

interface UploadBody {
  type?: UploadType;
  dataUrl?: string;
}

function isBase64DataUrl(value: string): boolean {
  return /^data:image\/(jpeg|png|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(value);
}

// POST: upload avatar or NID document (self or staff) via Cloudinary
export async function POST(
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

    const authUser = authResult.user;
    const isStaff = authUser?.role === "admin" || authUser?.role === "moderator";

    // Users can only upload to their own account; staff can upload for any account
    if (!isStaff && authUser?.phone !== phone) {
      return errorResponse({ status: 403, message: "Access denied", req });
    }

    const body: UploadBody = await req.json().catch(() => ({}));

    if (!body.type || !ALLOWED_TYPES.includes(body.type)) {
      return errorResponse({ status: 400, message: `type must be one of: ${ALLOWED_TYPES.join(", ")}`, req });
    }

    if (!body.dataUrl || typeof body.dataUrl !== "string" || !isBase64DataUrl(body.dataUrl)) {
      return errorResponse({ status: 400, message: "dataUrl must be a valid base64 image data URL", req });
    }

    const folder = `zypco/${body.type === "avatar" ? "avatars" : "nid-documents"}`;
    const { url } = await uploadBase64ToCloudinary(body.dataUrl, folder);

    // Build field update; a user uploading a new NID resets verification to pending
    const update: Record<string, unknown> = {};
    if (body.type === "avatar") {
      update.avatar = url;
    } else if (body.type === "nid-front") {
      update["nid.front"] = url;
      if (!isStaff) update["nid.verified"] = false;
    } else {
      update["nid.back"] = url;
      if (!isStaff) update["nid.verified"] = false;
    }

    const updatedUser = await User.findOneAndUpdate(
      { phone },
      { $set: update },
      { new: true, runValidators: true }
    )
      .select("-password -refreshTokens")
      .lean();

    if (!updatedUser) {
      return errorResponse({ status: 404, message: "User not found", req });
    }

    return successResponse({
      status: 200,
      message: "File uploaded successfully",
      data: { user: updatedUser, url },
      req,
    });
  } catch (error) {
    console.error("POST /accounts/[phone]/upload error:", error);
    return errorResponse({ status: 500, message: "Internal server error", error, req });
  }
}