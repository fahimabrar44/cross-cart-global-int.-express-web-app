import HeroHomeSection from "@/components/Home/HeroHomeSection";
import HomeCustomerReviewSection from "@/components/Home/HomeCustomerReviewSection";
import HomeCustomerServiceSection from "@/components/Home/HomeCustomerServiceSection";
import HomeQuickToolsSection from "@/components/Home/HomeQuickToolsSection";
import HomeSaliderSectation from "@/components/Home/HomeSaliderSectation";

export default function Home() {
  return (
    <div className="overflow-x-hidden">
      <HeroHomeSection />
      <HomeSaliderSectation />
      <HomeQuickToolsSection />
      <HomeCustomerServiceSection />
      <HomeCustomerReviewSection />
    </div>
  );
}
