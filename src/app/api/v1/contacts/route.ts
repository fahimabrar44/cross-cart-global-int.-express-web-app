import connectDB from "@/config/db";
import { createModeratorHandler, createPublicHandler } from "@/server/common/apiWrapper";
import { successResponse, errorResponse } from "@/server/common/response";
import { Contact } from "@/server/models/Contact.model";

type GetQuery = {
  status?: string;
  category?: string;
  priority?: string;
  isRead?: string;
  page?: string;
  limit?: string;
  search?: string;
};

// GET: List contacts (moderator/admin only)
export const GET = createModeratorHandler(async ({ req, user }) => {
  try {
    await connectDB();

    const url = new URL(req.url);
    const q: GetQuery = Object.fromEntries(url.searchParams.entries());

    const page = Math.max(1, parseInt(q.page || "1", 10));
    const limit = Math.max(1, Math.min(200, parseInt(q.limit || "20", 10)));
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};

    if (q.status) query.status = q.status;
    if (q.category) query.category = q.category;
    if (q.priority) query.priority = q.priority;
    if (q.isRead) query.isRead = q.isRead === "true";

    if (q.search) {
      const regex = new RegExp(q.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ name: regex }, { email: regex }, { message: regex }];
    }

    const total = await Contact.countDocuments(query);
    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("replies.responder", "name email")
      .lean();

    return successResponse({
      status: 200,
      message: "Contacts fetched successfully",
      data: contacts,
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch contacts";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

// POST: Public contact form submission
export const POST = createPublicHandler(async ({ req }) => {
  try {
    await connectDB();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = await req.json() as any;

    if (!body.name || !body.email || !body.message) {
      return errorResponse({
        status: 400,
        message: "name, email and message are required",
        req,
      });
    }

    const contact = new Contact({
      name: body.name,
      email: body.email,
      phone: body.phone || "",
      message: body.message,
      category: body.category || "inquiry",
      priority: body.priority || "normal",
      status: "new",
      isRead: false,
    });

    await contact.save();

    return successResponse({
      status: 201,
      message: "Contact message submitted successfully",
      data: contact,
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to submit contact";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});
