"use client";

import { getRequestSend } from "@/components/ApiCall/methord";
import { ROOT_API } from "@/components/ApiCall/url";
import PageHeader from "@/utilities/PageHeader";
import { Calculator, Clock, DollarSign, Globe, Loader2, Search, MapPin, Package, RotateCcw, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { trackClarityEvent, setClarityTag } from "@/lib/clarity";
import { gaEvent } from "@/lib/ga";
import { trackMarketingEvent } from "@/lib/marketing";

export interface CountryOption {
  _id: string;
  name: string;
  code: string;
  phoneCode?: string;
  isActive?: boolean;
}

export interface ZoneOption {
  _id: string;
  name: string;
  code?: string;
  isActive?: boolean;
}

interface FetchedZone {
  _id: string;
  name: string;
  code?: string;
  countryIds: { _id: string; name: string; code?: string; isActive?: boolean }[];
}

interface Rate {
  name: string;
  profitPercentage: number;
  gift: number;
  fuel: number;

  price: Record<string, number>;
  serviceDetails?: string[];
}

interface PriceData {
  _id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  to?: any;
  rate: Rate[];
}

const WEIGHT_LABELS: Record<string, string> = {
  gm500: "500 GM",
  gm1000: "1000 GM",
  gm1500: "1500 GM",
  gm2000: "2000 GM",
  gm2500: "2500 GM",
  gm3000: "3000 GM",
  gm3500: "3500 GM",
  gm4000: "4000 GM",
  gm4500: "4500 GM",
  gm5000: "5000 GM",
  gm5500: "5500 GM",
  kg6to10: "6 TO 10 PER KG",
  kg11to20: "11 TO 20 PER KG",
  kg21to30: "21 TO 30 PER KG",
  kg31to40: "31 TO 40 PER KG",
  kg41to50: "41 TO 50 PER KG",
  kg51to80: "51 TO 80 PER KG",
  kg81to100: "81 TO 100 PER KG",
  kg101to500: "101 TO 500 PER KG",
  kg501to1000: "501 TO 1000 PER KG",
};

export default function ShippingCalculatorContent({
  initialCountries,
  initialZones,
}: {
  initialCountries: CountryOption[];
  initialZones: ZoneOption[];
}) {
  const [countries, setCountries] = useState<CountryOption[]>(initialCountries);
  const [fromCountry, setFromCountry] = useState<string>(
    () =>
      initialCountries.find((c) => c.name.toLowerCase() === "bangladesh")?._id ||
      initialCountries[0]?._id ||
      "",
  );
  const [toZone, setToZone] = useState<string>(() => initialZones[0]?._id || "");
  const [shipmentType, setShipmentType] = useState("b2b");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [zonesData, setZonesData] = useState<FetchedZone[]>(
    () => initialZones as FetchedZone[]
  );
  const effectiveZones = zonesData as unknown as ZoneOption[];
  const [loadingCountries, setLoadingCountries] = useState(() => initialCountries.length === 0);
  const [loadingZones, setLoadingZones] = useState(() => initialZones.length === 0);
  const [zoneSearch, setZoneSearch] = useState("");

  useEffect(() => {
    if (initialCountries.length > 0) return;
    let active = true;
    (async () => {
      try {
        const params = new URLSearchParams({ limit: "250", isActive: "true", sortBy: "name", sortOrder: "asc" });
        const res = await getRequestSend<CountryOption[]>(
          `${ROOT_API}countrys?${params.toString()}`,
        );
        if (res.status === 200 && Array.isArray(res.data) && res.data.length > 0) {
          if (active) setCountries(res.data);
        }
      } catch {
        /* ignore country fetch errors */
      } finally {
        if (active) setLoadingCountries(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Zones are already server-rendered; only refetch when SSR had none.
    if (initialZones.length > 0) return;
    let active = true;
    (async () => {
      try {
        const params = new URLSearchParams({ limit: "200", isActive: "true" });
        const res = await getRequestSend<FetchedZone[]>(
          `${ROOT_API}zones?${params.toString()}`,
        );
        if (res.status === 200 && Array.isArray(res.data)) {
          if (active) setZonesData(res.data);
        }
      } catch {
        /* ignore zone fetch errors */
      } finally {
        if (active) setLoadingZones(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!fromCountry && countries.length > 0) {
      setFromCountry(countries.find((c) => c.name.toLowerCase() === "bangladesh")?._id || countries[0]._id);
    }
  }, [countries, fromCountry]);

  useEffect(() => {
    if (!toZone && effectiveZones.length > 0) {
      setToZone(effectiveZones[0]._id);
    }
  }, [effectiveZones, toZone]);

  useEffect(() => {
    setPriceData(null);
    setError("");
  }, [fromCountry, toZone]);

  const filteredZones = zonesData.filter((z) => {
    const term = zoneSearch.trim().toLowerCase();
    if (!term) return true;
    if (z.name.toLowerCase().includes(term)) return true;
    return (z.countryIds || []).some((c) =>
      c.name?.toLowerCase().includes(term),
    );
  });

  const getCountryName = (id: string) =>
    countries.find((c) => c._id === id)?.name || "";

  const getZoneName = (id: string) =>
    (effectiveZones as ZoneOption[]).find((z) => z._id === id)?.name || "";

  const handleCalculate = async () => {
    setError("");
    setPriceData(null);
    if (!fromCountry) {
      setError("Please select an origin country");
      return;
    }
    if (!toZone) {
      setError("Please select a destination zone");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: fromCountry,
        to: toZone,
      });
      const response = await getRequestSend<PriceData[]>(
        `${ROOT_API}prices?${params.toString()}`,
      );
      if (
        response.status === 200 &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        const candidate = response.data[0] as PriceData;
        const candFromId =
          typeof candidate.from === "string"
            ? candidate.from
            : (candidate.from as unknown as { _id?: string })?._id || "";
        const candToId =
          typeof candidate.to === "string"
            ? candidate.to
            : (candidate.to as unknown as { _id?: string })?._id || "";
        const isExactMatch =
          String(candFromId) === String(fromCountry) && String(candToId) === String(toZone);
        if (!isExactMatch) {
          setError(
            `No pricing found for ${getCountryName(fromCountry) || "selected origin"} → ${getZoneName(toZone) || "selected zone"} yet. Please contact our support team.`,
          );
          setClarityTag("quote_result", "no_price_mismatch");
          gaEvent("quote_no_price", { route: `${fromCountry} -> ${toZone}` });
          trackMarketingEvent("quote_no_price", {
            route: `${fromCountry} -> ${toZone}`,
          });
        } else {
          setPriceData(candidate);
          trackClarityEvent("quote_calculated");
          setClarityTag("quote_route", `${fromCountry} -> ${toZone}`);
          gaEvent("quote_calculated", { route: `${fromCountry} -> ${toZone}` });
          trackMarketingEvent("quote_calculated", {
            route: `${fromCountry} -> ${toZone}`,
          });
        }
      } else {
        setError(
          `No pricing found for ${getCountryName(fromCountry) || "selected origin"} → ${getZoneName(toZone) || "selected zone"} yet. Please contact our support team.`,
        );
        setClarityTag("quote_result", "no_price");
        gaEvent("quote_no_price", { route: `${fromCountry} -> ${toZone}` });
        trackMarketingEvent("quote_no_price", {
          route: `${fromCountry} -> ${toZone}`,
        });
      }
    } catch {
      setError("Failed to fetch prices. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const displayPrice = (base: number | string) => Number(base).toFixed(3);
  const carriers = [
    {
      name: "DHL Express",
      logo: "/logos/dhl-logo.webp",
      deliveryTime: "1-3 business days",
    },
    {
      name: "FedEx",
      logo: "/logos/fedex-logo.webp",
      deliveryTime: "3-5 business days",
    },
    {
      name: "Aramex",
      logo: "/logos/aramex-logo.webp",
      deliveryTime: "5-7 business days",
    },
    { name: "UPS", logo: "/logos/ups-logo.webp", deliveryTime: "1-3 business days" },
    {
      name: "Local Partner",
      logo: "/logo.png",
      deliveryTime: "8-10 business days",
    },
  ];

  const features = [
    {
      icon: <Calculator className="w-6 h-6 text-[#F5C400]" strokeWidth={1.5} />,
      title: "Instant Quotes",
      description: "Get real-time shipping rates from multiple carriers",
    },
    {
      icon: <Globe className="w-6 h-6 text-[#F5C400]" strokeWidth={1.5} />,
      title: "Global Coverage",
      description: "Compare rates for 200+ countries worldwide",
    },
    {
      icon: <DollarSign className="w-6 h-6 text-[#F5C400]" strokeWidth={1.5} />,
      title: "Best Prices",
      description: "Access to negotiated rates with major carriers",
    },
    {
      icon: <Clock className="w-6 h-6 text-[#F5C400]" strokeWidth={1.5} />,
      title: "Delivery Options",
      description: "Choose from express, standard, or economy options",
    },
  ];

  return (
    <div className="w-full h-auto bg-soft-green">
      <PageHeader
        title="SHIP AND TRACK"
        subtitle="CALCULATE SHIPPING CHARGE"
        mainLink="/ship-and-track"
        subLink="/ship-and-track/claculate-shipping-charge"
      />

      {/* World Country Zone List Section */}
      <div className="w-full bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-10 pb-16">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-[#12352A] mb-3">
              World Country Zone List
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Search and browse our shipping destination zones and the countries
              covered under each.
            </p>
          </div>

          <div className="max-w-xl mx-auto mb-8 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={zoneSearch}
              onChange={(e) => setZoneSearch(e.target.value)}
              placeholder="Search Country / Zone"
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-full shadow-sm focus:ring-2 focus:ring-[#006B45] focus:border-transparent outline-none"
            />
          </div>

          <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gradient-to-r from-[#12352A] to-[#1c4a36] text-white">
                <tr>
                  <th className="px-5 py-4 text-left font-semibold tracking-wide">
                    Zone Name
                  </th>
                  <th className="px-5 py-4 text-left font-semibold tracking-wide">
                    Country Name
                  </th>
                </tr>
              </thead>
              <tbody>
                {loadingZones ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-5 py-10 text-center text-gray-400"
                    >
                      Loading zones…
                    </td>
                  </tr>
                ) : filteredZones.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-5 py-10 text-center text-gray-400"
                    >
                      No zones found.
                    </td>
                  </tr>
                ) : (
                  filteredZones.map((z, i) => (
                    <tr
                      key={z._id}
                      className={`border-t border-gray-100 transition-colors hover:bg-[#f3faf7] ${
                        i % 2 === 1 ? "bg-gray-50/50" : ""
                      }`}
                    >
                      <td className="px-5 py-4 align-top">
                        <span className="inline-block bg-[#EAF3EE] text-[#006B45] border border-[#006B45]/30 rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap">
                          {z.name}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {z.countryIds && z.countryIds.length > 0 ? (
                            z.countryIds.map((c) => (
                              <span
                                key={c._id}
                                className="inline-block bg-gray-100 text-gray-700 rounded-md px-2 py-0.5 text-xs"
                              >
                                {c.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="w-full bg-white">
        <div className="container mx-auto px-2 py-8">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-[#12352A] mb-6">
              Calculate Shipping Charges
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Select origin country, destination zone and shipment type (B2B or
              B2C) to get instant shipping quotes.
            </p>
          </div>

          {/* Calculator Form */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-gray-100 p-6 sm:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#EAF3EE] border border-[#006B45]/10 flex items-center justify-center shrink-0">
                  <Calculator className="w-6 h-6 text-primary" strokeWidth={1.7} />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#12352A] leading-tight">
                    Shipping Calculator
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Choose origin, destination &amp; shipment type to see live rates.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* From Country */}
                <div>
                  <label htmlFor="calc-from" className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    From Country
                  </label>
                  <div className="relative">
                    <select
                      id="calc-from"
                      value={fromCountry}
                      onChange={(e) => setFromCountry(e.target.value)}
                      className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 pr-10 text-sm font-medium text-gray-800 focus:bg-white focus:ring-2 focus:ring-[#006B45]/20 focus:border-[#006B45] outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={loadingCountries && countries.length === 0}
                    >
                      <option value="">
                        {loadingCountries && countries.length === 0 ? "Loading countries…" : "Select Country"}
                      </option>
                      {countries.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
                  </div>
                  {fromCountry ? (
                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      {getCountryName(fromCountry)}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1.5">Origin where parcel will be picked up.</p>
                  )}
                </div>

                {/* To Zone */}
                <div>
                  <label htmlFor="calc-to" className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    To Zone
                  </label>
                  <div className="relative">
                    <select
                      id="calc-to"
                      value={toZone}
                      onChange={(e) => setToZone(e.target.value)}
                      className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 pr-10 text-sm font-medium text-gray-800 focus:bg-white focus:ring-2 focus:ring-[#006B45]/20 focus:border-[#006B45] outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={loadingZones && effectiveZones.length === 0}
                    >
                      <option value="">
                        {loadingZones && effectiveZones.length === 0 ? "Loading zones…" : "Select Zone"}
                      </option>
                      {(effectiveZones as ZoneOption[]).map((z) => (
                        <option key={z._id} value={z._id}>
                          {z.name}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
                  </div>
                  {toZone ? (
                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      {getZoneName(toZone)}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1.5">Destination zone covering multiple countries.</p>
                  )}
                </div>
              </div>

              {/* Shipment Type */}
              <div className="mt-6">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
                  <Package className="w-4 h-4 text-gray-400" />
                  Shipment Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setShipmentType("b2b")}
                    className={`relative rounded-xl border-2 px-4 py-3.5 text-left transition-all ${shipmentType === "b2b" ? "border-[#006B45] bg-[#EAF3EE] shadow-sm" : "border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300"}`}
                  >
                    <div className={`text-sm font-bold ${shipmentType === "b2b" ? "text-[#12352A]" : "text-gray-700"}`}>B2B</div>
                    <div className="text-xs text-gray-500 leading-tight">Business to Business</div>
                    {shipmentType === "b2b" && <CheckCircle2 className="w-4 h-4 text-[#006B45] absolute top-3 right-3" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShipmentType("b2c")}
                    className={`relative rounded-xl border-2 px-4 py-3.5 text-left transition-all ${shipmentType === "b2c" ? "border-[#006B45] bg-[#EAF3EE] shadow-sm" : "border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300"}`}
                  >
                    <div className={`text-sm font-bold ${shipmentType === "b2c" ? "text-[#12352A]" : "text-gray-700"}`}>B2C</div>
                    <div className="text-xs text-gray-500 leading-tight">Business to Customer</div>
                    {shipmentType === "b2c" && <CheckCircle2 className="w-4 h-4 text-[#006B45] absolute top-3 right-3" />}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-7 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Live rates with fuel &amp; profit included.</span>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPriceData(null);
                      setError("");
                      const bd = countries.find((c) => c.name.toLowerCase() === "bangladesh")?._id || countries[0]?._id || "";
                      const firstZone = (effectiveZones as ZoneOption[])[0]?._id || "";
                      if (bd) setFromCountry(bd);
                      if (firstZone) setToZone(firstZone);
                      setShipmentType("b2b");
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                  <button
                    onClick={handleCalculate}
                    disabled={loading || !fromCountry || !toZone || loadingCountries || loadingZones}
                    className="inline-flex items-center justify-center gap-2 bg-[#006B45] text-white px-8 py-3.5 rounded-xl hover:bg-[#087F4F] active:scale-[0.98] transition-all font-bold text-sm shadow-md disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                    {loading ? "Calculating..." : "Get Shipping Rates"}
                  </button>
                </div>
              </div>

              {/* Results */}
              {error && (
                <div className="mt-6 flex gap-3 bg-red-50 border border-red-200 text-red-800 rounded-xl p-4">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="text-sm font-medium leading-relaxed">{error}</div>
                </div>
              )}

              {priceData && (
                <div className="mt-6">
                  <div className="bg-[#F1F8F4] border border-[#E2E8F0] rounded-2xl p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                      <h4 className="text-lg sm:text-xl font-bold text-[#12352A] flex items-center gap-2">
                        <span className="inline-flex w-8 h-8 rounded-full bg-white border border-gray-200 items-center justify-center">
                          <Globe className="w-4 h-4 text-[#006B45]" />
                        </span>
                        {getCountryName(fromCountry)} → {getZoneName(toZone)}
                      </h4>
                      <span className="text-xs font-bold tracking-wide text-white bg-[#12352A] px-3 py-1.5 rounded-full">
                        {shipmentType === "b2b" ? "B2B" : "B2C"}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {(priceData.rate || []).map((r, idx) => (
                        <div
                          key={idx}
                          className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-gradient-to-r from-white to-gray-50 border-b border-gray-100">
                            <div className="font-bold text-[#12352A] capitalize flex items-center gap-2">
                              <span className="w-7 h-7 rounded-full bg-[#EAF3EE] border border-[#006B45]/20 flex items-center justify-center text-xs font-extrabold text-[#006B45]">
                                {idx + 1}
                              </span>
                              {r.name}
                            </div>
                            <div className="text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-2.5 py-1">
                              Gift: {r.gift ?? 0}
                            </div>
                          </div>
                          <div className="p-3 sm:p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-sm">
                              {Object.entries(r.price || {})
                                .filter(
                                  ([, v]) =>
                                    typeof v === "number" && Number(v) > 0,
                                )
                                .map(([k, v]) => (
                                  <div
                                    key={k}
                                    className="group flex items-center justify-between gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 hover:bg-white hover:border-[#006B45]/20 hover:shadow-sm transition-all"
                                  >
                                    <div className="font-medium text-gray-600 text-xs sm:text-sm truncate">
                                      {WEIGHT_LABELS[k] || k}
                                    </div>
                                    <div className="font-extrabold text-[#12352A] text-sm whitespace-nowrap">
                                      ${displayPrice(v as number)}
                                    </div>
                                  </div>
                                ))}
                            </div>
                            {r.serviceDetails && r.serviceDetails.filter(Boolean).length > 0 && (
                              <ul className="mt-4 grid gap-1.5">
                                {r.serviceDetails.filter(Boolean).map((d, di) => (
                                  <li key={di} className="flex items-start gap-2 text-sm text-gray-600">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>{d}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 text-center mt-4 flex items-center justify-center gap-1.5">
                      <DollarSign className="w-3 h-3" />
                      All prices include fuel &amp; profit. Final chargeable amount.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="w-full bg-[#12352A]">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Why Use Our Calculator?
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Get the most accurate shipping quotes with our advanced calculator
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-[#12352A] rounded-lg p-6 text-center hover:bg-[#1c4a36] transition-colors"
              >
                <div className="bg-[#12352A] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-300 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Carriers Section */}
      <div className="w-full bg-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#12352A] mb-4">
              Our Carrier Partners
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Compare rates from leading international and local courier
              services
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {carriers.map((carrier, index) => (
              <div
                key={index}
                className="bg-section rounded-lg p-6 text-center hover:shadow-lg transition-shadow"
              >
                <Image
                  src={carrier.logo}
                  alt={carrier.name}
                  width={48}
                  height={48}
                  className="h-12 w-auto mx-auto mb-4 object-contain"
                />
                <h3 className="font-semibold text-[#12352A] mb-2">
                  {carrier.name}
                </h3>
                <p className="text-sm text-gray-600">{carrier.deliveryTime}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="w-full bg-[#12352A]">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Ship Your Package?
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Found the perfect rate? Create your shipment now and enjoy doorstep
            pickup service.
          </p>
          <div className="flex justify-center align-middle items-center gap-3 flex-col sm:flex-row">
            <button className="bg-primary text-white py-2.5 px-7 rounded-lg hover:bg-[#087F4F] transition-colors font-semibold">
              Create Shipment
            </button>
            <button className="border-2 border-white text-white py-2 px-8 rounded-lg hover:bg-white hover:text-[#12352A] transition-colors font-semibold">
              Get Help
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

