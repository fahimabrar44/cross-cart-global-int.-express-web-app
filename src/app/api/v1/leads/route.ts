import connectDB from "@/config/db";
import { Lead } from "@/server/models/Lead.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { sendMetaCapiEvent } from "@/server/lib/metaCapi";
import {
  createPublicHandler,
  createModeratorHandler,
} from "@/server/common/apiWrapper";

export const POST = createPublicHandler(async ({ req }) => {
  try {
    await connectDB();
    const body = await req.json();
    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim();
    const serviceType = String(body.serviceType || "").trim();

    if (!name) {
      return errorResponse({
        status: 400,
        message: "Name is required",
        req,
      });
    }
    if (!phone) {
      return errorResponse({
        status: 400,
        message: "Phone is required",
        req,
      });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorResponse({
        status: 400,
        message: "A valid email is required",
        req,
      });
    }
    if (!serviceType) {
      return errorResponse({
        status: 400,
        message: "Service type is required",
        req,
      });
    }

    const lead = new Lead({
      name,
      phone,
      email,
      serviceType,
      submittedAt: new Date(),
    });
    await lead.save();

    void sendMetaCapiEvent(
      "Lead",
      { email, phone },
      { req, customData: { serviceType } }
    );

    return successResponse({
      status: 201,
      message: "Lead captured successfully",
      data: lead,
      req,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to capture lead";
    return errorResponse({
      status: 500,
      message,
      error,
      req,
    });
  }
});

export const GET = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();
    const url = new URL(req.url);
    const q = Object.fromEntries(url.searchParams.entries());
    const page = Math.max(1, parseInt(q.page || "1", 10));
    const limit = Math.max(1, Math.min(200, parseInt(q.limit || "50", 10)));
    const skip = (page - 1) * limit;

    const total = await Lead.countDocuments();
    const leads = await Lead.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return successResponse({
      status: 200,
      message: "Leads fetched successfully",
      data: leads,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      req,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch leads";
    return errorResponse({
      status: 500,
      message,
      error,
      req,
    });
  }
});
