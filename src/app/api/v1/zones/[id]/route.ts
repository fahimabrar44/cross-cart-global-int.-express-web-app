import connectDB from "@/config/db";
import { Zone } from "@/server/models/Zone.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { createModeratorHandler } from "@/server/common/apiWrapper";

const extractId = (req: Request): string => {
  const segments = new URL(req.url).pathname.split("/").filter(Boolean);
  return segments[segments.length - 1];
};

/**
 * GET - fetch a single zone by ID (populates its countries)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();

    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return errorResponse({ status: 400, message: "Invalid zone ID", req });
    }

    const zone = await Zone.findById(id).populate("countryIds", "name code isActive").lean();
    if (!zone) {
      return errorResponse({ status: 404, message: "Zone not found", req });
    }

    return successResponse({
      status: 200,
      message: "Zone fetched successfully",
      data: zone,
      req,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to fetch zone";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}

/**
 * PUT - update a zone by ID
 */
export const PUT = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();

    const id = extractId(req);
    if (!Types.ObjectId.isValid(id)) {
      return errorResponse({ status: 400, message: "Invalid zone ID", req });
    }

    const body = await req.json();

    if (body.name) body.name = String(body.name).trim();
    if (body.code) body.code = String(body.code).trim().toUpperCase();
    if (Array.isArray(body.countryIds)) {
      body.countryIds = body.countryIds
        .filter((cid: unknown) => typeof cid === "string" && Types.ObjectId.isValid(cid))
        .map((cid: string) => new Types.ObjectId(cid));
    }

    const updated = await Zone.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    ).populate("countryIds", "name code isActive");

    if (!updated) {
      return errorResponse({ status: 404, message: "Zone not found", req });
    }

    return successResponse({
      status: 200,
      message: "Zone updated successfully",
      data: updated,
      req,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to update zone";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

/**
 * PATCH - update a zone by ID (partial)
 */
export const PATCH = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();

    const id = extractId(req);
    if (!Types.ObjectId.isValid(id)) {
      return errorResponse({ status: 400, message: "Invalid zone ID", req });
    }

    const body = await req.json();

    if (body.name) body.name = String(body.name).trim();
    if (body.code) body.code = String(body.code).trim().toUpperCase();
    if (Array.isArray(body.countryIds)) {
      body.countryIds = body.countryIds
        .filter((cid: unknown) => typeof cid === "string" && Types.ObjectId.isValid(cid))
        .map((cid: string) => new Types.ObjectId(cid));
    }

    const updated = await Zone.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    ).populate("countryIds", "name code isActive");

    if (!updated) {
      return errorResponse({ status: 404, message: "Zone not found", req });
    }

    return successResponse({
      status: 200,
      message: "Zone updated successfully",
      data: updated,
      req,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to update zone";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

/**
 * DELETE - remove a zone by ID
 */
export const DELETE = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();

    const id = extractId(req);
    if (!Types.ObjectId.isValid(id)) {
      return errorResponse({ status: 400, message: "Invalid zone ID", req });
    }

    const deleted = await Zone.findByIdAndDelete(id);

    if (!deleted) {
      return errorResponse({ status: 404, message: "Zone not found", req });
    }

    return successResponse({
      status: 200,
      message: "Zone deleted successfully",
      data: deleted,
      req,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to delete zone";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});