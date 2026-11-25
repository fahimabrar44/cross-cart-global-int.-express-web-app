import connectDB from "@/config/db";
import { errorResponse, successResponse } from "@/server/common/response";
import { createModeratorHandler } from "@/server/common/apiWrapper";
import { Address } from "@/server/models/Address.model";
import { User } from "@/server/models/User.model";
import { Types } from "mongoose";

// GET all addresses (with optional query userId / phone)
export const GET = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();

    const url = new URL(req.url);
    const q = Object.fromEntries(url.searchParams.entries());
    const page = Math.max(1, parseInt(q.page || "1", 10));
    const limit = Math.max(1, Math.min(200, parseInt(q.limit || "20", 10)));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (q.userId && Types.ObjectId.isValid(q.userId)) filter.user = q.userId;
    if (q.country) filter["country"] = q.country;
    if (q.city) filter.city = { $regex: q.city, $options: "i" };
    if (q.state) filter.state = { $regex: q.state, $options: "i" };
    if (q.search && q.search.trim()) {
      const s = q.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(s, "i");
      filter.$or = [
        { name: regex },
        { label: regex },
        { addressLine: regex },
        { area: regex },
        { subCity: regex },
        { city: regex },
        { state: regex },
        { zipCode: regex },
        { phone: regex },
      ];
    }

    const total = await Address.countDocuments(filter);
    const addresses = await Address.find(filter)
      .populate("user")
      .populate("country")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return successResponse({
      status: 200,
      message: "Addresses fetched",
      data: addresses,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      req,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch addresses";
    return errorResponse({ status: 500, message: msg, error: err, req });
  }
});

// POST create new address for a user
export const POST = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();

    const body = await req.json();
    if (!body.userId) {
      return errorResponse({ status: 400, message: "userId is required", req });
    }

    if (!Types.ObjectId.isValid(body.userId)) {
      return errorResponse({ status: 400, message: "Invalid userId", req });
    }

    const user = await User.findById(body.userId);
    if (!user) return errorResponse({ status: 404, message: "User not found", req });

    const address = new Address({
      user: user._id,
      name: body.name,
      label: body.label || "Home",
      addressLine: body.addressLine,
      city: body.city,
      state: body.state || "",
      zipCode: body.zipCode || "",
      country: new Types.ObjectId(body.country),
      phone: body.phone || "",
      isDefault: body.isDefault || false,
      location: body.location
        ? { type: "Point", coordinates: body.location.coordinates ? body.location.coordinates : [0, 0] }
        : undefined,
    });

    await address.save();

    return successResponse({ status: 200, message: "Address created", data: address, req });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create address";
    return errorResponse({ status: 500, message: msg, error: err, req });
  }
});
