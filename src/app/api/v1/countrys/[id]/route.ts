import connectDB from "@/config/db";
import { Country } from "@/server/models/Country.model";
import { Zone } from "@/server/models/Zone.model";
import { Price } from "@/server/models/Price.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { createModeratorHandler } from "@/server/common/apiWrapper";
import { exactMatchRegex } from "@/server/common/regex";
import { invalidateReferenceData } from "@/server/services/referenceCache";

const extractId = (req: Request): string => {
  const segments = new URL(req.url).pathname.split("/").filter(Boolean);
  return segments[segments.length - 1];
};

function toText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

interface CountryUpdate {
  name?: string;
  code?: string;
  phoneCode?: string | null;
  flagUrl?: string | null;
  timezone?: string | null;
  zone?: string | null;
  isActive?: boolean;
  deactivatedAt?: Date | null;
  deactivatedReason?: string | null;
}

/**
 * Only allow known fields through; `$set: body` used to let callers overwrite
 * `_id`, timestamps and internal deactivation metadata.
 */
function buildCountryUpdate(body: Record<string, unknown>):
  | { ok: true; update: CountryUpdate }
  | { ok: false; message: string } {
  const update: CountryUpdate = {};

  if (body.name !== undefined) {
    const name = toText(body.name, 120);
    if (name.length < 2) {
      return { ok: false, message: "Country name must be at least 2 characters" };
    }
    update.name = name;
  }

  if (body.code !== undefined) {
    const code = toText(body.code, 3).toUpperCase();
    if (!/^[A-Z]{2,3}$/.test(code)) {
      return {
        ok: false,
        message: "Country code must be 2–3 letters (ISO code)",
      };
    }
    update.code = code;
  }

  if (body.phoneCode !== undefined) {
    const phoneCode = toText(body.phoneCode, 8);
    if (phoneCode && !/^\+\d{1,4}$/.test(phoneCode)) {
      return {
        ok: false,
        message: "Phone code must start with '+' and contain 1–4 digits",
      };
    }
    update.phoneCode = phoneCode || null;
  }

  if (body.flagUrl !== undefined) {
    update.flagUrl = toText(body.flagUrl, 500) || null;
  }
  if (body.timezone !== undefined) {
    update.timezone = toText(body.timezone, 100) || null;
  }
  if (body.zone !== undefined) {
    update.zone = toText(body.zone, 100) || null;
  }
  if (body.deactivatedReason !== undefined) {
    update.deactivatedReason = toText(body.deactivatedReason, 500) || null;
  }

  if (typeof body.isActive === "boolean") {
    update.isActive = body.isActive;
    update.deactivatedAt = body.isActive ? null : new Date();
    if (body.isActive) update.deactivatedReason = null;
  }

  if (Object.keys(update).length === 0) {
    return { ok: false, message: "No update fields provided" };
  }

  return { ok: true, update };
}

async function findDuplicate(
  id: string,
  update: CountryUpdate
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const or: any[] = [];
  if (update.name) or.push({ name: exactMatchRegex(update.name) });
  if (update.code) or.push({ code: update.code });
  if (or.length === 0) return false;

  const duplicate = await Country.findOne({
    _id: { $ne: id },
    $or: or,
  })
    .select("_id")
    .lean();

  return Boolean(duplicate);
}

/**
 * GET - fetch a single country by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();

    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return errorResponse({ status: 400, message: "Invalid country ID", req });
    }

    const country = await Country.findById(id).lean();
    if (!country) {
      return errorResponse({ status: 404, message: "Country not found", req });
    }

    return successResponse({
      status: 200,
      message: "Country fetched successfully",
      data: country,
      req,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to fetch country";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}

/**
 * PUT - update a country by ID
 */
export const PUT = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();

    const id = extractId(req);
    if (!Types.ObjectId.isValid(id)) {
      return errorResponse({ status: 400, message: "Invalid country ID", req });
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

    const built = buildCountryUpdate(body);
    if (!built.ok) {
      return errorResponse({ status: 400, message: built.message, req });
    }

    if (await findDuplicate(id, built.update)) {
      return errorResponse({
        status: 409,
        message: "Country with same code or name already exists",
        req,
      });
    }

    const updated = await Country.findByIdAndUpdate(
      id,
      { $set: built.update },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return errorResponse({ status: 404, message: "Country not found", req });
    }

    invalidateReferenceData("countrys");
    invalidateReferenceData("prices");

    return successResponse({
      status: 200,
      message: "Country updated successfully",
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
        message: "Country with same code or name already exists",
        req,
      });
    }
    const msg =
      error instanceof Error ? error.message : "Failed to update country";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

/**
 * PATCH - update a country by ID (also used for activate/deactivate)
 */
export const PATCH = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();

    const id = extractId(req);
    if (!Types.ObjectId.isValid(id)) {
      return errorResponse({ status: 400, message: "Invalid country ID", req });
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

    const built = buildCountryUpdate(body);
    if (!built.ok) {
      return errorResponse({ status: 400, message: built.message, req });
    }

    if (await findDuplicate(id, built.update)) {
      return errorResponse({
        status: 409,
        message: "Country with same code or name already exists",
        req,
      });
    }

    const updated = await Country.findByIdAndUpdate(
      id,
      { $set: built.update },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return errorResponse({ status: 404, message: "Country not found", req });
    }

    invalidateReferenceData("countrys");
    invalidateReferenceData("prices");

    return successResponse({
      status: 200,
      message: "Country updated successfully",
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
        message: "Country with same code or name already exists",
        req,
      });
    }
    const msg =
      error instanceof Error ? error.message : "Failed to update country";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

/**
 * DELETE - remove a country by ID
 *
 * Refuses to delete a country that is still referenced by a zone or a price
 * chart; otherwise those records would point at a missing document and the
 * calculator would silently fail for that route.
 */
export const DELETE = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();

    const id = extractId(req);
    if (!Types.ObjectId.isValid(id)) {
      return errorResponse({ status: 400, message: "Invalid country ID", req });
    }

    const [zoneRefs, priceRefs] = await Promise.all([
      Zone.countDocuments({ countryIds: id }),
      Price.countDocuments({ from: id }),
    ]);

    if (zoneRefs > 0 || priceRefs > 0) {
      return errorResponse({
        status: 409,
        message: `This country is still used by ${zoneRefs} zone(s) and ${priceRefs} price chart(s). Remove those references before deleting it.`,
        req,
      });
    }

    const deleted = await Country.findByIdAndDelete(id);

    if (!deleted) {
      return errorResponse({ status: 404, message: "Country not found", req });
    }

    invalidateReferenceData("countrys");
    invalidateReferenceData("prices");

    return successResponse({
      status: 200,
      message: "Country deleted successfully",
      data: deleted,
      req,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to delete country";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});
