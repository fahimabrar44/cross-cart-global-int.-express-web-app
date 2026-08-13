import { NextRequest } from "next/server";
import connectDB from "@/config/db";
import { Branch } from "@/server/models/Branch.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { createModeratorHandler } from "@/server/common/apiWrapper";

type GetQuery = {
  city?: string;
  type?: string;
  isActive?: string;
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
    if (q.city) query.city = q.city;
    if (q.type) query.type = q.type;
    if (q.isActive !== undefined) query.isActive = q.isActive === "true";
    if (q.search) {
      const s = q.search.trim();
      query.$or = [
        { name: { $regex: s, $options: "i" } },
        { code: { $regex: s, $options: "i" } },
        { city: { $regex: s, $options: "i" } },
      ];
    }

    const total = await Branch.countDocuments(query);
    const branches = await Branch.find(query)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort({ city: 1, name: 1 } as any)
      .skip(skip)
      .limit(limit)
      .lean();

    return successResponse({
      status: 200,
      message: "Branches fetched successfully",
      data: branches,
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch branches";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}

export const POST = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.name) return errorResponse({ status: 400, message: "name is required", req });
    if (!body.code) return errorResponse({ status: 400, message: "code is required", req });
    if (!body.address) return errorResponse({ status: 400, message: "address is required", req });
    if (!body.city) return errorResponse({ status: 400, message: "city is required", req });
    if (!body.phone) return errorResponse({ status: 400, message: "phone is required", req });

    const existing = await Branch.findOne({ code: body.code });
    if (existing) return errorResponse({ status: 409, message: "Branch code already exists", req });

    const branch = new Branch({
      name: body.name,
      code: body.code,
      type: body.type || "branch",
      address: body.address,
      city: body.city,
      phone: body.phone,
      manager: body.manager || "",
      managerPhone: body.managerPhone || "",
      openingHours: body.openingHours || "9:00 AM - 6:00 PM",
      isActive: body.isActive ?? true,
      coverage: Array.isArray(body.coverage) ? body.coverage : [],
    });

    await branch.save();

    return successResponse({ status: 201, message: "Branch created successfully", data: branch, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create branch";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});