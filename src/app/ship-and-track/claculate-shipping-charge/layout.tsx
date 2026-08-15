import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculate Shipping Charge",
  description:
    "Calculate international shipping charges from Bangladesh instantly. Get transparent quotes for parcels to any destination through DHL, FedEx, Aramex and UPS with Cross Cart Global International Express.",
  keywords: [
    "calculate shipping cost",
    "international shipping charges Bangladesh",
    "parcel delivery price",
    "courier rate calculator",
    "estimate shipping cost",
  ],
  alternates: {
    canonical:
      "https://crosscartglobal.com/ship-and-track/claculate-shipping-charge",
  },
  openGraph: {
    title: "Calculate Shipping Charge | Cross Cart Global International Express",
    description:
      "Get instant, transparent international shipping quotes from Bangladesh to any destination with Cross Cart Global International Express.",
    url: "https://crosscartglobal.com/ship-and-track/claculate-shipping-charge",
    siteName: "Cross Cart Global International Express",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Cross Cart Global International Express",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@crosscartglobal",
    creator: "@crosscartglobal",
    title: "Calculate Shipping Charge | Cross Cart Global International Express",
    description:
      "Get instant, transparent international shipping quotes from Bangladesh to any destination with Cross Cart Global International Express.",
    images: ["/logo.png"],
  },
};

export default function CalculateShippingChargeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}