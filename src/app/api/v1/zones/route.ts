import connectDB from "@/config/db";
import { Zone } from "@/server/models/Zone.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { NextRequest } from "next/server";
import { createModeratorHandler } from "@/server/common/apiWrapper";
import { Types } from "mongoose";
import { withTtlCache, invalidateReferenceData } from "@/server/services/referenceCache";

const REF_TTL_MS = 5 * 60 * 1000;

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const search = url.searchParams.get("search");
    const name = url.searchParams.get("name");
    const code = url.searchParams.get("code");
    const isActiveParam = url.searchParams.get("isActive");
    const createdFrom = url.searchParams.get("createdFrom");
    const createdTo = url.searchParams.get("createdTo");

    const sortBy = (url.searchParams.get("sortBy") || "createdAt").trim();
    const sortOrder = (url.searchParams.get("sortOrder") || "desc").toLowerCase() === "asc" ? 1 : -1;

    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10));
    const skip = (page - 1) * limit;

    const cacheKey = `zones:list:${search ?? ""}|${name ?? ""}|${code ?? ""}|${isActiveParam ?? ""}|${createdFrom ?? ""}|${createdTo ?? ""}|${sortBy}|${sortOrder}|${page}|${limit}`;

    const result = await withTtlCache<{ total: number; zones: unknown[] }>(
      cacheKey,
      REF_TTL_MS,
      async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query: any = {};

        if (typeof isActiveParam === "string") {
          if (isActiveParam.toLowerCase() === "true") query.isActive = true;
          else if (isActiveParam.toLowerCase() === "false") query.isActive = false;
        }

        if (name) query.name = { $regex: name, $options: "i" };
        if (code) query.code = { $regex: code, $options: "i" };

        if (createdFrom || createdTo) {
          query.createdAt = {};
          if (createdFrom) {
            const d = new Date(createdFrom);
            if (!isNaN(d.getTime())) query.createdAt.$gte = d;
          }
          if (createdTo) {
            const d = new Date(createdTo);
            if (!isNaN(d.getTime())) query.createdAt.$lte = d;
          }
          if (Object.keys(query.createdAt).length === 0) delete query.createdAt;
        }

        if (search) {
          const s = search.trim();
          query.$or = [
            { name: { $regex: s, $options: "i" } },
            { code: { $regex: s, $options: "i" } },
            { description: { $regex: s, $options: "i" } },
          ];
        }

        const allowedSortFields = new Set(["name", "code", "createdAt", "updatedAt"]);
        const finalSortBy = allowedSortFields.has(sortBy) ? sortBy : "createdAt";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sortObj: any = {};
        sortObj[finalSortBy] = sortOrder;

        const total = await Zone.countDocuments(query);

        const zones = await Zone.find(query)
          .populate("countryIds", "name code isActive")
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .lean();

        return { total, zones };
      }
    );

    return successResponse({
      status: 200,
      message: "Zones fetched successfully",
      data: result.zones,
      meta: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit) || 1,
      },
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch zones";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}

/**
 * POST - create a new zone
 * Body fields: name (required), code?, countryIds?, description?, isActive?
 */
export const POST = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();

    const body = await req.json();

    if (!body?.name) {
      return errorResponse({ status: 400, message: "Zone 'name' is required", req });
    }

    body.name = String(body.name).trim();
    if (body.code) body.code = String(body.code).trim().toUpperCase();

    const existing = await Zone.findOne({
      name: new RegExp(`^${body.name}$`, "i"),
    });

    if (existing) {
      return errorResponse({
        status: 409,
        message: "Zone with same name already exists",
        req,
      });
    }

    let countryIds: Types.ObjectId[] = [];
    if (Array.isArray(body.countryIds)) {
      countryIds = body.countryIds
        .filter((id: unknown) => typeof id === "string" && Types.ObjectId.isValid(id))
        .map((id: string) => new Types.ObjectId(id));
    }

    const zone = new Zone({
      name: body.name,
      code: body.code ?? null,
      countryIds,
      description: body.description ?? null,
      isActive: typeof body.isActive === "boolean" ? body.isActive : true,
    });

    await zone.save();
    invalidateReferenceData("zones");

    return successResponse({
      status: 200,
      message: "Zone created successfully",
      data: zone,
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create zone";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});
