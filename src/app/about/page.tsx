import { pageMetadata } from "@/lib/seo";
import OurServiceSection from "@/components/About/OurServiceSection";
import OurStorySection from "@/components/About/OurStorySection";
import OurTeamMemberSection from "@/components/About/OurTeamMemberSection";
import OurWorkProcessSection from "@/components/About/OurWorkProcessSection";
import PageHeader from "@/utilities/PageHeader";
import { fetchPublicData } from "@/server/common/fetchPublic";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata({
  title: "About Us",
  description:
    "Learn about Cross Cart Global International Express — a Bangladesh-based international courier built on trust, partnering with FedEx, DHL, UPS and Aramex to deliver affordable worldwide shipping with doorstep pickup.",
  path: "/about",
  keywords: [
    "about Cross Cart Global",
    "courier company Bangladesh",
    "international logistics company Bangladesh",
    "Cross Cart history",
    "Bangladesh courier company",
  ],
});

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
