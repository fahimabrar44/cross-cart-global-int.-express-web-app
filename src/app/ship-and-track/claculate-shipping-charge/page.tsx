import { pageMetadata } from "@/lib/seo";
import ShippingCalculatorContent, {
  type CountryOption,
  type ZoneOption,
} from "@/components/public/ShippingCalculatorContent";
import { fetchPublicData } from "@/server/common/fetchPublic";
export const metadata = pageMetadata({
  title: "Calculate Shipping Charge",
  description:
    "Compare international courier rates instantly with Cross Cart Global International Express — get discounted FedEx, DHL, UPS and Aramex shipping charges from Bangladesh by weight and destination.",
  path: "/ship-and-track/claculate-shipping-charge",
  keywords: [
    "shipping calculator",
    "courier rate calculator",
    "FedEx rate",
    "DHL rate",
    "UPS rate",
    "Aramex rate",
    "cheap international shipping",
    "calculate courier charge",
  ],
});


export const dynamic = "force-dynamic";

export default async function CalculateShippingChargePage() {
  const [countries, zones] = await Promise.all([
    fetchPublicData<CountryOption>(
      "countrys?isActive=true&limit=250&sortBy=name&sortOrder=asc"
    ),
    fetchPublicData<ZoneOption>(
      "zones?isActive=true&limit=100&sortBy=name&sortOrder=asc"
    ),
  ]);

  return (
    <ShippingCalculatorContent initialCountries={countries} initialZones={zones} />
  );
}
