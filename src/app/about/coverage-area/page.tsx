import CoverageAreaContent, { type Country } from "@/components/public/CoverageAreaContent";
import { fetchPublicData } from "@/server/common/fetchPublic";

export const dynamic = "force-dynamic";

export default async function CoverageAreaPage() {
  const countries = await fetchPublicData<Country>(
    "countrys?limit=250&sortBy=name&sortOrder=asc"
  );

  return <CoverageAreaContent initialCountries={countries} />;
}
