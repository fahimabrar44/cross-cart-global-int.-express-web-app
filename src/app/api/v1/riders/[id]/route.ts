import { NextRequest } from "next/server";
import connectDB from "@/config/db";
import { Rider } from "@/server/models/Rider.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { createModeratorHandler } from "@/server/common/apiWrapper";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const rider = await Rider.findById(id).populate("branch").lean();
    if (!rider) return errorResponse({ status: 404, message: "Rider not found", req });
    return successResponse({ status: 200, message: "Rider fetched successfully", data: rider, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch rider";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}

export const PUT = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();
    const url = new URL(req.url);
    const id = url.pathname.split("/").filter(Boolean).pop();

    const body = await req.json();

    const rider = await Rider.findById(id);
    if (!rider) return errorResponse({ status: 404, message: "Rider not found", req });

    const allowedFields = [
      "name",
      "phone",
      "email",
      "nidNumber",
      "vehicleType",
      "vehiclePlate",
      "status",
      "branch",
      "zones",
      "userId",
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: any = {};
    for (const field of allowedFields) {
      if (field in body) update[field] = body[field];
    }

    const updated = await Rider.findByIdAndUpdate(id, update, { new: true })
      .populate("branch")
      .lean();
    if (!updated) return errorResponse({ status: 404, message: "Rider not found", req });

    return successResponse({ status: 200, message: "Rider updated successfully", data: updated, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update rider";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

export const DELETE = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();
    const url = new URL(req.url);
    const id = url.pathname.split("/").filter(Boolean).pop();

    const deleted = await Rider.findByIdAndDelete(id);
    if (!deleted) return errorResponse({ status: 404, message: "Rider not found", req });

    return successResponse({ status: 200, message: "Rider deleted successfully", req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete rider";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});