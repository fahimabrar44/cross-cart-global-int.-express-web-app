// Country dial codes + local phone-number digit-length rules for frontend validation.
// `min`/`max` are the number of digits a user types locally (including any leading 0).
// When building the E.164 value we strip a single leading "0" (national trunk prefix).

export interface PhoneCountry {
  iso: string;
  name: string;
  dialCode: string;
  min: number;
  max: number;
  example: string;
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: "BD", name: "Bangladesh", dialCode: "880", min: 11, max: 11, example: "01XXXXXXXXX" },
  { iso: "IN", name: "India", dialCode: "91", min: 10, max: 10, example: "9XXXXXXXXX" },
  { iso: "PK", name: "Pakistan", dialCode: "92", min: 10, max: 11, example: "03XXYYYYYYY" },
  { iso: "NP", name: "Nepal", dialCode: "977", min: 10, max: 10, example: "98XXXXXXXX" },
  { iso: "LK", name: "Sri Lanka", dialCode: "94", min: 9, max: 10, example: "07XYYYYYYY" },
  { iso: "US", name: "United States", dialCode: "1", min: 10, max: 10, example: "2025550123" },
  { iso: "CA", name: "Canada", dialCode: "1", min: 10, max: 10, example: "4165550123" },
  { iso: "GB", name: "United Kingdom", dialCode: "44", min: 11, max: 11, example: "07XXXYYYYYY" },
  { iso: "AU", name: "Australia", dialCode: "61", min: 9, max: 10, example: "4XXYYYXXXX" },
  { iso: "AE", name: "United Arab Emirates", dialCode: "971", min: 9, max: 9, example: "05XYYYYYYY" },
  { iso: "SA", name: "Saudi Arabia", dialCode: "966", min: 9, max: 9, example: "05XYYYYYYY" },
  { iso: "SG", name: "Singapore", dialCode: "65", min: 8, max: 8, example: "9XXXXXXXX" },
  { iso: "MY", name: "Malaysia", dialCode: "60", min: 9, max: 10, example: "01XYYYYYYY" },
  { iso: "CN", name: "China", dialCode: "86", min: 11, max: 11, example: "13XXXXXXXXX" },
  { iso: "HK", name: "Hong Kong", dialCode: "852", min: 8, max: 8, example: "9XXXXXXXX" },
  { iso: "JP", name: "Japan", dialCode: "81", min: 10, max: 11, example: "090XXXXXXXX" },
  { iso: "KR", name: "South Korea", dialCode: "82", min: 10, max: 11, example: "010XXXXXXXX" },
  { iso: "TH", name: "Thailand", dialCode: "66", min: 9, max: 10, example: "08XYYYYYYY" },
  { iso: "ID", name: "Indonesia", dialCode: "62", min: 9, max: 12, example: "08XXXXXXXXXX" },
  { iso: "PH", name: "Philippines", dialCode: "63", min: 10, max: 10, example: "09XXYYYXXXX" },
  { iso: "VN", name: "Vietnam", dialCode: "84", min: 9, max: 10, example: "09XXYYYYYY" },
  { iso: "DE", name: "Germany", dialCode: "49", min: 10, max: 11, example: "17XYYYYYYYY" },
  { iso: "FR", name: "France", dialCode: "33", min: 9, max: 9, example: "06XXYYYYYY" },
  { iso: "IT", name: "Italy", dialCode: "39", min: 9, max: 10, example: "3XXYYYYYYY" },
  { iso: "ES", name: "Spain", dialCode: "34", min: 9, max: 9, example: "6XXYYYYYY" },
  { iso: "NL", name: "Netherlands", dialCode: "31", min: 9, max: 9, example: "6XXXXXXXX" },
  { iso: "BE", name: "Belgium", dialCode: "32", min: 9, max: 9, example: "4XXXXXXXX" },
  { iso: "CH", name: "Switzerland", dialCode: "41", min: 9, max: 9, example: "7XXXXXXXX" },
  { iso: "AT", name: "Austria", dialCode: "43", min: 10, max: 11, example: "6XXXXXXXX" },
  { iso: "SE", name: "Sweden", dialCode: "46", min: 9, max: 10, example: "7XXXXXXXX" },
  { iso: "NO", name: "Norway", dialCode: "47", min: 8, max: 8, example: "4XXXXXXXX" },
  { iso: "DK", name: "Denmark", dialCode: "45", min: 8, max: 8, example: "2XXXXXXXX" },
  { iso: "FI", name: "Finland", dialCode: "358", min: 9, max: 10, example: "4XXXXXXXX" },
  { iso: "PL", name: "Poland", dialCode: "48", min: 9, max: 9, example: "5XXXXXXXX" },
  { iso: "RU", name: "Russia", dialCode: "7", min: 10, max: 10, example: "9XXXXXXXXXX" },
  { iso: "TR", name: "Turkey", dialCode: "90", min: 10, max: 10, example: "5XXXXXXXXXX" },
  { iso: "EG", name: "Egypt", dialCode: "20", min: 10, max: 10, example: "1XXXXXXXXX" },
  { iso: "NG", name: "Nigeria", dialCode: "234", min: 10, max: 11, example: "08XXXXXXXX" },
  { iso: "KE", name: "Kenya", dialCode: "254", min: 9, max: 10, example: "07XXXXXXXX" },
  { iso: "ZA", name: "South Africa", dialCode: "27", min: 9, max: 10, example: "07XXXXXXXX" },
  { iso: "MA", name: "Morocco", dialCode: "212", min: 9, max: 9, example: "6XXXXXXXX" },
  { iso: "GH", name: "Ghana", dialCode: "233", min: 9, max: 10, example: "02XXXXXXX" },
  { iso: "BR", name: "Brazil", dialCode: "55", min: 10, max: 11, example: "1XXXXXXXXXX" },
  { iso: "MX", name: "Mexico", dialCode: "52", min: 10, max: 10, example: "1XXYYYYYYYY" },
  { iso: "AR", name: "Argentina", dialCode: "54", min: 10, max: 11, example: "9XXXXXXXXXX" },
  { iso: "QA", name: "Qatar", dialCode: "974", min: 8, max: 8, example: "3XXXXXXX" },
  { iso: "KW", name: "Kuwait", dialCode: "965", min: 8, max: 8, example: "5XXXXXXX" },
  { iso: "OM", name: "Oman", dialCode: "968", min: 8, max: 8, example: "9XXXXXXX" },
  { iso: "BH", name: "Bahrain", dialCode: "973", min: 8, max: 8, example: "3XXXXXXX" },
  { iso: "LB", name: "Lebanon", dialCode: "961", min: 8, max: 8, example: "7XXXXXXX" },
  { iso: "JO", name: "Jordan", dialCode: "962", min: 9, max: 9, example: "7XXXXXXXX" },
  { iso: "IQ", name: "Iraq", dialCode: "964", min: 10, max: 10, example: "7XXXXXXXXXX" },
  { iso: "AF", name: "Afghanistan", dialCode: "93", min: 9, max: 9, example: "7XXXXXXX" },
  { iso: "MM", name: "Myanmar", dialCode: "95", min: 9, max: 10, example: "9XXXXXXXX" },
  { iso: "KH", name: "Cambodia", dialCode: "855", min: 9, max: 9, example: "0XXXXXXXX" },
  { iso: "BN", name: "Brunei", dialCode: "673", min: 7, max: 8, example: "XXXXXXXX" },
  { iso: "MV", name: "Maldives", dialCode: "960", min: 7, max: 8, example: "XXXXXXXX" },
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

