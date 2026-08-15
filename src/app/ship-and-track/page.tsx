import type { Metadata } from "next";
import PageHeader from "@/utilities/PageHeader";
import Link from "next/link";
import { Calculator, Package, MapPin, Clock, Shield, Globe, ArrowRight, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Ship and Track",
  description:
    "Ship anywhere and track everything with Cross Cart Global International Express — calculate shipping charges, create shipments with doorstep pickup, and track parcels in real time from Bangladesh.",
  keywords: [
    "ship package Bangladesh",
    "track shipment",
    "create shipment online",
    "calculate shipping charge",
    "doorstep pickup courier",
  ],
  alternates: {
    canonical: "https://crosscartglobal.com/ship-and-track",
  },
  openGraph: {
    title: "Ship and Track | Cross Cart Global International Express",
    description:
      "Calculate shipping rates, create shipments with doorstep pickup and track your parcels in real time from Bangladesh.",
    url: "https://crosscartglobal.com/ship-and-track",
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
    title: "Ship and Track | Cross Cart Global International Express",
    description:
      "Calculate shipping rates, create shipments with doorstep pickup and track your parcels in real time from Bangladesh.",
    images: ["/logo.png"],
  },
};

const ShipAndTrack = () => {
  const services = [
    {
      icon: <Calculator className="w-12 h-12 text-[#12352A]" strokeWidth={1.5} />,
      title: "Calculate Shipping Charge",
      description: "Get instant shipping quotes for domestic and international deliveries",
      link: "/ship-and-track/claculate-shipping-charge",
      features: ["Instant Quotes", "Multiple Carriers", "Transparent Pricing", "Bulk Discounts"]
    },
    {
      icon: <Package className="w-12 h-12 text-[#12352A]" strokeWidth={1.5} />,
      title: "Create Shipment",
      description: "Easy shipment creation with doorstep pickup and automated processing",
      link: "/ship-and-track/create-shipment",
      features: ["Online Booking", "Doorstep Pickup", "Label Generation", "Insurance Options"]
    },
    {
      icon: <MapPin className="w-12 h-12 text-[#12352A]" strokeWidth={1.5} />,
      title: "Track Shipment",
      description: "Real-time tracking with detailed status updates and delivery notifications",
      link: "/ship-and-track/track-shipment",
      features: ["Real-time Updates", "SMS Notifications", "Delivery Proof", "History Log"]
    }
  ];

  const benefits = [
    {
      icon: <Clock className="w-8 h-8 text-[#F5C400]" strokeWidth={1.5} />,
      title: "Fast Processing",
      description: "Same-day pickup and next-day delivery options available"
    },
    {
      icon: <Shield className="w-8 h-8 text-[#F5C400]" strokeWidth={1.5} />,
      title: "Secure Handling",
      description: "Full insurance coverage and careful handling of all shipments"
    },
    {
      icon: <Globe className="w-8 h-8 text-[#F5C400]" strokeWidth={1.5} />,
      title: "Global Reach",
      description: "Partnerships with DHL, FedEx, Aramex, UPS for worldwide delivery"
    },
    {
      icon: <Package className="w-8 h-8 text-[#F5C400]" strokeWidth={1.5} />,
      title: "All Package Types",
      description: "Documents, parcels, freight - we handle all types of shipments"
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Calculate Rate",
      description: "Get instant shipping quotes for your package"
    },
    {
      number: "2", 
      title: "Create Shipment",
      description: "Book your shipment with pickup details"
    },
    {
      number: "3",
      title: "We Collect",
      description: "Our team picks up from your doorstep"
    },
    {
      number: "4",
      title: "Track Progress",
      description: "Monitor your shipment in real-time"
    }
  ];

  const features = [
    "Doorstep pickup and delivery service",
    "Competitive rates with transparent pricing",
    "Real-time tracking and notifications",
    "Insurance coverage up to declared value",
    "Express and economy shipping options",
    "International customs clearance support", 
    "Bulk shipping discounts for businesses"
  ];

  return (
    <div className="w-full h-auto bg-soft-green">
      <PageHeader 
        title="SHIP AND TRACK" 
        subtitle="SHIP AND TRACK"
        mainLink="/ship-and-track"
        subLink="/ship-and-track"
      />
      
      {/* Hero Content */}
      <div className="w-full bg-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#12352A] mb-6">
              Ship Anywhere, Track Everything
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Complete shipping solutions from rate calculation to delivery tracking. 
              Send your packages domestically or internationally with confidence, speed, and reliability.
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {services.map((service, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="bg-soft-green rounded-full w-20 h-20 flex items-center justify-center mb-6 mx-auto border border-border">
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-[#12352A] mb-4 text-center">{service.title}</h3>
                <p className="text-gray-600 mb-6 text-center">{service.description}</p>
                
                <div className="space-y-2 mb-6">
                  {service.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" strokeWidth={1.5} />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <div className="text-center">
                  <Link href={service.link}>
                    <button className="bg-[#12352A] text-white py-3 px-6 rounded-lg hover:bg-[#1c4a36] transition-colors font-semibold w-full">
                      Get Started
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="w-full bg-section">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#12352A] mb-4">How Shipping Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Simple, fast, and reliable shipping process from quote to delivery
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="bg-primary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">{step.number}</span>
                </div>
                <h3 className="text-lg font-semibold text-[#12352A] mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
                {index < steps.length - 1 && (
                  <ArrowRight className="w-6 h-6 text-gray-400 mx-auto mt-4 hidden md:block" strokeWidth={1.5} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="w-full bg-[#12352A]">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Why Ship with CrossCart Global Int Express?</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Experience the difference with our comprehensive shipping solutions
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="bg-[#12352A] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
                <p className="text-gray-300 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="w-full bg-white">
        <div className="container mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-[#12352A] mb-6">
                Complete Shipping Features
              </h2>
              <p className="text-gray-600 mb-8">
                Everything you need for domestic and international shipping, 
                from individual packages to bulk business shipments.
              </p>
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-soft-green rounded-lg p-8 border border-border">
              <h3 className="text-2xl font-bold text-primary mb-6">Quick Actions</h3>
              <div className="flex justify-center align-middle items-center gap-3 flex-col">
                <Link href="/ship-and-track/claculate-shipping-charge" className="w-full">
                  <div className="bg-white rounded-lg p-4 hover:shadow-card transition-shadow cursor-pointer w-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">Calculate Rates</h4>
                        <p className="text-sm text-muted-foreground">Get instant shipping quotes</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-primary" strokeWidth={1.5} />
                    </div>
                  </div>
                </Link>
                
                <Link href="/ship-and-track/create-shipment" className="w-full">
                  <div className="bg-white rounded-lg p-4 hover:shadow-card transition-shadow cursor-pointer w-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">Create Shipment</h4>
                        <p className="text-sm text-muted-foreground">Book your shipment now</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-primary" strokeWidth={1.5} />
                    </div>
                  </div>
                </Link>
                
                <Link href="/ship-and-track/track-shipment" className="w-full">
                  <div className="bg-white rounded-lg p-4 hover:shadow-card transition-shadow cursor-pointer w-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">Track Package</h4>
                        <p className="text-sm text-muted-foreground">Monitor your shipments</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[#12352A]" strokeWidth={1.5} />
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="w-full bg-gray-100">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-[#12352A] mb-2">200+</div>
              <p className="text-gray-600">Countries Served</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#12352A] mb-2">50K+</div>
              <p className="text-gray-600">Happy Customers</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#12352A] mb-2">99.5%</div>
              <p className="text-gray-600">On-Time Delivery</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#12352A] mb-2">24/7</div>
              <p className="text-gray-600">Customer Support</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="w-full bg-[#12352A]">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Ship Your Package?
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Get started with CrossCart Global Int Express{"'"}s reliable shipping services. Calculate rates, 
            create shipments, and track your packages all in one place.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <Link href="/ship-and-track/claculate-shipping-charge">
              <button className="bg-primary text-white py-3 px-8 rounded-lg hover:bg-[#087F4F] transition-colors font-semibold">
                Calculate Rates
              </button>
            </Link>
            <Link href="/ship-and-track/create-shipment">
              <button className="border-2 border-white text-white py-3 px-8 rounded-lg hover:bg-white hover:text-[#12352A] transition-colors font-semibold">
                Ship Now
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipAndTrack;