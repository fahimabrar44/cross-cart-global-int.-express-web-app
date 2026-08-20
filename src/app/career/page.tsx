import { pageMetadata } from "@/lib/seo";
import PageHeader from "@/utilities/PageHeader";
import CareerContent from "@/components/public/CareerContent";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata({
  title: "Careers",
  description:
    "Join Cross Cart Global International Express — build your career in international courier, logistics and eCommerce fulfillment with a fast-growing Bangladesh shipping company partnered with FedEx, DHL, UPS and Aramex.",
  path: "/career",
  keywords: [
    "courier jobs Bangladesh",
    "logistics careers",
    "Cross Cart careers",
    "shipping company jobs",
  ],
});

const Career = () => {
  return (
    <div className="w-full h-auto bg-soft-green overflow-x-hidden">
      <PageHeader title="CAREER" subtitle="CAREER" mainLink="/career" subLink="/career" />
      <CareerContent />
    </div>
  );
};

export default Career;
