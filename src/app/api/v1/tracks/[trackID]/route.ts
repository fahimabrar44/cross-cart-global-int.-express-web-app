import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/config/db";
import { Track } from "@/server/models/Track.model";
import { Country } from "@/server/models/Country.model";
import { Order } from "@/server/models/Order.model";
import { Types } from "mongoose";
import { createModeratorHandler } from "@/server/common/apiWrapper";
import { successResponse, errorResponse } from "@/server/common/response";
import {
  updateTrackStatus,
  fetchAndStoreTracking,
  logTrackSyncResult,
  sortHistoryByTime,
} from "@/server/services/trackingService";
import {
  detectCourier,
  isTrackingMoreConfigured,
  selectCourier,
  getTrackings,
  createTracking,
  extractTimelineEvents,
  mapTMDeliveryStatus,
  inferStatusFromText,
} from "@/server/services/trackingMoreService";
import { verifyApiKeyIfProvided } from "@/server/common/apiKeyAuth";

// How often the public lookup may poll the carrier (TrackingMore) API.
const EXTERNAL_SYNC_TTL_MS = 10 * 60 * 1000; // 10 minutes

// History locations sometimes store a Country ObjectId as a string;
// resolve any that look like one into the country name.
const normalizeCountry = async (value: string | unknown): Promise<string> => {
  if (typeof value !== "string" || !value.trim()) return "";
  if (Types.ObjectId.isValid(value)) {
    const country =
      value.length === 24
        ? await Country.findById(value).select("name").lean()
        : null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (country as any)?.name ?? value;
  }
  return value;
};

/**
 * Live lookup of an arbitrary carrier tracking number via TrackingMore
 * (no local Track needed). Returns a successResponse shaped like a Track
 * (without an order) or null when nothing can be resolved.
 */
