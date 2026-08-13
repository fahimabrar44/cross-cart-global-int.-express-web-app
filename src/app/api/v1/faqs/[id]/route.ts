import connectDB from "@/config/db";
import { FAQ } from "@/server/models/FAQ.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { createModeratorHandler } from "@/server/common/apiWrapper";

export const PUT = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();
    const url = new URL(req.url);
    const id = url.pathname.split("/").filter(Boolean).pop();

    const body = await req.json();

    const faq = await FAQ.findById(id);
    if (!faq) return errorResponse({ status: 404, message: "FAQ not found", req });

    const allowedFields = ["question", "answer", "category", "order", "isActive"];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: any = {};
    for (const field of allowedFields) {
      if (field in body) update[field] = body[field];
    }

    const updated = await FAQ.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!updated) return errorResponse({ status: 404, message: "FAQ not found", req });

    return successResponse({ status: 200, message: "FAQ updated successfully", data: updated, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update FAQ";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

export const DELETE = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();
    const url = new URL(req.url);
    const id = url.pathname.split("/").filter(Boolean).pop();

    const deleted = await FAQ.findByIdAndDelete(id);
    if (!deleted) return errorResponse({ status: 404, message: "FAQ not found", req });

    return successResponse({ status: 200, message: "FAQ deleted successfully", req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete FAQ";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});