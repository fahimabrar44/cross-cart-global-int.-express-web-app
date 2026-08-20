import { pageMetadata } from "@/lib/seo";
import PageHeader from "@/utilities/PageHeader";
import React from 'react';

export const dynamic = "force-dynamic";
export const metadata = pageMetadata({
  title: "Trust & Safety",
  description:
    "How Cross Cart Global International Express keeps your international courier shipments safe — secure handling, verified delivery, insurance options and trusted FedEx, DHL, UPS, Aramex partnerships.",
  path: "/about/trust-and-safety",
  keywords: [
    "safe courier service",
    "secure international shipping",
    "parcel insurance",
    "trusted courier Bangladesh",
    "shipment safety",
  ],
});

const TrustAndSafety = () => {
  return (
    <>
      <div className="w-full h-auto bg-soft-green overflow-x-hidden">
        <PageHeader title="ABOUT US" subtitle="TRUST AND SAFETY" mainLink="/about" subLink="/about/trust-and-safety" />
      </div>

      <div className="bg-white py-12 px-4 md:px-8 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center text-gray-800">
              Trust & Safety at Cross Cart Global International Express
            </h1>
            <p className="text-lg text-gray-700 leading-relaxed mb-8 text-center">
              At <span className="italic">Cross Cart Global International Express</span>, your trust is our top priority. We are committed to ensuring every delivery is handled with care, transparency, and complete security — from booking to final delivery.
            </p>
          </div>

          <div className="space-y-8">
            <section className="bg-section rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2 border-gray-200">
                1. Verified Courier Partnerships
              </h2>
              <p className="text-gray-700 mb-4">
                We operate as an official <span className="italic">agent of leading international couriers</span> — <span className="italic">DHL, FedEx, Aramex, UPS, and selected trusted local partners</span>.
              </p>
              <p className="text-gray-700">
                All shipments are processed under verified and insured courier networks to guarantee reliability and accountability.
              </p>
            </section>

            <section className="bg-section rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2 border-gray-200">
                2. Secure Handling & Tracking
              </h2>
              <p className="text-gray-700 mb-4">
                Every parcel is tracked with real-time updates from pickup to delivery.
                You{"'"}ll receive:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Tracking numbers for each shipment</li>
                <li>Live status notifications via SMS/email</li>
                <li>Immediate updates for customs or delivery issues</li>
              </ul>
            </section>

            <section className="bg-section rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2 border-gray-200">
                3. Data Privacy & Protection
              </h2>
              <p className="text-gray-700 mb-4">
                Your personal and shipment data are protected under our <span className="italic">Privacy Policy</span>.
              </p>
              <p className="text-gray-700">
                We use <span className="italic">encrypted systems, secure payment gateways, and confidential data handling</span> to ensure your information remains safe at all times.
              </p>
            </section>

            <section className="bg-section rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2 border-gray-200">
                4. Quality & Compliance
              </h2>
              <p className="text-gray-700 mb-4">
                We comply with <span className="italic">international shipping standards</span> and <span className="italic">Bangladesh customs regulations</span> to ensure all items move safely and legally.
              </p>
              <p className="text-gray-700">
                Restricted or high-risk items are not accepted to maintain compliance and protect our customers.
              </p>
            </section>

            <section className="bg-section rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2 border-gray-200">
                5. Customer Assurance
              </h2>
              <p className="text-gray-700 mb-4">
                We are always available for assistance through our <span className="italic">dedicated support team</span>.
              </p>
              <p className="text-gray-700 mb-4">
                If any issue arises during shipment, Cross Cart Global International Express ensures prompt investigation and fair resolution.
              </p>
              <p className="text-gray-700">
                You can reach our <span className="italic">Trust & Safety team</span> anytime at:
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">““§</span>
                  <a href="mailto:cross.cart.bd@gmail.com" className="text-primary hover:underline">cross.cart.bd@gmail.com</a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">““ž</span>
                  <a href="tel:+8801622541719" className="text-primary hover:underline">+880 1622-541719</a>
                </div>
              </div>
            </section>

            <section className="bg-[#12352A] text-white rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-semibold mb-4 text-center">6. Our Promise</h2>
              <blockquote className="text-center text-lg italic">
                {'"'}Every parcel you send through Cross Cart Global International Express carries our promise of honesty, care, and reliability.{'"'}
              </blockquote>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default TrustAndSafety;
