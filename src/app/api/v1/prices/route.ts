import connectDB from "@/config/db";
import { AuthMiddleware } from "@/middleware/auth";
import { createModeratorHandler } from "@/server/common/apiWrapper";
import { errorResponse, successResponse } from "@/server/common/response";
import { escapeRegex, exactMatchRegex } from "@/server/common/regex";
import { sanitizeRates, validateRates } from "@/server/common/priceValidation";
import { Country } from "@/server/models/Country.model";
import { Price } from "@/server/models/Price.model";
import { Zone } from "@/server/models/Zone.model";
import { Types } from "mongoose";
import { NextRequest } from "next/server";
import {
  withTtlCache,
  invalidateReferenceData,
} from "@/server/services/referenceCache";

const REF_TTL_MS = 5 * 60 * 1000;

type GetQuery = {
  from?: string;
  to?: string;
  toCountryId?: string;
  fromName?: string;
  toName?: string;
  rateName?: string;
  isActive?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
  search?: string;
};

/** Resolve a country name or ISO code to its ObjectId(s). */
async function resolveCountryIds(value: string): Promise<Types.ObjectId[]> {
  const rx = exactMatchRegex(value);
  const rows = await Country.find({ $or: [{ name: rx }, { code: rx }] })
    .select("_id")
    .lean();
  return rows.map((row) => row._id as Types.ObjectId);
}

