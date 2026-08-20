import { pageMetadata } from "@/lib/seo";
import OurServiceSection from '@/components/About/OurServiceSection';
import PageHeader from '@/utilities/PageHeader'
import React from 'react'

export const dynamic = "force-dynamic";
export const metadata = pageMetadata({
  title: "Our Services",
  description:
    "Cross Cart Global International Express offers international courier, air freight, sea freight, parcel delivery, customs clearance and eCommerce logistics from Bangladesh through FedEx, DHL, UPS and Aramex.",
  path: "/about/our-services",
  keywords: [
    "international courier services",
    "air freight Bangladesh",
    "sea freight Bangladesh",
    "parcel delivery",
    "ecommerce logistics",
    "customs clearance Bangladesh",
  ],
});

const CrossCartService = () => {
  return (
    <>
    <div className="w-full h-auto bg-soft-green overflow-x-hidden">
      <PageHeader title="ABOUT US" subtitle="OUR SERVICES" mainLink="/about" subLink="/about/our-services" />
    </div>

    <OurServiceSection />
    </>
  );
}

export default CrossCartService
