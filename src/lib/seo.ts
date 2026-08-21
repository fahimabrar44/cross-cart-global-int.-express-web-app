import type { Metadata } from "next";

export const SITE_URL = "https://www.crosscartglobal.com";
export const BRAND = "Cross Cart Global International Express";
export const BRAND_SHORT = "Cross Cart";

// Courier brands we partner with — we want to surface alongside their searches.
export const COURIER_BRANDS = ["FedEx", "UPS", "DHL", "Aramex"] as const;

// Keywords present on every public page (brand + service terms + couriers).
// ~100 courier-focused phrases so the site ranks for DHL / FedEx / UPS / Aramex
// and international-courier search intent.
export const CORE_KEYWORDS: string[] = [
  // Brand variants
  BRAND_SHORT,
  "Cross Cart Global",
  BRAND,
  "Cross Cart Global International Express Courier",
  "Cross Cart Courier",
  "Cross Cart Global Courier",
  "Cross Cart shipping",
  "Cross Cart tracking",
  "Cross Cart Bangladesh",

  // Core service terms
  "international courier",
  "international courier service",
  "international shipping",
  "international courier Bangladesh",
  "courier service Bangladesh",
  "global courier service",
  "worldwide courier",
  "worldwide shipping",
  "global shipping company",
  "global logistics company",
  "overseas courier",
  "overseas shipping",
  "courier from Bangladesh",
  "ship from Bangladesh",
  "send parcel abroad from Bangladesh",
  "parcel delivery Bangladesh",
  "doorstep pickup Bangladesh",
  "door to door courier Bangladesh",

  // Courier brands + country combos
  "DHL",
  "FedEx",
  "UPS",
  "Aramex",
  "DHL Bangladesh",
  "FedEx Bangladesh",
  "UPS Bangladesh",
  "Aramex Bangladesh",
  "DHL shipping",
  "FedEx shipping",
  "UPS express",
  "Aramex courier",
  "DHL courier service",
  "FedEx courier service",
  "UPS courier service",
  "Aramex shipping",
  "DHL FedEx UPS Aramex",
  "cheap DHL courier",
  "cheap FedEx courier",
  "cheap UPS courier",
  "cheap Aramex courier",
  "discount DHL rates",
  "discount FedEx rates",
  "discount UPS rates",
  "discount Aramex rates",
  "DHL rates Bangladesh",
  "FedEx rates Bangladesh",
  "UPS rates Bangladesh",
  "Aramex rates Bangladesh",
  "DHL tracking",
  "FedEx tracking",
  "UPS tracking",
  "Aramex tracking",

  // Comparison / intent
  "best international courier Bangladesh",
  "cheapest international courier Bangladesh",
  "cheapest courier to USA",
  "cheap courier to UK",
  "international courier rates",
  "courier charges Bangladesh",
  "courier near me",
  "courier company in Bangladesh",
  "top courier companies Bangladesh",
  "reliable courier service Bangladesh",
  "trusted courier Bangladesh",
  "fast international shipping",
  "express courier Bangladesh",
  "express international delivery",
  "same day courier Bangladesh",

  // Destinations
  "ship to USA from Bangladesh",
  "ship to UK from Bangladesh",
  "ship to Canada from Bangladesh",
  "ship to Australia from Bangladesh",
  "ship to Europe from Bangladesh",
  "ship to UAE from Bangladesh",
  "ship to Malaysia from Bangladesh",
  "ship to India from Bangladesh",
  "ship to China from Bangladesh",
  "ship to Saudi Arabia from Bangladesh",
  "courier to USA",
  "courier to UK",
  "courier to Canada",
  "courier to Australia",
  "courier to Europe",
  "courier to Dubai",
  "courier to Singapore",

  // Services
  "air freight Bangladesh",
  "sea freight Bangladesh",
  "ocean freight Bangladesh",
  "freight forwarding Bangladesh",
  "customs clearance Bangladesh",
  "parcel tracking",
  "courier tracking",
  "shipment tracking",
  "real time tracking",
  "ecommerce logistics Bangladesh",
  "ecommerce fulfillment Bangladesh",
  "order fulfillment Bangladesh",
  "COD fulfillment Bangladesh",
  "warehousing Bangladesh",
  "supply chain Bangladesh",
  "bulk courier shipping",
  "business courier solutions",
  "corporate courier Bangladesh",
  "document courier service",
  "gift courier service",
  "commercial shipment Bangladesh",

  // Booking / import-export intent
  "online courier booking",
  "book courier online Bangladesh",
  "schedule pickup Bangladesh",
  "international delivery service",
  "cross border shipping",
  "import export logistics Bangladesh",
  "export shipping Bangladesh",
  "import shipping Bangladesh",
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
