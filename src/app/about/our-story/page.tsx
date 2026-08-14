import OurStorySection from "@/components/About/OurStorySection";
import PageHeader from "@/utilities/PageHeader";

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
