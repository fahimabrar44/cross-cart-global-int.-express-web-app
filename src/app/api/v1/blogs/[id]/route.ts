import connectDB from "@/config/db";
import { errorResponse, successResponse } from "@/server/common/response";
import { Blog } from "@/server/models/Blog.model";
import { verifyAuth } from "@/middleware/auth";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { createModeratorHandler } from "@/server/common/apiWrapper";

const extractId = (req: Request): string => {
  const segments = new URL(req.url).pathname.split("/").filter(Boolean);
  return segments[segments.length - 1];
};

// ==========================
// GET - fetch single blog
// =========================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{  id: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();

    const { id } = await params;

    // Support both Mongo ObjectId and URL-friendly slug lookups
    const blog = mongoose.Types.ObjectId.isValid(id)
      ? await Blog.findById(id)
      : await Blog.findOne({ slug: id });

    if (!blog) {
      return errorResponse({ status: 404, message: "Blog not found", req });
    }

    // Drafts/archived posts are only visible to staff (admin/moderator)
    if (blog.status !== "published") {
      const authResult = await verifyAuth(req);
      const isStaff =
        authResult.success &&
        (authResult.user?.role === "admin" ||
          authResult.user?.role === "moderator");
      if (!isStaff) {
        return errorResponse({ status: 404, message: "Blog not found", req });
      }
    }

    return successResponse({
      status: 200,
      message: "Blog fetched successfully",
      data: blog,
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch blog";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}

// ==========================
// PUT - update blog
// ==========================
export const PUT = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();

    const id = extractId(req);
    const body = await req.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse({ status: 400, message: "Invalid blog ID", req });
    }

    // author and slug are managed server-side
    delete body.author;
    delete body.slug;

    const blog = await Blog.findByIdAndUpdate(id, body, { new: true });

    if (!blog)
      return errorResponse({ status: 404, message: "Blog not found", req });

    return successResponse({
      status: 200,
      message: "Blog updated successfully",
      data: blog,
      req,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to update blog";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

// ==========================
// DELETE - remove blog
// ==========================
export const DELETE = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();

    const id = extractId(req);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse({ status: 400, message: "Invalid blog ID", req });
    }

    const blog = await Blog.findByIdAndDelete(id);

    if (!blog)
      return errorResponse({ status: 404, message: "Blog not found", req });

    return successResponse({
      status: 200,
      message: "Blog deleted successfully",
      data: blog,
      req,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to delete blog";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});
