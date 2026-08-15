import PageHeader from "@/utilities/PageHeader";
import Link from "next/link";
import type { Metadata } from "next";

import { Mail, MessageCircle, Phone } from "lucide-react";

const siteName = "Cross Cart Global International Express";
const pageUrl = "https://crosscartglobal.com/contact";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Cross Cart Global International Express. Contact our support team by email or phone for international courier and parcel delivery inquiries from Bangladesh.",
  keywords: [
    "contact Cross Cart Global",
    "courier customer support Bangladesh",
    "international shipping inquiry",
    "cross cart global contact",
  ],
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "Contact Us | Cross Cart Global International Express",
    description:
      "Reach the support team at Cross Cart Global International Express for all your international courier and shipping needs.",
    url: pageUrl,
    siteName,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@crosscartglobal",
    creator: "@crosscartglobal",
    title: "Contact Us | Cross Cart Global International Express",
    description:
      "Reach the support team at Cross Cart Global International Express for all your international courier and shipping needs.",
    images: ["/logo.png"],
  },
};

const Contact = () => {
  const contactData = {
    title: "Contact Us",
    description: "Contact the support team at Cross Cart Global International Express.",
    emailLabel: "Email",
    emailDescription: "We respond to all emails within 24 hours.",
    email: "cross.cart.bd@gmail.com",
    officeLabel: "Office",
    officeDescription: "Drop by our office for a chat.",
    officeAddress: "1 Eagle St, Brisbane, QLD, 4000",
    phoneLabel: "Phone",
    phoneDescription: "We're available Mon-Fri, 9am-5pm.",
    phone: ["+8801410144466",  ],
    chatLabel: "Live Chat",
    chatDescription: "Get instant help from our support team.",
    chatLink: "Start Chat",
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact Cross Cart Global International Express",
    url: pageUrl,
    mainEntity: {
      "@type": "Organization",
      name: siteName,
      email: "mailto:cross.cart.bd@gmail.com",
      telephone: "+8801410144466",
    },
  };

  return (
    <div className="w-full h-auto bg-soft-green overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHeader
        title="CONTACT US"
        subtitle="CONTACT US"
        mainLink="/contact"
        subLink="/contact"
      />

      <div className="w-full bg-white">
        <section className="bg-background container m-auto py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-16">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-muted rounded-lg p-6">
              <span className="bg-accent mb-3 flex size-12 flex-col items-center justify-center rounded-full">
                <Mail className="h-6 w-auto" />
              </span>
              <p className="mb-2 text-lg font-semibold">
                {contactData.emailLabel}
              </p>
              <p className="text-muted-foreground mb-3">
                {contactData.emailDescription}
              </p>
              <a
                href={`mailto:${contactData.email}`}
                className="font-semibold hover:underline"
              >
                {contactData.email}
              </a>
            </div>
            {/* <div className="bg-muted rounded-lg p-6">
              <span className="bg-accent mb-3 flex size-12 flex-col items-center justify-center rounded-full">
                <MapPin className="h-6 w-auto" />
              </span>
              <p className="mb-2 text-lg font-semibold">
                {contactData.officeLabel}
              </p>
              <p className="text-muted-foreground mb-3">
                {contactData.officeDescription}
              </p>
              <a href="#" className="font-semibold hover:underline">
                {contactData.officeAddress}
              </a>
            </div> */}
            <div className="bg-muted rounded-lg p-6">
              <span className="bg-accent mb-3 flex size-12 flex-col items-center justify-center rounded-full">
                <Phone className="h-6 w-auto" />
              </span>
              <p className="mb-2 text-lg font-semibold">
                {contactData.phoneLabel}
              </p>
              <p className="text-muted-foreground mb-3">
                {contactData.phoneDescription}
              </p>
              {contactData.phone.map((phone) => (
                <a
                  href={`tel:${phone}`}
                  className="font-semibold hover:underline"
                  key={phone}
                >
                  {phone}{" "}
                </a>
              ))}
            </div>
            <div className="bg-muted rounded-lg p-6">
              <span className="bg-accent mb-3 flex size-12 flex-col items-center justify-center rounded-full">
                <MessageCircle className="h-6 w-auto" />
              </span>
              <p className="mb-2 text-lg font-semibold">
                {contactData.chatLabel}
              </p>
              <p className="text-muted-foreground mb-3">
                {contactData.chatDescription}
              </p>
              <Link
                href="/dashboard/support"
                className="font-semibold hover:underline"
              >
                {contactData.chatLink}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Contact;
