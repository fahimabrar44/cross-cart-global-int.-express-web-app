import connectDB from "@/config/db";
import { Price } from "@/server/models/Price.model";
import { Country } from "@/server/models/Country.model";
import { Zone } from "@/server/models/Zone.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { verifyApiKeyIfProvided } from "@/server/common/apiKeyAuth";
import { createRateLimitedHandler } from "@/server/common/apiWrapper";
import { Types } from "mongoose";
import { withTtlCache } from "@/server/services/referenceCache";
import {
  MAX_WEIGHT_GRAMS,
  resolveWeightTier,
} from "@/lib/weightTiers";

const REF_TTL_MS = 5 * 60 * 1000;

interface PriceBreakdown {
  name: string;
  profitPercentage: number;
  gift: number;
  fuel: number;
  tier: string;
  tierLabel: string;
  basePrice: number;
  finalPrice: number;
  serviceDetails: string[];
}

interface RateRow {
  name?: string;
  profitPercentage?: number;
  gift?: number;
  fuel?: number;
  price?: Record<string, number>;
  serviceDetails?: string[];
}

interface OriginLean {
  _id: unknown;
  name?: string;
  code?: string;
  isActive?: boolean;
}

interface ZoneLean {
  _id: unknown;
  name?: string;
  code?: string;
  isActive?: boolean;
  countryIds?: unknown[];
}

function zoneContainsCountry(
  zone: ZoneLean | null,
  countryId: Types.ObjectId
): boolean {
  if (!zone || !Array.isArray(zone.countryIds)) return false;
  return zone.countryIds.some((id) => String(id) === String(countryId));
}

interface DestinationLean {
  _id: unknown;
  name?: string;
  code?: string;
  isActive?: boolean;
}

interface PriceLean {
  rate?: RateRow[];
}

/**
 * POST /api/v1/prices/calculate
 *
 * Body: { fromCountryId, toZoneId, weight (grams), rateName? }
 *
 * The response is the final chargeable price (base + fuel + margin) for the
 * weight tier that covers `weight`. Public clients may call this without an
 * API key; API-key requests are still validated when a key is supplied.
 */
