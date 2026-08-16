import PwaRegister from "@/components/PWA/PwaRegister";
import UserTracker from "@/components/tracking/UserTracker";
import ClarityAnalytics from "@/components/Analytics/Clarity";
import GoogleAnalytics from "@/components/Analytics/GoogleAnalytics";
import MarketingPixels from "@/components/Analytics/MarketingPixels";
import CookieConsent from "@/components/Analytics/CookieConsent";
import ActivityTracker from "@/components/Analytics/ActivityTracker";
import { AuthProvider } from "@/hooks/AuthContext";
import SiteLayout from "@/utilities/SiteLayout";
import Script from "next/script";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
            {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Cross Cart Global - International Courier & Logistics",
      },
      {
        url: "/cover-1.png",
        width: 1200,
        height: 630,
        alt: "Cross Cart Global - Fast and Reliable Shipping Solutions",
      },
      {
        url: "/cover-2.png",
        width: 1200,
        height: 630,
        alt: "Cross Cart Global - Global Shipping Services",
      },
      {
        url: "/cover-3.png",
        width: 1200,
        height: 630,
        alt: "Cross Cart Global - eCommerce Logistics Solutions",
      },
      {
        url: "/cover-4.png",
        width: 1200,
        height: 630,
        alt: "Cross Cart Global - Real-Time Shipment Tracking",
      },
      {
        url: "/cover-5.png",
        width: 1200,
        height: 630,
        alt: "Cross Cart Global - Air and Sea Freight Services",
      },
      {
        url: "/cover-6.png",
        width: 1200,
        height: 630,
        alt: "Cross Cart Global - International Courier from Bangladesh",
      },
      {
        url: "/cover-7.png",
        width: 1200,
        height: 630,
        alt: "Cross Cart Global - Competitive Shipping Rates",
      },
      {
        url: "/cover-8.png",
        width: 1200,
        height: 630,
        alt: "Cross Cart Global - Trusted Logistics Partner",
      },
      {
        url: "/cover-9.png",
        width: 1200,
        height: 630,
        alt: "Cross Cart Global - Comprehensive Shipping Solutions",
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
    images: ["/full-logo.png", "/logo.png",  "/cover-1.png",
      "/cover-2.png",
      "/cover-3.png",
      "/cover-4.png",
      "/cover-5.png",
      "/cover-6.png",
      "/cover-7.png",
      "/cover-8.png",
      "/cover-9.png",],
    
  },
  icons: {
    icon: [
      { url: "/icon0.svg", type: "image/svg+xml" },
      { url: "/icon1.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon.ico" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  alternates: {
    canonical: "https://crosscartglobal.com",
  },
  other: {
    "facebook-domain-verification": "0z23qfw1nqjdzojtbxvrotsfgxt9u2",
    "msvalidate.01": "5E9033E01DB54C7DBC289D821074568A",
    "p:domain_verify": "a234a5efcceaadfafe7edbb6a6d238ce",
    "google-adsense-account": "ca-pub-3062190244275306",
  },
};


const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Cross Cart Global International Express Courier",
  url: "https://crosscartglobal.com",
  logo: "https://crosscartglobal.com/logo.png",
  sameAs: [
    "https://www.facebook.com/crosscart",
    "https://www.facebook.com/crosscartglobal",
    "https://www.instagram.com/crosscart.global",
    "https://www.linkedin.com/company/cross-cart-global",
    "https://twitter.com/crosscartglobal",
    "https://www.youtube.com/@crosscartglobal",
    "https://www.tiktok.com/@crosscartglobal",
  ],
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+8801410-144466",
      contactType: "customer service",
      areaServed: "BD",
      availableLanguage: ["English", "Bengali"],
    },
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Cross Cart Global International Express Courier",
  url: "https://crosscartglobal.com",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://crosscartglobal.com/track?search_term_string={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "CourierService",
  "@id": "https://crosscartglobal.com/",

  name: "Cross Cart Global International Express Courier",
  alternateName: "Cross Cart Global International Express Courier",
  url: "https://crosscartglobal.com",
  logo: "https://crosscartglobal.com/logo.png",
  image: [
    "https://crosscartglobal.com/logo.png",
    "https://crosscartglobal.com/cover-1.png",
    "https://crosscartglobal.com/cover-2.png"
  ],

  description:
    "Cross Cart Global is a leading international courier and logistics company based in Dhaka, Bangladesh. We provide fast, secure, and cost-effective worldwide shipping solutions including air freight, sea freight, parcel delivery, and eCommerce logistics.",
  telephone: "+8801811107751",
  email: "cross.cart.bd@gmail.com",

  priceRange: "$$",

  address: {
    "@type": "PostalAddress",
    streetAddress:"Warehouse No.1, Behind Sena Kalyan Sangstha (SKS Tower), Mohakhali DOHS",
    addressLocality: "Dhaka",
    postalCode: "1206",
    addressCountry: "BD"
  },

  geo: {
    "@type": "GeoCoordinates",
    latitude: 23.7806,
    longitude: 90.4070
  },

  areaServed: [
    { "@type": "Country", name: "Bangladesh" },
    { "@type": "Country", name: "United Kingdom" },
    { "@type": "Country", name: "United States" },
    { "@type": "Country", name: "Canada" },
    { "@type": "Country", name: "United Arab Emirates" },
    { "@type": "Country", name: "Malaysia" }
  ],

  serviceType: [
    "International Courier Service",
    "Air Freight",
    "Sea Freight",
    "Parcel Delivery",
    "eCommerce Logistics",
    "Freight Forwarding",
    "Customs Clearance",
    "Door to Door Delivery"
  ],

  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Saturday",
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday"
      ],
      opens: "09:00",
      closes: "22:00"
    }
  ],

  sameAs: [
    "https://www.facebook.com/crosscart",
    "https://www.facebook.com/crosscartglobal",
    "https://www.instagram.com/crosscart.global",
    "https://www.linkedin.com/company/cross-cart-global",
    "https://twitter.com/crosscartglobal",
    "https://www.youtube.com/@crosscartglobal",
    "https://www.tiktok.com/@crosscartglobal"
  ],

  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+8801811107751",
      contactType: "customer service",
      areaServed: "BD",
      availableLanguage: ["English", "Bengali"]
    }
  ],

  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Courier & Logistics Services",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "International Parcel Delivery"
        }
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Air Freight Shipping"
        }
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Sea Freight Shipping"
        }
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "eCommerce Fulfillment"
        }
      }
    ]
  },

  parentOrganization: {
    "@id": "https://crosscartglobal.com/#organization"
  }
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
          <UserTracker />
          <ClarityAnalytics />
          <GoogleAnalytics />
          <MarketingPixels />
          <CookieConsent />
          <ActivityTracker />
        </AuthProvider>
        <PwaRegister />

        {/* Google Tag Manager */}
        <Script id="gtm-script" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+i+dl:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-TDP9QDWF');
          `}
        </Script>

        {/* Google Analytics (gtag.js) */}
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-554K530WCW"
        />
        <Script id="google-analytics-config" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('consent', 'default', {
              analytics_storage: 'denied',
              ad_storage: 'denied',
              wait_for_update: 500
            });
            gtag('config', 'G-554K530WCW');
          `}
        </Script>

        {/* Microsoft Clarity */}
        {/* <Script
          id="microsoft-clarity"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "w8fn60boix");
            `,
          }}
        /> */}

        {/* Structured data (JSON-LD) for SEO */}
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <Script
          id="website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <Script
          id="local-business-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />

        {/* noscript fallbacks */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TDP9QDWF"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=26093014930391502&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>

        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
