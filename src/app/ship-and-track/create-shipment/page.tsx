import CreateShipmentForm, {
  type CountryOption,
  type ZoneOption,
} from "@/components/public/CreateShipmentForm";
import { fetchPublicData } from "@/server/common/fetchPublic";

export const dynamic = "force-dynamic";

export default async function CreateShipmentPage() {
  const [countries, zones] = await Promise.all([
    fetchPublicData<CountryOption>("countrys?isActive=true&limit=250&sortBy=name&sortOrder=asc"),
    fetchPublicData<ZoneOption>("zones?isActive=true&limit=100&sortBy=name&sortOrder=asc"),
  ]);

  return (
    <CreateShipmentForm initialCountries={countries} initialZones={zones} />
  );
}