// Strip a single leading national trunk "0" before building the E.164 number.
function toNationalDigits(input: string): string {
  const d = onlyDigits(input);
  return d.startsWith("0") ? d.slice(1) : d;
}

export function buildE164(iso: string, national: string): string {
  const country = getCountryByIso(iso);
  if (!country) return "";
  const nationalDigits = toNationalDigits(national);
  return `+${country.dialCode}${nationalDigits}`;
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
  for (const c of BY_DIAL_CODE) {
    if (trimmed.startsWith(`+${c.dialCode}`)) {
      const national = trimmed.slice(`+${c.dialCode}`.length);
      return { iso: c.iso, national: onlyDigits(national) };
    }
  }
  return { iso: fallbackIso, national: onlyDigits(trimmed) };
}

export interface PhoneValidation {
  valid: boolean;
  error?: string;
  iso?: string;
  e164?: string;
}

// Validate a full phone value (E.164). Returns the parsed country + E.164 when valid.
export function validatePhone(value: string, fallbackIso = "BD"): PhoneValidation {
  const { iso, national } = parseE164(value, fallbackIso);
  const country = getCountryByIso(iso);
  if (!country) {
    return { valid: false, error: "Please select a country", iso };
  }
  const digits = national; // already stripped of trunk 0 + non-digits
  if (digits.length === 0) {
    return { valid: false, error: "Phone number is required", iso };
  }
  if (digits.length < country.min || digits.length > country.max) {
    return {
      valid: false,
      error: `Enter a valid ${country.name} number (${country.min}-${country.max} digits)`,
      iso,
    };
  }
  return { valid: true, iso, e164: `+${country.dialCode}${digits}` };
}
