import { pageMetadata } from "@/lib/seo";
import OurWorkProcessSection from '@/components/About/OurWorkProcessSection';
import PageHeader from '@/utilities/PageHeader';
import React from 'react'

export const dynamic = "force-dynamic";
export const metadata = pageMetadata({
  title: "Our Work Process",
  description:
    "See how Cross Cart Global International Express ships your parcel worldwide — from doorstep pickup in Bangladesh to dispatch via FedEx, DHL, UPS and Aramex, with tracking at every step.",
  path: "/about/our-work-process",
  keywords: [
    "how international shipping works",
    "courier pickup process",
    "shipment process Bangladesh",
    "parcel dispatch process",
  ],
});

const CrossCartWorkProcess = () => {
  return (
    <>
    <div className="w-full h-auto bg-soft-green overflow-x-hidden">
      <PageHeader title="ABOUT US" subtitle="OUR WORK PROCESS" mainLink='/about' subLink='/about/our-work-process' />
    </div>
    <OurWorkProcessSection />
    </>
  );
}

export default CrossCartWorkProcess
