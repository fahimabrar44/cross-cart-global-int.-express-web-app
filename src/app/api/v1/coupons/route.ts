import { NextRequest } from "next/server";
import connectDB from "@/config/db";
import { Coupon } from "@/server/models/Coupon.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { createModeratorHandler } from "@/server/common/apiWrapper";

type GetQuery = {
  isActive?: string;
  appliesTo?: string;
  search?: string;
  page?: string;
  limit?: string;
};

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const q: GetQuery = Object.fromEntries(url.searchParams.entries());
    const isPublic = !q.isActive || q.isActive === "true";

    const page = Math.max(1, parseInt(q.page || "1", 10));
    const limit = Math.max(1, Math.min(200, parseInt(q.limit || "50", 10)));
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { ...(isPublic ? { isActive: true } : {}) };
    if (q.isActive !== undefined && !isPublic) query.isActive = q.isActive === "true";
    if (q.appliesTo) query.appliesTo = q.appliesTo;
    if (q.search) {
      const s = q.search.trim();
      query.$or = [
        { code: { $regex: s, $options: "i" } },
        { description: { $regex: s, $options: "i" } },
      ];
    }

    const total = await Coupon.countDocuments(query);
    const coupons = await Coupon.find(query)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort({ createdAt: -1 } as any)
      .skip(skip)
      .limit(limit)
      .lean();

    return successResponse({
      status: 200,
      message: "Coupons fetched successfully",
      data: coupons,
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch coupons";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}

export const POST = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.code) return errorResponse({ status: 400, message: "code is required", req });
    if (!body.discountType) return errorResponse({ status: 400, message: "discountType is required", req });
    if (body.discountValue === undefined) return errorResponse({ status: 400, message: "discountValue is required", req });
    if (!body.validUntil) return errorResponse({ status: 400, message: "validUntil is required", req });

    const code = String(body.code).trim().toUpperCase();
    const existing = await Coupon.findOne({ code });
    if (existing) return errorResponse({ status: 409, message: "Coupon code already exists", req });

    const coupon = new Coupon({
      code,
      description: body.description || "",
      discountType: body.discountType,
      discountValue: Number(body.discountValue),
      minOrderAmount: Number(body.minOrderAmount) || 0,
      maxDiscount: Number(body.maxDiscount) || 0,
      usageLimit: Number(body.usageLimit) || 0,
      perUserLimit: Number(body.perUserLimit) || 1,
      validFrom: body.validFrom ? new Date(body.validFrom) : new Date(),
      validUntil: new Date(body.validUntil),
      isActive: body.isActive ?? true,
      appliesTo: body.appliesTo || "all",
    });

    await coupon.save();

    return successResponse({ status: 201, message: "Coupon created successfully", data: coupon, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create coupon";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});