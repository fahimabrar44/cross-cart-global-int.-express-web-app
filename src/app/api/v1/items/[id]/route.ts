import connectDB from "@/config/db";
import {
  createAuthHandler,
  createModeratorHandler,
} from "@/server/common/apiWrapper";
import { errorResponse, successResponse } from "@/server/common/response";
import { buildItemPayload } from "@/server/common/itemPayload";
import { Item } from "@/server/models/Item.model";
import { Types } from "mongoose";

const extractId = (req: Request): string => {
  const segments = new URL(req.url).pathname.split("/").filter(Boolean);
  return segments[segments.length - 1];
};

async function findDuplicateName(
  id: string,
  nameKey?: string
): Promise<boolean> {
  if (!nameKey) return false;
  const duplicate = await Item.findOne({
    _id: { $ne: id },
    nameKey,
  })
    .select("_id")
    .lean();
  return Boolean(duplicate);
}

/**
 * GET /api/v1/items/:id — readable by signed-in users.
 */
export const GET = createAuthHandler(async ({ req }) => {
  try {
    await connectDB();

    const id = extractId(req);
    if (!Types.ObjectId.isValid(id)) {
      return errorResponse({ status: 400, message: "Invalid item ID", req });
    }

    const item = await Item.findById(id).lean();
    if (!item) {
      return errorResponse({ status: 404, message: "Item not found", req });
    }

    return successResponse({
      status: 200,
      message: "Item fetched successfully",
      data: item,
      req,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to fetch item";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

/**
 * PUT /api/v1/items/:id — full update (admin/moderator).
 */
export const PUT = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();

    const id = extractId(req);
    if (!Types.ObjectId.isValid(id)) {
      return errorResponse({ status: 400, message: "Invalid item ID", req });
    }

    const body = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body) {
      return errorResponse({
        status: 400,
        message: "A valid JSON body is required",
        req,
      });
    }

    const built = buildItemPayload(body, { requireName: false });
    if (!built.ok) {
      return errorResponse({ status: 400, message: built.message, req });
    }

    if (await findDuplicateName(id, built.data.nameKey)) {
      return errorResponse({
        status: 409,
        message: "An item with this name already exists",
        req,
      });
    }

    const updated = await Item.findByIdAndUpdate(
      id,
      { $set: built.data },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return errorResponse({ status: 404, message: "Item not found", req });
    }

    return successResponse({
      status: 200,
      message: "Item updated successfully",
      data: updated,
      req,
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { code?: number }).code === 11000
    ) {
      return errorResponse({
        status: 409,
        message: "An item with this name already exists",
        req,
      });
    }
    const msg =
      error instanceof Error ? error.message : "Failed to update item";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

/**
 * PATCH /api/v1/items/:id — partial update, e.g. activate/deactivate.
 */
export const PATCH = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();

    const id = extractId(req);
    if (!Types.ObjectId.isValid(id)) {
      return errorResponse({ status: 400, message: "Invalid item ID", req });
    }

    const body = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body) {
      return errorResponse({
        status: 400,
        message: "A valid JSON body is required",
        req,
      });
    }

    const built = buildItemPayload(body, { requireName: false });
    if (!built.ok) {
      return errorResponse({ status: 400, message: built.message, req });
    }

    if (await findDuplicateName(id, built.data.nameKey)) {
      return errorResponse({
        status: 409,
        message: "An item with this name already exists",
        req,
      });
    }

    const updated = await Item.findByIdAndUpdate(
      id,
      { $set: built.data },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return errorResponse({ status: 404, message: "Item not found", req });
    }

    return successResponse({
      status: 200,
      message: "Item updated successfully",
      data: updated,
      req,
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { code?: number }).code === 11000
    ) {
      return errorResponse({
        status: 409,
        message: "An item with this name already exists",
        req,
      });
    }
    const msg =
      error instanceof Error ? error.message : "Failed to update item";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

/**
 * DELETE /api/v1/items/:id — admin/moderator.
 *
 * Safe to hard-delete because orders store their own copy of the item name
 * and price, so historical orders are unaffected.
 */
export const DELETE = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();

    const id = extractId(req);
    if (!Types.ObjectId.isValid(id)) {
      return errorResponse({ status: 400, message: "Invalid item ID", req });
    }

    const deleted = await Item.findByIdAndDelete(id);
    if (!deleted) {
      return errorResponse({ status: 404, message: "Item not found", req });
    }

    return successResponse({
      status: 200,
      message: "Item deleted successfully",
      data: deleted,
      req,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to delete item";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});
