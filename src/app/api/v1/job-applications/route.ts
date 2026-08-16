import connectDB from "@/config/db";
import { JobApplication } from "@/server/models/JobApplication.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { NextRequest } from "next/server";
import { createModeratorHandler } from "@/server/common/apiWrapper";

// GET /api/v1/job-applications - list applications (moderator/admin)
// Supports ?job=<id>, ?status=new|reviewed|..., ?search=, pagination.
export const GET = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();
    const url = new URL(req.url);
    const job = url.searchParams.get("job");
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.max(
      1,
      Math.min(100, parseInt(url.searchParams.get("limit") || "20", 10))
    );
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (job) query.job = job;
    if (status) query.status = status;
    if (search) {
      const s = search.trim();
      query.$or = [
        { name: { $regex: s, $options: "i" } },
        { email: { $regex: s, $options: "i" } },
        { phone: { $regex: s, $options: "i" } },
        { jobTitle: { $regex: s, $options: "i" } },
      ];
    }

    const total = await JobApplication.countDocuments(query);
    const applications = await JobApplication.find(query)
      .populate("job", "title location type")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return successResponse({
      status: 200,
      message: "Applications fetched successfully",
      data: applications,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      req,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to fetch applications";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});
