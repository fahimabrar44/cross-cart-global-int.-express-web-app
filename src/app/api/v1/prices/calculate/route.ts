import { NextRequest } from "next/server";
import connectDB from "@/config/db";
import { Price } from "@/server/models/Price.model";
import { Country } from "@/server/models/Country.model";
import { Zone } from "@/server/models/Zone.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { verifyApiKeyIfProvided } from "@/server/common/apiKeyAuth";
import { Types } from "mongoose";
import { withTtlCache } from "@/server/services/referenceCache";

const REF_TTL_MS = 5 * 60 * 1000;

// Flat-rate tiers (grams) applied up to their cap
const FLAT_TIERS: { key: string; cap: number }[] = [
  { key: "gm500", cap: 500 },
  { key: "gm1000", cap: 1000 },
  { key: "gm1500", cap: 1500 },
  { key: "gm2000", cap: 2000 },
  { key: "gm2500", cap: 2500 },
  { key: "gm3000", cap: 3000 },
  { key: "gm3500", cap: 3500 },
  { key: "gm4000", cap: 4000 },
  { key: "gm4500", cap: 4500 },
  { key: "gm5000", cap: 5000 },
  { key: "gm5500", cap: 5500 },
];

// Per-kg tiers (kg ranges). Price stored is per kilogram.
const KG_TIERS: { key: string; min: number; max: number }[] = [
  { key: "kg6to10", min: 6, max: 10 },
  { key: "kg11to20", min: 11, max: 20 },
  { key: "kg21to30", min: 21, max: 30 },
  { key: "kg31to40", min: 31, max: 40 },
  { key: "kg41to50", min: 41, max: 50 },
  { key: "kg51to80", min: 51, max: 80 },
  { key: "kg81to100", min: 81, max: 100 },
  { key: "kg101to500", min: 101, max: 500 },
  { key: "kg501to1000", min: 501, max: 1000 },
];

interface PriceBreakdown {
  name: string;
  profitPercentage: number;
  gift: number;
  fuel: number;
  tier: string;
  tierLabel: string;
  basePrice: number;
  finalPrice: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RateRow = any;

// Resolve a weight (grams) into a tier key + how it is priced
function resolveTier(weightGrams: number): { key: string; label: string; perKg: boolean } {
  if (weightGrams > 0 && weightGrams <= 5500) {
    const tier = [...FLAT_TIERS].reverse().find((t) => weightGrams <= t.cap) || FLAT_TIERS[0];
    return { key: tier.key, label: tier.key.replace("gm", "") + " GM", perKg: false };
  }

  const weightKg = weightGrams / 1000;
  const tier = KG_TIERS.find((t) => weightKg >= t.min && weightKg <= t.max);
  if (tier) {
    return {
      key: tier.key,
      label: `PER KG (${tier.min} TO ${tier.max} KG)`,
      perKg: true,
    };
  }

  const last = KG_TIERS[KG_TIERS.length - 1];
  return { key: last.key, label: `PER KG (${last.min} TO ${last.max} KG)`, perKg: true };
}

export async function POST(req: NextRequest) {
  try {
    // API-key access when X-API-Key header is supplied; otherwise public
    const apiAuth = await verifyApiKeyIfProvided(req);
    if (!apiAuth.success && apiAuth.response) {
      return apiAuth.response;
    }

    await connectDB();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = (await req.json()) as any;

    const fromCountryId = body?.fromCountryId || body?.from;
    const toZoneId = body?.toZoneId || body?.to;
    const weight = Number(body?.weight);
    const rateName = body?.rateName ? String(body.rateName).trim() : undefined;

    if (!fromCountryId || !Types.ObjectId.isValid(fromCountryId)) {
      return errorResponse({ status: 400, message: "Valid fromCountryId is required", req });
    }
    if (!toZoneId || !Types.ObjectId.isValid(toZoneId)) {
      return errorResponse({ status: 400, message: "Valid toZoneId is required", req });
    }
    if (!weight || isNaN(weight) || weight <= 0) {
      return errorResponse({ status: 400, message: "Valid weight (grams) is required", req });
    }

    const cacheKey = `prices:calc:${fromCountryId}:${toZoneId}`;

    const looked = await withTtlCache<{
      origin: { _id: unknown; name?: string; code?: string };
      zone: { _id: unknown; name?: string; code?: string };
      price: { rate?: RateRow[] } | null;
    }>(
      cacheKey,
      REF_TTL_MS,
      async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const origin: any = await Country.findById(new Types.ObjectId(fromCountryId)).lean();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const zone: any = await Zone.findById(new Types.ObjectId(toZoneId)).lean();

        if (!origin) {
          return { origin: null as unknown as typeof origin, zone: null, price: null };
        }
        if (!zone) {
          return { origin, zone: null as unknown as typeof zone, price: null };
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const price: any = await Price.findOne({
          from: new Types.ObjectId(fromCountryId),
          to: new Types.ObjectId(toZoneId),
          isActive: true,
        }).lean();

        return { origin, zone, price };
      }
    );

    if (!looked.origin) {
      return errorResponse({ status: 404, message: "Origin country not found", req });
    }
    if (!looked.zone) {
      return errorResponse({ status: 404, message: "Destination zone not found", req });
    }

    const origin = looked.origin;
    const zone = looked.zone;
    const price = looked.price;

    if (!price) {
      return errorResponse({
        status: 404,
        message: "No pricing found for this route. Please contact our support team.",
        req,
      });
    }

    const { key: tier, label: tierLabel, perKg } = resolveTier(weight);

    const breakdown: PriceBreakdown[] = (price.rate || [])
      .filter((r: RateRow) => (rateName ? r.name.toLowerCase() === rateName.toLowerCase() : true))
      .map((r: RateRow) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tierPrice = (r.price as any)?.[tier] ?? 0;
        const basePrice = perKg ? Number(tierPrice) * (weight / 1000) : Number(tierPrice);
        const finalPrice = Number(
          basePrice *
            (1 + (r.fuel || 0) / 100) *
            (1 + (r.profitPercentage || 0) / 100)
        );
        return {
          name: r.name,
          profitPercentage: r.profitPercentage,
          gift: r.gift,
          fuel: r.fuel,
          tier,
          tierLabel,
          basePrice: Number(basePrice.toFixed(3)),
          finalPrice: Number(finalPrice.toFixed(3)),
        };
      });

    return successResponse({
      status: 200,
      message: "Price calculated successfully",
      data: {
        from: { _id: origin._id, name: origin.name, code: origin.code },
        to: { _id: zone._id, name: zone.name, code: zone.code },
        weight,
        tier,
        tierLabel,
        rates: breakdown,
      },
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to calculate price";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}