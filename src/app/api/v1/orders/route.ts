import connectDB from "@/config/db";
import { createPublicHandler, createAuthHandler } from "@/server/common/apiWrapper";
import { errorResponse, successResponse } from "@/server/common/response";
import { Order } from "@/server/models/Order.model";
import { Track } from "@/server/models/Track.model";
import { Coupon } from "@/server/models/Coupon.model";
import { Country } from "@/server/models/Country.model";
import { escapeRegex } from "@/server/common/regex";
import { notificationService } from "@/services/notificationService";
import { Types } from "mongoose";

type GetQuery = {
  trackId?: string;
  priority?: string;
  orderType?: string;
  from?: string;
  to?: string;
  createdFrom?: string;
  createdTo?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
  search?: string;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateAndFixItems(items: any[]): {
  valid: boolean;
  message?: string;
} {
  if (!Array.isArray(items))
    return { valid: false, message: "parcel.item must be an array" };

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!it || typeof it !== "object")
      return { valid: false, message: `parcel.item[${i}] invalid` };

    if (!it.name || typeof it.name !== "string" || !it.name.trim()) {
      return { valid: false, message: `parcel.item[${i}].name is required` };
    }

    if (
      it.quantity == null ||
      Number.isNaN(Number(it.quantity)) ||
      Number(it.quantity) <= 0
    ) {
      return {
        valid: false,
        message: `parcel.item[${i}].quantity must be a positive number`,
      };
    }

    if (
      it.unitPrice == null ||
      Number.isNaN(Number(it.unitPrice)) ||
      Number(it.unitPrice) < 0
    ) {
      return {
        valid: false,
        message: `parcel.item[${i}].unitPrice must be a non-negative number`,
      };
    }

    // Ensure totalPrice exists and is correct
    const qty = Number(it.quantity);
    const unit = Number(it.unitPrice);
    const computed = qty * unit;
    if (it.totalPrice == null || Number(it.totalPrice) !== computed) {
      it.totalPrice = computed;
    }
  }

  return { valid: true };
}

/** Keep only fields the client is allowed to set, with sane types/limits. */
function toText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function toAmount(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100) / 100;
}

function toWholeNumber(value: unknown, max = 100_000): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(n, max);
}

function toObjectIdOrNull(value: unknown): Types.ObjectId | null {
  if (value instanceof Types.ObjectId) return value;

  if (typeof value === "string") {
    const trimmed = value.trim();
    return Types.ObjectId.isValid(trimmed)
      ? new Types.ObjectId(trimmed)
      : null;
  }

  // Edit forms may send a populated document (e.g. the whole Country object)
  // instead of its id. Accept both shapes rather than failing the request.
  if (value && typeof value === "object") {
    const raw = value as { _id?: unknown; id?: unknown };
    return toObjectIdOrNull(raw._id ?? raw.id);
  }

  return null;
}

function sanitizeAddress(value: unknown) {
  const raw =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  return {
    address: toText(raw.address, 500),
    city: toText(raw.city, 120),
    zipCode: toText(raw.zipCode, 30),
    country: toObjectIdOrNull(raw.country),
  };
}

function sanitizePerson(
  value: unknown,
  fallback: { name?: string; phone?: string; email?: string }
) {
  const raw =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  return {
    name: toText(raw.name, 120) || toText(fallback.name, 120),
    phone: toText(raw.phone, 30) || toText(fallback.phone, 30),
    email: toText(raw.email, 200) || toText(fallback.email, 200),
    address: sanitizeAddress(raw.address),
  };
}

function sanitizeItems(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.slice(0, 50).map((entry) => {
    const raw =
      entry && typeof entry === "object"
        ? (entry as Record<string, unknown>)
        : {};
    const quantity = toWholeNumber(raw.quantity, 10_000);
    const unitPrice = toAmount(raw.unitPrice);

    return {
      name: toText(raw.name, 200),
      quantity,
      unitPrice,
      totalPrice: Math.round(quantity * unitPrice * 100) / 100,
    };
  });
}

function sanitizeBoxes(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.slice(0, 50).map((entry) => {
    const raw =
      entry && typeof entry === "object"
        ? (entry as Record<string, unknown>)
        : {};

    return {
      length: toAmount(raw.length),
      width: toAmount(raw.width),
      height: toAmount(raw.height),
      fragile: raw.fragile === true,
    };
  });
}

