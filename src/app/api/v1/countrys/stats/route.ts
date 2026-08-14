import connectDB from "@/config/db";
import { Country } from "@/server/models/Country.model";
import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/server/common/response";

/**
 * GET /api/v1/countrys/stats
 * Aggregated country statistics.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const [total, active, inactive, zoneGroups] = await Promise.all([
      Country.countDocuments(),
      Country.countDocuments({ isActive: true }),
      Country.countDocuments({ isActive: false }),
      Country.aggregate([
        { $group: { _id: "$zone", count: { $sum: 1 } } },
      ]),
    ]);

    const regions: { [key: string]: number } = {};
    for (const group of zoneGroups) {
      const key = group._id || "Unknown";
      regions[key] = (regions[key] || 0) + group.count;
    }

    return successResponse({
      status: 200,
      message: "Country statistics fetched",
      data: {
        total,
        active,
        inactive,
        regions,
        currencies: {},
      },
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch country statistics";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}