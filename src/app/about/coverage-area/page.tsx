import { pageMetadata } from "@/lib/seo";
import CoverageAreaContent, { type Country } from "@/components/public/CoverageAreaContent";
import { fetchPublicData } from "@/server/common/fetchPublic";
export const metadata = pageMetadata({
  title: "Coverage Area",
  description:
    "Cross Cart Global International Express ships worldwide — USA, UK, Canada, Europe, Australia, UAE, Malaysia, India, China and more — via FedEx, DHL, UPS and Aramex networks.",
  path: "/about/coverage-area",
  keywords: [
    "countries we ship to",
    "ship to USA",
    "ship to UK",
    "ship to Canada",
    "ship to Australia",
    "global coverage courier",
    "international delivery countries",
  ],
});


export const dynamic = "force-dynamic";

export default async function CoverageAreaPage() {
  const countries = await fetchPublicData<Country>(
    "countrys?limit=250&sortBy=name&sortOrder=asc"
  );

  return <CoverageAreaContent initialCountries={countries} />;
}
