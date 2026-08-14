import HeroHomeSection from "@/components/Home/HeroHomeSection";
import HomeCustomerReviewSection from "@/components/Home/HomeCustomerReviewSection";
import HomeCustomerServiceSection from "@/components/Home/HomeCustomerServiceSection";
import HomeSaliderSectation from "@/components/Home/HomeSaliderSectation";

export default function Home() {
  return (
    <div className="overflow-x-hidden">
      <HeroHomeSection />
      <HomeSaliderSectation />
      <HomeCustomerServiceSection />
      <HomeCustomerReviewSection />
    </div>
  );
}
