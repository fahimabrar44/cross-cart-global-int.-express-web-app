"use client";

import { getRequestSend } from "@/components/ApiCall/methord";
import { ROOT_API } from "@/components/ApiCall/url";
import PageHeader from "@/utilities/PageHeader";
import { Globe, Loader2, Mail, PhoneCall, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface Country {
  _id: string;
  name: string;
  code: string;
  phoneCode?: string;
  flagUrl?: string;
  zone?: string;
  isActive?: boolean;
}

const popularRoutes = [
  { name: "India", transit: "3-5 days" },
  { name: "China", transit: "5-7 days" },
  { name: "USA", transit: "7-10 days" },
  { name: "UAE", transit: "4-6 days" },
  { name: "United Kingdom", transit: "7-10 days" },
  { name: "Malaysia", transit: "5-7 days" },
];

// Build a flag emoji from an ISO 2-letter country code
const flagEmoji = (code?: string): string => {
  if (!code || code.length !== 2) return "🌍";
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
};

const CoverageArea = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState<string>("All");

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await getRequestSend<Country[]>(
          `${ROOT_API}countrys?limit=250&sortBy=name&sortOrder=asc`
        );
        if (response.status === 200 && Array.isArray(response.data)) {
          setCountries(response.data);
        }
      } catch {
        // countries are optional
      } finally {
        setLoading(false);
      }
    };
    fetchCountries();
  }, []);

  const regions = useMemo(() => {
    const set = new Set<string>();
    countries.forEach((c) => set.add(c.zone?.trim() || "Other"));
    return ["All", ...Array.from(set)];
  }, [countries]);

  const filteredCountries = useMemo(() => {
    const term = search.trim().toLowerCase();
    return countries.filter((country) => {
      const zone = country.zone?.trim() || "Other";
      const matchesRegion = region === "All" || zone === region;
      const matchesSearch =
        !term ||
        country.name.toLowerCase().includes(term) ||
        (country.code || "").toLowerCase().includes(term);
      return matchesRegion && matchesSearch;
    });
  }, [countries, search, region]);

  const visiblePopularRoutes = useMemo(() => {
    const names = new Set(countries.map((c) => c.name.toLowerCase()));
    return popularRoutes.filter((r) => names.has(r.name.toLowerCase()));
  }, [countries]);

  const stats = useMemo(
    () => [
      { value: `${countries.length}+`, label: "Countries" },
      { value: "50K+", label: "Cities" },
      { value: "24/7", label: "Support" },
      { value: "48h", label: "Avg. Transit" },
    ],
    [countries.length]
  );

  return (
    <>
      <div className="w-full h-auto bg-soft-green overflow-x-hidden">
        <PageHeader
          title="ABOUT US"
          subtitle="COVERAGE AREA"
          mainLink="/about"
          subLink="/about/coverage-area"
        />
      </div>

      {/* Hero / Global Network */}
      <section className="w-full h-auto bg-soft-green overflow-x-hidden">
        <div className="container m-auto py-16 px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider mb-3">
              <Globe className="size-5" />
              Global Network
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground">
              Our Coverage Area
            </h2>
            <p className="text-lg text-muted-foreground mt-4">
              We deliver to {countries.length || "100+"} countries and
              territories worldwide.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-14">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-2xl border border-border shadow-sm p-6 text-center"
              >
                <div className="text-4xl font-extrabold text-primary">
                  {stat.value}
                </div>
                <div className="text-muted-foreground font-medium mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      <section className="w-full h-auto py-16 px-4 overflow-x-hidden">
        <div className="container m-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
              Popular Routes
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {(visiblePopularRoutes.length > 0
              ? visiblePopularRoutes
              : popularRoutes
            ).map((route) => (
              <div
                key={route.name}
                className="bg-soft-green rounded-xl border border-border p-5 flex flex-col items-center text-center gap-1 hover:shadow-card transition-all duration-300"
              >
                <span className="text-4xl">
                  {flagEmoji(
                    countries.find(
                      (c) => c.name.toLowerCase() === route.name.toLowerCase()
                    )?.code
                  )}
                </span>
                <span className="font-semibold text-foreground">
                  {route.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {route.transit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All Countries */}
      <section className="w-full h-auto bg-soft-green overflow-x-hidden">
        <div className="container m-auto py-16 px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div className="flex flex-wrap items-center gap-2">
              {regions.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setRegion(filter)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                    region === filter
                      ? "bg-primary text-white"
                      : "bg-white text-foreground hover:bg-primary/10 border border-border"
                  }`}
                >
                  {filter} (
                  {filter === "All"
                    ? countries.length
                    : countries.filter(
                        (c) => (c.zone?.trim() || "Other") === filter
                      ).length}
                  )
                </button>
              ))}
            </div>

            <div className="relative md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country..."
                className="w-full bg-white border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
            All Countries
          </h2>

          {loading && (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              Loading countries...
            </div>
          )}

          {!loading && filteredCountries.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              {countries.length === 0
                ? "No countries available yet. Please check back soon."
                : "No countries found for your search."}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredCountries.map((country) => (
              <div
                key={country._id}
                className="bg-white rounded-xl border border-border p-4 flex items-center gap-3 hover:shadow-card transition-all duration-300"
              >
                <span className="text-3xl">{flagEmoji(country.code)}</span>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">
                    {country.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {country.code}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Need a Custom Route */}
      <section className="w-full h-auto py-16 px-4 overflow-x-hidden">
        <div className="container m-auto">
          <div className="bg-[#12352A] text-white rounded-2xl p-8 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">
              Need a Custom Route?
            </h2>
            <p className="text-white/80 text-lg mt-3 max-w-2xl mx-auto">
              Contact our support team for shipping to destinations not listed
              above.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <Link
                href="mailto:cross.cart.bd@gmail.com"
                className="inline-flex items-center gap-2 bg-primary hover:bg-[#087F4F] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                <Mail className="size-5" />
                Email Support
              </Link>
              <Link
                href="tel:+8801622541719"
                className="inline-flex items-center gap-2 border border-white/30 hover:bg-white/10 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                <PhoneCall className="size-5" />
                Call +880 1622-541719
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default CoverageArea;
