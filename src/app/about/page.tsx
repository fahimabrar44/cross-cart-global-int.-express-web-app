import OurServiceSection from "@/components/About/OurServiceSection";
import OurStorySection from "@/components/About/OurStorySection";
import OurTeamMemberSection from "@/components/About/OurTeamMemberSection";
import OurWorkProcessSection from "@/components/About/OurWorkProcessSection";
import PageHeader from "@/utilities/PageHeader";
import Head from "next/head";

const CrossCartAbout = () => {
  return (
    <>
      <Head>
        <title>About</title>
      </Head>
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
