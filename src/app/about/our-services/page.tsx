import OurServiceSection from '@/components/About/OurServiceSection';
import PageHeader from '@/utilities/PageHeader'
import React from 'react'

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