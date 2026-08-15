import type { Metadata } from "next";
import OurServiceSection from "@/components/About/OurServiceSection";
import OurStorySection from "@/components/About/OurStorySection";
import OurTeamMemberSection from "@/components/About/OurTeamMemberSection";
import OurWorkProcessSection from "@/components/About/OurWorkProcessSection";
import PageHeader from "@/utilities/PageHeader";

const siteName = "Cross Cart Global International Express";
const pageUrl = "https://crosscartglobal.com/about";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Cross Cart Global International Express — a Bangladesh-based international courier service built on trust, offering discounted worldwide delivery through DHL, FedEx, Aramex and UPS with doorstep pickup.",
  keywords: [
    "about Cross Cart Global",
    "international courier company Bangladesh",
    "courier agency Bangladesh",
    "affordable international shipping",
    "cross cart global about us",
  ],
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "About Us | Cross Cart Global International Express",
    description:
      "Discover how Cross Cart Global International Express makes international courier services more affordable and reliable in Bangladesh.",
    url: pageUrl,
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
    title: "About Us | Cross Cart Global International Express",
    description:
      "Discover how Cross Cart Global International Express makes international courier services more affordable and reliable in Bangladesh.",
    images: ["/logo.png"],
  },
};

const CrossCartAbout = () => {
  return (
    <>
      <div className="w-full h-auto bg-soft-green overflow-x-hidden">
        <PageHeader
          title="ABOUT US"
          subtitle="ABOUT US"
          mainLink="/about"
          subLink="/"
        />
      </div>

      <OurStorySection />
      <OurServiceSection />
      <OurWorkProcessSection />
      <OurTeamMemberSection />
    </>
  );
};

export default CrossCartAbout;
