import type { Metadata } from "next";
import OurTeamMemberSection from "@/components/About/OurTeamMemberSection";
import PageHeader from "@/utilities/PageHeader";

export const metadata: Metadata = {
  title: "Our Team",
  description:
    "Meet the dedicated team behind Cross Cart Global International Express — logistics, operations and support professionals committed to reliable, affordable international shipping from Bangladesh.",
  keywords: [
    "Cross Cart Global team",
    "courier team Bangladesh",
    "logistics professionals",
    "international shipping experts",
  ],
  alternates: {
    canonical: "https://crosscartglobal.com/about/our-team",
  },
  openGraph: {
    title: "Our Team | Cross Cart Global International Express",
    description:
      "Meet the professionals behind Cross Cart Global International Express who make reliable, affordable international shipping from Bangladesh possible.",
    url: "https://crosscartglobal.com/about/our-team",
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
    title: "Our Team | Cross Cart Global International Express",
    description:
      "Meet the professionals behind Cross Cart Global International Express who make reliable, affordable international shipping from Bangladesh possible.",
    images: ["/full-logo.png", "/logo.png"],
  },
};

const CrossCartTeamMember = () => {
  return (
    <div className="w-full h-auto bg-soft-green overflow-x-hidden">
      <PageHeader
        title="ABOUT US"
        subtitle="OUR TEAM MEMBERS"
        mainLink="/about"
        subLink="/about/our-team"
      />
      <OurTeamMemberSection />
    </div>
  );
};

export default CrossCartTeamMember;
