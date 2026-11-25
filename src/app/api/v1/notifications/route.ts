import connectDB from "@/config/db";
import { Notification } from "@/server/models/Notification.model";
import { User } from "@/server/models/User.model";
import { createAuthHandler } from "@/server/common/apiWrapper";
import { successResponse, errorResponse } from "@/server/common/response";
import { Types } from "mongoose";

type GetQuery = {
  user?: string;
  read?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
  search?: string;
  type?: string;
  category?: string;
};

export const GET = createAuthHandler(async ({ req, user }) => {
  try {
    await connectDB();

    if (!user) {
      return errorResponse({ status: 401, message: "Unauthorized", req });
    }

    const url = new URL(req.url);
    const q: GetQuery = Object.fromEntries(url.searchParams.entries());

    const page = Math.max(1, parseInt(q.page || "1"));
    const limit = Math.max(1, Math.min(200, parseInt(q.limit || "20")));
    const skip = (page - 1) * limit;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};

    const isStaff = user?.role === "admin" || user?.role === "moderator";

    // Role-based filtering: regular users only ever see their own
    // notifications. Admin/moderator see every notification in the system and
    // may optionally narrow the list to a single recipient.
    if (!isStaff) {
      query.userId = new Types.ObjectId(user.id);
    } else if (q.user && Types.ObjectId.isValid(q.user)) {
      query.userId = new Types.ObjectId(q.user);
    }

    // Additional filters
    if (q.read !== undefined) query.isRead = q.read === "true";
    if (q.type) query.type = q.type;
    if (q.category) query.category = q.category;

    if (q.search) {
      const s = q.search.trim();
      query.$or = [
        { title: { $regex: s, $options: "i" } },
        { message: { $regex: s, $options: "i" } },
      ];
    }

    const allowedSortFields = new Set(["createdAt", "updatedAt", "title", "isRead"]);
    const sortBy = allowedSortFields.has(q.sortBy || "") ? (q.sortBy as string) : "createdAt";
    const sortOrder = (q.sortOrder || "desc").toLowerCase() === "asc" ? 1 : -1;

    // Count unread with the same role scope, ignoring the read/type filters so
    // the header badge always reflects the viewer's real unread total.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unreadQuery: any = { ...query };
    delete unreadQuery.isRead;

    const [total, unread, notifications] = await Promise.all([
      Notification.countDocuments(query),
      Notification.countDocuments({ ...unreadQuery, isRead: false }),
      Notification.find(query)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .sort({ [sortBy]: sortOrder } as any)
        .skip(skip)
        .limit(limit)
        .populate("userId", "name email phone role")
        .lean(),
    ]);

    return successResponse({
      status: 200,
      message: "Notifications fetched successfully",
      data: notifications,
      meta: { page, limit, total, unread, totalPages: Math.ceil(total / limit) },
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch notifications";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

export const POST = createAuthHandler(async ({ req, user }) => {
  try {
    await connectDB();

    const body = await req.json();

    // Validate required fields
    if (!body.title) {
      return errorResponse({ 
        status: 400, 
        message: "Title is required", 
        req 
      });
    }
    if (!body.message) {
      return errorResponse({ 
        status: 400, 
        message: "Message is required", 
        req 
      });
    }

    const content = {
      title: body.title,
      message: body.message,
      type: body.type || "info",
      category: body.category || "system",
      channels: body.channels || ["inapp"],
    };

    // Broadcast to every active normal user (admin-only).
    const isBroadcast =
      body.broadcast === true ||
      body.audience === "all" ||
      body.userId === "all";

    if (isBroadcast) {
      if (user?.role !== "admin") {
        return errorResponse({
          status: 403,
          message: "Only admins can broadcast notifications",
          req,
        });
      }

      const recipients = await User.find({ role: "user", isActive: true })
        .select("_id")
        .lean();

      if (recipients.length === 0) {
        return successResponse({
          status: 200,
          message: "No active users to notify",
          data: { count: 0 },
          req,
        });
      }

      const created = await Notification.insertMany(
        recipients.map((recipient) => ({
          ...content,
          userId: recipient._id,
          isRead: false,
        }))
      );

      return successResponse({
        status: 201,
        message: `Notification sent to ${created.length} user${
          created.length === 1 ? "" : "s"
        }`,
        data: { count: created.length },
        req,
      });
    }

    // Determine target user
    let targetUserId = user?.id;
    if (body.userId) {
      // Only admin can create notifications for other users
      if (user?.role !== "admin") {
        return errorResponse({
          status: 403,
          message: "Only admins can create notifications for other users",
          req,
        });
      }
      targetUserId = body.userId;
    }

    if (!targetUserId) {
      return errorResponse({
        status: 400,
        message: "Target user is required",
        req,
      });
    }

    // Validate target user exists
    if (!Types.ObjectId.isValid(targetUserId)) {
      return errorResponse({
        status: 400,
        message: "Invalid user ID",
        req,
      });
    }

    const targetExists = await User.exists({ _id: targetUserId });
    if (!targetExists) {
      return errorResponse({
        status: 404,
        message: "Target user not found",
        req,
      });
    }

    const notification = new Notification({
      userId: targetUserId,
      ...content,
      isRead: body.isRead || false,
    });

    await notification.save();

    // Populate user data for response
    await notification.populate("userId", "name email phone role");

    return successResponse({ 
      status: 201, 
      message: "Notification created successfully", 
      data: notification, 
      req 
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create notification";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

// Mark notification as read
export const PATCH = createAuthHandler(async ({ req, user }) => {
  try {
    await connectDB();

    const body = await req.json();
    const { notificationIds, isRead = true } = body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return errorResponse({
        status: 400,
        message: "Notification IDs array is required",
        req,
      });
    }

    // Validate all notification IDs
    const validIds = notificationIds.filter(id => Types.ObjectId.isValid(id));
    if (validIds.length !== notificationIds.length) {
      return errorResponse({
        status: 400,
        message: "Invalid notification ID format",
        req,
      });
    }

    // Build query - users can only update their own notifications
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { 
      _id: { $in: validIds.map(id => new Types.ObjectId(id)) }
    };

    if (user?.role === "user") {
      query.userId = new Types.ObjectId(user.id);
    }
    // Admin can update any notification (no additional filter)

    const result = await Notification.updateMany(
      query,
      { $set: { isRead: Boolean(isRead), updatedAt: new Date() } }
    );

    return successResponse({
      status: 200,
      message: `${result.modifiedCount} notifications updated successfully`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      },
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update notifications";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});