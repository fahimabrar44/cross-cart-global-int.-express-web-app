import PageHeader from '@/utilities/PageHeader'
import React from 'react'

const RefundPolicy = () => {
  return (
   <>
    <div className="w-full h-auto bg-soft-green">
      <PageHeader title="ABOUT US" subtitle="REFUND POLICY" mainLink="/about" subLink="/about/refund-policy" />
    </div>

    <div className="w-full bg-white py-12 px-4 md:px-8 lg:px-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center text-gray-800">
          Refund Policy – CrossCart Global Int Express Bangladesh
        </h1>
        
        <p className="text-lg mb-8 text-gray-600 leading-relaxed">
          At <span className="italic">CrossCart Global Int Express</span>, we value your trust. Our goal is to make every international and local shipment fast, safe, and affordable.
          However, if something doesn{"'"}t go as planned, our refund policy ensures a fair and transparent process.
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2 border-gray-200">
              1. Eligibility for Refund
            </h2>
            <p className="mb-4 text-gray-600">You may be eligible for a refund if:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Your shipment is <span className="italic">not picked up or processed</span> due to a technical or operational issue from CrossCart Global Int Express{"'"}s side.</li>
              <li>You have <span className="italic">cancelled your shipment</span> before it has been handed over to the courier partner.</li>
              <li>Your shipment has been <span className="italic">lost or undelivered</span> due to a verified fault by CrossCart Global Int Express or its courier partner.</li>
              <li>You have <span className="italic">accidentally made double payment</span> for the same order or transaction.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2 border-gray-200">
              2. Non-Refundable Situations
            </h2>
            <p className="mb-4 text-gray-600">Refunds will <span className="italic">not be applicable</span> in the following cases:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Shipment <span className="italic">delayed</span> due to customs, weather conditions, or external factors beyond our control.</li>
              <li>Shipment <span className="italic">rejected, returned, or seized</span> due to restricted items, incorrect paperwork, or destination-country regulations.</li>
              <li><span className="italic">Wrong or incomplete address/contact details</span> provided by the customer.</li>
              <li>Shipment already <span className="italic">collected, processed, or dispatched</span> to courier partners.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2 border-gray-200">
              3. Refund Amount and Method
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Refunds will be processed <span className="italic">in Bangladeshi Taka (BDT)</span> only.</li>
              <li>Refunds will be made to the <span className="italic">original payment method, including <span className="font-semibold">bKash, Nagad, Rocket, Bank Transfer, or Card Payment</span></span>.</li>
              <li>Processing time: <span className="italic">7–10 business days</span> after refund approval.</li>
              <li>You{"'"}ll receive an <span className="italic">SMS or email confirmation</span> once your refund is initiated.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2 border-gray-200">
              4. Requesting a Refund
            </h2>
            <p className="mb-4 text-gray-600">To request a refund, please contact our support team with your:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li><span className="italic">Order ID / Tracking Number</span></li>
              <li><span className="italic">Payment receipt or transaction ID</span></li>
              <li><span className="italic">Reason for refund request</span></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2 border-gray-200">
              5. Policy Updates
            </h2>
            <p className="text-gray-600">
              CrossCart Global Int Express reserves the right to update this policy at any time to ensure compliance with courier partner and regulatory standards.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <p className="text-xl font-semibold text-gray-800 mb-2">
            CrossCart Global Int Express – Direct Costs More. CrossCart Global Int Express Saves You.
          </p>
          <p className="text-gray-600">
            Smarter shipping, trusted service, better value. 🚀
          </p>
        </div>
      </div>
    </div>
   </>
  );
}

export default RefundPolicy