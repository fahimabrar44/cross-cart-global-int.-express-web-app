import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coverage Area",
  description:
    "Cross Cart Global International Express delivers to 100+ countries and territories worldwide. Explore our coverage area, popular routes and supported destinations from Bangladesh.",
  keywords: [
    "international shipping coverage",
    "countries we ship to",
    "courier coverage Bangladesh",
    "popular shipping routes",
    "worldwide delivery destinations",
  ],
  alternates: {
    canonical: "https://crosscartglobal.com/about/coverage-area",
  },
  openGraph: {
    title: "Coverage Area | Cross Cart Global International Express",
    description:
      "We deliver to 100+ countries and territories worldwide — explore popular routes and all supported destinations from Bangladesh.",
    url: "https://crosscartglobal.com/about/coverage-area",
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
    title: "Coverage Area | Cross Cart Global International Express",
    description:
      "We deliver to 100+ countries and territories worldwide — explore popular routes and all supported destinations from Bangladesh.",
    images: ["/logo.png"],
  },
};

export default function CoverageAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}