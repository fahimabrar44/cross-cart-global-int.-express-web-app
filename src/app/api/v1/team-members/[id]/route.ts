import connectDB from "@/config/db";
import { TeamMember } from "@/server/models/TeamMember.model";
import { successResponse, errorResponse } from "@/server/common/response";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { createModeratorHandler, createPublicHandler } from "@/server/common/apiWrapper";

const extractId = (req: Request): string => {
  const segments = new URL(req.url).pathname.split("/").filter(Boolean);
  return segments[segments.length - 1];
};

// =========================
// GET - fetch single team member (public)
// =========================
export const GET = createPublicHandler(async ({ req }) => {
  try {
    await connectDB();

    const id = extractId(req);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse({ status: 400, message: "Invalid team member ID", req });
    }

    const member = await TeamMember.findById(id).lean();

    if (!member) {
      return errorResponse({ status: 404, message: "Team member not found", req });
    }

    return successResponse({
      status: 200,
      message: "Team member fetched successfully",
      data: member,
      req,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to fetch team member";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

// =========================
// PUT - update team member (admin/moderator)
// =========================
export const PUT = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();

    const id = extractId(req);
    const body = await req.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse({ status: 400, message: "Invalid team member ID", req });
    }

    const member = await TeamMember.findByIdAndUpdate(id, body, { new: true });

    if (!member)
      return errorResponse({ status: 404, message: "Team member not found", req });

    return successResponse({
      status: 200,
      message: "Team member updated successfully",
      data: member,
      req,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to update team member";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

// =========================
// DELETE - remove team member (admin/moderator)
// =========================
export const DELETE = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();

    const id = extractId(req);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse({ status: 400, message: "Invalid team member ID", req });
    }

    const member = await TeamMember.findByIdAndDelete(id);

    if (!member)
      return errorResponse({ status: 404, message: "Team member not found", req });

    return successResponse({
      status: 200,
      message: "Team member deleted successfully",
      data: member,
      req,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to delete team member";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});
