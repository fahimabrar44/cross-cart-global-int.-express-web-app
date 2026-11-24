/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/config/db";
import { User } from "@/server/models/User.model";
import { Notification } from "@/server/models/Notification.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { verifyAuth } from "@/middleware/auth";
import { escapeRegex } from "@/server/common/regex";
import { Types } from "mongoose";

type NotificationQuery = {
  read?: string;
  isRead?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
  search?: string;
  type?: string;
  category?: string;
};

type NotificationUpdateBody = {
  notificationId?: string;
  notificationIds?: string[];
  read?: boolean;
  isRead?: boolean;
  title?: string;
  message?: string;
};

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Phone numbers are stored in several formats across the app (E.164 with a
 * leading "+", digits only, or the last 10 digits). Try all of them so a
 * request for "+880..." still finds a user saved as "880..." or "018...".
 */
function buildPhoneVariants(phone: string): string[] {
  const variants = new Set<string>();
  if (!phone) return [];

  variants.add(phone);
  const digits = digitsOnly(phone);
  if (digits) {
    variants.add(digits);
    variants.add(`+${digits}`);
    if (digits.length >= 10) variants.add(digits.slice(-10));
  }

  return Array.from(variants);
}

function phonesMatch(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;

  const da = digitsOnly(a);
  const db = digitsOnly(b);
  if (!da || !db) return false;
  if (da === db) return true;

  return da.length >= 10 && db.length >= 10 && da.slice(-10) === db.slice(-10);
}

async function findUserByPhone(phone: string) {
  const variants = buildPhoneVariants(phone);
  if (variants.length === 0) return null;

  return User.findOne({ phone: { $in: variants } })
    .select("_id phone")
    .lean();
}

function isStaff(role?: string): boolean {
  return role === "admin" || role === "moderator";
}

/**
 * Authenticate, check that the caller may access this phone number, and
 * resolve the target user. Returning a discriminated union keeps the route
 * handlers readable without repeating the auth logic in every method.
 */
async function resolveTargetUser(
  req: NextRequest,
  phone: string
): Promise<{ error: NextResponse } | { userId: Types.ObjectId }> {
  const authResult = await verifyAuth(req);
  if (!authResult.success) {
    return {
      error: errorResponse({ status: 401, message: "Unauthorized", req }),
    };
  }

  if (
    !isStaff(authResult.user?.role) &&
    !phonesMatch(authResult.user?.phone, phone)
  ) {
    return {
      error: errorResponse({
        status: 403,
        message: "Access denied - You can only access your own account data",
        req,
      }),
    };
  }

  await connectDB();

  const user = await findUserByPhone(phone);
  if (!user) {
    return {
      error: errorResponse({ status: 404, message: "User not found", req }),
    };
  }

  return { userId: new Types.ObjectId(String(user._id)) };
}

