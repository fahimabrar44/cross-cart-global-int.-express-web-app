import connectDB from "@/config/db";
import { Job } from "@/server/models/Job.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { NextRequest } from "next/server";
import { createModeratorHandler } from "@/server/common/apiWrapper";

// POST /api/v1/jobs - create a job (moderator/admin)
export const POST = createModeratorHandler(async ({ req, user }) => {
  try {
    await connectDB();
    const body = await req.json();

    const job = new Job({
      ...body,
      // slug is auto-generated; never trust client-supplied slug
      slug: undefined,
    });
    await job.save();

    return successResponse({
      status: 201,
      message: "Job created successfully",
      data: job,
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create job";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

// GET /api/v1/jobs - list jobs.
// Public: returns only active jobs. Pass ?all=true (moderator) to get everything.
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const includeInactive = url.searchParams.get("all") === "true";
    const department = url.searchParams.get("department");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (!includeInactive) query.isActive = true;
    if (department) query.department = department;

    const jobs = await Job.find(query).sort({ createdAt: -1 }).lean();

    return successResponse({
      status: 200,
      message: "Jobs fetched successfully",
      data: jobs,
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch jobs";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}
