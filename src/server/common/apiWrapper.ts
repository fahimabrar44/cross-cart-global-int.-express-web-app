import { AuthenticatedUser, authenticateToken } from "@/middleware/apiAuth";
import { ApiNotificationMiddleware } from "@/middleware/apiNotification";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { errorResponse } from "./response";
import { getClientIp } from "./requestIp";
import { consumeRateLimit } from "@/server/services/rateLimitService";

interface ApiHandlerOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireModerator?: boolean; // Admin or Moderator
  requireVerified?: boolean;
  notifyActivity?: boolean; // Send notifications and emails
  rateLimit?: {
    max: number;
    windowMs: number;
  };
}

interface ApiContext {
  req: NextRequest;
  user?: AuthenticatedUser;
  requestId: string;
  startTime: number;
}

type ApiHandler = (context: ApiContext) => Promise<NextResponse>;

export function createApiHandler(
  handler: ApiHandler,
  options: ApiHandlerOptions = {}
) {
  return async function (req: NextRequest): Promise<NextResponse> {
    const startTime = Date.now();
    const requestId = uuidv4();
    const endpoint = new URL(req.url).pathname;

    let user: AuthenticatedUser | undefined;
    let response: NextResponse;
    let success = false;
    let statusCode = 500;
    let errorMessage: string | undefined;

    try {
      // Rate limiting (Redis-backed when configured, in-memory otherwise)
      if (options.rateLimit) {
        const rateLimitKey = `${getClientIp(req)}:${endpoint}`;
        const result = await consumeRateLimit(
          rateLimitKey,
          options.rateLimit.max,
          options.rateLimit.windowMs
        );

        if (!result.allowed) {
          const response = errorResponse({
            status: 429,
            message: "Too many requests. Please try again later.",
            req,
          });
          response.headers.set(
            "Retry-After",
            String(Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000)))
          );
          return response;
        }
      }

      // Authentication
      if (
        options.requireAuth ||
        options.requireAdmin ||
        options.requireModerator
      ) {
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error  
        user = await authenticateToken(req);

        if (!user) {
          return errorResponse({
            status: 401,
            message: "Authentication required",
            req,
          });
        }

        // Check admin access
        if (options.requireAdmin && user.role !== "admin") {
          return errorResponse({
            status: 403,
            message: "Admin access required",
            req,
          });
        }

        // Check moderator or admin access
        if (
          options.requireModerator &&
          user.role !== "admin" &&
          user.role !== "moderator"
        ) {
          return errorResponse({
            status: 403,
            message: "Admin or moderator access required",
            req,
          });
        }

        // Check email verification
        if (options.requireVerified && !user.isVerified) {
          return errorResponse({
            status: 403,
            message: "Email verification required",
            req,
          });
        }
      }

      // Execute the handler
      const context: ApiContext = {
        req,
        user,
        requestId,
        startTime,
      };

      response = await handler(context);

      success = response.status >= 200 && response.status < 300;
      statusCode = response.status;
    } catch (error) {
      // Keep full details in the server log, never in the response body.
      console.error("API Handler Error:", error);
      errorMessage =
        error instanceof Error ? error.message : "Internal server error";

      response = errorResponse({
        status: 500,
        message:
          process.env.NODE_ENV === "production"
            ? "Internal server error"
            : errorMessage,
        req,
      });

      statusCode = 500;
      success = false;
    }

    // Send notifications if enabled
    if (options.notifyActivity !== false) {
      // Default to true unless explicitly disabled
      const responseTime = Date.now() - startTime;

      ApiNotificationMiddleware.notifyApiActivity(req, user, {
        success,
        status: statusCode,
        message: errorMessage || "Request processed",
        endpoint,
        responseTime,
        error: errorMessage,
        requestId,
      }).catch((err) => {
        console.error("Notification Error:", err);
      });
    }

    return response;
  };
}

// Pre-configured handler creators
export const createAuthHandler = (handler: ApiHandler) =>
  createApiHandler(handler, { requireAuth: true });

export const createAdminHandler = (handler: ApiHandler) =>
  createApiHandler(handler, { requireAuth: true, requireAdmin: true });

export const createModeratorHandler = (handler: ApiHandler) =>
  createApiHandler(handler, { requireAuth: true, requireModerator: true });

export const createPublicHandler = (handler: ApiHandler) =>
  createApiHandler(handler, { requireAuth: false, notifyActivity: true });

export const createProtectedHandler = (handler: ApiHandler) =>
  createApiHandler(handler, {
    requireAuth: true,
    requireVerified: true,
    notifyActivity: true,
  });

// Rate-limited handlers
export const createRateLimitedHandler = (
  handler: ApiHandler,
  rateLimit: { max: number; windowMs: number }
) => createApiHandler(handler, { rateLimit, notifyActivity: true });

export const createAuthRateLimitedHandler = (
  handler: ApiHandler,
  rateLimit: { max: number; windowMs: number }
) =>
  createApiHandler(handler, {
    requireAuth: true,
    rateLimit,
    notifyActivity: true,
  });

