import OurWorkProcessSection from '@/components/About/OurWorkProcessSection';
import PageHeader from '@/utilities/PageHeader';
import React from 'react'

const CrossCartWorkProcess = () => {
  return (
    <>
    <div className="w-full h-auto bg-soft-green">
      <PageHeader title="ABOUT US" subtitle="OUR WORK PROCESS" mainLink='/about' subLink='/about/our-work-process' />
    </div>
    <OurWorkProcessSection />
    </>
  );
}

export default CrossCartWorkProcess