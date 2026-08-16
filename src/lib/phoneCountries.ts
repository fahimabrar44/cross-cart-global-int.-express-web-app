// Country dial codes + names for the frontend dropdown.
// All validation/parsing/formatting is delegated to libphonenumber-js for accuracy.

import {
  parsePhoneNumberFromString,
  isValidPhoneNumber,
  validatePhoneNumberLength,
  getCountryCallingCode,
  AsYouType,
  type CountryCode,
} from "libphonenumber-js";

export interface PhoneCountry {
  iso: string;
  name: string;
  dialCode: string;
  example: string;
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: "BD", name: "Bangladesh", dialCode: "880", example: "01XXXXXXXXX" },
  { iso: "IN", name: "India", dialCode: "91", example: "9XXXXXXXXX" },
  { iso: "PK", name: "Pakistan", dialCode: "92", example: "03XXYYYYYYY" },
  { iso: "NP", name: "Nepal", dialCode: "977", example: "98XXXXXXXX" },
  { iso: "LK", name: "Sri Lanka", dialCode: "94", example: "07XYYYYYYY" },
  { iso: "US", name: "United States", dialCode: "1", example: "2025550123" },
  { iso: "CA", name: "Canada", dialCode: "1", example: "4165550123" },
  { iso: "GB", name: "United Kingdom", dialCode: "44", example: "07XXXYYYYYY" },
  { iso: "AU", name: "Australia", dialCode: "61", example: "4XXYYYXXXX" },
  { iso: "AE", name: "United Arab Emirates", dialCode: "971", example: "05XYYYYYYY" },
  { iso: "SA", name: "Saudi Arabia", dialCode: "966", example: "05XYYYYYYY" },
  { iso: "SG", name: "Singapore", dialCode: "65", example: "9XXXXXXXX" },
  { iso: "MY", name: "Malaysia", dialCode: "60", example: "01XYYYYYYY" },
  { iso: "CN", name: "China", dialCode: "86", example: "13XXXXXXXXX" },
  { iso: "HK", name: "Hong Kong", dialCode: "852", example: "9XXXXXXXX" },
  { iso: "JP", name: "Japan", dialCode: "81", example: "090XXXXXXXX" },
  { iso: "KR", name: "South Korea", dialCode: "82", example: "010XXXXXXXX" },
  { iso: "TH", name: "Thailand", dialCode: "66", example: "08XYYYYYYY" },
  { iso: "ID", name: "Indonesia", dialCode: "62", example: "08XXXXXXXXXX" },
  { iso: "PH", name: "Philippines", dialCode: "63", example: "09XXYYYXXXX" },
  { iso: "VN", name: "Vietnam", dialCode: "84", example: "09XXYYYYYY" },
  { iso: "DE", name: "Germany", dialCode: "49", example: "17XYYYYYYYY" },
  { iso: "FR", name: "France", dialCode: "33", example: "06XXYYYYYY" },
  { iso: "IT", name: "Italy", dialCode: "39", example: "3XXYYYYYYY" },
  { iso: "ES", name: "Spain", dialCode: "34", example: "6XXYYYYYY" },
  { iso: "NL", name: "Netherlands", dialCode: "31", example: "6XXXXXXXX" },
  { iso: "BE", name: "Belgium", dialCode: "32", example: "4XXXXXXXX" },
  { iso: "CH", name: "Switzerland", dialCode: "41", example: "7XXXXXXXX" },
  { iso: "AT", name: "Austria", dialCode: "43", example: "6XXXXXXXX" },
  { iso: "SE", name: "Sweden", dialCode: "46", example: "7XXXXXXXX" },
  { iso: "NO", name: "Norway", dialCode: "47", example: "4XXXXXXXX" },
  { iso: "DK", name: "Denmark", dialCode: "45", example: "2XXXXXXXX" },
  { iso: "FI", name: "Finland", dialCode: "358", example: "4XXXXXXXX" },
  { iso: "PL", name: "Poland", dialCode: "48", example: "5XXXXXXXX" },
  { iso: "RU", name: "Russia", dialCode: "7", example: "9XXXXXXXXXX" },
  { iso: "TR", name: "Turkey", dialCode: "90", example: "5XXXXXXXXXX" },
  { iso: "EG", name: "Egypt", dialCode: "20", example: "1XXXXXXXXX" },
  { iso: "NG", name: "Nigeria", dialCode: "234", example: "08XXXXXXXX" },
  { iso: "KE", name: "Kenya", dialCode: "254", example: "07XXXXXXXX" },
  { iso: "ZA", name: "South Africa", dialCode: "27", example: "07XXXXXXXX" },
  { iso: "MA", name: "Morocco", dialCode: "212", example: "6XXXXXXXX" },
  { iso: "GH", name: "Ghana", dialCode: "233", example: "02XXXXXXX" },
  { iso: "BR", name: "Brazil", dialCode: "55", example: "1XXXXXXXXXX" },
  { iso: "MX", name: "Mexico", dialCode: "52", example: "1XXYYYYYYYY" },
  { iso: "AR", name: "Argentina", dialCode: "54", example: "9XXXXXXXXXX" },
  { iso: "QA", name: "Qatar", dialCode: "974", example: "3XXXXXXX" },
  { iso: "KW", name: "Kuwait", dialCode: "965", example: "5XXXXXXX" },
  { iso: "OM", name: "Oman", dialCode: "968", example: "9XXXXXXX" },
  { iso: "BH", name: "Bahrain", dialCode: "973", example: "3XXXXXXX" },
  { iso: "LB", name: "Lebanon", dialCode: "961", example: "7XXXXXXX" },
  { iso: "JO", name: "Jordan", dialCode: "962", example: "7XXXXXXXX" },
  { iso: "IQ", name: "Iraq", dialCode: "964", example: "7XXXXXXXXXX" },
  { iso: "AF", name: "Afghanistan", dialCode: "93", example: "7XXXXXXX" },
  { iso: "MM", name: "Myanmar", dialCode: "95", example: "9XXXXXXXX" },
  { iso: "KH", name: "Cambodia", dialCode: "855", example: "0XXXXXXXX" },
  { iso: "BN", name: "Brunei", dialCode: "673", example: "XXXXXXXX" },
  { iso: "MV", name: "Maldives", dialCode: "960", example: "XXXXXXXX" },
];

