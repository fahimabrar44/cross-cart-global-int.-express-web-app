"use client";

import { Calculator, PackagePlus, Headset } from "lucide-react";
import Link from "next/link";

const HomeQuickToolsSection = () => {
  const tools = [
    {
      icon: <Calculator className="w-8 h-8" strokeWidth={1.5} />,
      title: "Shipping Calculator",
      description:
        "Select your origin and destination to get instant international shipping rates for Bangladeshi Taka (BDT).",
      link: "/ship-and-track/claculate-shipping-charge",
      linkText: "Calculate Shipping Rates",
    },
    {
      icon: <PackagePlus className="w-8 h-8" strokeWidth={1.5} />,
      title: "Create Shipment",
      description:
        "Book a new international parcel shipment with doorstep pickup, real-time tracking and door-to-door delivery.",
      link: "/ship-and-track/create-shipment",
      linkText: "Create an Order",
    },
    {
      icon: <Headset className="w-8 h-8" strokeWidth={1.5} />,
      title: "Contact & Support",
      description:
        "Need help with your shipment, pricing or anything else? Our support team is available to assist you anytime.",
      link: "/contact",
      linkText: "Contact Us",
    },
  ];

  return (
    <div className="w-full h-auto bg-white py-12">
      <div className="container m-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tools.map((tool, index) => (
            <div
              key={index}
              className="bg-soft-green rounded-xl p-6 border border-border shadow-card flex flex-col hover:shadow-lg transition-shadow"
            >
              <div className="bg-primary w-16 h-16 rounded-lg flex items-center justify-center text-white mb-4">
                {tool.icon}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                {tool.title}
              </h3>
              <p className="text-muted-foreground text-sm mb-6 flex-grow">
                {tool.description}
              </p>
              <Link
                href={tool.link}
                className="inline-block text-center bg-primary text-white font-semibold rounded-lg py-3 px-6 hover:bg-[#087F4F] transition-colors"
              >
                {tool.linkText}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeQuickToolsSection;