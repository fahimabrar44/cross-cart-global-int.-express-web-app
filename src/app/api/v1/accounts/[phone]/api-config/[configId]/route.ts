import connectDB from "@/config/db";
import { errorResponse, successResponse } from "@/server/common/response";
import { verifyAuth } from "@/middleware/auth";
import { ApiConfig } from "@/server/models/ApiConfig.model";
import { User } from "@/server/models/User.model";
import { notificationService } from "@/services/notificationService";
import { NextRequest, NextResponse } from "next/server";

// PATCH - regenerate an API key (returns the new key once)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ phone: string; configId: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return errorResponse({ status: 401, message: "Unauthorized", req });
    }

    await connectDB();

    const { phone, configId } = await params;
    if (!phone || !configId) {
      return errorResponse(
        { status: 400, message: "Phone and config ID are required", req }
      );
    }

    // Access control: users can only manage their own configs
    if (
      authResult.user &&
      authResult.user.role !== "admin" &&
      authResult.user.role !== "moderator" &&
      authResult.user.phone !== phone
    ) {
      return errorResponse({ status: 403, message: "Access denied", req });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return errorResponse({ status: 404, message: "User not found", req });
    }

    const config = await ApiConfig.findOne({
      _id: configId,
      user: user._id,
    });

    if (!config) {
      return errorResponse({
        status: 404,
        message: "API config not found",
        req,
      });
    }

    config.generateNewKey();
    try {
      await config.save();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (saveErr: any) {
      if (saveErr?.code === 11000) {
        config.generateNewKey();
        await config.save();
      } else {
        throw saveErr;
      }
    }

    // Send notification
    await notificationService
      .sendNotification({
        userId: user._id,
        phone: user.phone,
        email: user.email,
        title: "API Key Regenerated",
        message: `Your API key "${config.name}" has been regenerated. The previous key is no longer valid.`,
        type: "info",
        category: "account",
        channels: ["email", "inapp"],
        data: { configId: config._id.toString(), name: config.name },
      })
      .catch((err) =>
        console.error("API key regeneration notification failed:", err)
      );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated: any = await ApiConfig.findById(config._id)
      .select("+apiKey")
      .lean();

    return successResponse({
      status: 200,
      message: "API key regenerated",
      data: updated,
      req,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to regenerate API key";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}