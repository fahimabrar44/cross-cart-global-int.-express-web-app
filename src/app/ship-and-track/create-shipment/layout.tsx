import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Shipment",
  description:
    "Create your international shipment online with Cross Cart Global International Express — book with doorstep pickup, choose your courier, and get automated label generation and tracking.",
  keywords: [
    "create shipment Bangladesh",
    "book courier online",
    "schedule doorstep pickup",
    "international parcel booking",
    "send package abroad",
  ],
  alternates: {
    canonical: "https://crosscartglobal.com/ship-and-track/create-shipment",
  },
  openGraph: {
    title: "Create Shipment | Cross Cart Global International Express",
    description:
      "Book your international shipment online with doorstep pickup, label generation and real-time tracking from Cross Cart Global International Express.",
    url: "https://crosscartglobal.com/ship-and-track/create-shipment",
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
    title: "Create Shipment | Cross Cart Global International Express",
    description:
      "Book your international shipment online with doorstep pickup, label generation and real-time tracking from Cross Cart Global International Express.",
    images: ["/full-logo.png", "/logo.png"],
  },
};

export default function CreateShipmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}