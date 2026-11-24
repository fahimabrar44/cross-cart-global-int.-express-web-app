/**
 * Single source of truth for shipping weight tiers.
 *
 * The first 5.5 kg are flat-priced (the `gm*` keys). Above that, prices are
 * stored per kilogram (`kg*` keys) and multiplied by the parcel weight.
 *
 * This file is imported by both server routes and client components, so it
 * must stay free of Node/Mongoose imports.
 */

export const WEIGHT_TIER_KEYS = [
  "gm500",
  "gm1000",
  "gm1500",
  "gm2000",
  "gm2500",
  "gm3000",
  "gm3500",
  "gm4000",
  "gm4500",
  "gm5000",
  "gm5500",
  "kg6to10",
  "kg11to20",
  "kg21to30",
  "kg31to40",
  "kg41to50",
  "kg51to80",
  "kg81to100",
  "kg101to500",
  "kg501to1000",
] as const;

export type WeightTierKey = (typeof WEIGHT_TIER_KEYS)[number];

export const WEIGHT_LABELS: Record<WeightTierKey, string> = {
  gm500: "Up to 500 GM",
  gm1000: "Up to 1000 GM",
  gm1500: "Up to 1500 GM",
  gm2000: "Up to 2000 GM",
  gm2500: "Up to 2500 GM",
  gm3000: "Up to 3000 GM",
  gm3500: "Up to 3500 GM",
  gm4000: "Up to 4000 GM",
  gm4500: "Up to 4500 GM",
  gm5000: "Up to 5000 GM",
  gm5500: "Up to 5500 GM",
  kg6to10: "6 – 10 KG (per kg)",
  kg11to20: "11 – 20 KG (per kg)",
  kg21to30: "21 – 30 KG (per kg)",
  kg31to40: "31 – 40 KG (per kg)",
  kg41to50: "41 – 50 KG (per kg)",
  kg51to80: "51 – 80 KG (per kg)",
  kg81to100: "81 – 100 KG (per kg)",
  kg101to500: "101 – 500 KG (per kg)",
  kg501to1000: "501 – 1000 KG (per kg)",
};

export const MAX_WEIGHT_GRAMS = 1_000_000; // 1000 kg
export const MAX_WEIGHT_KG = MAX_WEIGHT_GRAMS / 1000;

const FLAT_TIERS: { key: WeightTierKey; cap: number }[] = [
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

const KG_TIERS: { key: WeightTierKey; min: number; max: number }[] = [
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

export interface ResolvedWeightTier {
  key: WeightTierKey;
  label: string;
  perKg: boolean;
}

/**
 * Map a weight in grams to its price tier.
 *
 * Uses the *upper bound* of each band so there are no gaps between tiers
 * (e.g. 5.6 kg falls into the 6–10 kg band instead of the last 501–1000 kg
 * band, which was a serious mispricing bug).
 */
export function resolveWeightTier(weightGrams: number): ResolvedWeightTier {
  if (!Number.isFinite(weightGrams) || weightGrams <= 0) {
    return { key: "gm500", label: WEIGHT_LABELS.gm500, perKg: false };
  }

  if (weightGrams <= 5500) {
    const tier =
      FLAT_TIERS.find((t) => weightGrams <= t.cap) ??
      FLAT_TIERS[FLAT_TIERS.length - 1];
    return { key: tier.key, label: WEIGHT_LABELS[tier.key], perKg: false };
  }

  const weightKg = weightGrams / 1000;
  const tier =
    KG_TIERS.find((t) => weightKg <= t.max) ?? KG_TIERS[KG_TIERS.length - 1];

  return { key: tier.key, label: WEIGHT_LABELS[tier.key], perKg: true };
}

export function weightTierLabel(key: string): string {
  return WEIGHT_LABELS[key as WeightTierKey] ?? key;
}

export function emptyWeightPrices(): Record<WeightTierKey, number> {
  return WEIGHT_TIER_KEYS.reduce(
    (acc, key) => {
      acc[key] = 0;
      return acc;
    },
    {} as Record<WeightTierKey, number>
  );
}
