import { pageMetadata } from "@/lib/seo";
import OurStorySection from "@/components/About/OurStorySection";
import PageHeader from "@/utilities/PageHeader";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata({
  title: "Our Story",
  description:
    "The story of Cross Cart Global International Express — how a trusted Bangladesh international courier started with doorstep pickup and partnerships with FedEx, DHL, UPS and Aramex to make global shipping affordable.",
  path: "/about/our-story",
  keywords: [
    "Cross Cart story",
    "Cross Cart Global founded",
    "international courier Bangladesh history",
    "courier agency Bangladesh",
  ],
});

const CrossCartStory = () => {
  return (
    <>
      <div className="w-full h-auto bg-soft-green overflow-x-hidden">
        <PageHeader title="ABOUT US" subtitle="OUR STORY" mainLink="/about" subLink="/about/our-story" />
      </div>
      <OurStorySection />
    </>
  );
};

export default CrossCartStory;
