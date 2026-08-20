import type { Metadata } from "next";
import OurTeamMemberSection from "@/components/About/OurTeamMemberSection";
import PageHeader from "@/utilities/PageHeader";
import { fetchPublicData } from "@/server/common/fetchPublic";

export const dynamic = "force-dynamic";
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

const CrossCartTeamMember = async () => {
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
    <div className="w-full h-auto bg-soft-green overflow-x-hidden">
      <PageHeader
        title="ABOUT US"
        subtitle="OUR TEAM MEMBERS"
        mainLink="/about"
        subLink="/about/our-team"
      />
      <OurTeamMemberSection members={members} />
    </div>
  );
};

export default CrossCartTeamMember;
