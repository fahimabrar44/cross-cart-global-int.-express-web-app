import { NextRequest } from "next/server";
import connectDB from "@/config/db";
import { FAQ } from "@/server/models/FAQ.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { createModeratorHandler } from "@/server/common/apiWrapper";

type GetQuery = {
  category?: string;
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
    const limit = Math.max(1, Math.min(200, parseInt(q.limit || "100", 10)));
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (q.isActive !== undefined) query.isActive = q.isActive === "true";
    if (q.category) query.category = q.category;
    if (q.search) {
      const s = q.search.trim();
      query.$or = [
        { question: { $regex: s, $options: "i" } },
        { answer: { $regex: s, $options: "i" } },
      ];
    }

    const total = await FAQ.countDocuments(query);
    const faqs = await FAQ.find(query)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort({ category: 1, order: 1 } as any)
      .skip(skip)
      .limit(limit)
      .lean();

    return successResponse({
      status: 200,
      message: "FAQs fetched successfully",
      data: faqs,
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch FAQs";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}

export const POST = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.question) return errorResponse({ status: 400, message: "question is required", req });
    if (!body.answer) return errorResponse({ status: 400, message: "answer is required", req });

    const faq = new FAQ({
      question: body.question,
      answer: body.answer,
      category: body.category || "General",
      order: Number(body.order) || 0,
      isActive: body.isActive ?? true,
    });

    await faq.save();

    return successResponse({ status: 201, message: "FAQ created successfully", data: faq, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create FAQ";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});