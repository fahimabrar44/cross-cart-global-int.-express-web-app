import HeroHomeSection from "@/components/Home/HeroHomeSection";
import HomeCustomerReviewSection from "@/components/Home/HomeCustomerReviewSection";
import HomeCustomerServiceSection from "@/components/Home/HomeCustomerServiceSection";
import HomeSaliderSectation from "@/components/Home/HomeSaliderSectation";
import HomeServiceQuickLinksSection from "@/components/Home/HomeServiceQuickLinksSection";
import { fetchPublicData } from "@/server/common/fetchPublic";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "International Courier & Shipping from Bangladesh",
  description:
    "Cross Cart Global International Express is a trusted international courier from Bangladesh, offering discounted FedEx, DHL, UPS and Aramex shipping worldwide with free doorstep pickup, real-time tracking and customs clearance.",
  path: "/",
  keywords: [
    "international courier Bangladesh",
    "ship to USA from Bangladesh",
    "ship to UK from Bangladesh",
    "cheap courier to USA",
    "global courier service",
    "online courier booking",
  ],
});

export default async function Home() {
  // SSR-fetch approved reviews so the testimonials render server-side
  // (cache is invalidated on every admin write, so updates appear on next load).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reviews = await fetchPublicData<any>("reviews?status=approved&limit=12");

  return (
    <div className="overflow-x-hidden">
      <HeroHomeSection />
      <HomeServiceQuickLinksSection />
      <HomeSaliderSectation />
      <HomeCustomerServiceSection />
      <HomeCustomerReviewSection initialReviews={reviews} />
    </div>
  );
}
