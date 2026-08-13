import connectDB from "@/config/db";
import { Coupon } from "@/server/models/Coupon.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { createModeratorHandler } from "@/server/common/apiWrapper";

export const PUT = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();
    const url = new URL(req.url);
    const id = url.pathname.split("/").filter(Boolean).pop();

    const body = await req.json();

    const coupon = await Coupon.findById(id);
    if (!coupon) return errorResponse({ status: 404, message: "Coupon not found", req });

    if (body.code) {
      const code = String(body.code).trim().toUpperCase();
      const existing = await Coupon.findOne({ code, _id: { $ne: id } });
      if (existing) return errorResponse({ status: 409, message: "Coupon code already exists", req });
      body.code = code;
    }

    const allowedFields = [
      "code",
      "description",
      "discountType",
      "discountValue",
      "minOrderAmount",
      "maxDiscount",
      "usageLimit",
      "perUserLimit",
      "validFrom",
      "validUntil",
      "isActive",
      "appliesTo",
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: any = {};
    for (const field of allowedFields) {
      if (field in body) {
        update[field] =
          field === "validFrom" || field === "validUntil"
            ? body[field]
              ? new Date(body[field])
              : null
            : body[field];
      }
    }

    const updated = await Coupon.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!updated) return errorResponse({ status: 404, message: "Coupon not found", req });

    return successResponse({ status: 200, message: "Coupon updated successfully", data: updated, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update coupon";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

export const DELETE = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();
    const url = new URL(req.url);
    const id = url.pathname.split("/").filter(Boolean).pop();

    const deleted = await Coupon.findByIdAndDelete(id);
    if (!deleted) return errorResponse({ status: 404, message: "Coupon not found", req });

    return successResponse({ status: 200, message: "Coupon deleted successfully", req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete coupon";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});