const lookupExternalTracking = async (
  trackingNumber: string,
  req: NextRequest
): Promise<NextResponse | null> => {
  if (!trackingNumber || !(await isTrackingMoreConfigured())) return null;

  // Optional special-field values from the UI (e.g. ?tracking_postal_code=10115&
  // tracking_destination_country=DE) for couriers like DPD that require them.
  const EXTRAS_ALLOWED = [
    "tracking_postal_code",
    "tracking_destination_country",
    "tracking_ship_date",
    "tracking_departure_country",
    "tracking_phone",
    "tracking_email",
    "order_number",
  ];
  const extras: Record<string, string> = {};
  for (const key of EXTRAS_ALLOWED) {
    const v = req.nextUrl.searchParams.get(key);
    if (v && v.trim()) extras[key] = v.trim();
  }

  try {
    // detect may return several matches (e.g. "dpd" and "dpd-de" for DPD
    // Germany) — try each until one produces a tracking result.
    const detected = await detectCourier(trackingNumber);
    const couriers = (detected || [])
      .map((c) => c?.courier_code)
      .filter((c): c is string => Boolean(c));

    // Try the best-matched courier first (country match / no required fields),
    // then keep trying the rest so a healthy account still resolves.
    const best = await selectCourier(detected);
    if (best && couriers.length > 1) {
      couriers.sort((a, b) => (a === best ? -1 : b === best ? 1 : 0));
    }

    let courierCode = "";
    let tm: Awaited<ReturnType<typeof getTrackings>>[number] | undefined;
    let lastCreateError = "";
    let lastCreateErrorCode = 0;

    for (const code of couriers.length ? couriers : [""]) {
      courierCode = code;
      try {
        let tmTrackings = await getTrackings([trackingNumber], {
          courierCode: code || undefined,
        });
        if (tmTrackings && tmTrackings.length) {
          tm = tmTrackings[0];
          // Freshly created trackings often need a moment before TrackingMore
          // populates the trackinfo — one short retry to return events on the
          // very first search for any courier.
          if (!extractTimelineEvents(tm).length) {
            await new Promise((r) => setTimeout(r, 2500));
            const retry = await getTrackings([trackingNumber], {
              courierCode: code || undefined,
            });
            if (retry && retry.length) tm = retry[0];
          }
          if (extractTimelineEvents(tm).length || tm.delivery_status) break;
        }
        const created = await createTracking({
          tracking_number: trackingNumber,
          courier_code: code || undefined,
          ...extras,
        });
        if (created?.tracking_number) {
          tmTrackings = await getTrackings([created.tracking_number], {
            courierCode: code || undefined,
          });
          tm = tmTrackings?.[0];
          if (tm) break;
        }
      } catch (error) {
        lastCreateError = error instanceof Error ? error.message : String(error);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const c = (error as any)?.code;
        if (typeof c === "number") lastCreateErrorCode = c;
      }
    }

    if (!tm) {
      await logTrackSyncResult({
        trackingNumber,
        courier: courierCode,
        source: "public",
        status: "failed",
        message: lastCreateError || "No courier produced a tracking result",
      });

      // 4050 = empty-create marker (account-level issue); 4122/4124 = courier
      // required-field / format problems. Surface a precise, customer-friendly
      // reason instead of a bare "Track not found".
      if (lastCreateError) {
        const marker =
          lastCreateErrorCode === 4122 || lastCreateErrorCode === 4124
            ? lastCreateErrorCode
            : typeof lastCreateError === "string" &&
                lastCreateError.includes("no tracking object")
              ? 4050
              : 0;
        if (marker) {
          if (marker === 4122) {
            // Tell the UI exactly which special fields to collect from the user.
            const { getCouriersCached, requiredFieldMeta } = await import(
              "@/server/services/trackingMoreService"
            );
            let requiredFields: string[] = [];
            try {
              const all = await getCouriersCached();
              const metaCourier = all.find(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (c: any) => c?.courier_code === courierCode
              );
              requiredFields = (metaCourier?.tracking_required_fields || []) as string[];
            } catch {
              /* keep defaults */
            }
            if (!requiredFields.length) {
              requiredFields = [
                "tracking_postal_code",
                "tracking_destination_country",
              ];
            }
            return errorResponse({
              status: 200,
              message: lastCreateError,
              req,
              meta: {
                needsFields: true,
                needsFieldsCourier: courierCode,
                trackingNumber,
                requiredFields: requiredFieldMeta(requiredFields),
              },
            });
          }
          return errorResponse({
            status: 404,
            message:
              marker === 4050
                ? "Carrier lookup is temporarily unavailable for this number."
                : lastCreateError,
            req,
          });
        }
      }
      return null;
    }

    const history = extractTimelineEvents(tm)
      .map((e) => ({
        status: e.status,
        description: e.description,
        location: e.location,
        timestamp: e.timestamp,
        updatedBy: null,
      }))
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

    const currentStatus = tm.delivery_status
      ? mapTMDeliveryStatus(tm.delivery_status)
      : history.length
        ? history[history.length - 1].status
        : "created";

    await logTrackSyncResult({
      trackingNumber,
      courier: courierCode,
      source: "public",
      status: "success",
      added: history.length,
      message: "Live external lookup (no local parcel)",
    });

    const data = {
      trackId: trackingNumber,
      currentStatus,
      history,
      estimatedDelivery: tm.scheduled_delivery_date || tm.estimated_delivery || null,
      order: null,
      live: true,
      courier_code: courierCode,
    };

    return successResponse({
      status: 200,
      message: "Track fetched successfully (live)",
      data,
      req: undefined,
    });
  } catch (error) {
    await logTrackSyncResult({
      trackingNumber,
      source: "public",
      status: "failed",
      message:
        error instanceof Error ? error.message : "Live lookup failed",
    });
    return null;
  }
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ trackID: string }> }
): Promise<NextResponse> {
  try {
    // API-key access when X-API-Key header is supplied; otherwise public
    const apiAuth = await verifyApiKeyIfProvided(req);
    if (!apiAuth.success && apiAuth.response) {
      return apiAuth.response;
    }

    await connectDB();

    const { trackID } = await params;

    // 1) Look up the parcel in our own database
    const lookupQuery: { trackId?: string; order?: Types.ObjectId } = {
      trackId: trackID,
    };
    let track = await Track.findOne(lookupQuery)
      .populate({
        path: "order",
        populate: [
          { path: "parcel.from" },
          { path: "parcel.to" },
          { path: "parcel.sender.address.country" },
          { path: "parcel.receiver.address.country" },
        ],
      })
      .lean();

    // 2) Fallback: allow looking up by the COURIER tracking number too
    //    (orders handed over to a carrier store it in handover_by.tracking)
    if (!track && trackID) {
      const orderByCourierTracking = await Order.findOne({
        "handover_by.tracking": trackID,
      }).select("_id");
      if (orderByCourierTracking) {
        track = await Track.findOne({ order: orderByCourierTracking._id })
          .populate({
            path: "order",
            populate: [
              { path: "parcel.from" },
              { path: "parcel.to" },
              { path: "parcel.sender.address.country" },
              { path: "parcel.receiver.address.country" },
            ],
          })
          .lean();
      }
    }

    if (!track) {
      // 3) No local parcel matched — try a LIVE TrackingMore lookup so users
      //    can track any carrier number directly (even one never handed over).
      const liveTrack = await lookupExternalTracking(trackID, req);
      if (liveTrack) return liveTrack;
      return errorResponse({ status: 404, message: "Track not found", req });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let tracked = track as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order = (tracked.order as any) as { handover_by?: { company?: string; tracking?: string; courier_code?: string }; _id?: Types.ObjectId };
    const handedOver = Boolean(
      order?.handover_by?.company || order?.handover_by?.tracking
    );

    if (handedOver) {
      try {
        const trackingNumber =
          order?.handover_by?.tracking || tracked.trackId;
        let courierCode = order?.handover_by?.courier_code || "";

        const lastSync = tracked.lastExternalSync
          ? new Date(tracked.lastExternalSync).getTime()
          : 0;
        const shouldPoll =
          Date.now() - lastSync > EXTERNAL_SYNC_TTL_MS &&
          tracked.currentStatus !== "delivered";

        if (shouldPoll) {
          // 2) Resolve the courier (detect if not cached yet)
          if (!courierCode && (await isTrackingMoreConfigured())) {
            const detected = await detectCourier(trackingNumber);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const destCountry = (order as any)?.parcel?.to?.code as string | undefined;
            courierCode = await selectCourier(detected, destCountry);
            if (courierCode && order?._id) {
              await Order.findByIdAndUpdate(order._id, {
                "handover_by.courier_code": courierCode,
              });
            }
          }
          // Fallback: use the handover company name as a best-effort code
          if (!courierCode) courierCode = order?.handover_by?.company || "";

          // 3) Get from TrackingMore (create if not created yet), merge + store
          await fetchAndStoreTracking({
            trackId: trackID,
            carrier: courierCode,
            trackingNumber,
          });
          await Track.updateOne(
            { trackId: trackID },
            { $set: { lastExternalSync: new Date() } }
          );
        }
      } catch (error) {
        // Carrier polling must never break the public page — fall back to stored data
        console.error("Auto tracking sync failed, showing stored data:", error);
        await logTrackSyncResult({
          trackId: trackID,
          trackingNumber: order?.handover_by?.tracking || trackID,
          courier: order?.handover_by?.company || "",
          source: "public",
          status: "failed",
          message:
            error instanceof Error ? error.message : "Carrier sync failed",
        });
      }

      // 4) Re-fetch merged data so the user sees the freshest stored history
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fresh: any = await Track.findOne({ trackId: trackID })
        .populate({
          path: "order",
          populate: [
            { path: "parcel.from" },
            { path: "parcel.to" },
            { path: "parcel.sender.address.country" },
            { path: "parcel.receiver.address.country" },
          ],
        })
        .lean();
      if (fresh) tracked = fresh;
    }

    // History locations sometimes store a Country ObjectId as a string;
    // resolve any that look like one into the country name. Also re-classify
    // any history rows still stored as "created" (synced before the status-
    // inference fix) into their real stage from the scan description.
    if (Array.isArray(tracked.history)) {
      tracked.history = await Promise.all(
        tracked.history.map(async (step: { status?: string; description?: string; location?: { country?: string } }) => {
          const loc = step.location?.country;
          if (loc && typeof loc === "string") {
            step.location!.country = await normalizeCountry(loc);
          }
          if (step.status === "created" && step.description) {
            const inferred = inferStatusFromText(step.description);
            if (inferred !== "created") step.status = inferred;
          }
          return step;
        })
      );
    }

    // Always return history in chronological order so the public timeline,
    // admin modal and receipt render updates in the correct sequence.
    if (Array.isArray(tracked.history)) {
      tracked.history = sortHistoryByTime(tracked.history);
    }

    return successResponse({ status: 200, message: "Track fetched successfully", data: tracked, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch track";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}

export const PUT = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();

    const url = new URL(req.url);
    const trackID = url.pathname.split("/").filter(Boolean).pop();

    if (!trackID) {
      return errorResponse({ status: 400, message: "Track ID is required", req });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = (await req.json()) as any;

    if (!body.currentStatus) {
      return errorResponse({ status: 400, message: "currentStatus is required", req });
    }

    const result = await updateTrackStatus({
      trackId: trackID,
      status: body.currentStatus,
      description: body.description || "",
      location: body.location || { city: "", country: "" },
      updatedBy: body.updatedBy || null,
      estimatedDelivery: body.estimatedDelivery,
      timestamp: body.timestamp,
    });

    if (!result) return errorResponse({ status: 404, message: "Track not found", req });

    return successResponse({ status: 200, message: "Track updated successfully", data: result.track, req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update track";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});

export const DELETE = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();

    const url = new URL(req.url);
    const trackID = url.pathname.split("/").filter(Boolean).pop();

    const deleted = await Track.findOneAndDelete({ trackId: trackID });
    if (!deleted) return errorResponse({ status: 404, message: "Track not found", req });

    return successResponse({ status: 200, message: "Track deleted successfully", req });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete track";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});
