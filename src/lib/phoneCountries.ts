// Country dial codes + names for the frontend dropdown.
//
// All validation/parsing/formatting is delegated to libphonenumber-js for accuracy.

import {
  AsYouType,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  validatePhoneNumberLength,
  type CountryCode,
  type ValidatePhoneNumberLengthResult,
} from "libphonenumber-js";

export interface PhoneCountry {
  iso: string;
  name: string;
  dialCode: string;
  example: string;
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: "AF", name: "Afghanistan", dialCode: "93", example: "7XXXXXXXX" },
  { iso: "AL", name: "Albania", dialCode: "355", example: "6XXXXXXXX" },
  { iso: "DZ", name: "Algeria", dialCode: "213", example: "5XXXXXXXX" },
  {
    iso: "AS",
    name: "American Samoa",
    dialCode: "1684",
    example: "684XXXXXXX",
  },
  { iso: "AD", name: "Andorra", dialCode: "376", example: "3XXXXXXX" },
  { iso: "AO", name: "Angola", dialCode: "244", example: "9XXXXXXXX" },
  { iso: "AI", name: "Anguilla", dialCode: "1264", example: "264XXXXXXX" },
  {
    iso: "AG",
    name: "Antigua and Barbuda",
    dialCode: "1268",
    example: "268XXXXXXX",
  },
  { iso: "AR", name: "Argentina", dialCode: "54", example: "9XXXXXXXXXX" },
  { iso: "AM", name: "Armenia", dialCode: "374", example: "7XXXXXXX" },
  { iso: "AW", name: "Aruba", dialCode: "297", example: "5XXXXXXX" },
  { iso: "AU", name: "Australia", dialCode: "61", example: "4XXXXXXXX" },
  { iso: "AT", name: "Austria", dialCode: "43", example: "6XXXXXXXX" },
  { iso: "AZ", name: "Azerbaijan", dialCode: "994", example: "5XXXXXXXX" },

  { iso: "BS", name: "Bahamas", dialCode: "1242", example: "242XXXXXXX" },
  { iso: "BH", name: "Bahrain", dialCode: "973", example: "3XXXXXXX" },
  { iso: "BD", name: "Bangladesh", dialCode: "880", example: "01XXXXXXXXX" },
  { iso: "BB", name: "Barbados", dialCode: "1246", example: "246XXXXXXX" },
  { iso: "BY", name: "Belarus", dialCode: "375", example: "2XXXXXXXX" },
  { iso: "BE", name: "Belgium", dialCode: "32", example: "4XXXXXXXX" },
  { iso: "BZ", name: "Belize", dialCode: "501", example: "6XXXXXXX" },
  { iso: "BJ", name: "Benin", dialCode: "229", example: "9XXXXXXX" },
  { iso: "BM", name: "Bermuda", dialCode: "1441", example: "441XXXXXXX" },
  { iso: "BT", name: "Bhutan", dialCode: "975", example: "17XXXXXX" },
  { iso: "BO", name: "Bolivia", dialCode: "591", example: "7XXXXXXX" },
  {
    iso: "BA",
    name: "Bosnia and Herzegovina",
    dialCode: "387",
    example: "6XXXXXXX",
  },
  { iso: "BW", name: "Botswana", dialCode: "267", example: "7XXXXXXX" },
  { iso: "BR", name: "Brazil", dialCode: "55", example: "1XXXXXXXXXX" },
  {
    iso: "IO",
    name: "British Indian Ocean Territory",
    dialCode: "246",
    example: "3XXXXXXX",
  },
  {
    iso: "VG",
    name: "British Virgin Islands",
    dialCode: "1284",
    example: "284XXXXXXX",
  },
  { iso: "BN", name: "Brunei", dialCode: "673", example: "XXXXXXXX" },
  { iso: "BG", name: "Bulgaria", dialCode: "359", example: "8XXXXXXXX" },
  { iso: "BF", name: "Burkina Faso", dialCode: "226", example: "7XXXXXXX" },
  { iso: "BI", name: "Burundi", dialCode: "257", example: "7XXXXXXX" },

  { iso: "KH", name: "Cambodia", dialCode: "855", example: "0XXXXXXXX" },
  { iso: "CM", name: "Cameroon", dialCode: "237", example: "6XXXXXXXX" },
  { iso: "CA", name: "Canada", dialCode: "1", example: "4165550123" },
  { iso: "CV", name: "Cape Verde", dialCode: "238", example: "9XXXXXXX" },
  {
    iso: "BQ",
    name: "Caribbean Netherlands",
    dialCode: "599",
    example: "7XXXXXXX",
  },
  {
    iso: "KY",
    name: "Cayman Islands",
    dialCode: "1345",
    example: "345XXXXXXX",
  },
  {
    iso: "CF",
    name: "Central African Republic",
    dialCode: "236",
    example: "7XXXXXXX",
  },
  { iso: "TD", name: "Chad", dialCode: "235", example: "6XXXXXXX" },
  { iso: "CL", name: "Chile", dialCode: "56", example: "9XXXXXXXX" },
  { iso: "CN", name: "China", dialCode: "86", example: "13XXXXXXXXX" },
  { iso: "CX", name: "Christmas Island", dialCode: "61", example: "4XXXXXXXX" },
  {
    iso: "CC",
    name: "Cocos (Keeling) Islands",
    dialCode: "61",
    example: "4XXXXXXXX",
  },
  { iso: "CO", name: "Colombia", dialCode: "57", example: "3XXXXXXXXX" },
  { iso: "KM", name: "Comoros", dialCode: "269", example: "3XXXXXXX" },
  { iso: "CG", name: "Congo", dialCode: "242", example: "0XXXXXXXX" },
  {
    iso: "CD",
    name: "Congo, Democratic Republic of the",
    dialCode: "243",
    example: "8XXXXXXXX",
  },
  { iso: "CK", name: "Cook Islands", dialCode: "682", example: "7XXXXXX" },
  { iso: "CR", name: "Costa Rica", dialCode: "506", example: "8XXXXXXX" },
  { iso: "CI", name: "Côte d'Ivoire", dialCode: "225", example: "0XXXXXXXXX" },
  { iso: "HR", name: "Croatia", dialCode: "385", example: "9XXXXXXXX" },
  { iso: "CU", name: "Cuba", dialCode: "53", example: "5XXXXXXX" },
  { iso: "CW", name: "Curaçao", dialCode: "599", example: "9XXXXXXX" },
  { iso: "CY", name: "Cyprus", dialCode: "357", example: "9XXXXXXX" },
  { iso: "CZ", name: "Czech Republic", dialCode: "420", example: "6XXXXXXXX" },

  { iso: "DK", name: "Denmark", dialCode: "45", example: "2XXXXXXX" },
  { iso: "DJ", name: "Djibouti", dialCode: "253", example: "7XXXXXXX" },
  { iso: "DM", name: "Dominica", dialCode: "1767", example: "767XXXXXXX" },
  {
    iso: "DO",
    name: "Dominican Republic",
    dialCode: "1809",
    example: "809XXXXXXX",
  },

  { iso: "EC", name: "Ecuador", dialCode: "593", example: "9XXXXXXXX" },
  { iso: "EG", name: "Egypt", dialCode: "20", example: "1XXXXXXXXX" },
  { iso: "SV", name: "El Salvador", dialCode: "503", example: "7XXXXXXX" },
  {
    iso: "GQ",
    name: "Equatorial Guinea",
    dialCode: "240",
    example: "2XXXXXXX",
  },
  { iso: "ER", name: "Eritrea", dialCode: "291", example: "7XXXXXXX" },
  { iso: "EE", name: "Estonia", dialCode: "372", example: "5XXXXXXX" },
  { iso: "SZ", name: "Eswatini", dialCode: "268", example: "7XXXXXXX" },
  { iso: "ET", name: "Ethiopia", dialCode: "251", example: "9XXXXXXXX" },

  { iso: "FK", name: "Falkland Islands", dialCode: "500", example: "5XXXX" },
  { iso: "FO", name: "Faroe Islands", dialCode: "298", example: "2XXXXXX" },
  { iso: "FJ", name: "Fiji", dialCode: "679", example: "7XXXXXX" },
  { iso: "FI", name: "Finland", dialCode: "358", example: "4XXXXXXXX" },
  { iso: "FR", name: "France", dialCode: "33", example: "06XXXXXXXX" },
  { iso: "GF", name: "French Guiana", dialCode: "594", example: "694XXXXXX" },
  { iso: "PF", name: "French Polynesia", dialCode: "689", example: "8XXXXXXX" },

  { iso: "GA", name: "Gabon", dialCode: "241", example: "0XXXXXXX" },
  { iso: "GM", name: "Gambia", dialCode: "220", example: "3XXXXXXX" },
  { iso: "GE", name: "Georgia", dialCode: "995", example: "5XXXXXXXX" },
  { iso: "DE", name: "Germany", dialCode: "49", example: "15XXXXXXXXX" },
  { iso: "GH", name: "Ghana", dialCode: "233", example: "2XXXXXXXX" },
  { iso: "GI", name: "Gibraltar", dialCode: "350", example: "5XXXXXXX" },
  { iso: "GR", name: "Greece", dialCode: "30", example: "6XXXXXXXXX" },
  { iso: "GL", name: "Greenland", dialCode: "299", example: "2XXXXXX" },
  { iso: "GD", name: "Grenada", dialCode: "1473", example: "473XXXXXXX" },
  { iso: "GP", name: "Guadeloupe", dialCode: "590", example: "690XXXXXX" },
  { iso: "GU", name: "Guam", dialCode: "1671", example: "671XXXXXXX" },
  { iso: "GT", name: "Guatemala", dialCode: "502", example: "5XXXXXXX" },
  { iso: "GG", name: "Guernsey", dialCode: "44", example: "7XXXXXXXXX" },
  { iso: "GN", name: "Guinea", dialCode: "224", example: "6XXXXXXXX" },
  { iso: "GW", name: "Guinea-Bissau", dialCode: "245", example: "9XXXXXX" },
  { iso: "GY", name: "Guyana", dialCode: "592", example: "6XXXXXX" },

  { iso: "HT", name: "Haiti", dialCode: "509", example: "3XXXXXXX" },
  { iso: "HN", name: "Honduras", dialCode: "504", example: "9XXXXXXX" },
  { iso: "HK", name: "Hong Kong", dialCode: "852", example: "9XXXXXXX" },
  { iso: "HU", name: "Hungary", dialCode: "36", example: "2XXXXXXXX" },

  { iso: "IS", name: "Iceland", dialCode: "354", example: "6XXXXXX" },
  { iso: "IN", name: "India", dialCode: "91", example: "9XXXXXXXXX" },
  { iso: "ID", name: "Indonesia", dialCode: "62", example: "8XXXXXXXXXX" },
  { iso: "IR", name: "Iran", dialCode: "98", example: "9XXXXXXXXX" },
  { iso: "IQ", name: "Iraq", dialCode: "964", example: "7XXXXXXXXX" },
  { iso: "IE", name: "Ireland", dialCode: "353", example: "8XXXXXXXX" },
  { iso: "IM", name: "Isle of Man", dialCode: "44", example: "7XXXXXXXXX" },
  { iso: "IL", name: "Israel", dialCode: "972", example: "5XXXXXXXX" },
  { iso: "IT", name: "Italy", dialCode: "39", example: "3XXXXXXXXX" },

  { iso: "JM", name: "Jamaica", dialCode: "1876", example: "876XXXXXXX" },
  { iso: "JP", name: "Japan", dialCode: "81", example: "90XXXXXXXX" },
  { iso: "JE", name: "Jersey", dialCode: "44", example: "7XXXXXXXXX" },
  { iso: "JO", name: "Jordan", dialCode: "962", example: "7XXXXXXXX" },

  { iso: "KZ", name: "Kazakhstan", dialCode: "7", example: "7XXXXXXXXX" },
  { iso: "KE", name: "Kenya", dialCode: "254", example: "7XXXXXXXX" },
  { iso: "KI", name: "Kiribati", dialCode: "686", example: "6XXXXXXX" },
  { iso: "XK", name: "Kosovo", dialCode: "383", example: "4XXXXXXXX" },
  { iso: "KW", name: "Kuwait", dialCode: "965", example: "5XXXXXXX" },
  { iso: "KG", name: "Kyrgyzstan", dialCode: "996", example: "5XXXXXXXX" },

  { iso: "LA", name: "Laos", dialCode: "856", example: "2XXXXXXXX" },
  { iso: "LV", name: "Latvia", dialCode: "371", example: "2XXXXXXX" },
  { iso: "LB", name: "Lebanon", dialCode: "961", example: "7XXXXXXX" },
  { iso: "LS", name: "Lesotho", dialCode: "266", example: "5XXXXXXX" },
  { iso: "LR", name: "Liberia", dialCode: "231", example: "7XXXXXXX" },
  { iso: "LY", name: "Libya", dialCode: "218", example: "9XXXXXXXX" },
  { iso: "LI", name: "Liechtenstein", dialCode: "423", example: "6XXXXXX" },
  { iso: "LT", name: "Lithuania", dialCode: "370", example: "6XXXXXXX" },
  { iso: "LU", name: "Luxembourg", dialCode: "352", example: "6XXXXXXXX" },

  { iso: "MO", name: "Macau", dialCode: "853", example: "6XXXXXXX" },
  { iso: "MG", name: "Madagascar", dialCode: "261", example: "3XXXXXXXX" },
  { iso: "MW", name: "Malawi", dialCode: "265", example: "9XXXXXXXX" },
  { iso: "MY", name: "Malaysia", dialCode: "60", example: "1XXXXXXXXX" },
  { iso: "MV", name: "Maldives", dialCode: "960", example: "XXXXXXXX" },
  { iso: "ML", name: "Mali", dialCode: "223", example: "7XXXXXXX" },
  { iso: "MT", name: "Malta", dialCode: "356", example: "7XXXXXXX" },
  { iso: "MH", name: "Marshall Islands", dialCode: "692", example: "2XXXXXX" },
  { iso: "MQ", name: "Martinique", dialCode: "596", example: "696XXXXXX" },
  { iso: "MR", name: "Mauritania", dialCode: "222", example: "2XXXXXXX" },
  { iso: "MU", name: "Mauritius", dialCode: "230", example: "5XXXXXXX" },
  { iso: "YT", name: "Mayotte", dialCode: "262", example: "6XXXXXXXX" },
  { iso: "MX", name: "Mexico", dialCode: "52", example: "1XXXXXXXXXX" },
  { iso: "FM", name: "Micronesia", dialCode: "691", example: "3XXXXXX" },
  { iso: "MD", name: "Moldova", dialCode: "373", example: "6XXXXXXX" },
  { iso: "MC", name: "Monaco", dialCode: "377", example: "6XXXXXXX" },
  { iso: "MN", name: "Mongolia", dialCode: "976", example: "8XXXXXXX" },
  { iso: "ME", name: "Montenegro", dialCode: "382", example: "6XXXXXXX" },
  { iso: "MS", name: "Montserrat", dialCode: "1664", example: "664XXXXXXX" },
  { iso: "MA", name: "Morocco", dialCode: "212", example: "6XXXXXXXX" },
  { iso: "MZ", name: "Mozambique", dialCode: "258", example: "8XXXXXXXX" },
  { iso: "MM", name: "Myanmar", dialCode: "95", example: "9XXXXXXXX" },

  { iso: "NA", name: "Namibia", dialCode: "264", example: "8XXXXXXXX" },
  { iso: "NR", name: "Nauru", dialCode: "674", example: "5XXXXXX" },
  { iso: "NP", name: "Nepal", dialCode: "977", example: "98XXXXXXXX" },
  { iso: "NL", name: "Netherlands", dialCode: "31", example: "6XXXXXXXX" },
  { iso: "NC", name: "New Caledonia", dialCode: "687", example: "7XXXXXX" },
  { iso: "NZ", name: "New Zealand", dialCode: "64", example: "2XXXXXXXX" },
  { iso: "NI", name: "Nicaragua", dialCode: "505", example: "8XXXXXXX" },
  { iso: "NE", name: "Niger", dialCode: "227", example: "9XXXXXXX" },
  { iso: "NG", name: "Nigeria", dialCode: "234", example: "8XXXXXXXXX" },
  { iso: "NU", name: "Niue", dialCode: "683", example: "4XXXX" },
  { iso: "NF", name: "Norfolk Island", dialCode: "672", example: "3XXXX" },
  { iso: "KP", name: "North Korea", dialCode: "850", example: "1XXXXXXXX" },
  { iso: "MK", name: "North Macedonia", dialCode: "389", example: "7XXXXXXX" },
  {
    iso: "MP",
    name: "Northern Mariana Islands",
    dialCode: "1670",
    example: "670XXXXXXX",
  },
  { iso: "NO", name: "Norway", dialCode: "47", example: "4XXXXXXX" },

  { iso: "OM", name: "Oman", dialCode: "968", example: "9XXXXXXX" },

  { iso: "PK", name: "Pakistan", dialCode: "92", example: "3XXXXXXXXX" },
  { iso: "PW", name: "Palau", dialCode: "680", example: "6XXXXXX" },
  { iso: "PS", name: "Palestine", dialCode: "970", example: "5XXXXXXXX" },
  { iso: "PA", name: "Panama", dialCode: "507", example: "6XXXXXXX" },
  { iso: "PG", name: "Papua New Guinea", dialCode: "675", example: "7XXXXXX" },
  { iso: "PY", name: "Paraguay", dialCode: "595", example: "9XXXXXXXX" },
  { iso: "PE", name: "Peru", dialCode: "51", example: "9XXXXXXXX" },
  { iso: "PH", name: "Philippines", dialCode: "63", example: "9XXXXXXXXX" },
  { iso: "PL", name: "Poland", dialCode: "48", example: "5XXXXXXXX" },
  { iso: "PT", name: "Portugal", dialCode: "351", example: "9XXXXXXXX" },
  { iso: "PR", name: "Puerto Rico", dialCode: "1787", example: "787XXXXXXX" },

  { iso: "QA", name: "Qatar", dialCode: "974", example: "3XXXXXXX" },

  { iso: "RE", name: "Réunion", dialCode: "262", example: "6XXXXXXXX" },
  { iso: "RO", name: "Romania", dialCode: "40", example: "7XXXXXXXX" },
  { iso: "RU", name: "Russia", dialCode: "7", example: "9XXXXXXXXX" },
  { iso: "RW", name: "Rwanda", dialCode: "250", example: "7XXXXXXXX" },

  {
    iso: "BL",
    name: "Saint Barthélemy",
    dialCode: "590",
    example: "690XXXXXX",
  },
  { iso: "SH", name: "Saint Helena", dialCode: "290", example: "5XXXX" },
  {
    iso: "KN",
    name: "Saint Kitts and Nevis",
    dialCode: "1869",
    example: "869XXXXXXX",
  },
  { iso: "LC", name: "Saint Lucia", dialCode: "1758", example: "758XXXXXXX" },
  { iso: "MF", name: "Saint Martin", dialCode: "590", example: "690XXXXXX" },
  {
    iso: "PM",
    name: "Saint Pierre and Miquelon",
    dialCode: "508",
    example: "5XXXXXX",
  },
  {
    iso: "VC",
    name: "Saint Vincent and the Grenadines",
    dialCode: "1784",
    example: "784XXXXXXX",
  },
  { iso: "WS", name: "Samoa", dialCode: "685", example: "7XXXXXX" },
  { iso: "SM", name: "San Marino", dialCode: "378", example: "6XXXXXXXX" },
  {
    iso: "ST",
    name: "São Tomé and Príncipe",
    dialCode: "239",
    example: "9XXXXXX",
  },
  { iso: "SA", name: "Saudi Arabia", dialCode: "966", example: "5XXXXXXXX" },
  { iso: "SN", name: "Senegal", dialCode: "221", example: "7XXXXXXXX" },
  { iso: "RS", name: "Serbia", dialCode: "381", example: "6XXXXXXXX" },
  { iso: "SC", name: "Seychelles", dialCode: "248", example: "2XXXXXX" },
  { iso: "SL", name: "Sierra Leone", dialCode: "232", example: "7XXXXXXX" },
  { iso: "SG", name: "Singapore", dialCode: "65", example: "8XXXXXXX" },
  { iso: "SX", name: "Sint Maarten", dialCode: "1721", example: "721XXXXXXX" },
  { iso: "SK", name: "Slovakia", dialCode: "421", example: "9XXXXXXXX" },
  { iso: "SI", name: "Slovenia", dialCode: "386", example: "3XXXXXXX" },
  { iso: "SB", name: "Solomon Islands", dialCode: "677", example: "7XXXXXX" },
  { iso: "SO", name: "Somalia", dialCode: "252", example: "6XXXXXXX" },
  { iso: "ZA", name: "South Africa", dialCode: "27", example: "7XXXXXXXX" },
  { iso: "KR", name: "South Korea", dialCode: "82", example: "10XXXXXXXX" },
  { iso: "SS", name: "South Sudan", dialCode: "211", example: "9XXXXXXXX" },
  { iso: "ES", name: "Spain", dialCode: "34", example: "6XXXXXXXX" },
  { iso: "LK", name: "Sri Lanka", dialCode: "94", example: "7XXXXXXXX" },
  { iso: "SD", name: "Sudan", dialCode: "249", example: "9XXXXXXXX" },
  { iso: "SR", name: "Suriname", dialCode: "597", example: "7XXXXXX" },
  {
    iso: "SJ",
    name: "Svalbard and Jan Mayen",
    dialCode: "47",
    example: "4XXXXXXX",
  },
  { iso: "SE", name: "Sweden", dialCode: "46", example: "7XXXXXXXX" },
  { iso: "CH", name: "Switzerland", dialCode: "41", example: "7XXXXXXXX" },
  { iso: "SY", name: "Syria", dialCode: "963", example: "9XXXXXXXX" },

  { iso: "TW", name: "Taiwan", dialCode: "886", example: "9XXXXXXXX" },
  { iso: "TJ", name: "Tajikistan", dialCode: "992", example: "9XXXXXXXX" },
  { iso: "TZ", name: "Tanzania", dialCode: "255", example: "7XXXXXXXX" },
  { iso: "TH", name: "Thailand", dialCode: "66", example: "8XXXXXXXX" },
  { iso: "TL", name: "Timor-Leste", dialCode: "670", example: "7XXXXXXX" },
  { iso: "TG", name: "Togo", dialCode: "228", example: "9XXXXXXX" },
  { iso: "TK", name: "Tokelau", dialCode: "690", example: "7XXXX" },
  { iso: "TO", name: "Tonga", dialCode: "676", example: "8XXXXXX" },
  {
    iso: "TT",
    name: "Trinidad and Tobago",
    dialCode: "1868",
    example: "868XXXXXXX",
  },
  { iso: "TN", name: "Tunisia", dialCode: "216", example: "2XXXXXXX" },
  { iso: "TR", name: "Turkey", dialCode: "90", example: "5XXXXXXXXX" },
  { iso: "TM", name: "Turkmenistan", dialCode: "993", example: "6XXXXXXX" },
  {
    iso: "TC",
    name: "Turks and Caicos Islands",
    dialCode: "1649",
    example: "649XXXXXXX",
  },
  { iso: "TV", name: "Tuvalu", dialCode: "688", example: "9XXXXXX" },

  { iso: "UG", name: "Uganda", dialCode: "256", example: "7XXXXXXXX" },
  { iso: "UA", name: "Ukraine", dialCode: "380", example: "6XXXXXXXX" },
  {
    iso: "AE",
    name: "United Arab Emirates",
    dialCode: "971",
    example: "5XXXXXXXX",
  },
  { iso: "GB", name: "United Kingdom", dialCode: "44", example: "7XXXXXXXXX" },
  { iso: "US", name: "United States", dialCode: "1", example: "2025550123" },
  { iso: "UY", name: "Uruguay", dialCode: "598", example: "9XXXXXXX" },
  { iso: "UZ", name: "Uzbekistan", dialCode: "998", example: "9XXXXXXXX" },
  {
    iso: "VI",
    name: "U.S. Virgin Islands",
    dialCode: "1340",
    example: "340XXXXXXX",
  },

  { iso: "VU", name: "Vanuatu", dialCode: "678", example: "7XXXXXX" },
  { iso: "VA", name: "Vatican City", dialCode: "379", example: "6XXXXXXXX" },
  { iso: "VE", name: "Venezuela", dialCode: "58", example: "4XXXXXXXXX" },
  { iso: "VN", name: "Vietnam", dialCode: "84", example: "9XXXXXXXX" },

  { iso: "WF", name: "Wallis and Futuna", dialCode: "681", example: "7XXXXXX" },
  { iso: "EH", name: "Western Sahara", dialCode: "212", example: "6XXXXXXXX" },

  { iso: "YE", name: "Yemen", dialCode: "967", example: "7XXXXXXXX" },

  { iso: "ZM", name: "Zambia", dialCode: "260", example: "9XXXXXXXX" },
  { iso: "ZW", name: "Zimbabwe", dialCode: "263", example: "7XXXXXXXX" },
];

