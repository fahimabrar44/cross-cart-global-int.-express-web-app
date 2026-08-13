// F:\New folder\crosscart-web-apps\src\app\api\v1\notifications\[id]\route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/config/db";
import { Notification } from "@/server/models/Notification.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { verifyAuth } from "@/middleware/auth";
import { Types } from "mongoose";

// Helper: only owner (notification.userId), admin or moderator may act on the resource
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getAccessible(req: NextRequest, id: string): Promise<{ success: boolean; response?: NextResponse; notification?: any }> {
  const authResult = await verifyAuth(req);
  if (!authResult.success) {
    return { success: false, response: errorResponse({ status: 401, message: "Unauthorized", req }) };
  }

  if (!Types.ObjectId.isValid(id)) {
    return { success: false, response: errorResponse({ status: 400, message: "Invalid ID", req }) };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const notification: any = await Notification.findById(id).lean();
  if (!notification) {
    return { success: false, response: errorResponse({ status: 404, message: "Notification not found", req }) };
  }

  const isStaff = authResult.user?.role === "admin" || authResult.user?.role === "moderator";
  const isOwner = notification.userId?.toString() === authResult.user?.id;

  if (!isStaff && !isOwner) {
    return { success: false, response: errorResponse({ status: 403, message: "Access denied", req }) };
  }

  return { success: true, notification };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();

    const { id } = await params;
    const access = await getAccessible(req, id);
    if (!access.success) return access.response!;

    return successResponse({ status: 200, message: "Notification fetched successfully", data: access.notification, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch notification";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{  id: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();

    const { id } = await params;
    const access = await getAccessible(req, id);
    if (!access.success) return access.response!;

    const body = await req.json();
    const allowedFields = ["title", "message", "type", "read"];
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    for (const key of allowedFields) if (key in body) updateData[key] = body[key];

    const updated = await Notification.findByIdAndUpdate(id, updateData, { new: true }).lean();
    if (!updated) return errorResponse({ status: 404, message: "Notification not found", req });

    return successResponse({ status: 200, message: "Notification updated successfully", data: updated, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update notification";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{  id: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();

    const { id } = await params;
    const access = await getAccessible(req, id);
    if (!access.success) return access.response!;

    const body = await req.json();
    console.log(body);
    
    const allowedFields = ["title", "message", "type", "isRead"];
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    for (const key of allowedFields) if (key in body) updateData[key] = body[key];

    console.log(updateData);
    

    const updated = await Notification.findByIdAndUpdate(id, updateData, { new: true }).lean();
    if (!updated) return errorResponse({ status: 404, message: "Notification not found", req });

    return successResponse({ status: 200, message: "Notification updated successfully", data: updated, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update notification";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{  id: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();

    const { id } = await params;
    const access = await getAccessible(req, id);
    if (!access.success) return access.response!;

    const deleted = await Notification.findByIdAndDelete(id).lean();
    if (!deleted) return errorResponse({ status: 404, message: "Notification not found", req });

    return successResponse({ status: 200, message: "Notification deleted successfully", data: deleted, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete notification";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}
