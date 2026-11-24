import { WEIGHT_TIER_KEYS } from "@/lib/weightTiers";

export interface SanitizedRate {
  name: string;
  profitPercentage: number;
  gift: number;
  fuel: number;
  price: Record<string, number>;
  serviceDetails: string[];
}

function toNonNegativeNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.round(n * 1000) / 1000;
}

function toText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

/**
 * Validate a rate array coming from an admin/moderator form or API client.
 * `fuel` and `profitPercentage` may legitimately be 0, so they are only
 * rejected when missing or non-numeric (the previous truthiness check made
 * it impossible to save a 0% fuel surcharge).
 */
export function validateRates(rates: unknown): { valid: boolean; message: string } {
  if (!Array.isArray(rates) || rates.length === 0) {
    return { valid: false, message: "At least one rate is required" };
  }

  for (let i = 0; i < rates.length; i++) {
    const r = rates[i] as Record<string, unknown> | null;
    if (!r || typeof r !== "object") {
      return { valid: false, message: `rate[${i}] must be an object` };
    }

    const name = toText(r.name, 120);
    if (!name) {
      return { valid: false, message: `rate[${i}].name is required` };
    }

    if (r.fuel == null || !Number.isFinite(Number(r.fuel))) {
      return { valid: false, message: `rate[${i}].fuel must be a number` };
    }

    if (
      r.profitPercentage == null ||
      !Number.isFinite(Number(r.profitPercentage))
    ) {
      return {
        valid: false,
        message: `rate[${i}].profitPercentage must be a number`,
      };
    }

    if (r.gift == null || !Number.isFinite(Number(r.gift))) {
      return { valid: false, message: `rate[${i}].gift must be a number` };
    }

    if (r.price != null && typeof r.price !== "object") {
      return { valid: false, message: `rate[${i}].price must be an object` };
    }

    if (r.price && typeof r.price === "object") {
      for (const key of WEIGHT_TIER_KEYS) {
        const value = (r.price as Record<string, unknown>)[key];
        if (value != null && !Number.isFinite(Number(value))) {
          return {
            valid: false,
            message: `rate[${i}].price.${key} must be a number`,
          };
        }
      }
    }

    if (
      r.serviceDetails !== undefined &&
      (!Array.isArray(r.serviceDetails) ||
        !r.serviceDetails.every((s) => typeof s === "string"))
    ) {
      return {
        valid: false,
        message: `rate[${i}].serviceDetails must be an array of strings`,
      };
    }
  }

  return { valid: true, message: "Valid" };
}

/** Keep only known fields and normalize numeric values. */
export function sanitizeRates(rates: unknown[]): SanitizedRate[] {
  return rates.map((raw) => {
    const r =
      raw && typeof raw === "object"
        ? (raw as Record<string, unknown>)
        : {};
    const rawPrice =
      r.price && typeof r.price === "object"
        ? (r.price as Record<string, unknown>)
        : {};

    const price: Record<string, number> = {};
    for (const key of WEIGHT_TIER_KEYS) {
      price[key] = toNonNegativeNumber(rawPrice[key]);
    }

    const serviceDetails = Array.isArray(r.serviceDetails)
      ? r.serviceDetails
          .map((detail) => toText(detail, 300))
          .filter(Boolean)
          .slice(0, 20)
      : [];

    return {
      name: toText(r.name, 120),
      profitPercentage: toNonNegativeNumber(r.profitPercentage),
      gift: toNonNegativeNumber(r.gift),
      fuel: toNonNegativeNumber(r.fuel),
      price,
      serviceDetails,
    };
  });
}
