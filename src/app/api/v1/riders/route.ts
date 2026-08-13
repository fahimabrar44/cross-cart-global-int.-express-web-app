import { NextRequest } from "next/server";
import connectDB from "@/config/db";
import { Rider } from "@/server/models/Rider.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { createModeratorHandler } from "@/server/common/apiWrapper";

type GetQuery = {
  status?: string;
  branch?: string;
  search?: string;
  page?: string;
  limit?: string;
};

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const q: GetQuery = Object.fromEntries(url.searchParams.entries());

    const page = Math.max(1, parseInt(q.page || "1", 10));
    const limit = Math.max(1, Math.min(200, parseInt(q.limit || "50", 10)));
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (q.status) query.status = q.status;
    if (q.branch) query.branch = q.branch;
    if (q.search) {
      const s = q.search.trim();
      query.$or = [
        { name: { $regex: s, $options: "i" } },
        { phone: { $regex: s, $options: "i" } },
      ];
    }

    const total = await Rider.countDocuments(query);
    const riders = await Rider.find(query)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort({ createdAt: -1 } as any)
      .skip(skip)
      .limit(limit)
      .populate("branch")
      .lean();

    return successResponse({
      status: 200,
      message: "Riders fetched successfully",
      data: riders,
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch riders";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}

export const POST = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.name) return errorResponse({ status: 400, message: "name is required", req });
    if (!body.phone) return errorResponse({ status: 400, message: "phone is required", req });

    const existing = await Rider.findOne({ phone: body.phone });
    if (existing) return errorResponse({ status: 409, message: "A rider with this phone already exists", req });

    const rider = new Rider({
      name: body.name,
      phone: body.phone,
      email: body.email || "",
      nidNumber: body.nidNumber || "",
      vehicleType: body.vehicleType || "bike",
      vehiclePlate: body.vehiclePlate || "",
      status: body.status || "available",
      branch: body.branch || null,
      zones: Array.isArray(body.zones) ? body.zones : [],
      userId: body.userId || null,
      joiningDate: body.joiningDate ? new Date(body.joiningDate) : new Date(),
    });

    await rider.save();

    return successResponse({ status: 201, message: "Rider created successfully", data: rider, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create rider";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});