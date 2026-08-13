import PageHeader from '@/utilities/PageHeader';
import React from 'react'

const PrivacyPolicy = () => {
  return (
    <>
      <div className="w-full h-auto bg-soft-green">
        <PageHeader title="ABOUT US" subtitle="PRIVACY POLICY" mainLink="/about" subLink="/about/privacy-policy" />
      </div>

      <div className="bg-white py-12 px-4 md:px-8 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">Privacy Policy</h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
              <div>
                <span className="font-semibold">Effective Date:</span> 1/11/2025
              </div>
              <div>
                <span className="font-semibold">Last Updated:</span> 7/11/2025
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Welcome to <span className="italic">CrossCart Global Int Express</span> ({"'"}we,{"'"} {"'"}our,{"'"} or {"'"}us{"'"}). Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and protect your information when you use our website, mobile application, and courier services (collectively, the {"'"}Services{"'"}).
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              By using our Services, you agree to the collection and use of information in accordance with this policy.
            </p>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2 border-gray-200">1. Information We Collect</h2>
              <p className="text-gray-700 mb-4">We collect several types of information to provide and improve our services:</p>
              
              <h3 className="text-lg font-semibold mb-2 text-gray-800">A. Personal Information</h3>
              <p className="text-gray-700 mb-3">When you use our services or register an account, we may collect:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
                <li>Full name</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>Shipping and billing addresses</li>
                <li>Payment details (processed securely via third-party gateways)</li>
                <li>Identification documents (if required for customs or verification)</li>
              </ul>
              
              <h3 className="text-lg font-semibold mb-2 text-gray-800">B. Shipment Information</h3>
              <p className="text-gray-700 mb-3">We collect details necessary to deliver your parcels, including:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
                <li>Sender and receiver names, addresses, and contact numbers</li>
                <li>Package contents, declared value, and tracking information</li>
              </ul>
              
              <h3 className="text-lg font-semibold mb-2 text-gray-800">C. Usage Data</h3>
              <p className="text-gray-700 mb-3">We may collect information automatically, such as:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>IP address, browser type, and operating system</li>
                <li>Date and time of access</li>
                <li>Pages visited and interaction data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2 border-gray-200">2. How We Use Your Information</h2>
              <p className="text-gray-700 mb-3">We use your information to:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Process, track, and deliver shipments</li>
                <li>Communicate updates and support requests</li>
                <li>Verify your identity and prevent fraud</li>
                <li>Improve our website, services, and customer experience</li>
                <li>Comply with legal and regulatory requirements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2 border-gray-200">3. Sharing and Disclosure</h2>
              <p className="text-gray-700 mb-3">We may share your information with:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
                <li><span className="font-semibold">Courier Partners:</span> DHL, FedEx, Aramex, UPS, and selected local couriers for shipment handling.</li>
                <li><span className="font-semibold">Payment Processors:</span> For secure transaction processing.</li>
                <li><span className="font-semibold">Regulatory Authorities:</span> When required by customs or legal obligations.</li>
                <li><span className="font-semibold">Service Providers:</span> For IT, marketing, or analytics support (bound by confidentiality).</li>
              </ul>
              <p className="text-gray-700">We do <span className="font-semibold italic">not</span> sell or rent your personal data to any third party.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2 border-gray-200">4. Data Retention</h2>
              <p className="text-gray-700">
                We retain your data for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce agreements.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2 border-gray-200">5. Data Security</h2>
              <p className="text-gray-700">
                We use industry-standard encryption and security protocols to protect your information. However, no online system is 100% secure, and we cannot guarantee absolute protection against unauthorized access.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2 border-gray-200">6. Cookies and Tracking Technologies</h2>
              <p className="text-gray-700 mb-3">Our website uses cookies to:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
                <li>Enhance user experience</li>
                <li>Analyze site performance</li>
                <li>Remember user preferences</li>
              </ul>
              <p className="text-gray-700">
                You can disable cookies through your browser settings, but some site features may not function properly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2 border-gray-200">7. Your Rights</h2>
              <p className="text-gray-700 mb-3">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
                <li>Access, correct, or delete your personal data</li>
                <li>Withdraw consent for marketing communications</li>
                <li>Request data portability (where applicable)</li>
              </ul>
              <p className="text-gray-700">
                To exercise your rights, contact us at <a href="mailto:crosscartglobal@gmail.com" className="text-primary hover:underline">crosscartglobal@gmail.com</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2 border-gray-200">8. International Data Transfer</h2>
              <p className="text-gray-700">
                Since CrossCart Global Int Express partners with global courier companies, your data may be transferred across international borders. We ensure appropriate safeguards for such transfers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2 border-gray-200">9. Updates to This Policy</h2>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. Updates will be posted on this page with the new effective date. Continued use of our services after changes means you accept the revised policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2 border-gray-200">10. Contact Us</h2>
              <p className="text-gray-700 mb-3">If you have questions about this Privacy Policy or your data, please contact:</p>
              <p className="text-gray-700 font-semibold">CrossCart Global Int Express</p>
              <p className="text-gray-700">
                Email: <a href="mailto:crosscartglobal@gmail.com" className="text-primary hover:underline">crosscartglobal@gmail.com</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

export default PrivacyPolicy