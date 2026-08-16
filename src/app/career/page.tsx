import type { Metadata } from "next";
import PageHeader from "@/utilities/PageHeader";
import CareerContent from "@/components/public/CareerContent";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Career",
  description:
    "Build your future with Cross Cart Global International Express. Explore open positions in logistics operations, customer support, sales and software engineering in Dhaka and remote.",
  keywords: [
    "courier job Bangladesh",
    "logistics careers Dhaka",
    "customer support jobs",
    "software engineer job Dhaka",
    "Cross Cart Global careers",
  ],
  alternates: {
    canonical: "https://crosscartglobal.com/career",
  },
  openGraph: {
    title: "Career | Cross Cart Global International Express",
    description:
      "Join Cross Cart Global International Express — open roles in logistics, customer support, sales and engineering in Dhaka and remote.",
    url: "https://crosscartglobal.com/career",
    siteName: "Cross Cart Global International Express",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/logo.png",
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
    title: "Career | Cross Cart Global International Express",
    description:
      "Join Cross Cart Global International Express — open roles in logistics, customer support, sales and engineering in Dhaka and remote.",
    images: ["/logo.png"],
  },
};

const Career = () => {
  return (
    <div className="w-full h-auto bg-soft-green overflow-x-hidden">
      <PageHeader title="CAREER" subtitle="CAREER" mainLink="/career" subLink="/career" />
      <CareerContent />
    </div>
  );
};

export default Career;
