import { NextRequest } from "next/server";
import connectDB from "@/config/db";
import { Branch } from "@/server/models/Branch.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { createModeratorHandler } from "@/server/common/apiWrapper";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const branch = await Branch.findById(id).lean();
    if (!branch) return errorResponse({ status: 404, message: "Branch not found", req });
    return successResponse({ status: 200, message: "Branch fetched successfully", data: branch, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch branch";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}

export const PUT = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();
    const url = new URL(req.url);
    const id = url.pathname.split("/").filter(Boolean).pop();

    const body = await req.json();

    if (body.code) {
      const existing = await Branch.findOne({ code: body.code, _id: { $ne: id } });
      if (existing) return errorResponse({ status: 409, message: "Branch code already exists", req });
    }

    const branch = await Branch.findById(id);
    if (!branch) return errorResponse({ status: 404, message: "Branch not found", req });

    const allowedFields = [
      "name",
      "code",
      "type",
      "address",
      "city",
      "phone",
      "manager",
      "managerPhone",
      "openingHours",
      "isActive",
      "coverage",
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: any = {};
    for (const field of allowedFields) {
      if (field in body) update[field] = body[field];
    }

    const updated = await Branch.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!updated) return errorResponse({ status: 404, message: "Branch not found", req });

    return successResponse({ status: 200, message: "Branch updated successfully", data: updated, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update branch";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

export const DELETE = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();
    const url = new URL(req.url);
    const id = url.pathname.split("/").filter(Boolean).pop();

    const deleted = await Branch.findByIdAndDelete(id);
    if (!deleted) return errorResponse({ status: 404, message: "Branch not found", req });

    return successResponse({ status: 200, message: "Branch deleted successfully", req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete branch";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});