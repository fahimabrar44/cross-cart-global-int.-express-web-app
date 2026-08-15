import type { Metadata } from 'next'
import OurServiceSection from '@/components/About/OurServiceSection';
import PageHeader from '@/utilities/PageHeader'
import React from 'react'

export const metadata: Metadata = {
  title: 'Our Services',
  description:
    'Explore the international courier services of Cross Cart Global International Express — documents, parcels, e-commerce and corporate shipping from Bangladesh with doorstep pickup and real-time tracking.',
  keywords: [
    'international courier services Bangladesh',
    'parcel shipping services',
    'e-commerce shipping solutions',
    'corporate courier Bangladesh',
    'doorstep pickup service',
  ],
  alternates: {
    canonical: 'https://crosscartglobal.com/about/our-services',
  },
  openGraph: {
    title: 'Our Services | Cross Cart Global International Express',
    description:
      'Affordable international courier services from Bangladesh — documents, parcels, e-commerce and corporate shipping with doorstep pickup and tracking.',
    url: 'https://crosscartglobal.com/about/our-services',
    siteName: 'Cross Cart Global International Express',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/logo.png',
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
    title: 'Our Services | Cross Cart Global International Express',
    description:
      'Affordable international courier services from Bangladesh — documents, parcels, e-commerce and corporate shipping with doorstep pickup and tracking.',
    images: ['/logo.png'],
  },
};

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