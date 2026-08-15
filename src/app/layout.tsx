import PwaRegister from "@/components/PWA/PwaRegister";
import { AuthProvider } from "@/hooks/AuthContext";
import SiteLayout from "@/utilities/SiteLayout";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  manifest: "/manifest.json",
  title: {
    default:
      "Cross Cart Global International Express – International Courier Solutions",
    template: "%s | Cross Cart Global International Express",
  },
  description: `Cross Cart Global International Express is more than just a courier service — we are your trusted partner for international delivery solutions. Our vision is simple: to make global shipping easier, faster, and more affordable for everyone.
Through our strong network and agency partnerships with leading international couriers like DHL, FedEx, Aramex, UPS, as well as selected local courier companies, Cross Cart Global International Express ensures that our customers enjoy premium delivery services at competitive, discounted rates. This unique model allows us to save you money while keeping your parcels safe and on time.

We also provide assistance with GPO (General Post Office) services, giving you even more flexibility and convenience for your shipments.

From the very beginning, Cross Cart Global International Express has been committed to customer convenience. Operating with a home-office model, we offer hassle-free pickup from your doorstep and ensure your package is securely delivered to the right courier hub for international dispatch.

At Cross Cart Global International Express, we believe shipping should be simple, transparent, and stress-free. Whether you’re sending documents, gifts, or commercial shipments, our mission is to connect Bangladesh with the world — one parcel at a time


Cross Cart Global International Express was founded with a clear vision: to make international courier services more affordable, reliable, and accessible in Bangladesh.

We noticed that many people were paying high fees for global shipping without realizing that smarter, cost-saving options existed. With this in mind, Cross Cart Global International Express began as a home-office model, built on trust, dedication, and customer convenience.

By partnering with world-renowned courier services such as DHL, FedEx, Aramex, UPS, along with selected local providers, we created a unique network that allows us to deliver the same premium services at discounted rates.

From the very beginning, our focus has been on customer-first solutions: offering doorstep pickup, seamless processing, and safe delivery to the right courier hub. Whether it’s important documents, personal gifts, or commercial shipments, Cross Cart Global International Express ensures every package is handled with care.

Today, Cross Cart Global International Express continues to grow — but our foundation remains the same: a commitment to connecting Bangladesh with the world, one parcel at a time.


To become a leading international courier company, connecting Bangladesh seamlessly with the world while providing reliable, affordable, and customer-focused shipping solutions.`,
  metadataBase: new URL("https://crosscartglobal.com"),
  applicationName:
    "Cross Cart Global International Express – International Courier Solutions",
  generator: "Next.js 15",

  keywords: [
    "Cross Cart Global",
    "cross cart global international express",
    "Cross Cart Global International Express",
    "courier service Global",
    "international courier Bangladesh",
    "Bangladesh to India courier",
    "China to Bangladesh shipping",
    "air freight",
    "sea freight",
    "parcel tracking",
    "worldwide courier service",
    "ecommerce logistics ",
    "international parcel delivery",
    "freight forwarding ",
    "cross border delivery ",
    "Global logistics company",
    "international shipping",
    "affordable shipping",
    "global shipping solutions",
    "air freight",
    "sea freight",
    "ocean freight",
    "express delivery",
    "courier services",
    "parcel tracking",
    "DHL shipping",
    "FedEx rates",
    "UPS express",
    "international logistics",
    "cargo services",
    "supply chain solutions",
    "export shipping",
    "import export logistics",
    "customs clearance",
    "freight forwarding",
    "door-to-door delivery",
    "same-day shipping",
    "economy shipping",
    "Surat courier services",
    "Surat logistics provider",
    "fast international delivery",
    "overseas shipping",
    "shipping companies in India",
    "cargo insurance",
    "real-time tracking",
    "best air freight rates",
    "custom clearance",
    "export rates",
    "courier services in Surat",
    "DHL rates comparison",
    "FedEx shipping quotes",
    "UPS shipping options",
    "professional shipping solutions",
    "global shipping services",
    "Surat export company",
    "Surat air cargo",
    "Surat sea freight",
    "Surat courier tracking",
    "express international shipping",
    "premium courier services",
    "trusted shipping partner",
    "international order fulfillment",
    "logistics automation",
    "customs brokerage",
    "bonded warehouse",
    "temperature-controlled shipping",
    "white-glove delivery",
    "commercial import export",
    "express parcel services",
    "import-export documentation",
    "global trade compliance",
    "HS code classification",
    "certified freight forwarding",
    "worldwide transport solutions",
    "global e-commerce fulfillment",
    "Surat logistics hub",
    "Surat freight forwarding",
    "Surat business shipping",
    "Surat cargo handling",
    "Surat international trade",
    "freight network",
    "tracking",
    "courier",
    "parcel tracking",
    "shipment tracking",
    "freight services",
    "shipping solutions",
    "export services",
    "cargo solutions",
    "logistics provider",
    "warehouse solutions",
    "air cargo",
    "ocean freight",
    "customs clearance",
    "supply chain management",
    "global delivery",
    "B2B shipping",
    "e-commerce logistics",
    "door-to-door services",
    "trade compliance",
    "import-export services",
    "cross-border shipping",
    "international freight forwarding",
    "commercial shipping",
    "real-time tracking",
    "logistics automation",
    "bonded warehouse",
    "last-mile delivery",
    "temperature-controlled freight",
    "custom brokerage",
    "heavy freight solutions",
    "cargo insurance",
    "certified logistics",
    "multimodal shipping",
    "global supply chain",
    "duty-free shipping",
    "premium courier",
    "economy shipping",
    "same-day freight",
    "bulk shipping",
    "B2B freight",
    "global trade compliance",
    "trade documentation",
    "port-to-port shipping",
    "customs handling",
    "global express",
    "import duty solutions",
    "warehouse storage",
    "e-commerce order fulfillment",
    "commercial cargo",
    "competitive freight rates",
    "trusted logistics",
    "import-export trade",
    "international retail shipping",
    "express parcel services",
    "certified freight forwarding",
    "global transport solutions",
    "bonded logistics",
    "multimodal transport",
    "specialized freight solutions",
    "temperature-controlled storage",
    "white-glove shipping",
    "customs processing",
    "overseas warehousing",
    "international cargo tracking",
    "high-value shipment",
    "international supplier logistics",
    "product fulfillment",
    "regulatory compliance",
    "import logistics",
    "cargo warehousing",
    "freight cost reduction",
    "cargo packaging",
    "goods handling",
    "product distribution",
    "customs inspection",
    "global network",
    "time-critical freight",
    "secure shipping",
    "air cargo security",
    "corporate shipping",
    "fulfillment center",
    "on-demand shipping",
    "just-in-time logistics",
    "warehousing solutions",
    "cargo transport management",
    "freight consolidation",
    "distribution channels",
    "logistics partner",
    "service quality",
    "express freight solutions",
    "digital freight forwarding",
    "freight brokerage services",
    "procurement logistics",
    "digital shipping tracking",
    "advanced logistics solutions",
    "international trade support",
    "shipping carrier comparison",
    "certified customs broker",
    "global import network",
    "customs solutions",
    "smart logistics",
    "cargo insurance coverage",
    "priority freight services",
    "bulk order shipping",
    "fulfillment logistics",
    "cargo safety",
    "optimized supply chain",
    "global freight network",
    "warehouse management",
    "courier cost analysis",
    "cost-efficient shipping",
    "advanced freight solutions",
    "risk-free cargo shipping",
    "regulated goods shipping",
    "temperature-sensitive freight",
    "wholesale logistics",
    "order tracking",
    "high-speed courier services",
    "tailored shipping solutions",
    "express warehousing",
    "secure freight transport",
    "air cargo logistics",
    "bonded freight",
    "special cargo handling",
    "expert freight solutions",
    "global logistics network",
    "intermodal freight",
    "warehousing efficiency",
    "streamlined shipping",
    "last-mile logistics",
    "cargo protection",
    "air express freight",
    "contract logistics",
    "professional courier services",
    "optimized transport routes",
    "freight cost comparison",
    "import-export carrier",
    "logistics advisory",
    "supply chain data analytics",
    "e-commerce supply chain",
    "international trade logistics",
    "retail supply chain solutions",
    "cargo storage solutions",
    "time-sensitive cargo shipping",
    "automated logistics",
    "customs trade facilitation",
    "freight documentation support",
    "B2C logistics solutions",
    "competitive express services",
    "international business logistics",
    "Shipment Tracking",
    "Cross Cart Global International Express Courier",
  ],
  authors: [
    {
      name: "Cross Cart Global International Express Team",
      url: "https://crosscartbd.com",
    },
  ],
  category:
    "Logistics, Courier Service, International Shipping, E-commerce Logistics, Freight Forwarding",

  creator: "CrossCart Global International Express Team",
  publisher:
    "CrossCart Global International Express – International Courier Solutions",

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title:
      "Cross Cart Global International Express – International Courier Solutions",
    description: `Cross Cart Global International Express is more than just a courier service — we are your trusted partner for international delivery solutions. Our vision is simple: to make global shipping easier, faster, and more affordable for everyone.
Through our strong network and agency partnerships with leading international couriers like DHL, FedEx, Aramex, UPS, as well as selected local courier companies, Cross Cart Global International Express ensures that our customers enjoy premium delivery services at competitive, discounted rates. This unique model allows us to save you money while keeping your parcels safe and on time.

We also provide assistance with GPO (General Post Office) services, giving you even more flexibility and convenience for your shipments.

From the very beginning, Cross Cart Global International Express has been committed to customer convenience. Operating with a home-office model, we offer hassle-free pickup from your doorstep and ensure your package is securely delivered to the right courier hub for international dispatch.

At Cross Cart Global International Express, we believe shipping should be simple, transparent, and stress-free. Whether you’re sending documents, gifts, or commercial shipments, our mission is to connect Bangladesh with the world — one parcel at a time


Cross Cart Global International Express was founded with a clear vision: to make international courier services more affordable, reliable, and accessible in Bangladesh.

We noticed that many people were paying high fees for global shipping without realizing that smarter, cost-saving options existed. With this in mind, Cross Cart Global International Express began as a home-office model, built on trust, dedication, and customer convenience.

By partnering with world-renowned courier services such as DHL, FedEx, Aramex, UPS, along with selected local providers, we created a unique network that allows us to deliver the same premium services at discounted rates.

From the very beginning, our focus has been on customer-first solutions: offering doorstep pickup, seamless processing, and safe delivery to the right courier hub. Whether it’s important documents, personal gifts, or commercial shipments, Cross Cart Global International Express ensures every package is handled with care.

Today, Cross Cart Global International Express continues to grow — but our foundation remains the same: a commitment to connecting Bangladesh with the world, one parcel at a time.


To become a leading international courier company, connecting Bangladesh seamlessly with the world while providing reliable, affordable, and customer-focused shipping solutions.`,
    url: "https://crosscartglobal.com",
    siteName:
      "Cross Cart Global International Express – International Courier Solutions",
    images: [
      {
        url: "/full-logo.png",
        width: 1200,
        height: 630,
        alt: "Cross Cart Global International Express – International Courier Solutions",
        type: "image/jpeg",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@crosscartglobal",
    creator: "@crosscartglobal",
    title:
      "Cross Cart Global International Express – International Courier Solutions",
    description: `Cross Cart Global International Express is more than just a courier service — we are your trusted partner for international delivery solutions. Our vision is simple: to make global shipping easier, faster, and more affordable for everyone.
Through our strong network and agency partnerships with leading international couriers like DHL, FedEx, Aramex, UPS, as well as selected local courier companies, Cross Cart Global International Express ensures that our customers enjoy premium delivery services at competitive, discounted rates. This unique model allows us to save you money while keeping your parcels safe and on time.

We also provide assistance with GPO (General Post Office) services, giving you even more flexibility and convenience for your shipments.

From the very beginning, Cross Cart Global International Express has been committed to customer convenience. Operating with a home-office model, we offer hassle-free pickup from your doorstep and ensure your package is securely delivered to the right courier hub for international dispatch.

At Cross Cart Global International Express, we believe shipping should be simple, transparent, and stress-free. Whether you’re sending documents, gifts, or commercial shipments, our mission is to connect Bangladesh with the world — one parcel at a time


Cross Cart Global International Express was founded with a clear vision: to make international courier services more affordable, reliable, and accessible in Bangladesh.

We noticed that many people were paying high fees for global shipping without realizing that smarter, cost-saving options existed. With this in mind, Cross Cart Global International Express began as a home-office model, built on trust, dedication, and customer convenience.

By partnering with world-renowned courier services such as DHL, FedEx, Aramex, UPS, along with selected local providers, we created a unique network that allows us to deliver the same premium services at discounted rates.

From the very beginning, our focus has been on customer-first solutions: offering doorstep pickup, seamless processing, and safe delivery to the right courier hub. Whether it’s important documents, personal gifts, or commercial shipments, Cross Cart Global International Express ensures every package is handled with care.

Today, Cross Cart Global International Express continues to grow — but our foundation remains the same: a commitment to connecting Bangladesh with the world, one parcel at a time.


To become a leading international courier company, connecting Bangladesh seamlessly with the world while providing reliable, affordable, and customer-focused shipping solutions.`,
    images: ["/full-logo.png", "/logo.png"],
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
    other: [
      {
        rel: "mask-icon",
        url: "/logo.png",
      },
    ],
  },
  alternates: {
    canonical: "https://crosscartglobal.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <SiteLayout>{children}</SiteLayout>
        </AuthProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
