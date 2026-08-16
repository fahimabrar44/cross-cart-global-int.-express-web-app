import connectDB from "@/config/db";
import { JobApplication } from "@/server/models/JobApplication.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { Types } from "mongoose";
import { createModeratorHandler } from "@/server/common/apiWrapper";

const extractId = (req: Request): string => {
  const segments = new URL(req.url).pathname.split("/").filter(Boolean);
  return segments[segments.length - 1];
};

// PUT /api/v1/job-applications/[id] - update status (moderator/admin)
export const PUT = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();
    const id = extractId(req);
    if (!Types.ObjectId.isValid(id)) {
      return errorResponse({
        status: 400,
        message: "Invalid application id",
        req,
      });
    }
    const body = await req.json().catch(() => ({}));
    const allowed = ["new", "reviewed", "rejected", "hired"];
    const status = body.status;
    if (!status || !allowed.includes(status)) {
      return errorResponse({
        status: 400,
        message: "Valid status is required (new/reviewed/rejected/hired)",
        req,
      });
    }

    const application = await JobApplication.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!application) {
      return errorResponse({
        status: 404,
        message: "Application not found",
        req,
      });
    }
    return successResponse({
      status: 200,
      message: "Application updated successfully",
      data: application,
      req,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to update application";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

// DELETE /api/v1/job-applications/[id] - delete (moderator/admin)
export const DELETE = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();
    const id = extractId(req);
    if (!Types.ObjectId.isValid(id)) {
      return errorResponse({
        status: 400,
        message: "Invalid application id",
        req,
      });
    }
    const application = await JobApplication.findByIdAndDelete(id);
    if (!application) {
      return errorResponse({
        status: 404,
        message: "Application not found",
        req,
      });
    }
    return successResponse({
      status: 200,
      message: "Application deleted successfully",
      data: application,
      req,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to delete application";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});
