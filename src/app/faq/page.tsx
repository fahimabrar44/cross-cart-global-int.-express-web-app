import { pageMetadata } from "@/lib/seo";
import FAQContent from "@/components/public/FAQContent";
import { fetchPublicData } from "@/server/common/fetchPublic";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Frequently Asked Questions",
  description:
    "Answers to common questions about Cross Cart Global International Express international courier — booking, FedEx/DHL/UPS/Aramex rates, tracking, customs, delivery times and payments from Bangladesh.",
  path: "/faq",
  keywords: [
    "courier FAQ",
    "international shipping questions",
    "tracking FAQ",
    "customs FAQ Bangladesh",
    "shipping charges FAQ",
  ],
});

export default async function FQAPage() {
  const faqs = await fetchPublicData<{ _id: string; question: string; answer: string; category?: string }>(
    "faqs?isActive=true&limit=100"
  );

  return <FAQContent initialFaqs={faqs} />;
}
