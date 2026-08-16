import connectDB from "@/config/db";
import { TeamMember } from "@/server/models/TeamMember.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { createModeratorHandler, createPublicHandler } from "@/server/common/apiWrapper";

// =========================
// POST - Create Team Member (admin/moderator)
// =========================
export const POST = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();

    const body = await req.json();

    const member = new TeamMember({
      ...body,
      isActive: body.isActive === undefined ? true : body.isActive,
      order: typeof body.order === "number" ? body.order : 0,
    });
    await member.save();

    return successResponse({
      status: 201,
      message: "Team member created successfully",
      data: member,
      req,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to create team member";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

// =========================
// GET - Fetch Team Members (public)
// ?includeInactive=true returns inactive members too (used by admin panel)
// ?activeOnly=true (default) returns only active members
// =========================
export const GET = createPublicHandler(async ({ req }) => {
  try {
    await connectDB();

    const url = new URL(req.url);
    const includeInactive =
      url.searchParams.get("includeInactive") === "true";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (!includeInactive) query.isActive = true;

    const members = await TeamMember.find(query)
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return successResponse({
      status: 200,
      message: "Team members fetched successfully",
      data: members,
      req,
    });
  } catch (error: unknown) {
    console.error("GET /api/v1/team-members error:", error);
    const msg =
      error instanceof Error ? error.message : "Failed to fetch team members";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});
