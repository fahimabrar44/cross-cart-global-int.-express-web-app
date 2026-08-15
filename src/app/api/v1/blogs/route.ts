import connectDB from "@/config/db";
import { Blog, dropLegacyBlogTextIndex } from "@/server/models/Blog.model";
import { User } from "@/server/models/User.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { NextRequest } from "next/server";
import { createModeratorHandler } from "@/server/common/apiWrapper";

// =========================
// POST - Create Blog
// =========================
export const POST = createModeratorHandler(async ({ req, user }) => {
  try {
    await connectDB();
    // Remove any legacy text index that includes the array field `tags`
    await dropLegacyBlogTextIndex();

    const body = await req.json();

    // author is always the authenticated admin/moderator, never client-supplied
    const blog = new Blog({
      ...body,
      author: user?.id,
    });
    await blog.save();

    return successResponse({
      status: 201,
      message: "Blog created successfully",
      data: blog,
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create blog";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

// =========================
// GET - Fetch All Blogs
// =========================
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    // Drop the legacy text index (if present) BEFORE the first query triggers
    // mongoose auto-indexing, otherwise index creation conflicts and fails.
    await dropLegacyBlogTextIndex();

    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");
    const isPublished = url.searchParams.get("isPublished");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (isPublished !== null) query.isPublished = isPublished === "true";

    if (search) {
      query.$or = [
        { title: new RegExp(search, "i") },
        { content: new RegExp(search, "i") },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const total = await Blog.countDocuments(query);

    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Manually populate authors as plain objects (avoids mongoose Document
    // toJSON serialization which crashes on the User model's transform)
    const authorIds = Array.from(
      new Set(
        (blogs as Array<{ author?: unknown }>)
          .map((b) => b.author)
          .filter(Boolean)
          .map((id) => id?.toString())
      )
    );
    const userMap = new Map<string, { name?: string; email?: string }>();
    if (authorIds.length > 0) {
      const users = (await User.find({ _id: { $in: authorIds } })
        .select("name email")
        .lean()) as Array<{ _id: unknown; name?: string; email?: string }>;
      for (const u of users) {
        userMap.set(String(u._id), { name: u.name, email: u.email });
      }
    }
    for (const b of blogs as Array<{ author?: unknown }>) {
      const idStr = b.author?.toString();
      b.author = idStr ? userMap.get(idStr) || null : null;
    }

    return successResponse({
      status: 200,
      message: "Blogs fetched successfully",
      data: blogs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      req,
    });
  } catch (error: unknown) {
    console.error("GET /api/v1/blogs error:", error);
    const msg = error instanceof Error ? error.message : "Failed to fetch blogs";
    const detail =
      error instanceof Error && error.stack
        ? { message: msg, stack: error.stack }
        : error;
    return errorResponse({ status: 500, message: msg, error: detail, req });
  }
}
