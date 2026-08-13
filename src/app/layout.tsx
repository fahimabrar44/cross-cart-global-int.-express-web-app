import { AuthProvider } from "@/hooks/AuthContext";
import SiteLayout from "@/utilities/SiteLayout";
import PwaRegister from "@/components/PWA/PwaRegister";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  manifest: "/manifest.json",
  title: {
    default: "Cross Cart Global International Express – International Courier Solutions",
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
  applicationName: "Cross Cart Global International Express – International Courier Solutions",
  generator: "Next.js 15",
  keywords: [
    "CrossCart Global International Express",
    "International",
    "Courier",
    "Solutions",
    "Cross Cart Global International Express – International Courier Solutions",
    "DHL Express",
    "FEDEX Express",
    "ARAMEX Express",
    "UPS Express",
  ],
  authors: [{ name: "Forhadul Islam", url: "/" }],
  creator: "CrossCart Global Int Express Team",
  publisher: "CrossCart Global Int Express – International Courier Solutions",
  category: "International Courier",
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
    title: "Cross Cart Global International Express – International Courier Solutions",
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
    siteName: "Cross Cart Global International Express – International Courier Solutions",
    images: [
      {
        url: "/logo.png",
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
    title: "Cross Cart Global International Express – International Courier Solutions",
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
    images: ["/logo.png"],
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
    other: [
      {
        rel: "mask-icon",
        url: "/icon.png",
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
