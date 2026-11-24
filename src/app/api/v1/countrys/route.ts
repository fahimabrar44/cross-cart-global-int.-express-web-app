import connectDB from "@/config/db";
import { Country } from "@/server/models/Country.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { NextRequest } from "next/server";
import { createModeratorHandler } from "@/server/common/apiWrapper";
import { AuthMiddleware } from "@/middleware/auth";
import { escapeRegex, exactMatchRegex } from "@/server/common/regex";
import {
  withTtlCache,
  invalidateReferenceData,
} from "@/server/services/referenceCache";

const REF_TTL_MS = 5 * 60 * 1000;
const MAX_PAGE_SIZE = 500;

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Admins/moderators (JWT or API key) manage this data and must see fresh
    // results, so skip the cache for them. The in-memory cache isn't shared
    // across serverless instances, so relying on it for admins would otherwise
    // show stale data after an edit. Public/API-key consumers stay cached.
    let isInternal = false;
    const apiKey = req.headers.get("X-API-Key") || req.headers.get("x-api-key");
    if (apiKey) {
      const apiAuth = await AuthMiddleware.validateApiKey(req);
      if (!apiAuth.success && apiAuth.response) return apiAuth.response;
      isInternal = ["admin", "moderator"].includes(apiAuth.user?.role || "");
    } else {
      const authResult = await AuthMiddleware.authenticate(req);
      isInternal = ["admin", "moderator"].includes(authResult.user?.role || "");
    }

    const url = new URL(req.url);
    const search = url.searchParams.get("search");
    const name = url.searchParams.get("name");
    const code = url.searchParams.get("code");
    const zone = url.searchParams.get("zone");
    const timezone = url.searchParams.get("timezone");
    const phoneCode = url.searchParams.get("phoneCode");
    const isActiveParam = url.searchParams.get("isActive");
    const createdFrom = url.searchParams.get("createdFrom");
    const createdTo = url.searchParams.get("createdTo");

    const sortBy = (url.searchParams.get("sortBy") || "createdAt").trim();
    const sortOrder =
      (url.searchParams.get("sortOrder") || "desc").toLowerCase() === "asc"
        ? 1
        : -1;

    const page = Math.max(
      1,
      parseInt(url.searchParams.get("page") || "1", 10)
    );
    const limit = Math.max(
      1,
      Math.min(
        MAX_PAGE_SIZE,
        parseInt(url.searchParams.get("limit") || "20", 10)
      )
    );
    const skip = (page - 1) * limit;

    const cacheKey = [
      "countrys:list",
      search ?? "",
      name ?? "",
      code ?? "",
      zone ?? "",
      timezone ?? "",
      phoneCode ?? "",
      isActiveParam ?? "",
      createdFrom ?? "",
      createdTo ?? "",
      sortBy,
      sortOrder,
      page,
      limit,
    ].join("|");

    const loadCountries = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query: any = {};

      if (isActiveParam === "true") query.isActive = true;
      else if (isActiveParam === "false") query.isActive = false;

      if (name) query.name = { $regex: escapeRegex(name), $options: "i" };
      if (code) query.code = escapeRegex(code).toUpperCase();
      if (zone) query.zone = { $regex: escapeRegex(zone), $options: "i" };
      if (timezone) {
        query.timezone = { $regex: escapeRegex(timezone), $options: "i" };
      }
      if (phoneCode) {
        query.phoneCode = { $regex: escapeRegex(phoneCode), $options: "i" };
      }

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

      if (search && search.trim()) {
        const s = new RegExp(escapeRegex(search.trim()), "i");
        query.$or = [
          { name: s },
          { code: s },
          { zone: s },
          { timezone: s },
          { phoneCode: s },
        ];
      }

      const allowedSortFields = new Set([
        "name",
        "code",
        "createdAt",
        "updatedAt",
        "zone",
        "phoneCode",
      ]);
      const finalSortBy = allowedSortFields.has(sortBy) ? sortBy : "createdAt";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sortObj: any = {};
      sortObj[finalSortBy] = sortOrder;

      const total = await Country.countDocuments(query);

      const countries = await Country.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean();

      return { total, countries };
    };

    const result = isInternal
      ? await loadCountries()
      : await withTtlCache<{ total: number; countries: unknown[] }>(
          cacheKey,
          REF_TTL_MS,
          loadCountries
        );

    return successResponse({
      status: 200,
      message: "Countries fetched successfully",
      data: result.countries,
      meta: {
        page,
        limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / limit)),
      },
      req,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to fetch countries";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}

function toText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

/**
 * POST - create a new country
 * Body fields: name (required), code (required), phoneCode?, flagUrl?,
 * timezone?, zone?, isActive?
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

    const name = toText(body.name, 120);
    const code = toText(body.code, 3).toUpperCase();
    const phoneCode = toText(body.phoneCode, 8);

    if (!name || !code) {
      return errorResponse({
        status: 400,
        message: "Both 'name' and 'code' are required",
        req,
      });
    }
    if (!/^[A-Z]{2,3}$/.test(code)) {
      return errorResponse({
        status: 400,
        message: "Country code must be 2–3 letters (ISO code)",
        req,
      });
    }
    if (phoneCode && !/^\+\d{1,4}$/.test(phoneCode)) {
      return errorResponse({
        status: 400,
        message: "Phone code must start with '+' and contain 1–4 digits",
        req,
      });
    }

    // Prevent duplicate (by code or name)
    const existing = await Country.findOne({
      $or: [{ code }, { name: exactMatchRegex(name) }],
    })
      .select("_id")
      .lean();

    if (existing) {
      return errorResponse({
        status: 409,
        message: "Country with same code or name already exists",
        req,
      });
    }

    const isActive = typeof body.isActive === "boolean" ? body.isActive : true;

    const country = await Country.create({
      name,
      code,
      phoneCode: phoneCode || null,
      flagUrl: toText(body.flagUrl, 500) || null,
      timezone: toText(body.timezone, 100) || null,
      zone: toText(body.zone, 100) || null,
      isActive,
      deactivatedAt: isActive ? null : new Date(),
    });

    invalidateReferenceData("countrys");
    // Price lists embed country names, so their cached copies are stale too.
    invalidateReferenceData("prices");

    return successResponse({
      status: 200,
      message: "Country created successfully",
      data: country,
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
        message: "Country with same code or name already exists",
        req,
      });
    }
    const msg =
      error instanceof Error ? error.message : "Failed to create country";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});
