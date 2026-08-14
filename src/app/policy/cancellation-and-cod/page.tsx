import PageHeader from "@/utilities/PageHeader";
import { Ban, Boxes, FileWarning, Wallet, RotateCcw, HandCoins } from "lucide-react";

const sections = [
  {
    icon: FileWarning,
    title: "Cancellation Policy",
    rules: [
      "Orders can be cancelled free of charge before pickup within 2 hours of placing the order.",
      "Cancellation between 2 hours and pickup is subject to a small processing fee of 5% of the shipping charge (min. BDT 50).",
      "Once a package has been picked up, the order can no longer be cancelled. It may be returned instead (see Returns).",
      "Cancellation is not available after the package has left Bangladesh (international shipments).",
    ],
  },
  {
    icon: RotateCcw,
    title: "Returns & Refunds",
    rules: [
      "If delivery fails, the package will be returned to the sender. Return shipping charges may apply.",
      "Refunds for cancelled orders are processed within 5–7 business days to the original payment method or as account credit.",
      "COD (Cash on Delivery) charges are fully refunded for cancelled orders where payment was not yet forwarded.",
    ],
  },
  {
    icon: HandCoins,
    title: "Cash on Delivery (COD)",
    rules: [
      "COD is available for domestic shipments and selected international routes.",
      "The maximum COD amount per package is BDT 25,000 unless pre-approved.",
      "COD collections are remitted to the sender within 7 business days of successful delivery, minus a COD handling fee of 2% (min. BDT 20).",
      "Receiver must pay the full COD amount in cash or via bKash/Nagad before the package is handed over.",
      "If the receiver refuses or is unavailable, the package is returned to the sender and COD remittance is cancelled.",
    ],
  },
  {
    icon: Wallet,
    title: "Prohibited/False COD",
    rules: [
      "Senders must not declare a COD amount higher than the value of the goods. False COD declarations may lead to account suspension.",
      "CrossCart is not responsible for verifying the contents of COD parcels beyond standard checks.",
    ],
  },
  {
    icon: Boxes,
    title: "Prohibited Items",
    rules: [
      "Weapons, ammunition, explosives, flammable liquids, and hazardous materials are strictly prohibited.",
      "Illegal drugs, counterfeit goods, and prohibited currencies/securities are not accepted.",
      "Perishable goods and live animals are only accepted as pre-approved special shipments.",
      "Shipments of these items detected during transit will be held by customs or local authorities at the sender's risk.",
    ],
  },
  {
    icon: Ban,
    title: "Service Limitations",
    rules: [
      "CrossCart acts as a booking agent for partner couriers (DHL, FedEx, Aramex, UPS). Final transit times depend on the operating carrier.",
      "Quoted delivery times are estimates and may be affected by customs clearance, weather, or remote delivery zones.",
      "Compensation for loss or damage requires a valid claim submitted within 30 days using recorded shipment details.",
    ],
  },
];

export default function CancellationPolicyPage() {
  return (
    <div className="w-full h-auto bg-soft-green overflow-x-hidden">
      <PageHeader
        title="CANCELLATION & COD POLICY"
        subtitle="CANCELLATION  &  POLICY"
        mainLink="/policy/cancellation-and-cod"
        subLink="/policy/cancellation-and-cod"
      />

      <div className="w-full bg-white">
        <section className="bg-background container m-auto py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-4">
              Cancellation & Cash on Delivery Policy
            </h1>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Please read our cancellation, return, and Cash on Delivery (COD)
              policies carefully. By placing an order, you agree to these terms.
            </p>

            <div className="space-y-8">
              {sections.map((section) => (
                <div
                  key={section.title}
                  className="bg-section rounded-lg p-6 border border-border"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-soft-green rounded-full p-3">
                      <section.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold">{section.title}</h2>
                  </div>
                  <ul className="space-y-2 ml-1">
                    {section.rules.map((rule, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-muted-foreground"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0"></span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-10 bg-primary text-white rounded-lg p-6 text-center">
              <p className="text-lg">
                Have questions about these policies? Our support team is happy to
                help.
              </p>
              <p className="mt-2 text-sm opacity-90">
                +8801622541719 · +8801863468546 · Mon–Fri 9am–5pm
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}