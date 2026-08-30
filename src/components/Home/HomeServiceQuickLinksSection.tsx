import Link from "next/link";
import { Calculator, Globe2, Headset } from "lucide-react";

const quickLinks = [
  {
    title: "Price Calculation",
    description: "Calculate your shipping cost instantly",
    icon: Calculator,
    href: "/ship-and-track/claculate-shipping-charge",
  },
  {
    title: "Coverage Area",
    description: "Check all the countries we deliver to",
    icon: Globe2,
    href: "/about/coverage-area",
  },
  {
    title: "Contact Support",
    description: "Reach our team for any assistance",
    icon: Headset,
    href: "/contact",
  },
];

const HomeServiceQuickLinksSection = () => {
  return (
    <div className="w-full h-auto py-14 px-4 bg-soft-green">
      <div className="container m-auto">
        <div className="w-full h-auto flex flex-col md:flex-row gap-8 justify-between items-center align-middle">
          {quickLinks.map(({ title, description, icon: Icon, href }) => (
            <Link
              key={title}
              href={href}
              className="w-full p-6 rounded-xl bg-white border border-border shadow-card hover:shadow-hover hover:-translate-y-1 transition-all flex flex-col justify-center align-middle items-center"
            >
              <div className="p-5 rounded-full bg-soft-green">
                <Icon size={52} className="text-primary" strokeWidth={1.5} />
              </div>
              <div className="text-center">
                <h3 className="text-base font-bold text-foreground">{title}</h3>
                <p className="text-sm font-normal text-muted-foreground">
                  {description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeServiceQuickLinksSection;
