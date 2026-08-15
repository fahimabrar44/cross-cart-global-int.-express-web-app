import type { Metadata } from "next";
import FAQContent from "@/components/public/FAQContent";
import { fetchPublicData } from "@/server/common/fetchPublic";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about shipping with Cross Cart Global International Express — rates, tracking, customs, packaging, pickup and delivery from Bangladesh.",
  keywords: [
    "shipping FAQ Bangladesh",
    "courier questions",
    "how to track shipment",
    "customs documents shipping",
    "Cross Cart FAQ",
  ],
  alternates: {
    canonical: "https://crosscartglobal.com/faq",
  },
  openGraph: {
    title: "FAQ | Cross Cart Global International Express",
    description:
      "Everything you need to know about rates, tracking, customs and delivery with Cross Cart Global International Express from Bangladesh.",
    url: "https://crosscartglobal.com/faq",
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
    title: "FAQ | Cross Cart Global International Express",
    description:
      "Everything you need to know about rates, tracking, customs and delivery with Cross Cart Global International Express from Bangladesh.",
    images: ["/logo.png"],
  },
};

export default async function FQAPage() {
  const faqs = await fetchPublicData<{ _id: string; question: string; answer: string; category?: string }>(
    "faqs?isActive=true&limit=100"
  );

  return <FAQContent initialFaqs={faqs} />;
}
