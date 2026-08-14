import connectDB from "@/config/db";
import { authenticateToken } from "@/middleware/apiAuth";
import { errorResponse, successResponse } from "@/server/common/response";
import { Order } from "@/server/models/Order.model";
import { Track } from "@/server/models/Track.model";
import { getSettingString } from "@/server/services/settingsService";
import {
  fetchAndStoreTracking,
  logTrackSyncResult,
} from "@/server/services/trackingService";
import { getTrackingMoreUsage } from "@/server/services/trackingMoreService";
import { NextRequest } from "next/server";

const SYNC_TTL_MS = 30 * 60 * 1000; // poll each live parcel at most every 30 min
const MAX_PER_RUN = 40; // hard cap per run so a cron tick never nukes the daily quota

function wantedParcelsCount(): number {
  const n = parseInt(process.env.SYNC_ALL_MAX_PER_RUN || "", 10);
  return Number.isNaN(n) || n < 1 ? MAX_PER_RUN : Math.min(n, MAX_PER_RUN);
}

/**
 * POST /api/v1/tracking/sync-all
 * Cron entry point: polls the carrier API for every active, handed-over parcel
 * that hasn't been synced within the TTL, and merges fresh events.
 *
 * Auth: send `x-cron-secret: <CRON_SECRET>` (env), OR a moderator/admin
 * bearer token. Without either the route returns 401.
 *
 * Wire a scheduler (GitHub Actions / cron on the host / UptimeRobot ping) to
 * call this endpoint every 10 minutes.
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    // ---- Auth: cron secret OR moderator/admin token ----
    const cronSecret = await getSettingString(
      "CRON_SECRET",
      process.env.CRON_SECRET || ""
    ).catch(() => process.env.CRON_SECRET || "");
    const provided = req.headers.get("x-cron-secret") || req.headers.get("authorization") || "";
    let allowed = false;

    if (cronSecret && provided && provided === cronSecret) {
      allowed = true;
    } else if (provided.startsWith("Bearer ")) {
      const bearer = new Request(req.url, {
        headers: { authorization: provided },
      });
      const user = await authenticateToken(bearer as NextRequest).catch(() => null);
      if (user && (user.role === "admin" || user.role === "moderator")) {
        allowed = true;
      }
    }

    if (!allowed) {
      return errorResponse({
        status: 401,
        message: "Unauthorized — send x-cron-secret or a moderator/admin token",
        req,
      });
    }

    await connectDB();

    // ---- Find live parcels that were handed over to a courier ----
    const cutoff = new Date(Date.now() - SYNC_TTL_MS);
    const handedOverOrderIds = await Order.find({
      $or: [
        { "handover_by.company": { $ne: "" } },
        { "handover_by.tracking": { $ne: "" } },
      ],
    })
      .select("_id")
      .lean();

    const tracks = await Track.find({
      order: { $in: handedOverOrderIds.map((o) => o._id) },
      currentStatus: { $in: ["created", "pickup-pending", "picked-up", "in-transit", "arrived-at-hub", "customs-clearance", "out-for-delivery", "failed"] },
      $or: [{ lastExternalSync: null }, { lastExternalSync: { $lte: cutoff } }],
    })
      .sort({ lastExternalSync: 1 })
      .limit(wantedParcelsCount())
      .lean();

    const usage = await getTrackingMoreUsage().catch(() => ({
      date: "",
      count: 0,
      limit: 0,
      remaining: 0,
    }));

    // Respect the quota — don't start a batch that would blow past it.
    const affordable = Math.min(tracks.length, Math.max(0, usage.remaining));
    if (affordable < tracks.length) {
      tracks.splice(affordable);
    }
    if (usage.remaining <= 0) {
      return successResponse({
        status: 200,
        message: "TrackingMore daily quota exhausted — sync skipped",
        data: { attempted: 0, succeeded: 0, failed: 0, added: 0, usage, skipped: tracks.length },
        req,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tmTracks = tracks as any[];

    let succeeded = 0;
    let failed = 0;
    let addedEvents = 0;

    for (const t of tmTracks) {
      // Fetch order's handover info.
      const orderDoc = await Order.findById(t.order).lean();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handover: any = (orderDoc as any)?.handover_by || {};
      const trackingNumber = handover.tracking || t.trackId;
      const carrier = handover.courier_code || handover.company || "";

      try {
        const result = await fetchAndStoreTracking({
          trackId: t.trackId,
          carrier,
          trackingNumber,
          updatedBy: null,
        });
        await Track.updateOne(
          { _id: t._id },
          { $set: { lastExternalSync: new Date() } }
        );
        succeeded += 1;
        addedEvents += (result as { added: number }).added;
        if ((result as { added: number }).added > 0) {
          await logTrackSyncResult({
            trackId: t.trackId,
            trackingNumber,
            courier: carrier,
            source: "cron",
            status: "success",
            added: (result as { added: number }).added,
            message: (result as { message: string }).message,
          });
        }
      } catch (error) {
        failed += 1;
        await logTrackSyncResult({
          trackId: t.trackId,
          trackingNumber,
          courier: carrier,
          source: "cron",
          status: "failed",
          message: error instanceof Error ? error.message : "Sync failed",
        });
      }
    }

    const usageAfter = await getTrackingMoreUsage().catch(() => usage);

    return successResponse({
      status: 200,
      message: `Auto-sync complete: ${succeeded} ok, ${failed} failed`,
      data: {
        attempted: tmTracks.length,
        succeeded,
        failed,
        added: addedEvents,
        usage: usageAfter,
      },
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Auto-sync failed";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}

export async function GET(req: NextRequest): Promise<Response> {
  return POST(req);
}