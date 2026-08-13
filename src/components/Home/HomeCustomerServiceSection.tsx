import { BriefcaseBusiness, Headset, LaptopMinimalCheck } from "lucide-react";

const HomeCustomerServiceSection = () => {
  return (
    <div className="w-full h-auto py-14 px-4 bg-white">
      <div className="container m-auto">
        <div className="w-full h-auto flex flex-col md:flex-row gap-8 justify-between items-center align-middle">
          <div className="w-full p-6 rounded-xl bg-white border border-border shadow-card hover:shadow-hover transition-shadow flex flex-col justify-center align-middle items-center">
            <div className="p-5 rounded-full bg-soft-green">
              <Headset size={52} className="text-primary" strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <h1 className="text-base font-bold text-foreground">Customer Support</h1>
              <p className="text-sm font-normal text-muted-foreground">Inquire about due deliveries or report a problem</p>
            </div>
          </div>

          <div className="w-full p-6 rounded-xl bg-white border border-border shadow-card hover:shadow-hover transition-shadow flex flex-col justify-center align-middle items-center">
            <div className="p-5 rounded-full bg-soft-green">
              <LaptopMinimalCheck size={52} className="text-primary" strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <h1 className="text-base font-bold text-foreground">Business Enquiries</h1>
              <p className="text-sm font-normal text-muted-foreground">Connect with our team to discuss your needs</p>
            </div>
          </div>

          <div className="w-full p-6 rounded-xl bg-white border border-border shadow-card hover:shadow-hover transition-shadow flex flex-col justify-center align-middle items-center">
            <div className="p-5 rounded-full bg-soft-green">
              <BriefcaseBusiness size={52} className="text-primary" strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <h1 className="text-base font-bold text-foreground">Careers</h1>
              <p className="text-sm font-normal text-muted-foreground">Explore opportunities to join our team</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeCustomerServiceSection;