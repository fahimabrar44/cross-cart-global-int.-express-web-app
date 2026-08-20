import type { Metadata } from "next";

export const SITE_URL = "https://crosscartglobal.com";
export const BRAND = "Cross Cart Global International Express";
export const BRAND_SHORT = "Cross Cart";

// Courier brands we partner with — we want to surface alongside their searches.
export const COURIER_BRANDS = ["FedEx", "UPS", "DHL", "Aramex"] as const;

// Keywords present on every public page (brand + service terms + couriers).
export const CORE_KEYWORDS: string[] = [
  BRAND_SHORT,
  "Cross Cart Global",
  BRAND,
  "Cross Cart Global International Express Courier",
  "international courier",
  "international courier service",
  "international shipping",
  "courier service Bangladesh",
  "global logistics company",
  "worldwide delivery",
  "ship from Bangladesh",
  "Bangladesh courier agency",
  ...COURIER_BRANDS,
  "FedEx shipping",
  "DHL shipping",
  "UPS express",
  "Aramex courier",
  "discounted courier rates",
  "doorstep pickup Bangladesh",
];

// Merge the site-wide core keywords with page-specific extras (de-duplicated).
export function mergeKeywords(extra: string[] = []): string[] {
  return Array.from(new Set<string>([...CORE_KEYWORDS, ...extra]));
}

export interface PageSeoInput {
  // Page-specific title; the root layout template appends " | Cross Cart Global International Express".
  title: string;
  // Unique, keyword-rich description (1–3 sentences).
  description: string;
  // Route path, e.g. "/about" or "/ship-and-track/track-shipment".
  path: string;
  // Extra, page-specific keywords (brand/courier terms are added automatically).
  keywords?: string[];
  canonical?: string;
}

// Build consistent, brand + courier rich metadata for a public page.
export function pageMetadata(input: PageSeoInput): Metadata {
  const url = `${SITE_URL}${input.path}`;
  const description = input.description;
  const keywords = mergeKeywords(input.keywords);
  const fullTitle = `${input.title} | ${BRAND}`;

  return {
    title: input.title,
    description,
    keywords,
    alternates: { canonical: input.canonical ?? url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: BRAND,
      type: "website",
      locale: "en_US",
      images: [{ url: "/full-logo.png", width: 1200, height: 630, alt: BRAND }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@crosscartglobal",
      creator: "@crosscartglobal",
      title: fullTitle,
      description,
      images: ["/full-logo.png", "/logo.png"],
    },
    robots: { index: true, follow: true },
  };
}