function parsePagination(query: NotificationQuery) {
  const parsedPage = parseInt(query.page || "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const parsedLimit = parseInt(query.limit || "20", 10);
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(200, Math.max(1, parsedLimit))
    : 20;

  return { page, limit, skip: (page - 1) * limit };
}

function collectNotificationIds(body: NotificationUpdateBody): string[] {
  const rawIds = [
    ...(Array.isArray(body.notificationIds) ? body.notificationIds : []),
    ...(body.notificationId ? [body.notificationId] : []),
  ];

  return Array.from(
    new Set(
      rawIds.filter(
        (id): id is string =>
          typeof id === "string" && Types.ObjectId.isValid(id)
      )
    )
  );
}

// GET - fetch notifications for a user
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
): Promise<NextResponse> {
  try {
    const { phone } = await params;
    if (!phone) {
      return errorResponse({
        status: 400,
        message: "Phone parameter is required",
        req,
      });
    }

    const target = await resolveTargetUser(req, phone);
    if ("error" in target) return target.error;

    const url = new URL(req.url);
    const query: NotificationQuery = Object.fromEntries(
      url.searchParams.entries()
    );
    const { page, limit, skip } = parsePagination(query);

    const filter: Record<string, unknown> = { userId: target.userId };

    const readParam = query.isRead ?? query.read;
    if (readParam === "true" || readParam === "false") {
      filter.isRead = readParam === "true";
    }
    if (query.type) filter.type = query.type;
    if (query.category) filter.category = query.category;

    if (query.search?.trim()) {
      const rx = new RegExp(escapeRegex(query.search.trim()), "i");
      filter.$or = [{ title: rx }, { message: rx }];
    }

    const allowedSortFields = new Set([
      "createdAt",
      "updatedAt",
      "title",
      "isRead",
    ]);
    const sortBy = allowedSortFields.has(query.sortBy || "")
      ? (query.sortBy as string)
      : "createdAt";
    const sortOrder =
      (query.sortOrder || "desc").toLowerCase() === "asc" ? 1 : -1;

    const [total, unreadTotal, notifications] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.countDocuments({
        userId: target.userId,
        isRead: false,
      }),
      Notification.find(filter)
        .sort({ [sortBy]: sortOrder } as any)
        .skip(skip)
        .limit(limit)
        .populate("userId", "name email phone")
        .lean(),
    ]);

    return successResponse({
      status: 200,
      message: "Notifications fetched",
      data: notifications,
      meta: {
        page,
        limit,
        total,
        unreadTotal,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      req,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to fetch notifications";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}

async function updateNotifications(
  req: NextRequest,
  phone: string
): Promise<NextResponse> {
  const target = await resolveTargetUser(req, phone);
  if ("error" in target) return target.error;

  const body = (await req.json().catch(() => null)) as
    | NotificationUpdateBody
    | null;
  if (!body) {
    return errorResponse({
      status: 400,
      message: "A valid JSON body is required",
      req,
    });
  }

  const ids = collectNotificationIds(body);
  if (ids.length === 0) {
    return errorResponse({
      status: 400,
      message: "A valid notification ID is required",
      req,
    });
  }

  const update: Record<string, unknown> = {};

  // The dashboard sends `isRead`; older clients send `read`.
  const readValue =
    typeof body.isRead === "boolean" ? body.isRead : body.read;
  if (typeof readValue === "boolean") update.isRead = readValue;

  if (typeof body.title === "string" && body.title.trim()) {
    update.title = body.title.trim().slice(0, 200);
  }
  if (typeof body.message === "string" && body.message.trim()) {
    update.message = body.message.trim().slice(0, 2_000);
  }

  if (Object.keys(update).length === 0) {
    return errorResponse({
      status: 400,
      message: "No update fields provided",
      req,
    });
  }

  const result = await Notification.updateMany(
    {
      _id: { $in: ids.map((id) => new Types.ObjectId(id)) },
      userId: target.userId,
    },
    { $set: update }
  );

  return successResponse({
    status: 200,
    message: `${result.modifiedCount} notification(s) updated`,
    data: {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    },
    req,
  });
}

// PUT - mark notification(s) as read/unread or update their content
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
): Promise<NextResponse> {
  try {
    const { phone } = await params;
    if (!phone) {
      return errorResponse({
        status: 400,
        message: "Phone parameter is required",
        req,
      });
    }
    return await updateNotifications(req, phone);
  } catch (error: unknown) {
    const msg =
      error instanceof Error
        ? error.message
        : "Failed to update notification";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}

// PATCH - same behaviour as PUT, kept for clients that send partial updates
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
): Promise<NextResponse> {
  try {
    const { phone } = await params;
    if (!phone) {
      return errorResponse({
        status: 400,
        message: "Phone parameter is required",
        req,
      });
    }
    return await updateNotifications(req, phone);
  } catch (error: unknown) {
    const msg =
      error instanceof Error
        ? error.message
        : "Failed to update notification";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}

// DELETE - remove one or more notifications
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
): Promise<NextResponse> {
  try {
    const { phone } = await params;
    if (!phone) {
      return errorResponse({
        status: 400,
        message: "Phone parameter is required",
        req,
      });
    }

    const target = await resolveTargetUser(req, phone);
    if ("error" in target) return target.error;

    const body = (await req.json().catch(() => null)) as
      | NotificationUpdateBody
      | null;
    if (!body) {
      return errorResponse({
        status: 400,
        message: "A valid JSON body is required",
        req,
      });
    }

    const ids = collectNotificationIds(body);
    if (ids.length === 0) {
      return errorResponse({
        status: 400,
        message: "A valid notification ID is required",
        req,
      });
    }

    const result = await Notification.deleteMany({
      _id: { $in: ids.map((id) => new Types.ObjectId(id)) },
      userId: target.userId,
    });

    return successResponse({
      status: 200,
      message: `${result.deletedCount} notification(s) deleted`,
      data: { deletedCount: result.deletedCount },
      req,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error
        ? error.message
        : "Failed to delete notification";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}
