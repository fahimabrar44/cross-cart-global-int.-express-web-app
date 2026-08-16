import CoverageAreaContent, { type Country } from "@/components/public/CoverageAreaContent";
import { fetchPublicData } from "@/server/common/fetchPublic";
export const metadata = {
  title: "Coverage Area | Cross Cart Global International Express Shipping Network",
  description: "Check the Cross Cart Global shipping coverage area and international delivery network across 200+ countries and territories.",
};


export const dynamic = "force-dynamic";

export default async function CoverageAreaPage() {
  const countries = await fetchPublicData<Country>(
    "countrys?limit=250&sortBy=name&sortOrder=asc"
  );

  return <CoverageAreaContent initialCountries={countries} />;
}
