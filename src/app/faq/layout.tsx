import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about shipping with Cross Cart Global International Express — rates, tracking, customs, packaging, pickup and delivery from Bangladesh.",
  keywords: [
    "shipping FAQ Bangladesh",
    "courier questions",
    "how to track shipment",
    "customs documents shipping",
    "Cross Cart FAQ",
  ],
  alternates: {
    canonical: "https://crosscartglobal.com/faq",
  },
  openGraph: {
    title: "FAQ | Cross Cart Global International Express",
    description:
      "Everything you need to know about rates, tracking, customs and delivery with Cross Cart Global International Express from Bangladesh.",
    url: "https://crosscartglobal.com/faq",
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
    title: "FAQ | Cross Cart Global International Express",
    description:
      "Everything you need to know about rates, tracking, customs and delivery with Cross Cart Global International Express from Bangladesh.",
    images: ["/logo.png"],
  },
};

export default function FaqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}