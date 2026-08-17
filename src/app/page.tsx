import HeroHomeSection from "@/components/Home/HeroHomeSection";
import HomeCustomerReviewSection from "@/components/Home/HomeCustomerReviewSection";
import HomeCustomerServiceSection from "@/components/Home/HomeCustomerServiceSection";
import HomeSaliderSectation from "@/components/Home/HomeSaliderSectation";
import HomeServiceQuickLinksSection from "@/components/Home/HomeServiceQuickLinksSection";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="overflow-x-hidden">
      <HeroHomeSection />
      <HomeServiceQuickLinksSection />
      <HomeSaliderSectation />
      <HomeCustomerServiceSection />
      <HomeCustomerReviewSection />
    </div>
  );
}