const COUNTRY_MAP = new Map(
  PHONE_COUNTRIES.map((country) => [country.iso, country]),
);

// Sorted by dial code length (longest first).
const BY_DIAL_CODE = [...PHONE_COUNTRIES].sort(
  (a, b) => b.dialCode.length - a.dialCode.length,
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

  if (!digits) return "";

  try {
    const parsed = parsePhoneNumberFromString(
      digits,
      iso.toUpperCase() as CountryCode,
    );

    if (parsed?.number) {
      return parsed.number;
    }
  } catch {
    // Fall through to manual construction.
  }

  let code = getCountryByIso(iso)?.dialCode;

  try {
    code = getCountryCallingCode(iso.toUpperCase() as CountryCode);
  } catch {
    // Keep curated dial code.
  }

  if (!code) return `+${digits}`;

  // Most national formats include a trunk prefix "0".
  // We only use this as a fallback when libphonenumber-js couldn't parse it.
  const nationalDigits = digits.startsWith("0") ? digits.slice(1) : digits;

  return `+${code}${nationalDigits}`;
}

// Parse an E.164 (or "+dialcode...") string back into { iso, national }.
export function parseE164(
  value: string,
  fallbackIso = "BD",
): { iso: string; national: string } {
  const trimmed = (value || "").trim();

  if (!trimmed.startsWith("+")) {
    return {
      iso: fallbackIso.toUpperCase(),
      national: onlyDigits(trimmed),
    };
  }

  const parsed = parsePhoneNumberFromString(trimmed);

  if (parsed?.country) {
    return {
      iso: parsed.country,
      national: parsed.nationalNumber,
    };
  }

  for (const country of BY_DIAL_CODE) {
    const prefix = `+${country.dialCode}`;

    if (trimmed.startsWith(prefix)) {
      return {
        iso: country.iso,
        national: onlyDigits(trimmed.slice(prefix.length)),
      };
    }
  }

  return {
    iso: fallbackIso.toUpperCase(),
    national: onlyDigits(trimmed),
  };
}

