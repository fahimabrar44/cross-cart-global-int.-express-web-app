import type { Metadata } from 'next'
import OurWorkProcessSection from '@/components/About/OurWorkProcessSection';
import PageHeader from '@/utilities/PageHeader';
import React from 'react'

export const metadata: Metadata = {
  title: 'Our Work Process',
  description:
    'Learn how Cross Cart Global International Express ships your parcels — from booking and doorstep pickup to customs clearance and final delivery, with tracking at every step.',
  keywords: [
    'courier work process',
    'how international shipping works',
    'doorstep pickup process',
    'parcel delivery steps',
    'Cross Cart Global shipping process',
  ],
  alternates: {
    canonical: 'https://crosscartglobal.com/about/our-work-process',
  },
  openGraph: {
    title: 'Our Work Process | Cross Cart Global International Express',
    description:
      'See how Cross Cart Global International Express handles your shipment from doorstep pickup to worldwide delivery, with tracking at every step.',
    url: 'https://crosscartglobal.com/about/our-work-process',
    siteName: 'Cross Cart Global International Express',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/full-logo.png',
        width: 1200,
        height: 630,
        alt: 'Cross Cart Global International Express',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@crosscartglobal',
    creator: '@crosscartglobal',
    title: 'Our Work Process | Cross Cart Global International Express',
    description:
      'See how Cross Cart Global International Express handles your shipment from doorstep pickup to worldwide delivery, with tracking at every step.',
    images: ['/full-logo.png', '/logo.png'],
  },
};

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