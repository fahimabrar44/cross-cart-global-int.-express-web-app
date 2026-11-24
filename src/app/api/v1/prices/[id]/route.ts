import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/config/db";
import { AuthMiddleware } from "@/middleware/auth";
import { Price } from "@/server/models/Price.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { createModeratorHandler } from "@/server/common/apiWrapper";
import { sanitizeRates, validateRates } from "@/server/common/priceValidation";
import { Types } from "mongoose";
import { invalidateReferenceData } from "@/server/services/referenceCache";

const extractId = (req: Request): string => {
  const segments = new URL(req.url).pathname.split("/").filter(Boolean);
  return segments[segments.length - 1];
};

interface LeanRate {
  profitPercentage?: number;
  fuel?: number;
  price?: Record<string, number>;
}

async function isInternalRequest(req: NextRequest): Promise<boolean> {
  const apiKey = req.headers.get("X-API-Key") || req.headers.get("x-api-key");
  if (apiKey) {
    const apiAuth = await AuthMiddleware.validateApiKey(req);
    if (!apiAuth.success && apiAuth.response) return false;
    return ["admin", "moderator"].includes(apiAuth.user?.role || "");
  }
  const authResult = await AuthMiddleware.authenticate(req);
  return ["admin", "moderator"].includes(authResult.user?.role || "");
}

/**
 * GET /api/v1/prices/:id
 *
 * Admins/moderators receive the base rates they manage. Public callers get
 * the same final (fuel + margin applied) values as the list endpoint, so a
 * single-document request cannot be used to reverse-engineer margins.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return errorResponse({ status: 400, message: "Invalid ID", req });
    }

    const price = (await Price.findById(id)
      .populate("from")
      .populate("to")
      .lean()) as unknown as {
      rate?: LeanRate[];
      [key: string]: unknown;
    } | null;

    if (!price) {
      return errorResponse({ status: 404, message: "Price not found", req });
    }

    if (!(await isInternalRequest(req))) {
      (price.rate || []).forEach((r) => {
        const profit = Number(r.profitPercentage) || 0;
        const fuel = Number(r.fuel) || 0;
        const priceMap = r.price;
        if (priceMap && typeof priceMap === "object") {
          Object.keys(priceMap).forEach((tier) => {
            const base = Number(priceMap[tier]) || 0;
            priceMap[tier] = Number(
              (base * (1 + fuel / 100) * (1 + profit / 100)).toFixed(3)
            );
          });
        }
      });
    }

    return successResponse({
      status: 200,
      message: "Price fetched successfully",
      data: price,
      req,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to fetch price";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}

export const PUT = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();

    const id = extractId(req);

    if (!Types.ObjectId.isValid(id)) {
      return errorResponse({ status: 400, message: "Invalid ID", req });
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

    const price = await Price.findById(id);
    if (!price) {
      return errorResponse({ status: 404, message: "Price not found", req });
    }

    const nextFrom =
      typeof body.from === "string" && Types.ObjectId.isValid(body.from)
        ? body.from
        : price.from.toString();
    const nextTo =
      typeof body.to === "string" && Types.ObjectId.isValid(body.to)
        ? body.to
        : price.to.toString();

    if (body.rate !== undefined) {
      const validation = validateRates(body.rate);
      if (!validation.valid) {
        return errorResponse({ status: 400, message: validation.message, req });
      }
      price.rate = sanitizeRates(body.rate as unknown[]);
    }

    // A route must stay unique: two charts for the same origin + destination
    // would make the calculator pick one arbitrarily.
    if (
      nextFrom !== price.from.toString() ||
      nextTo !== price.to.toString()
    ) {
      const duplicate = await Price.findOne({
        _id: { $ne: price._id },
        from: nextFrom,
        to: nextTo,
      })
        .select("_id")
        .lean();
      if (duplicate) {
        return errorResponse({
          status: 409,
          message: "A price chart already exists for this route",
          req,
        });
      }
      price.from = new Types.ObjectId(nextFrom);
      price.to = new Types.ObjectId(nextTo);
    }

    if (typeof body.isActive === "boolean") {
      price.isActive = body.isActive;
      price.deactivatedAt = body.isActive ? null : new Date();
    }

    await price.save();
    invalidateReferenceData("prices");

    return successResponse({
      status: 200,
      message: "Price updated successfully",
      data: price,
      req,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to update price";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

// PATCH: Partial update (e.g., toggle isActive) — Moderator/admin only
export const PATCH = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();

    const id = extractId(req);

    if (!Types.ObjectId.isValid(id)) {
      return errorResponse({ status: 400, message: "Invalid ID", req });
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setFields: Record<string, any> = {};

    if (typeof body.isActive === "boolean") {
      setFields.isActive = body.isActive;
      setFields.deactivatedAt = body.isActive ? null : new Date();
    }
    if (typeof body.from === "string" && Types.ObjectId.isValid(body.from)) {
      setFields.from = body.from;
    }
    if (typeof body.to === "string" && Types.ObjectId.isValid(body.to)) {
      setFields.to = body.to;
    }
    if (body.rate !== undefined) {
      const validation = validateRates(body.rate);
      if (!validation.valid) {
        return errorResponse({ status: 400, message: validation.message, req });
      }
      setFields.rate = sanitizeRates(body.rate as unknown[]);
    }

    if (Object.keys(setFields).length === 0) {
      return errorResponse({
        status: 400,
        message: "No update fields provided",
        req,
      });
    }

    if (setFields.from !== undefined || setFields.to !== undefined) {
      const current = (await Price.findById(id)
        .select("from to")
        .lean()) as unknown as {
        from: Types.ObjectId;
        to: Types.ObjectId;
      } | null;
      if (!current) {
        return errorResponse({ status: 404, message: "Price not found", req });
      }
      const nextFrom = setFields.from ?? current.from.toString();
      const nextTo = setFields.to ?? current.to.toString();
      const duplicate = await Price.findOne({
        _id: { $ne: id },
        from: nextFrom,
        to: nextTo,
      })
        .select("_id")
        .lean();
      if (duplicate) {
        return errorResponse({
          status: 409,
          message: "A price chart already exists for this route",
          req,
        });
      }
    }

    const price = await Price.findByIdAndUpdate(
      id,
      { $set: setFields },
      { new: true, runValidators: true }
    ).lean();

    if (!price) {
      return errorResponse({ status: 404, message: "Price not found", req });
    }

    invalidateReferenceData("prices");

    return successResponse({
      status: 200,
      message: "Price updated successfully",
      data: price,
      req,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to update price";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

// DELETE - remove a price by ID
export const DELETE = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();

    const id = extractId(req);

    if (!Types.ObjectId.isValid(id)) {
      return errorResponse({ status: 400, message: "Invalid ID", req });
    }

    const deleted = await Price.findByIdAndDelete(id);
    if (!deleted) {
      return errorResponse({ status: 404, message: "Price not found", req });
    }

    invalidateReferenceData("prices");

    return successResponse({
      status: 200,
      message: "Price deleted successfully",
      req,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to delete price";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});
