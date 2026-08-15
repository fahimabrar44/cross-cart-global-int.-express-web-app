import type { Metadata } from "next";
import HeroHomeSection from "@/components/Home/HeroHomeSection";
import HomeCustomerReviewSection from "@/components/Home/HomeCustomerReviewSection";
import HomeCustomerServiceSection from "@/components/Home/HomeCustomerServiceSection";
import HomeSaliderSectation from "@/components/Home/HomeSaliderSectation";
import HomeServiceQuickLinksSection from "@/components/Home/HomeServiceQuickLinksSection";

const siteName = "Cross Cart Global International Express";
const siteUrl = "https://crosscartglobal.com";

export const metadata: Metadata = {
  title:
    "International Courier Services in Bangladesh – Doorstep Pickup & Worldwide Delivery",
  description:
    "Ship documents, gifts and parcels worldwide from Bangladesh at discounted rates. Cross Cart Global International Express partners with DHL, FedEx, Aramex and UPS for reliable international courier delivery with free doorstep pickup.",
  keywords: [
    "international courier Bangladesh",
    "parcel delivery Bangladesh",
    "ship from Bangladesh abroad",
    "DHL FedEx Aramex UPS discount",
    "doorstep pickup courier",
    "international shipping Bangladesh",
    "cross cart global",
  ],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title:
      "International Courier Services in Bangladesh – Cross Cart Global International Express",
    description:
      "Affordable, reliable international courier delivery from Bangladesh with doorstep pickup. Trusted network of DHL, FedEx, Aramex and UPS.",
    url: siteUrl,
    siteName,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@crosscartglobal",
    creator: "@crosscartglobal",
    title:
      "International Courier Services in Bangladesh – Cross Cart Global International Express",
    description:
      "Affordable, reliable international courier delivery from Bangladesh with doorstep pickup. Trusted network of DHL, FedEx, Aramex and UPS.",
    images: ["/logo.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: siteName,
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
      description:
        "International courier and parcel delivery service connecting Bangladesh with the world through DHL, FedEx, Aramex and UPS.",
    },
    {
      "@type": "WebSite",
      name: siteName,
      url: siteUrl,
    },
  ],
};

export default function Home() {
  return (
    <div className="overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroHomeSection />
      <HomeServiceQuickLinksSection />
      <HomeSaliderSectation />
      <HomeCustomerServiceSection />
      <HomeCustomerReviewSection />
    </div>
  );
}
