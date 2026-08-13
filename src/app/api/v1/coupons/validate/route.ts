import connectDB from "@/config/db";
import { Coupon } from "@/server/models/Coupon.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { createAuthHandler } from "@/server/common/apiWrapper";

/**
 * POST /api/v1/coupons/validate
 * Validate + calculate discount for a coupon.
 * Body: { code, orderAmount, userId }
 */
export const POST = createAuthHandler(async ({ req, user }) => {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.code) return errorResponse({ status: 400, message: "code is required", req });

    const code = String(body.code).trim().toUpperCase();
    const orderAmount = Number(body.orderAmount) || 0;
    const userId = body.userId || user?.id;

    const coupon = await Coupon.findOne({ code, isActive: true });
    if (!coupon) return errorResponse({ status: 404, message: "Invalid or inactive coupon code", req });

    const now = new Date();
    if (now < coupon.validFrom) return errorResponse({ status: 400, message: "Coupon is not active yet", req });
    if (now > coupon.validUntil) return errorResponse({ status: 400, message: "Coupon has expired", req });

    if (orderAmount < coupon.minOrderAmount) {
      return errorResponse({
        status: 400,
        message: `Minimum order amount of ${coupon.minOrderAmount} required for this coupon`,
        req,
      });
    }

    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return errorResponse({ status: 400, message: "Coupon usage limit reached", req });
    }

    if (userId && coupon.perUserLimit > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userUses = coupon.usedBy.filter((id: any) => id.toString() === userId).length;
      if (userUses >= coupon.perUserLimit) {
        return errorResponse({ status: 400, message: "You have already used this coupon", req });
      }
    }

    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = (orderAmount * coupon.discountValue) / 100;
    } else {
      discount = coupon.discountValue;
    }
    if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
    discount = Math.min(discount, orderAmount);

    return successResponse({
      status: 200,
      message: "Coupon is valid",
      data: {
        code: coupon.code,
        discount,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscount: coupon.maxDiscount,
        validUntil: coupon.validUntil,
      },
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to validate coupon";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});