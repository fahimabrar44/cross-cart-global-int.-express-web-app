import connectDB from "@/config/db";
import {
  createAuthHandler,
  createModeratorHandler,
} from "@/server/common/apiWrapper";
import { errorResponse, successResponse } from "@/server/common/response";
import { escapeRegex } from "@/server/common/regex";
import { buildItemPayload } from "@/server/common/itemPayload";
import { Item } from "@/server/models/Item.model";

const MAX_PAGE_SIZE = 500;

/**
 * GET /api/v1/items
 *
 * Readable by every signed-in user: the order form needs the catalog to offer
 * suggestions. Writes are restricted to admins/moderators below.
 */
export const GET = createAuthHandler(async ({ req }) => {
  try {
    await connectDB();

    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.trim() || "";
    const isActiveParam = url.searchParams.get("isActive");

    const page = Math.max(
      1,
      parseInt(url.searchParams.get("page") || "1", 10) || 1
    );
    const limit = Math.max(
      1,
      Math.min(
        MAX_PAGE_SIZE,
        parseInt(url.searchParams.get("limit") || "20", 10) || 20
      )
    );
    const skip = (page - 1) * limit;

    const allowedSortFields = new Set([
      "name",
      "defaultPrice",
      "createdAt",
      "updatedAt",
    ]);
    const sortBy = allowedSortFields.has(url.searchParams.get("sortBy") || "")
      ? (url.searchParams.get("sortBy") as string)
      : "name";
    const sortOrder =
      (url.searchParams.get("sortOrder") || "asc").toLowerCase() === "desc"
        ? -1
        : 1;

    const query: Record<string, unknown> = {};
    if (isActiveParam === "true") query.isActive = true;
    if (isActiveParam === "false") query.isActive = false;

    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      query.$or = [{ name: rx }, { description: rx }, { unit: rx }];
    }

    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder };

    const [total, activeTotal, items] = await Promise.all([
      Item.countDocuments(query),
      Item.countDocuments({ ...query, isActive: true }),
      Item.find(query).sort(sort).skip(skip).limit(limit).lean(),
    ]);

    return successResponse({
      status: 200,
      message: "Items fetched successfully",
      data: items,
      meta: {
        page,
        limit,
        total,
        activeTotal,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      req,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to fetch items";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

/**
 * POST /api/v1/items
 * Body: { name, defaultPrice?, unit?, description?, isActive? }
 */
export const POST = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();

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

    const built = buildItemPayload(body, { requireName: true });
    if (!built.ok) {
      return errorResponse({ status: 400, message: built.message, req });
    }

    const existing = await Item.findOne({ nameKey: built.data.nameKey })
      .select("_id")
      .lean();

    if (existing) {
      return errorResponse({
        status: 409,
        message: "An item with this name already exists",
        req,
      });
    }

    const item = await Item.create(built.data);

    return successResponse({
      status: 200,
      message: "Item created successfully",
      data: item,
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
      error instanceof Error ? error.message : "Failed to create item";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});
