import { NextRequest } from "next/server";
import connectDB from "@/config/db";
import { FAQ } from "@/server/models/FAQ.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { createModeratorHandler } from "@/server/common/apiWrapper";
import { AuthMiddleware } from "@/middleware/auth";
import { withTtlCache, invalidateReferenceData } from "@/server/services/referenceCache";

const REF_TTL_MS = 5 * 60 * 1000;

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

    // Admins/moderators (JWT or API key) manage this data and must see fresh
    // results, so skip the cache for them. The in-memory cache isn't shared
    // across serverless instances, so relying on it for admins would otherwise
    // show stale data after an edit. Public/API-key consumers stay cached.
    let isInternal = false;
    const apiKey = req.headers.get("X-API-Key") || req.headers.get("x-api-key");
    if (apiKey) {
      const apiAuth = await AuthMiddleware.validateApiKey(req);
      if (!apiAuth.success && apiAuth.response) return apiAuth.response;
      isInternal = ["admin", "moderator"].includes(apiAuth.user?.role || "");
    } else {
      const authResult = await AuthMiddleware.authenticate(req);
      isInternal = ["admin", "moderator"].includes(authResult.user?.role || "");
    }

    const url = new URL(req.url);
    const q: GetQuery = Object.fromEntries(url.searchParams.entries());

    const page = Math.max(1, parseInt(q.page || "1", 10) || 1);
    const limit = Math.max(1, Math.min(200, parseInt(q.limit || "100", 10) || 100));
    const skip = (page - 1) * limit;

    const cacheKey = `faqs:list:${q.category ?? ""}|${q.isActive ?? ""}|${q.search ?? ""}|${page}|${limit}`;

    const loadFaqs = async () => {
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

      return { total, faqs };
    };

    const result = isInternal
      ? await loadFaqs()
      : await withTtlCache<{ total: number; faqs: unknown[] }>(
          cacheKey,
          REF_TTL_MS,
          loadFaqs
        );

    return successResponse({
      status: 200,
      message: "FAQs fetched successfully",
      data: result.faqs,
      meta: { page, limit, total: result.total, totalPages: Math.max(1, Math.ceil(result.total / limit)) },
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
    invalidateReferenceData("faqs");

    return successResponse({ status: 201, message: "FAQ created successfully", data: faq, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create FAQ";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});