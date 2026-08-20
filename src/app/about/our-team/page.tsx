import { pageMetadata } from "@/lib/seo";
import OurTeamMemberSection from "@/components/About/OurTeamMemberSection";
import PageHeader from "@/utilities/PageHeader";
import { fetchPublicData } from "@/server/common/fetchPublic";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata({
  title: "Our Team",
  description:
    "Meet the team behind Cross Cart Global International Express — the professionals making reliable, affordable international courier and FedEx, DHL, UPS, Aramex shipping from Bangladesh possible.",
  path: "/about/our-team",
  keywords: [
    "Cross Cart team",
    "courier professionals Bangladesh",
    "logistics team Bangladesh",
  ],
});

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
