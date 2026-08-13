import connectDB from "@/config/db";
import { errorResponse, successResponse } from "@/server/common/response";
import { verifyAuth } from "@/middleware/auth";
import { LoginHistory } from "@/server/models/LoginHistory.model";
import { NextRequest, NextResponse } from "next/server";

const extractPhone = (req: Request): string => {
  const segments = new URL(req.url).pathname.split("/").filter(Boolean);
  const accountsIndex = segments.indexOf("accounts");
  return accountsIndex !== -1 ? segments[accountsIndex + 1] : "";
};

// GET - fetch single login history
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{  id: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return errorResponse({ status: 401, message: "Unauthorized", req });
    }

    const phone = extractPhone(req);
    if (!phone) {
      return errorResponse({ status: 400, message: "Phone parameter is required", req });
    }

    // Access control: users can only access their own account; admins and moderators can access any
    if (
      authResult.user &&
      authResult.user.role !== "admin" &&
      authResult.user.role !== "moderator" &&
      authResult.user.phone !== phone
    ) {
      return errorResponse({ status: 403, message: "Access denied - You can only access your own account data", req });
    }

    await connectDB();

    const { id } = await params;

    const history = await LoginHistory.findById(id);
    if (!history) return errorResponse({ status: 404, message: "Login history not found", req });

    return successResponse({ status: 200, message: "Login history fetched", data: history, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch login history";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}

// PUT - update login history
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{  id: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return errorResponse({ status: 401, message: "Unauthorized", req });
    }

    const phone = extractPhone(req);
    if (!phone) {
      return errorResponse({ status: 400, message: "Phone parameter is required", req });
    }

    // Access control: users can only access their own account; admins and moderators can access any
    if (
      authResult.user &&
      authResult.user.role !== "admin" &&
      authResult.user.role !== "moderator" &&
      authResult.user.phone !== phone
    ) {
      return errorResponse({ status: 403, message: "Access denied - You can only access your own account data", req });
    }

    await connectDB();

    const { id } = await params;

    const body = await req.json();

    const updated = await LoginHistory.findByIdAndUpdate(id, body, { new: true });
    if (!updated) return errorResponse({ status: 404, message: "Login history not found", req });

    return successResponse({ status: 200, message: "Login history updated", data: updated, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update login history";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}

// DELETE - remove login history
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{  id: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return errorResponse({ status: 401, message: "Unauthorized", req });
    }

    const phone = extractPhone(req);
    if (!phone) {
      return errorResponse({ status: 400, message: "Phone parameter is required", req });
    }

    // Access control: users can only access their own account; admins and moderators can access any
    if (
      authResult.user &&
      authResult.user.role !== "admin" &&
      authResult.user.role !== "moderator" &&
      authResult.user.phone !== phone
    ) {
      return errorResponse({ status: 403, message: "Access denied - You can only access your own account data", req });
    }

    await connectDB();

    const { id } = await params;

    const deleted = await LoginHistory.findByIdAndDelete(id);
    if (!deleted) return errorResponse({ status: 404, message: "Login history not found", req });

    return successResponse({ status: 200, message: "Login history deleted", data: deleted, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete login history";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}
