import type { Metadata } from "next";
import PageHeader from "@/utilities/PageHeader";
import { Briefcase, Clock, GraduationCap, HeartHandshake, MapPin, Sparkles } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Career",
  description:
    "Build your future with Cross Cart Global International Express. Explore open positions in logistics operations, customer support, sales and software engineering in Dhaka and remote.",
  keywords: [
    "courier job Bangladesh",
    "logistics careers Dhaka",
    "customer support jobs",
    "software engineer job Dhaka",
    "Cross Cart Global careers",
  ],
  alternates: {
    canonical: "https://crosscartglobal.com/career",
  },
  openGraph: {
    title: "Career | Cross Cart Global International Express",
    description:
      "Join Cross Cart Global International Express — open roles in logistics, customer support, sales and engineering in Dhaka and remote.",
    url: "https://crosscartglobal.com/career",
    siteName: "Cross Cart Global International Express",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Cross Cart Global International Express",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@crosscartglobal",
    creator: "@crosscartglobal",
    title: "Career | Cross Cart Global International Express",
    description:
      "Join Cross Cart Global International Express — open roles in logistics, customer support, sales and engineering in Dhaka and remote.",
    images: ["/logo.png"],
  },
};

const Career = () => {
  const perks = [
    {
      icon: <Sparkles className="w-6 h-6 text-primary" strokeWidth={1.5} />,
      title: "Growth & Learning",
      description: "Continuous upskilling programs and clear promotion paths across every role.",
    },
    {
      icon: <HeartHandshake className="w-6 h-6 text-primary" strokeWidth={1.5} />,
      title: "Supportive Culture",
      description: "A collaborative team that celebrates wins together and cares about wellbeing.",
    },
    {
      icon: <Clock className="w-6 h-6 text-primary" strokeWidth={1.5} />,
      title: "Flexible Work",
      description: "Remote-friendly roles and flexible schedules to help you balance life.",
    },
    {
      icon: <GraduationCap className="w-6 h-6 text-primary" strokeWidth={1.5} />,
      title: "Training & Certifications",
      description: "Industry certifications and leadership training to advance your expertise.",
    },
  ];

  const openRoles = [
    {
      title: "Logistics Operations Executive",
      type: "Full-time",
      location: "Dhaka, Bangladesh",
    },
    {
      title: "Customer Support Specialist",
      type: "Full-time",
      location: "Remote",
    },
    {
      title: "Sales & Business Development",
      type: "Full-time",
      location: "Dhaka, Bangladesh",
    },
    {
      title: "Software Engineer (Node.js / Next.js)",
      type: "Full-time",
      location: "Remote",
    },
  ];

  return (
    <div className="w-full h-auto bg-soft-green overflow-x-hidden">
      <PageHeader title="CAREER" subtitle="CAREER" mainLink="/career" subLink="/career" />

      {/* Intro */}
      <div className="w-full bg-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#12352A] mb-6">
              Build Your Future With Us
            </h2>
            <p className="text-lg text-gray-600">
              Join Cross Cart Global International Express and help us connect people,
              parcels and possibilities across the globe. We are always looking
              for passionate individuals who want to make shipping simple.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            {perks.map((perk, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-6 border border-border shadow-card hover:shadow-lg transition-shadow"
              >
                <div className="bg-soft-green rounded-full w-14 h-14 flex items-center justify-center mb-4">
                  {perk.icon}
                </div>
                <h3 className="text-lg font-semibold text-[#12352A] mb-2">
                  {perk.title}
                </h3>
                <p className="text-sm text-gray-600">{perk.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Open Positions */}
      <div className="w-full bg-section">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#12352A] mb-4">
              Open Positions
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore current openings. Dont see the right role? Reach out — we
              are always open to great talent.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {openRoles.map((role, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-6 border border-border shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <h3 className="text-lg font-semibold text-[#12352A]">
                    {role.title}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4 text-primary" />
                      {role.type}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-primary" />
                      {role.location}
                    </span>
                  </div>
                </div>
                <Link
                  href="/contact"
                  className="bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-[#087F4F] transition-colors font-semibold text-center whitespace-nowrap"
                >
                  Apply Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="w-full bg-[#12352A]">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Join the Team?
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Send your CV and cover letter to our HR team. We would love to hear
            from you.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-primary text-white py-3 px-8 rounded-lg hover:bg-[#087F4F] transition-colors font-bold"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Career;
