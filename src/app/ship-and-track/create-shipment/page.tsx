import { pageMetadata } from "@/lib/seo";
import CreateShipmentForm, {
  type CountryOption,
  type ZoneOption,
} from "@/components/public/CreateShipmentForm";
import { fetchPublicData } from "@/server/common/fetchPublic";
export const metadata = pageMetadata({
  title: "Create Shipment",
  description:
    "Book your international courier shipment online with Cross Cart Global International Express — doorstep pickup in Bangladesh, customs support and tracking via FedEx, DHL, UPS and Aramex.",
  path: "/ship-and-track/create-shipment",
  keywords: [
    "create shipment",
    "book courier online",
    "international parcel booking",
    "online courier Bangladesh",
    "schedule pickup",
  ],
});


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
