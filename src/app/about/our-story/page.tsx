import type { Metadata } from "next";
import OurStorySection from "@/components/About/OurStorySection";
import PageHeader from "@/utilities/PageHeader";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "Read the story of Cross Cart Global International Express — a Bangladesh-based courier company on a mission to make international shipping affordable, reliable and accessible through DHL, FedEx, Aramex and UPS.",
  keywords: [
    "Cross Cart Global story",
    "international courier journey",
    "courier company Bangladesh",
    "affordable international shipping",
  ],
  alternates: {
    canonical: "https://crosscartglobal.com/about/our-story",
  },
  openGraph: {
    title: "Our Story | Cross Cart Global International Express",
    description:
      "Discover how Cross Cart Global International Express started and how it makes international shipping more affordable and reliable from Bangladesh.",
    url: "https://crosscartglobal.com/about/our-story",
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
    title: "Our Story | Cross Cart Global International Express",
    description:
      "Discover how Cross Cart Global International Express started and how it makes international shipping more affordable and reliable from Bangladesh.",
    images: ["/full-logo.png", "/logo.png"],
  },
};

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
