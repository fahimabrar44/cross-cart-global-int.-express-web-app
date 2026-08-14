"use client";

import PageHeader from "@/utilities/PageHeader";
import { Globe, Mail, PhoneCall, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type Region =
  | "Asia"
  | "Europe"
  | "Africa"
  | "N. America"
  | "S. America"
  | "Oceania";

interface Country {
  name: string;
  code: string;
  region: Region;
  flag: string;
}

const countries: Country[] = [
  { name: "Afghanistan", code: "AF", region: "Asia", flag: "🇦🇫" },
  { name: "Armenia", code: "AM", region: "Asia", flag: "🇦🇲" },
  { name: "Azerbaijan", code: "AZ", region: "Asia", flag: "🇦🇿" },
  { name: "Bahrain", code: "BH", region: "Asia", flag: "🇧🇭" },
  { name: "Bangladesh", code: "BD", region: "Asia", flag: "🇧🇩" },
  { name: "Bhutan", code: "BT", region: "Asia", flag: "🇧🇹" },
  { name: "Brunei", code: "BN", region: "Asia", flag: "🇧🇳" },
  { name: "Cambodia", code: "KH", region: "Asia", flag: "🇰🇭" },
  { name: "China", code: "CN", region: "Asia", flag: "🇨🇳" },
  { name: "Cyprus", code: "CY", region: "Asia", flag: "🇨🇾" },
  { name: "Georgia", code: "GE", region: "Asia", flag: "🇬🇪" },
  { name: "India", code: "IN", region: "Asia", flag: "🇮🇳" },
  { name: "Indonesia", code: "ID", region: "Asia", flag: "🇮🇩" },
  { name: "Iran", code: "IR", region: "Asia", flag: "🇮🇷" },
  { name: "Iraq", code: "IQ", region: "Asia", flag: "🇮🇶" },
  { name: "Israel", code: "IL", region: "Asia", flag: "🇮🇱" },
  { name: "Japan", code: "JP", region: "Asia", flag: "🇯🇵" },
  { name: "Jordan", code: "JO", region: "Asia", flag: "🇯🇴" },
  { name: "Kazakhstan", code: "KZ", region: "Asia", flag: "🇰🇿" },
  { name: "Kuwait", code: "KW", region: "Asia", flag: "🇰🇼" },
  { name: "Kyrgyzstan", code: "KG", region: "Asia", flag: "🇰🇬" },
  { name: "Laos", code: "LA", region: "Asia", flag: "🇱🇦" },
  { name: "Lebanon", code: "LB", region: "Asia", flag: "🇱🇧" },
  { name: "Malaysia", code: "MY", region: "Asia", flag: "🇲🇾" },
  { name: "Maldives", code: "MV", region: "Asia", flag: "🇲🇻" },
  { name: "Mongolia", code: "MN", region: "Asia", flag: "🇲🇳" },
  { name: "Myanmar", code: "MM", region: "Asia", flag: "🇲🇲" },
  { name: "Nepal", code: "NP", region: "Asia", flag: "🇳🇵" },
  { name: "North Korea", code: "KP", region: "Asia", flag: "🇰🇵" },
  { name: "Oman", code: "OM", region: "Asia", flag: "🇴🇲" },
  { name: "Pakistan", code: "PK", region: "Asia", flag: "🇵🇰" },
  { name: "Palestine", code: "PS", region: "Asia", flag: "🇵🇸" },
  { name: "Philippines", code: "PH", region: "Asia", flag: "🇵🇭" },
  { name: "Qatar", code: "QA", region: "Asia", flag: "🇶🇦" },
  { name: "Saudi Arabia", code: "SA", region: "Asia", flag: "🇸🇦" },
  { name: "Singapore", code: "SG", region: "Asia", flag: "🇸🇬" },
  { name: "South Korea", code: "KR", region: "Asia", flag: "🇰🇷" },
  { name: "Sri Lanka", code: "LK", region: "Asia", flag: "🇱🇰" },
  { name: "Syria", code: "SY", region: "Asia", flag: "🇸🇾" },
  { name: "Taiwan", code: "TW", region: "Asia", flag: "🇹🇼" },
  { name: "Tajikistan", code: "TJ", region: "Asia", flag: "🇹🇯" },
  { name: "Thailand", code: "TH", region: "Asia", flag: "🇹🇭" },
  { name: "Timor-Leste", code: "TL", region: "Asia", flag: "🇹🇱" },
  { name: "Turkey", code: "TR", region: "Asia", flag: "🇹🇷" },
  { name: "Turkmenistan", code: "TM", region: "Asia", flag: "🇹🇲" },
  { name: "UAE", code: "AE", region: "Asia", flag: "🇦🇪" },
  { name: "Uzbekistan", code: "UZ", region: "Asia", flag: "🇺🇿" },
  { name: "Vietnam", code: "VN", region: "Asia", flag: "🇻🇳" },
  { name: "Yemen", code: "YE", region: "Asia", flag: "🇾🇪" },
  { name: "Albania", code: "AL", region: "Europe", flag: "🇦🇱" },
  { name: "Austria", code: "AT", region: "Europe", flag: "🇦🇹" },
  { name: "Belarus", code: "BY", region: "Europe", flag: "🇧🇾" },
  { name: "Belgium", code: "BE", region: "Europe", flag: "🇧🇪" },
  { name: "Bosnia", code: "BA", region: "Europe", flag: "🇧🇦" },
  { name: "Bulgaria", code: "BG", region: "Europe", flag: "🇧🇬" },
  { name: "Croatia", code: "HR", region: "Europe", flag: "🇭🇷" },
  { name: "Czech Republic", code: "CZ", region: "Europe", flag: "🇨🇿" },
  { name: "Denmark", code: "DK", region: "Europe", flag: "🇩🇰" },
  { name: "Estonia", code: "EE", region: "Europe", flag: "🇪🇪" },
  { name: "Finland", code: "FI", region: "Europe", flag: "🇫🇮" },
  { name: "France", code: "FR", region: "Europe", flag: "🇫🇷" },
  { name: "Germany", code: "DE", region: "Europe", flag: "🇩🇪" },
  { name: "Greece", code: "GR", region: "Europe", flag: "🇬🇷" },
  { name: "Hungary", code: "HU", region: "Europe", flag: "🇭🇺" },
  { name: "Iceland", code: "IS", region: "Europe", flag: "🇮🇸" },
  { name: "Ireland", code: "IE", region: "Europe", flag: "🇮🇪" },
  { name: "Italy", code: "IT", region: "Europe", flag: "🇮🇹" },
  { name: "Latvia", code: "LV", region: "Europe", flag: "🇱🇻" },
  { name: "Lithuania", code: "LT", region: "Europe", flag: "🇱🇹" },
  { name: "Netherlands", code: "NL", region: "Europe", flag: "🇳🇱" },
  { name: "Norway", code: "NO", region: "Europe", flag: "🇳🇴" },
  { name: "Poland", code: "PL", region: "Europe", flag: "🇵🇱" },
  { name: "Portugal", code: "PT", region: "Europe", flag: "🇵🇹" },
  { name: "Romania", code: "RO", region: "Europe", flag: "🇷🇴" },
  { name: "Russia", code: "RU", region: "Europe", flag: "🇷🇺" },
  { name: "Serbia", code: "RS", region: "Europe", flag: "🇷🇸" },
  { name: "Slovakia", code: "SK", region: "Europe", flag: "🇸🇰" },
  { name: "Slovenia", code: "SI", region: "Europe", flag: "🇸🇮" },
  { name: "Spain", code: "ES", region: "Europe", flag: "🇪🇸" },
  { name: "Sweden", code: "SE", region: "Europe", flag: "🇸🇪" },
  { name: "Switzerland", code: "CH", region: "Europe", flag: "🇨🇭" },
  { name: "Ukraine", code: "UA", region: "Europe", flag: "🇺🇦" },
  { name: "United Kingdom", code: "GB", region: "Europe", flag: "🇬🇧" },
  { name: "Egypt", code: "EG", region: "Africa", flag: "🇪🇬" },
  { name: "Kenya", code: "KE", region: "Africa", flag: "🇰🇪" },
  { name: "Nigeria", code: "NG", region: "Africa", flag: "🇳🇬" },
  { name: "South Africa", code: "ZA", region: "Africa", flag: "🇿🇦" },
  { name: "Morocco", code: "MA", region: "Africa", flag: "🇲🇦" },
  { name: "Ghana", code: "GH", region: "Africa", flag: "🇬🇭" },
  { name: "Tanzania", code: "TZ", region: "Africa", flag: "🇹🇿" },
  { name: "Ethiopia", code: "ET", region: "Africa", flag: "🇪🇹" },
  { name: "Canada", code: "CA", region: "N. America", flag: "🇨🇦" },
  { name: "USA", code: "US", region: "N. America", flag: "🇺🇸" },
  { name: "Mexico", code: "MX", region: "N. America", flag: "🇲🇽" },
  { name: "Argentina", code: "AR", region: "S. America", flag: "🇦🇷" },
  { name: "Brazil", code: "BR", region: "S. America", flag: "🇧🇷" },
  { name: "Chile", code: "CL", region: "S. America", flag: "🇨🇱" },
  { name: "Colombia", code: "CO", region: "S. America", flag: "🇨🇴" },
  { name: "Australia", code: "AU", region: "Oceania", flag: "🇦🇺" },
  { name: "New Zealand", code: "NZ", region: "Oceania", flag: "🇳🇿" },
];

const stats = [
  { value: "100+", label: "Countries" },
  { value: "50K+", label: "Cities" },
  { value: "24/7", label: "Support" },
  { value: "48h", label: "Avg. Transit" },
];

const popularRoutes = [
  { flag: "🇮🇳", name: "India", transit: "3-5 days" },
  { flag: "🇨🇳", name: "China", transit: "5-7 days" },
  { flag: "🇺🇸", name: "USA", transit: "7-10 days" },
  { flag: "🇦🇪", name: "UAE", transit: "4-6 days" },
  { flag: "🇬🇧", name: "UK", transit: "7-10 days" },
  { flag: "🇲🇾", name: "Malaysia", transit: "5-7 days" },
];

const regionFilters: ("All" | Region)[] = [
  "All",
  "Asia",
  "Europe",
  "Africa",
  "N. America",
  "S. America",
  "Oceania",
];

const CoverageArea = () => {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState<"All" | Region>("All");

  const filteredCountries = useMemo(() => {
    const term = search.trim().toLowerCase();
    return countries.filter((country) => {
      const matchesRegion = region === "All" || country.region === region;
      const matchesSearch =
        !term ||
        country.name.toLowerCase().includes(term) ||
        country.code.toLowerCase().includes(term);
      return matchesRegion && matchesSearch;
    });
  }, [search, region]);

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
              We deliver to 100+ countries and territories worldwide.
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
            {popularRoutes.map((route) => (
              <div
                key={route.name}
                className="bg-soft-green rounded-xl border border-border p-5 flex flex-col items-center text-center gap-1 hover:shadow-card transition-all duration-300"
              >
                <span className="text-4xl">{route.flag}</span>
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
              {regionFilters.map((filter) => (
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
                    : countries.filter((c) => c.region === filter).length}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredCountries.map((country) => (
              <div
                key={country.code}
                className="bg-white rounded-xl border border-border p-4 flex items-center gap-3 hover:shadow-card transition-all duration-300"
              >
                <span className="text-3xl">{country.flag}</span>
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

          {filteredCountries.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              No countries found for your search.
            </div>
          )}
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