function sanitizePayment(value: unknown, allowAmounts: boolean) {
  const defaults = {
    pType: "Due",
    pAmount: 0,
    pOfferDiscount: 0,
    pExtraCharge: 0,
    pDiscount: 0,
    pReceived: 0,
    pRefunded: 0,
  };

  // Regular users and guests cannot set financial values on creation.
  if (!allowAmounts) return defaults;

  const raw =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  return {
    pType: toText(raw.pType, 50) || "Due",
    pAmount: toAmount(raw.pAmount),
    pOfferDiscount: toAmount(raw.pOfferDiscount),
    pExtraCharge: toAmount(raw.pExtraCharge),
    pDiscount: toAmount(raw.pDiscount),
    pReceived: toAmount(raw.pReceived),
    pRefunded: toAmount(raw.pRefunded),
  };
}

const ORDER_TYPES = new Set(["document", "parcel", "e-commerce"]);
const PRIORITIES = new Set(["normal", "express", "super-express", "tax-paid"]);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET: Everyone can view orders, but filtered by role
export const GET = createAuthHandler(async ({ req, user }) => {
  try {
    await connectDB();

    const url = new URL(req.url);
    const q: GetQuery = Object.fromEntries(url.searchParams.entries());

    const parsedPage = parseInt(q.page || "1", 10);
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const parsedLimit = parseInt(q.limit || "10", 10);
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(200, Math.max(1, parsedLimit))
      : 10;
    const skip = (page - 1) * limit;

    // Build query - users can only see their own orders unless admin/moderator
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    
    // Role-based filtering
    if (user?.role === "user") {
      // Regular users can see orders where they're the sender or the receiver.
      // Match phones tolerantly (E.164 vs local formats) using normalized variants.
      const phoneVariants: string[] = [];
      if (user.phone) {
        phoneVariants.push(user.phone);
        const digits = user.phone.replace(/\D/g, "");
        if (digits) {
          phoneVariants.push(digits);
          if (digits.length >= 10) phoneVariants.push(digits.slice(-10));
        }
      }
      const or: Record<string, unknown>[] = [];
      if (phoneVariants.length) {
        or.push({ "parcel.sender.phone": { $in: phoneVariants } });
        or.push({ "parcel.receiver.phone": { $in: phoneVariants } });
      }
      if (user.email) {
        or.push({ "parcel.sender.email": user.email });
        or.push({ "parcel.receiver.email": user.email });
      }
      // MongoDB rejects an empty `$or`, and a user with no phone/email must
      // never fall through to seeing every order.
      if (or.length > 0) {
        query.$or = or;
      } else {
        query._id = { $in: [] };
      }
    }
    // Admin and moderator can see all orders (no additional filter needed)

    if (q.trackId) {
      const t = q.trackId.trim();
      if (t.includes("*") || t.includes("%")) {
        const pattern = t.replace(/\*/g, ".*").replace(/%/g, ".*");
        query.trackId = { $regex: pattern, $options: "i" };
      } else {
        query.trackId = t;
      }
    }

    if (q.priority) query["parcel.priority"] = q.priority;
    if (q.orderType) query["parcel.orderType"] = q.orderType;

    if (q.createdFrom || q.createdTo) {
      query.createdAt = {};
      if (q.createdFrom) {
        const d = new Date(q.createdFrom);
        if (!isNaN(d.getTime())) query.createdAt.$gte = d;
      }
      if (q.createdTo) {
        const d = new Date(q.createdTo);
        if (!isNaN(d.getTime())) query.createdAt.$lte = d;
      }
      if (Object.keys(query.createdAt).length === 0) delete query.createdAt;
    }

    if (q.search) {
      const s = escapeRegex(q.search.trim());
      const searchOr = [
        { trackId: { $regex: s, $options: "i" } },
        { "parcel.sender.name": { $regex: s, $options: "i" } },
        { "parcel.receiver.name": { $regex: s, $options: "i" } },
      ];
      if (user?.role === "user" && query.$or) {
        // Keep the user's own-orders restriction even while searching
        query.$and = [{ $or: query.$or }, { $or: searchOr }];
        delete query.$or;
      } else {
        query.$or = searchOr;
      }
    }

    // Sorting
    const allowedSortFields = new Set([
      "createdAt",
      "orderDate",
      "trackId",
      "parcel.priority",
    ]);
    const sortBy = allowedSortFields.has(q.sortBy || "")
      ? (q.sortBy as string)
      : "createdAt";
    const sortOrder = (q.sortOrder || "desc").toLowerCase() === "asc" ? 1 : -1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sortObj: any = {};
    sortObj[sortBy] = sortOrder;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query).populate([
    { path: 'parcel.from' },
    { path: 'parcel.to' },
    { path: 'parcel.sender.address.country' },
    { path: 'parcel.receiver.address.country' },
  ])
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();

    return successResponse({
      status: 200,
      message: "Orders fetched successfully",
      data: orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        userRole: user?.role || "guest",
        filteredByRole: user?.role === "user",
      },
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch orders";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

// POST: Everyone can create orders (public access with optional auth).
//
// Security notes:
// - Only whitelisted fields are copied into the order document, so clients
//   cannot inject trackId, status, awb, assignment, handover details, etc.
// - Guests and regular users cannot set payment amounts.
// - Coupon discount is computed from item totals on the server and consumed
//   atomically, so two concurrent requests cannot exceed the usage limit.
export const POST = createPublicHandler(async ({ req, user }) => {
  let couponUsage:
    | { couponId: Types.ObjectId; userId?: Types.ObjectId }
    | null = null;

  try {
    await connectDB();

    const body =
      (await req.json()) as Record<string, unknown>;

    const parcelInput =
      body.parcel && typeof body.parcel === "object"
        ? (body.parcel as Record<string, unknown>)
        : null;

    if (!parcelInput) {
      return errorResponse({
        status: 400,
        message: "Parcel information is required",
        req,
      });
    }

    // Validate required parcel fields
    const from = toObjectIdOrNull(parcelInput.from);
    if (!from) {
      return errorResponse({
        status: 400,
        message: "A valid origin country (parcel.from) is required",
        req,
      });
    }

    const to = toObjectIdOrNull(parcelInput.to);
    if (!to) {
      return errorResponse({
        status: 400,
        message: "A valid destination country (parcel.to) is required",
        req,
      });
    }

    const weight = toText(parcelInput.weight, 50);
    if (!weight) {
      return errorResponse({
        status: 400,
        message: "Package weight (parcel.weight) is required",
        req,
      });
    }

    const senderInput =
      parcelInput.sender && typeof parcelInput.sender === "object"
        ? (parcelInput.sender as Record<string, unknown>)
        : null;
    const receiverInput =
      parcelInput.receiver && typeof parcelInput.receiver === "object"
        ? (parcelInput.receiver as Record<string, unknown>)
        : null;

    if (!senderInput) {
      return errorResponse({
        status: 400,
        message: "Sender information (parcel.sender) is required",
        req,
      });
    }

    if (!receiverInput) {
      return errorResponse({
        status: 400,
        message: "Receiver information (parcel.receiver) is required",
        req,
      });
    }

    const sender = sanitizePerson(senderInput, {
      name: user?.name,
      phone: user?.phone,
      email: user?.email,
    });
    const receiver = sanitizePerson(receiverInput, {});

    // Authenticated customers always ship under their own account identity.
    if (user) {
      sender.phone = user.phone;
      sender.email = user.email;
    }

    if (!sender.name || !sender.phone) {
      return errorResponse({
        status: 400,
        message: "Sender name and phone are required",
        req,
      });
    }

    if (!receiver.name || !receiver.phone) {
      return errorResponse({
        status: 400,
        message: "Receiver name and phone are required",
        req,
      });
    }

    if (sender.email && !EMAIL_REGEX.test(sender.email)) {
      return errorResponse({
        status: 400,
        message: "Invalid sender email format",
        req,
      });
    }

    if (receiver.email && !EMAIL_REGEX.test(receiver.email)) {
      return errorResponse({
        status: 400,
        message: "Invalid receiver email format",
        req,
      });
    }

    // Items (optional, but every provided entry must be valid)
    if (parcelInput.item !== undefined && !Array.isArray(parcelInput.item)) {
      return errorResponse({
        status: 400,
        message: "parcel.item must be an array",
        req,
      });
    }

    if (Array.isArray(parcelInput.item)) {
      const validation = validateAndFixItems(parcelInput.item);
      if (!validation.valid) {
        return errorResponse({
          status: 400,
          message: validation.message || "Invalid parcel.item",
          req,
        });
      }
    }

    const items = sanitizeItems(parcelInput.item);
    const itemsTotal = Math.round(
      items.reduce((sum, item) => sum + item.totalPrice, 0) * 100
    ) / 100;

    const orderType = ORDER_TYPES.has(String(parcelInput.orderType))
      ? String(parcelInput.orderType)
      : "parcel";
    const priority = PRIORITIES.has(String(parcelInput.priority))
      ? String(parcelInput.priority)
      : "normal";

    const dimensionsInput =
      parcelInput.dimensions && typeof parcelInput.dimensions === "object"
        ? (parcelInput.dimensions as Record<string, unknown>)
        : {};
    const insuranceInput =
      parcelInput.insurance && typeof parcelInput.insurance === "object"
        ? (parcelInput.insurance as Record<string, unknown>)
        : {};

    // Only staff can set financial amounts when creating an order.
    const isStaff = user?.role === "admin" || user?.role === "moderator";
    const payment = sanitizePayment(body.payment, isStaff);

    // ---- Coupon (server-computed discount + atomic consumption) ----
    let couponCode = "";
    let couponDiscount = 0;

    if (parcelInput.couponCode) {
      couponCode = toText(parcelInput.couponCode, 50).toUpperCase();
    }

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, isActive: true });

      if (!coupon) {
        return errorResponse({
          status: 400,
          message: `Coupon "${couponCode}" is invalid or inactive`,
          req,
        });
      }

      const now = new Date();
      if (now < coupon.validFrom) {
        return errorResponse({ status: 400, message: "Coupon is not active yet", req });
      }
      if (now > coupon.validUntil) {
        return errorResponse({ status: 400, message: "Coupon has expired", req });
      }

      // Discount applies to the item subtotal, never to a client-supplied amount.
      if (itemsTotal < (coupon.minOrderAmount || 0)) {
        return errorResponse({
          status: 400,
          message: `Minimum order amount of ${coupon.minOrderAmount} required for this coupon`,
          req,
        });
      }

      if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
        return errorResponse({ status: 400, message: "Coupon usage limit reached", req });
      }

      const userId =
        user?.id && Types.ObjectId.isValid(user.id)
          ? new Types.ObjectId(user.id)
          : null;

      if (userId && coupon.perUserLimit > 0) {
        const userUses = (coupon.usedBy || []).filter(
          (id: Types.ObjectId) => id.toString() === userId.toString()
        ).length;
        if (userUses >= coupon.perUserLimit) {
          return errorResponse({
            status: 400,
            message: "You have already used this coupon",
            req,
          });
        }
      }

      let discount =
        coupon.discountType === "percentage"
          ? (itemsTotal * coupon.discountValue) / 100
          : coupon.discountValue;

      if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
      discount = Math.min(discount, itemsTotal);
      couponDiscount = Math.round(discount * 100) / 100;

      // Atomic guard: re-check limits in the update query so concurrent
      // requests cannot push usedCount past usageLimit / perUserLimit.
      const conditions: Record<string, unknown>[] = [];
      if (coupon.usageLimit > 0) {
        conditions.push({ $expr: { $lt: ["$usedCount", "$usageLimit"] } });
      }
      if (userId && coupon.perUserLimit > 0) {
        conditions.push({
          $expr: {
            $lt: [
              {
                $size: {
                  $filter: {
                    input: { $ifNull: ["$usedBy", []] },
                    as: "used",
                    cond: { $eq: ["$$used", userId] },
                  },
                },
              },
              "$perUserLimit",
            ],
          },
        });
      }

      const consumeFilter: Record<string, unknown> = {
        _id: coupon._id,
        isActive: true,
        validFrom: { $lte: now },
        validUntil: { $gte: now },
      };
      if (conditions.length > 0) consumeFilter.$and = conditions;

      const consumed = await Coupon.findOneAndUpdate(
        consumeFilter,
        {
          $inc: { usedCount: 1 },
          ...(userId ? { $push: { usedBy: userId } } : {}),
        },
        { new: true }
      );

      if (!consumed) {
        return errorResponse({
          status: 409,
          message: "Coupon is no longer available. Please try again.",
          req,
        });
      }

      couponUsage = {
        couponId: coupon._id as Types.ObjectId,
        ...(userId ? { userId } : {}),
      };

      payment.pDiscount = Math.round((payment.pDiscount + couponDiscount) * 100) / 100;
      if (payment.pAmount > 0) {
        payment.pAmount = Math.max(
          0,
          Math.round((payment.pAmount - couponDiscount) * 100) / 100
        );
      }
    }

    const estimatedDeliveryRaw = body.estimatedDelivery;
    const estimatedDelivery =
      typeof estimatedDeliveryRaw === "string" ||
      estimatedDeliveryRaw instanceof Date
        ? new Date(estimatedDeliveryRaw)
        : null;

    // ---- Build the order from whitelisted fields only ----
    const orderPayload = {
      parcel: {
        from,
        to,
        sender,
        receiver,
        box: sanitizeBoxes(parcelInput.box),
        weight,
        packagingType: toText(parcelInput.packagingType, 100),
        boxCount: toWholeNumber(parcelInput.boxCount, 10_000),
        dimensions: {
          length: toAmount(dimensionsInput.length),
          width: toAmount(dimensionsInput.width),
          height: toAmount(dimensionsInput.height),
        },
        serviceType: toText(parcelInput.serviceType, 100),
        priority,
        orderType,
        item: items,
        customerNote: toText(parcelInput.customerNote, 2_000),
        insurance: {
          enabled: insuranceInput.enabled === true,
          declaredValue: toAmount(insuranceInput.declaredValue),
          // The client never determines the insurance charge.
          charge: 0,
        },
        couponCode,
        couponDiscount,
      },
      payment,
      handover_by: { company: "", tracking: "", payment: 0 },
      orderDate: new Date(),
      status: "pending",
    };

    let order;
    try {
      order = await Order.create(orderPayload);
    } catch (error) {
      // The order failed after the coupon was consumed: give it back.
      if (couponUsage) {
        await Coupon.updateOne(
          { _id: couponUsage.couponId },
          {
            $inc: { usedCount: -1 },
            ...(couponUsage.userId
              ? { $pull: { usedBy: couponUsage.userId } }
              : {}),
          }
        ).catch((rollbackError) => {
          console.error("Failed to roll back coupon usage:", rollbackError);
        });
      }
      throw error;
    }

    // Tracking is created after the order; a tracking failure must not turn a
    // successfully stored order into a 500 response.
    try {
      const track = new Track({
        order: order._id,
        currentStatus: "created",
        estimatedDelivery:
          estimatedDelivery && !Number.isNaN(estimatedDelivery.getTime())
            ? estimatedDelivery
            : undefined,
        history: [
          {
            status: "created",
            description: "Order has been placed and is being processed",
            location: {
              city: sender.address.city,
              country: toText(senderInput.address && (senderInput.address as Record<string, unknown>).country, 100),
            },
            updatedBy: user?.id || null,
            timestamp: new Date(),
          },
        ],
      });

      await track.save();
    } catch (trackError) {
      console.error(
        `Failed to create tracking record for order ${order.trackId}:`,
        trackError
      );
    }

    // Send order creation notifications (only if user is authenticated)
    if (user) {
      try {
        await notificationService.sendNotification({
          userId: user.id,
          title: "Order Created Successfully",
          message: `Your order ${order.trackId} has been created and will be processed soon.`,
          type: "success",
          category: "order",
          priority: "normal",
          channels: ["inapp", "email"],
          actionUrl: `/dashboard/orders`,
          actionText: "View Order",
          data: {
            orderId: order._id,
            trackId: order.trackId,
            from,
            to,
          },
        });
      } catch (notificationError) {
        console.error("Failed to send order notification:", notificationError);
        // Don't fail order creation if notification fails
      }
    }

    return successResponse({
      status: 201,
      message: "Order created successfully",
      data: {
        ...order.toObject(),
        instructions: user
          ? "You can track this order in your dashboard"
          : "Please save your tracking ID to track this order later",
        trackingUrl: `/ship-and-track/track-shipment?trackId=${order.trackId}`,
      },
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create order";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});
