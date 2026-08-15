import ShippingCalculatorContent, {
  type CountryOption,
  type ZoneOption,
} from "@/components/public/ShippingCalculatorContent";
import { fetchPublicData } from "@/server/common/fetchPublic";

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