export const POST = createRateLimitedHandler(
  async ({ req }) => {
    try {
      // API-key access when X-API-Key header is supplied; otherwise public.
      const apiAuth = await verifyApiKeyIfProvided(req);
      if (!apiAuth.success && apiAuth.response) {
        return apiAuth.response;
      }

      await connectDB();

      const body = (await req.json().catch(() => null)) as Record<
        string,
        unknown
      > | null;

      if (!body) {
        return errorResponse({
          status: 400,
          message: "A valid JSON body is required",
          req,
        });
      }

      const fromCountryId = body.fromCountryId ?? body.from;
      const rawToZoneId = body.toZoneId ?? body.to;
      const rawToCountryId = body.toCountryId;
      const toZoneId =
        typeof rawToZoneId === "string" && Types.ObjectId.isValid(rawToZoneId)
          ? rawToZoneId
          : "";
      const toCountryId =
        typeof rawToCountryId === "string" &&
        Types.ObjectId.isValid(rawToCountryId)
          ? rawToCountryId
          : "";
      const rawWeight = Number(body.weight);
      const rateName =
        typeof body.rateName === "string" && body.rateName.trim()
          ? body.rateName.trim()
          : undefined;

      if (
        typeof fromCountryId !== "string" ||
        !Types.ObjectId.isValid(fromCountryId)
      ) {
        return errorResponse({
          status: 400,
          message: "Valid fromCountryId is required",
          req,
        });
      }
      if (!toZoneId && !toCountryId) {
        return errorResponse({
          status: 400,
          message: "Valid toCountryId or toZoneId is required",
          req,
        });
      }
      if (!Number.isFinite(rawWeight) || rawWeight <= 0) {
        return errorResponse({
          status: 400,
          message: "Valid weight (grams) is required",
          req,
        });
      }
      if (rawWeight > MAX_WEIGHT_GRAMS) {
        return errorResponse({
          status: 400,
          message: `Weight cannot exceed ${MAX_WEIGHT_GRAMS / 1000} kg`,
          req,
        });
      }

      const weight = Math.round(rawWeight);
      const cacheKey = `prices:calc:${fromCountryId}:${toZoneId || "-"}:${
        toCountryId || "-"
      }`;

      const looked = await withTtlCache<{
        origin: OriginLean | null;
        destination: DestinationLean | null;
        zone: ZoneLean | null;
        price: { rate?: RateRow[] } | null;
      }>(cacheKey, REF_TTL_MS, async () => {
        const fromOid = new Types.ObjectId(fromCountryId);
        const zoneOid = toZoneId ? new Types.ObjectId(toZoneId) : null;
        const countryOid = toCountryId
          ? new Types.ObjectId(toCountryId)
          : null;

        const [originDoc, zoneDoc, countryDoc] = (await Promise.all([
          Country.findById(fromOid).lean(),
          zoneOid ? Zone.findById(zoneOid).lean() : Promise.resolve(null),
          countryOid ? Country.findById(countryOid).lean() : Promise.resolve(null),
        ])) as unknown as [
          OriginLean | null,
          ZoneLean | null,
          OriginLean | null,
        ];

        let destinationDoc: DestinationLean | null = null;
        let effectiveZone: ZoneLean | null = zoneDoc;
        let priceDoc: PriceLean | null = null;

        if (countryOid) {
          if (countryDoc) {
            // Older charts may store the destination country directly.
            priceDoc = (await Price.findOne({
              from: fromOid,
              to: countryOid,
              isActive: { $ne: false },
            }).lean()) as PriceLean | null;

            // Current charts store the destination zone; map the selected
            // country to the zone that contains it.
            if (!priceDoc) {
              if (!zoneContainsCountry(effectiveZone, countryOid)) {
                effectiveZone = (await Zone.findOne({
                  countryIds: countryOid,
                  isActive: { $ne: false },
                }).lean()) as ZoneLean | null;
              }
              if (effectiveZone) {
                priceDoc = (await Price.findOne({
                  from: fromOid,
                  to: effectiveZone._id,
                  isActive: { $ne: false },
                }).lean()) as PriceLean | null;
              }
            }

            destinationDoc = countryDoc;
          }
        } else if (zoneOid && zoneDoc) {
          priceDoc = (await Price.findOne({
            from: fromOid,
            to: zoneOid,
            isActive: { $ne: false },
          }).lean()) as PriceLean | null;
          destinationDoc = zoneDoc;
        } else if (zoneOid) {
          // Legacy charts may have stored a country ID in the `to` field even
          // though the current model expects a zone.
          const legacyCountry = (await Country.findById(
            zoneOid
          ).lean()) as OriginLean | null;
          if (legacyCountry) {
            priceDoc = (await Price.findOne({
              from: fromOid,
              to: zoneOid,
              isActive: { $ne: false },
            }).lean()) as PriceLean | null;
            destinationDoc = legacyCountry;
          }
        }

        return {
          origin: originDoc
            ? {
                _id: originDoc._id,
                name: originDoc.name,
                code: originDoc.code,
                isActive: originDoc.isActive,
              }
            : null,
          destination: destinationDoc
            ? {
                _id: destinationDoc._id,
                name: destinationDoc.name,
                code: destinationDoc.code,
                isActive: destinationDoc.isActive,
              }
            : null,
          zone: effectiveZone
            ? {
                _id: effectiveZone._id,
                name: effectiveZone.name,
                code: effectiveZone.code,
                isActive: effectiveZone.isActive,
              }
            : null,
          price: priceDoc
            ? {
                rate: (priceDoc.rate || []) as RateRow[],
              }
            : null,
        };
      });

      if (!looked.origin) {
        return errorResponse({
          status: 404,
          message: "Origin country not found",
          req,
        });
      }
      if (!looked.destination) {
        return errorResponse({
          status: 404,
          message: toCountryId
            ? "Destination country not found"
            : "Destination zone not found",
          req,
        });
      }
      if (looked.origin.isActive === false) {
        return errorResponse({
          status: 400,
          message: "Shipping from this country is currently unavailable",
          req,
        });
      }
      if (looked.zone && looked.zone.isActive === false) {
        return errorResponse({
          status: 400,
          message: "This destination zone is currently unavailable",
          req,
        });
      }
      if (looked.destination.isActive === false) {
        return errorResponse({
          status: 400,
          message: toCountryId
            ? "This destination country is currently unavailable"
            : "This destination zone is currently unavailable",
          req,
        });
      }

      const price = looked.price;
      if (!price) {
        return errorResponse({
          status: 404,
          message:
            "No pricing found for this route. Please contact our support team.",
          req,
        });
      }

      const { key: tier, label: tierLabel, perKg } =
        resolveWeightTier(weight);

      const allRates = Array.isArray(price.rate) ? price.rate : [];
      const matchedRates = rateName
        ? allRates.filter(
            (rate) =>
              (rate.name || "").trim().toLowerCase() ===
              rateName.toLowerCase()
          )
        : allRates;

      if (rateName && matchedRates.length === 0) {
        return errorResponse({
          status: 404,
          message: `Rate "${rateName}" is not available for this route`,
          req,
        });
      }

      const breakdown: PriceBreakdown[] = matchedRates
        .map((rate) => {
          const tierPrice = Number(rate.price?.[tier]) || 0;
          const basePrice = perKg ? tierPrice * (weight / 1000) : tierPrice;
          const finalPrice =
            basePrice *
            (1 + (Number(rate.fuel) || 0) / 100) *
            (1 + (Number(rate.profitPercentage) || 0) / 100);

          return {
            name: rate.name || "Unnamed rate",
            profitPercentage: Number(rate.profitPercentage) || 0,
            gift: Number(rate.gift) || 0,
            fuel: Number(rate.fuel) || 0,
            tier,
            tierLabel,
            basePrice: Number(basePrice.toFixed(3)),
            finalPrice: Number(finalPrice.toFixed(3)),
            serviceDetails: Array.isArray(rate.serviceDetails)
              ? rate.serviceDetails.filter(Boolean)
              : [],
          };
        })
        // A zero/missing tier price means the carrier does not offer this
        // weight band; showing "$0.00" would be misleading.
        .filter((rate) => rate.finalPrice > 0);

      if (breakdown.length === 0) {
        return errorResponse({
          status: 404,
          message:
            "No rates are configured for this weight. Please contact our support team.",
          req,
        });
      }

      return successResponse({
        status: 200,
        message: "Price calculated successfully",
        data: {
          from: {
            _id: looked.origin._id,
            name: looked.origin.name,
            code: looked.origin.code,
          },
          to: {
            _id: looked.destination._id,
            name: looked.destination.name,
            code: looked.destination.code,
          },
          weight,
          weightKg: Number((weight / 1000).toFixed(3)),
          tier,
          tierLabel,
          perKg,
          rates: breakdown,
        },
        req,
      });
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Failed to calculate price";
      return errorResponse({ status: 500, message: msg, error, req });
    }
  },
  { max: 60, windowMs: 60 * 1000 }
);
