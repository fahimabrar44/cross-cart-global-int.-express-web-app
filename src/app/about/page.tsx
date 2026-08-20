import type { Metadata } from "next";
import OurServiceSection from "@/components/About/OurServiceSection";
import OurStorySection from "@/components/About/OurStorySection";
import OurTeamMemberSection from "@/components/About/OurTeamMemberSection";
import OurWorkProcessSection from "@/components/About/OurWorkProcessSection";
import PageHeader from "@/utilities/PageHeader";
import { fetchPublicData } from "@/server/common/fetchPublic";

const siteName = "Cross Cart Global International Express";
const pageUrl = "https://crosscartglobal.com/about";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Cross Cart Global International Express — a Bangladesh-based international courier service built on trust, offering discounted worldwide delivery through DHL, FedEx, Aramex and UPS with doorstep pickup.",
  keywords: [
    "about Cross Cart Global",
    "Cross Cart Global about",
    "courier company Bangladesh",
    "international logistics company Bangladesh",
    "shipping company Dhaka",
    "about Cross Cart",
    "logistics company Bangladesh",
    "courier service about us",
    "Cross Cart history",
    "Bangladesh courier company",
    "global logistics partner Bangladesh",
    "Cross Cart mission vision",
    "international shipping company Bangladesh",
    "trusted courier Bangladesh",
    "logistics services Bangladesh",
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
        url: "/full-logo.png",
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
    images: ["/full-logo.png", "/logo.png"],
  },
   robots: {
    index: true,
    follow: true,
  },
};

const CrossCartAbout = async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await fetchPublicData<any>("team-members");

  const members = (data || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((m: any) => ({
      name: String(m?.name || ""),
      position: String(m?.position || ""),
      image: m?.image ? String(m.image) : undefined,
      bio: m?.bio ? String(m.bio) : undefined,
      experience: m?.experience ? String(m.experience) : undefined,
      location: m?.location ? String(m.location) : undefined,
      keyAchievement: m?.keyAchievement ? String(m.keyAchievement) : undefined,
      social: m?.social as
        | { email?: string; phone?: string }
        | undefined,
    }))
    .filter((member: { name: string }) => member.name);

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
      <OurTeamMemberSection members={members} />
    </>
  );
};

export default CrossCartAbout;
