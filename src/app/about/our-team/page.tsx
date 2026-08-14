import OurTeamMemberSection from "@/components/About/OurTeamMemberSection";
import PageHeader from "@/utilities/PageHeader";

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