// Format a national number for display as the user types.
export function formatNational(iso: string, national: string): string {
  const digits = onlyDigits(national);

  try {
    return new AsYouType(iso.toUpperCase() as CountryCode).input(digits);
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

// Validate a national number for a known country.
export function validateNational(
  iso: string,
  nationalRaw: string,
): PhoneValidation {
  const countryIso = iso.toUpperCase();
  const digits = onlyDigits(nationalRaw);
  const country = getCountryByIso(countryIso);
  const name = country?.name ?? countryIso;

  if (!digits) {
    return {
      valid: false,
      error: "Phone number is required",
      iso: countryIso,
    };
  }

  let status: ValidatePhoneNumberLengthResult | undefined;

  try {
    status = validatePhoneNumberLength(nationalRaw, countryIso as CountryCode);
  } catch {
    return {
      valid: false,
      error: "Please select a valid country",
      iso: countryIso,
    };
  }

  if (
    status === "TOO_SHORT" ||
    status === "TOO_LONG" ||
    status === "INVALID_LENGTH"
  ) {
    return {
      valid: false,
      error: `Enter a valid ${name} phone number`,
      iso: countryIso,
    };
  }

  if (status === "INVALID_COUNTRY") {
    return {
      valid: false,
      error: "Please select a country",
      iso: countryIso,
    };
  }

  if (status) {
    return {
      valid: false,
      error: "Enter a valid phone number",
      iso: countryIso,
    };
  }

  if (!isValidPhoneNumber(nationalRaw, countryIso as CountryCode)) {
    return {
      valid: false,
      error: `Enter a valid ${name} phone number`,
      iso: countryIso,
    };
  }

  return {
    valid: true,
    iso: countryIso,
    e164: buildE164(countryIso, nationalRaw),
  };
}

// Validate a full phone value (E.164).
// Returns the parsed country + E.164 when valid.
export function validatePhone(
  value: string,
  fallbackIso = "BD",
): PhoneValidation {
  const { iso, national } = parseE164(value, fallbackIso);

  return validateNational(iso, national);
}

// Strip everything except digits.
// "+880 1712-345678" -> "8801712345678".
export function normalizePhone(p?: string | null): string {
  if (!p) return "";

  return p.replace(/\D/g, "");
}

// Compare two phone numbers tolerantly.
//
// Examples:
// "+8801712345678"
// "01712345678"
// "8801712345678"
// "1712345678"
export function phonesEqual(a?: string | null, b?: string | null): boolean {
  const da = normalizePhone(a);
  const db = normalizePhone(b);

  if (!da || !db) return false;

  if (da === db) return true;

  // First try parsing both values as phone numbers.
  try {
    const pa = parsePhoneNumberFromString(
      a?.trim().startsWith("+") ? a : `+${da}`,
    );

    const pb = parsePhoneNumberFromString(
      b?.trim().startsWith("+") ? b : `+${db}`,
    );

    if (pa?.number && pb?.number && pa.number === pb.number) {
      return true;
    }
  } catch {
    // Fall back to tolerant digit comparison.
  }

  // Legacy tolerant comparison for local/international format differences.
  if (da.length >= 10 && db.length >= 10 && da.slice(-10) === db.slice(-10)) {
    return true;
  }

  return false;
}
