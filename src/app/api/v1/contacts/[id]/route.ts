import connectDB from "@/config/db";
import { createModeratorHandler } from "@/server/common/apiWrapper";
import { successResponse, errorResponse } from "@/server/common/response";
import { Contact } from "@/server/models/Contact.model";
import { Types } from "mongoose";

const extractId = (req: Request): string => {
  const segments = new URL(req.url).pathname.split("/").filter(Boolean);
  return segments[segments.length - 1];
};

// GET: Single contact
export const GET = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();

    const id = extractId(req);

    if (!Types.ObjectId.isValid(id)) {
      return errorResponse({ status: 400, message: "Invalid contact id", req });
    }

    const contact = await Contact.findById(id)
      .populate("replies.responder", "name email")
      .lean();
    if (!contact) return errorResponse({ status: 404, message: "Contact not found", req });

    return successResponse({ status: 200, message: "Contact fetched successfully", data: contact, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch contact";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

// PATCH: Update status / isRead / add reply
export const PATCH = createModeratorHandler(async ({ req, user }) => {
  try {
    await connectDB();

    const id = extractId(req);

    if (!Types.ObjectId.isValid(id)) {
      return errorResponse({ status: 400, message: "Invalid contact id", req });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = await req.json() as any;

    const update: Record<string, unknown> = {};

    if (typeof body.isRead === "boolean") update.isRead = body.isRead;
    if (typeof body.status === "string") update.status = body.status;
    if (typeof body.priority === "string") update.priority = body.priority;
    if (typeof body.category === "string") update.category = body.category;

    if (body.reply && typeof body.reply === "string" && body.reply.trim() && user?.id) {
      update.$push = {
        replies: {
          message: body.reply.trim(),
          responder: new Types.ObjectId(user.id),
          createdAt: new Date(),
        },
      };
      update.status = "in-progress";
    }

    const contact = await Contact.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!contact) return errorResponse({ status: 404, message: "Contact not found", req });

    return successResponse({ status: 200, message: "Contact updated successfully", data: contact, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update contact";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

// DELETE: Remove contact
export const DELETE = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();

    const id = extractId(req);

    if (!Types.ObjectId.isValid(id)) {
      return errorResponse({ status: 400, message: "Invalid contact id", req });
    }

    const deleted = await Contact.findByIdAndDelete(id);
    if (!deleted) return errorResponse({ status: 404, message: "Contact not found", req });

    return successResponse({ status: 200, message: "Contact deleted successfully", req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete contact";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});
