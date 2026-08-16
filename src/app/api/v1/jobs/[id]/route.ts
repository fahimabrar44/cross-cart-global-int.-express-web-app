import connectDB from "@/config/db";
import { Job } from "@/server/models/Job.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { createModeratorHandler } from "@/server/common/apiWrapper";

const extractId = (req: Request): string => {
  const segments = new URL(req.url).pathname.split("/").filter(Boolean);
  return segments[segments.length - 1];
};

// GET /api/v1/jobs/[id] - single job (public)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return errorResponse({ status: 400, message: "Invalid job id", req });
    }
    const job = await Job.findById(id).lean();
    if (!job) {
      return errorResponse({ status: 404, message: "Job not found", req });
    }
    return successResponse({
      status: 200,
      message: "Job fetched successfully",
      data: job,
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch job";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}

// PUT /api/v1/jobs/[id] - update job (moderator/admin)
export const PUT = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();
    const id = extractId(req);
    if (!Types.ObjectId.isValid(id)) {
      return errorResponse({ status: 400, message: "Invalid job id", req });
    }
    const body = await req.json();
    const update: Record<string, unknown> = { ...body };
    delete update.slug; // slug is managed automatically
    delete update._id;

    const job = await Job.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });
    if (!job) {
      return errorResponse({ status: 404, message: "Job not found", req });
    }
    return successResponse({
      status: 200,
      message: "Job updated successfully",
      data: job,
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update job";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

// DELETE /api/v1/jobs/[id] - delete job (moderator/admin)
export const DELETE = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();
    const id = extractId(req);
    if (!Types.ObjectId.isValid(id)) {
      return errorResponse({ status: 400, message: "Invalid job id", req });
    }
    const job = await Job.findByIdAndDelete(id);
    if (!job) {
      return errorResponse({ status: 404, message: "Job not found", req });
    }
    return successResponse({
      status: 200,
      message: "Job deleted successfully",
      data: job,
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete job";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});
