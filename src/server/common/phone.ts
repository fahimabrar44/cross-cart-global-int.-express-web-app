/** Digits-only form of a phone number. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Phone numbers are stored in several formats across the app (E.164 with a
 * leading "+", digits only, or the last 10 digits). Try all of them so a
 * request for "+880..." still finds a user saved as "880..." or "018...".
 */
export function buildPhoneVariants(phone: string): string[] {
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

/** Compare two phone numbers tolerantly (E.164 vs local formats). */
export function phonesMatch(
  a?: string | null,
  b?: string | null
): boolean {
  if (!a || !b) return false;
  if (a === b) return true;

  const da = digitsOnly(a);
  const db = digitsOnly(b);
  if (!da || !db) return false;
  if (da === db) return true;

  return da.length >= 10 && db.length >= 10 && da.slice(-10) === db.slice(-10);
}
