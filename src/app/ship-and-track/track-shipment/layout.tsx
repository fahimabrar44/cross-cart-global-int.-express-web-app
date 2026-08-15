import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Shipment",
  description:
    "Track your international shipment in real time with Cross Cart Global International Express — get live status updates and delivery notifications from pickup to doorstep.",
  keywords: [
    "track shipment Bangladesh",
    "track parcel status",
    "courier tracking number",
    "international shipment tracking",
    "delivery updates",
  ],
  alternates: {
    canonical: "https://crosscartglobal.com/ship-and-track/track-shipment",
  },
  openGraph: {
    title: "Track Shipment | Cross Cart Global International Express",
    description:
      "Track your international parcel in real time with live status updates and delivery notifications from Cross Cart Global International Express.",
    url: "https://crosscartglobal.com/ship-and-track/track-shipment",
    siteName: "Cross Cart Global International Express",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/full-logo.png",
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
    title: "Track Shipment | Cross Cart Global International Express",
    description:
      "Track your international parcel in real time with live status updates and delivery notifications from Cross Cart Global International Express.",
    images: ["/full-logo.png", "/logo.png"],
  },
};

export default function TrackShipmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}