const COUNTRY_MAP = new Map(PHONE_COUNTRIES.map((c) => [c.iso, c]));

// Sorted by dial code length (longest first) so e.g. "+1" doesn't win over "+1242".
const BY_DIAL_CODE = [...PHONE_COUNTRIES].sort(
  (a, b) => b.dialCode.length - a.dialCode.length
);

export function getCountryByIso(iso: string): PhoneCountry | undefined {
  return COUNTRY_MAP.get(iso.toUpperCase());
}

export function flagEmoji(iso: string): string {
  return iso
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

function onlyDigits(input: string): string {
  return input.replace(/\D/g, "");
}

// Build a canonical E.164 string from a country + national number.
export function buildE164(iso: string, national: string): string {
  const digits = onlyDigits(national);
  const nationalDigits = digits.startsWith("0") ? digits.slice(1) : digits;
  try {
    const p = parsePhoneNumberFromString(national, iso as CountryCode);
    if (p?.number) return p.number;
  } catch {
    // fall through to manual construction
  }
  let code = getCountryByIso(iso)?.dialCode;
  try {
    code = getCountryCallingCode(iso as CountryCode);
  } catch {
    // keep curated dial code
  }
  return `+${code}${nationalDigits}`;
}

// Parse an E.164 (or "+dialcode...") string back into { iso, national }.
export function parseE164(
  value: string,
  fallbackIso = "BD"
): { iso: string; national: string } {
  const trimmed = (value || "").trim();
  if (!trimmed.startsWith("+")) {
    return { iso: fallbackIso, national: onlyDigits(trimmed) };
  }
  const p = parsePhoneNumberFromString(trimmed);
  if (p && p.country) {
    return { iso: p.country, national: p.nationalNumber };
  }
  for (const c of BY_DIAL_CODE) {
    if (trimmed.startsWith(`+${c.dialCode}`)) {
      const national = trimmed.slice(`+${c.dialCode}`.length);
      return { iso: c.iso, national: onlyDigits(national) };
    }
  }
  return { iso: fallbackIso, national: onlyDigits(trimmed) };
}

// Format a national number for display as the user types (grouping by country).
export function formatNational(iso: string, national: string): string {
  const digits = onlyDigits(national);
  try {
    return new AsYouType(iso as CountryCode).input(digits);
  } catch {
    return digits;
  }
}

export interface PhoneValidation {
  valid: boolean;
  error?: string;
  iso?: string;
  e164?: string;
}

// Validate a national number for a known country (used for live component feedback).
export function validateNational(iso: string, nationalRaw: string): PhoneValidation {
  const digits = onlyDigits(nationalRaw);
  const country = getCountryByIso(iso);
  const name = country?.name ?? iso;
  if (!digits) {
    return { valid: false, error: "Phone number is required", iso };
  }
  const status = validatePhoneNumberLength(nationalRaw, iso as CountryCode);
  if (status === "TOO_SHORT" || status === "TOO_LONG" || status === "INVALID_LENGTH") {
    return { valid: false, error: `Enter a valid ${name} phone number`, iso };
  }
  if (status === "INVALID_COUNTRY") {
    return { valid: false, error: "Please select a country", iso };
  }
  if (status) {
    return { valid: false, error: "Enter a valid phone number", iso };
  }
  if (!isValidPhoneNumber(nationalRaw, iso as CountryCode)) {
    return { valid: false, error: "Enter a valid phone number", iso };
  }
  return { valid: true, iso, e164: buildE164(iso, nationalRaw) };
}

// Validate a full phone value (E.164). Returns the parsed country + E.164 when valid.
export function validatePhone(value: string, fallbackIso = "BD"): PhoneValidation {
  const { iso, national } = parseE164(value, fallbackIso);
  return validateNational(iso, national);
}