/** Resolve a zone name/code to its ObjectId(s). */
async function resolveZoneIds(value: string): Promise<Types.ObjectId[]> {
  const rx = exactMatchRegex(value);
  const rows = await Zone.find({ $or: [{ name: rx }, { code: rx }] })
    .select("_id")
    .lean();
  return rows.map((row) => row._id as Types.ObjectId);
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Admins/moderators (JWT login or their own API key) see the base rates;
    // everyone else gets rates with profit % + fuel already applied, so the
    // public rate fields are the final chargeable price.
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
    const q: GetQuery = Object.fromEntries(url.searchParams.entries());

    const page = Math.max(1, parseInt(q.page || "1", 10));
    const limit = Math.max(1, Math.min(200, parseInt(q.limit || "20", 10)));
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};

    if (q.from && Types.ObjectId.isValid(q.from)) {
      query.from = new Types.ObjectId(q.from);
    }
    if (q.to && Types.ObjectId.isValid(q.to)) {
      query.to = new Types.ObjectId(q.to);
    }
    if (q.toCountryId && Types.ObjectId.isValid(q.toCountryId)) {
      // A destination country can be priced directly (legacy charts) or
      // through the zone that contains it (current charts).
      const countryOid = new Types.ObjectId(q.toCountryId);
      const zoneRows = await Zone.find({ countryIds: countryOid })
        .select("_id")
        .lean();
      query.to = {
        $in: [countryOid, ...zoneRows.map((zone) => zone._id)],
      };
    }

    if (q.fromName) {
      const countryIds = await resolveCountryIds(q.fromName);
      if (countryIds.length === 0) {
        return successResponse({
          status: 200,
          message: "Prices fetched successfully",
          data: [],
          meta: { page, limit, total: 0, totalPages: 0, activeTotal: 0 },
          req,
        });
      }
      query.from = { $in: countryIds };
    }

    if (q.toName) {
      // Destination resolves to a Zone first, then falls back to a Country.
      const zoneIds = await resolveZoneIds(q.toName);
      if (zoneIds.length > 0) {
        query.to = { $in: zoneIds };
      } else {
        const countryIds = await resolveCountryIds(q.toName);
        if (countryIds.length === 0) {
          return successResponse({
            status: 200,
            message: "Prices fetched successfully",
            data: [],
            meta: { page, limit, total: 0, totalPages: 0, activeTotal: 0 },
            req,
          });
        }
        query.to = { $in: countryIds };
      }
    }

    if (q.rateName) {
      query["rate.name"] = {
        $regex: escapeRegex(q.rateName.trim()),
        $options: "i",
      };
    }

    if (q.isActive === "true") query.isActive = { $ne: false };
    if (q.isActive === "false") query.isActive = false;

    if (q.search && q.search.trim()) {
      const searchRegex = new RegExp(escapeRegex(q.search.trim()), "i");
      const [countryIds, zoneIds] = await Promise.all([
        Country.find({
          $or: [{ name: searchRegex }, { code: searchRegex }],
        })
          .select("_id")
          .lean(),
        Zone.find({
          $or: [{ name: searchRegex }, { code: searchRegex }],
        })
          .select("_id")
          .lean(),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const searchOr: any[] = [{ "rate.name": searchRegex }];
      if (countryIds.length > 0) {
        searchOr.push({ from: { $in: countryIds.map((c) => c._id) } });
      }
      if (zoneIds.length > 0) {
        searchOr.push({ to: { $in: zoneIds.map((z) => z._id) } });
      }
      query.$or = searchOr;
    }

    const allowedSortFields = new Set(["createdAt", "updatedAt", "from", "to"]);
    const sortBy = allowedSortFields.has(q.sortBy || "")
      ? (q.sortBy as string)
      : "createdAt";
    const sortOrder = (q.sortOrder || "desc").toLowerCase() === "asc" ? 1 : -1;

    const cacheKey = [
      "prices:list",
      q.from ?? "",
      q.to ?? "",
      q.toCountryId ?? "",
      q.fromName ?? "",
      q.toName ?? "",
      q.rateName ?? "",
      q.isActive ?? "",
      q.search ?? "",
      sortBy,
      sortOrder,
      page,
      limit,
    ].join("|");

    // Internal users (admin/moderator) manage these rates, so they must always
    // see fresh data — skip the cache. Caching is only for public/API-key
    // consumers, where a brief staleness is acceptable and saves DB load.
    const loadPrices = async () => {
      const [total, activeTotal, priceDocs] = await Promise.all([
        Price.countDocuments(query),
        Price.countDocuments({ ...query, isActive: { $ne: false } }),
        Price.find(query)
          .populate("from")
          .sort({ [sortBy]: sortOrder })
          .skip(skip)
          .limit(limit)
          .lean(),
      ]);

      // Resolve the destination manually so charts whose `to` points at a
      // country (legacy data) still return a usable name. `populate("to")`
      // would null those out because the current ref is Zone.
      const rows = priceDocs as unknown as Array<Record<string, unknown>>;
      const destinationIds = Array.from(
        new Set(
          rows
            .map((row) => String(row.to ?? ""))
            .filter((id) => Types.ObjectId.isValid(id))
        )
      );

      if (destinationIds.length > 0) {
        const objectIds = destinationIds.map((id) => new Types.ObjectId(id));
        const [zoneDocs, countryDocs] = await Promise.all([
          Zone.find({ _id: { $in: objectIds } }).select("name code").lean(),
          Country.find({ _id: { $in: objectIds } }).select("name code").lean(),
        ]);

        const destinations = new Map<
          string,
          { _id: Types.ObjectId; name: string; code?: string | null }
        >();
        countryDocs.forEach((doc) => {
          destinations.set(String(doc._id), {
            _id: doc._id as Types.ObjectId,
            name: doc.name,
            code: doc.code,
          });
        });
        // Zones win if an ID exists in both collections.
        zoneDocs.forEach((doc) => {
          destinations.set(String(doc._id), {
            _id: doc._id as Types.ObjectId,
            name: doc.name,
            code: doc.code,
          });
        });

        rows.forEach((row) => {
          const id = String(row.to ?? "");
          const destination = destinations.get(id);
          if (destination) row.to = destination;
          else if (!id) row.to = null;
        });
      }

      return { total, activeTotal, prices: rows };
    };

    const result = isInternal
      ? await loadPrices()
      : await withTtlCache<{
          total: number;
          activeTotal: number;
          prices: unknown[];
        }>(cacheKey, REF_TTL_MS, loadPrices);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prices = result.prices as any[];

    // For public / API-key consumers apply profit % then fuel surcharge onto
    // every rate field so the returned values are the final chargeable prices.
    // Admins & moderators keep the base (actual) rates.
    if (!isInternal) {
      prices.forEach((doc) => {
        (doc.rate || []).forEach(
          (r: {
            profitPercentage?: number;
            fuel?: number;
            price?: Record<string, number>;
          }) => {
            const profit = Number(r.profitPercentage) || 0;
            const fuel = Number(r.fuel) || 0;
            if (r.price && typeof r.price === "object") {
              Object.keys(r.price).forEach((tier) => {
                const base = Number(r.price?.[tier]) || 0;
                // Match the /prices/calculate formula:
                //   base * (1 + fuel/100) * (1 + profit%/100)
                r.price![tier] = Number(
                  (base * (1 + fuel / 100) * (1 + profit / 100)).toFixed(3)
                );
              });
            }
          }
        );
      });
    }

    return successResponse({
      status: 200,
      message: "Prices fetched successfully",
      data: prices,
      meta: {
        page,
        limit,
        total: result.total,
        activeTotal: result.activeTotal,
        totalPages: Math.max(1, Math.ceil(result.total / limit)),
      },
      req,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to fetch prices";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}

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

    const from = typeof body.from === "string" ? body.from : "";
    const to = typeof body.to === "string" ? body.to : "";

    if (!Types.ObjectId.isValid(from)) {
      return errorResponse({ status: 400, message: "from is required", req });
    }
    if (!Types.ObjectId.isValid(to)) {
      return errorResponse({ status: 400, message: "to is required", req });
    }

    const validation = validateRates(body.rate);
    if (!validation.valid) {
      return errorResponse({ status: 400, message: validation.message, req });
    }

    const [countryExists, zoneExists, existing] = await Promise.all([
      Country.exists({ _id: from }),
      Zone.exists({ _id: to }),
      Price.findOne({ from, to }).select("_id").lean(),
    ]);

    if (!countryExists) {
      return errorResponse({
        status: 400,
        message: "Origin country not found",
        req,
      });
    }
    if (!zoneExists) {
      return errorResponse({
        status: 400,
        message: "Destination zone not found",
        req,
      });
    }
    if (existing) {
      return errorResponse({
        status: 409,
        message:
          "A price chart already exists for this route. Edit the existing chart instead.",
        req,
      });
    }

    const price = await Price.create({
      from: new Types.ObjectId(from),
      to: new Types.ObjectId(to),
      rate: sanitizeRates(body.rate as unknown[]),
      isActive: typeof body.isActive === "boolean" ? body.isActive : true,
    });

    invalidateReferenceData("prices");

    return successResponse({
      status: 200,
      message: "Price created successfully",
      data: price,
      req,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to create price";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});
