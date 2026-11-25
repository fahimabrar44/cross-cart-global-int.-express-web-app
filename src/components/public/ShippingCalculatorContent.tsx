"use client";

import {
  getRequestSend,
  postRequestSend,
} from "@/components/ApiCall/methord";
import { ROOT_API } from "@/components/ApiCall/url";
import { MAX_WEIGHT_KG, weightTierLabel } from "@/lib/weightTiers";
import PageHeader from "@/utilities/PageHeader";
import {
  BadgeCheck,
  Calculator,
  Clock,
  DollarSign,
  Globe,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
  /** Zones are populated with the countries they cover by the list API. */
  countryIds?: Array<
    string | { _id: string; name?: string; code?: string; isActive?: boolean }
  >;
}

interface PriceRef {
  _id?: string;
  name?: string;
  code?: string;
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
  from?: string | PriceRef;
  to?: string | PriceRef;
  rate: Rate[];
}

interface DestinationOption {
  _id: string;
  name: string;
}

interface DestinationGroup {
  zoneId: string;
  zoneName: string;
  countries: Array<{ _id: string; name: string }>;
}

interface QuoteRate {
  name: string;
  profitPercentage: number;
  gift: number;
  fuel: number;
  tier: string;
  tierLabel: string;
  basePrice: number;
  finalPrice: number;
  serviceDetails: string[];
}

interface QuoteData {
  from: { _id: string; name?: string; code?: string };
  to: { _id: string; name?: string; code?: string };
  weight: number;
  weightKg: number;
  tier: string;
  tierLabel: string;
  perKg: boolean;
  rates: QuoteRate[];
}

function getId(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const ref = value as { _id?: unknown; id?: unknown };
    if (typeof ref._id === "string") return ref._id;
    if (typeof ref.id === "string") return ref.id;
  }
  return "";
}

function isObjectId(value: string): boolean {
  return /^[a-f0-9]{24}$/i.test(value);
}

function getRefName(value: unknown): string {
  if (value && typeof value === "object") {
    const ref = value as { name?: unknown };
    if (typeof ref.name === "string") return ref.name;
  }
  return "";
}

export default function ShippingCalculatorContent({
  initialCountries,
  initialZones,
}: {
  initialCountries: CountryOption[];
  initialZones: ZoneOption[];
}) {
  const [countries, setCountries] = useState<CountryOption[]>(initialCountries);
  const [zones, setZones] = useState<ZoneOption[]>(initialZones);
  const [fromCountry, setFromCountry] = useState<string>(
    () =>
      initialCountries.find((c) => c.name === "Bangladesh")?._id ||
      initialCountries[0]?._id ||
      ""
  );
  const [toZone, setToZone] = useState<string>("");
  const [weightKg, setWeightKg] = useState("1");
  const [loading, setLoading] = useState(false);
  const [routeLoading, setRouteLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [originCharts, setOriginCharts] = useState<PriceData[]>([]);
  const [routeCharts, setRouteCharts] = useState<PriceData[]>([]);

  const zoneNameById = useMemo(() => {
    const map = new Map<string, string>();
    zones.forEach((zone) => map.set(zone._id, zone.name));
    return map;
  }, [zones]);

  const zoneById = useMemo(() => {
    const map = new Map<string, ZoneOption>();
    zones.forEach((zone) => map.set(zone._id, zone));
    return map;
  }, [zones]);

  const getCountryName = (id: string) =>
    countries.find((c) => c._id === id)?.name || "";

  /**
   * Destinations are derived from the rate charts configured for the selected
   * origin. This prevents the user from picking a route that has no rates and
   * keeps "From Country → To Country Zone" a valid pair before calculating.
   */
  const destinationOptions = useMemo<DestinationOption[]>(() => {
    const map = new Map<string, DestinationOption>();
    originCharts.forEach((chart) => {
      const id = getId(chart.to);
      if (!id) return;
      const zone = zoneById.get(id);
      if (zone?.isActive === false) return;
      const country = countries.find((c) => c._id === id);
      if (country?.isActive === false) return;
      map.set(id, {
        _id: id,
        name:
          getRefName(chart.to) ||
          zoneNameById.get(id) ||
          country?.name ||
          id,
      });
    });

    // If the route lookup failed or no chart exists yet, still show the zone
    // list so the page does not look broken; the calculate step will explain
    // that no pricing is configured.
    if (map.size === 0) {
      zones.forEach((zone) => {
        if (zone.isActive === false) return;
        map.set(zone._id, zone);
      });
    }

    return Array.from(map.values());
  }, [originCharts, zones, zoneById, zoneNameById, countries]);

  /**
   * Group every destination zone by the countries it covers. The second select
   * then lets the user pick a real destination country while the rate lookup
   * still happens against that country's zone.
   */
  const destinationGroups = useMemo<DestinationGroup[]>(() => {
    return destinationOptions.map((destination) => {
      const zone = zoneById.get(destination._id);
      const zoneName =
        destination.name || zone?.name || zoneNameById.get(destination._id) || "";

      const seen = new Set<string>();
      const groupCountries = (zone?.countryIds || [])
        .map((entry) => {
          if (typeof entry === "string") {
            const match = countries.find((c) => c._id === entry);
            return {
              _id: entry,
              name: match?.name || "",
              isActive: match?.isActive,
            };
          }
          const match = countries.find((c) => c._id === entry._id);
          return {
            _id: entry._id,
            name: entry.name || match?.name || "",
            isActive: entry.isActive ?? match?.isActive,
          };
        })
        .filter((country) => {
          if (!country._id || !country.name) return false;
          if (country.isActive === false) return false;
          if (country._id === fromCountry) return false;
          if (seen.has(country._id)) return false;
          seen.add(country._id);
          return true;
        })
        .map((country) => ({ _id: country._id, name: country.name }));

      return {
        zoneId: destination._id,
        zoneName,
        countries: groupCountries,
      };
    });
  }, [destinationOptions, zoneById, zoneNameById, countries, fromCountry]);

  // Encoded values: "c:<zoneId>:<countryId>" for a country and
  // "z:<zoneId>" for a zone without a country mapping (legacy routes or zones
  // with no countries). Encoding the zone as well keeps duplicate country
  // names in different zones unambiguous.
  const destinationChoices = useMemo(
    () =>
      destinationGroups.flatMap((group) =>
        group.countries.length > 0
          ? group.countries.map(
              (country) => `c:${group.zoneId}:${country._id}`
            )
          : [`z:${group.zoneId}`]
      ),
    [destinationGroups]
  );

  const destinationLabelByValue = useMemo(() => {
    const map = new Map<string, string>();
    destinationGroups.forEach((group) => {
      if (group.countries.length > 0) {
        group.countries.forEach((country) =>
          map.set(
            `c:${group.zoneId}:${country._id}`,
            `${country.name} — ${group.zoneName}`
          )
        );
      } else {
        map.set(`z:${group.zoneId}`, group.zoneName);
      }
    });
    return map;
  }, [destinationGroups]);

  const selectedDestinationLabel = destinationLabelByValue.get(toZone) || "";

  // The zone used for the actual price lookup. A country selection is mapped
  // back to the zone that contains it.
  const selectedZoneId = useMemo(() => {
    if (!toZone) return "";
    if (toZone.startsWith("z:")) return toZone.slice(2);
    const [, zoneId] = toZone.split(":");
    return zoneId || "";
  }, [toZone]);

  // Public pages are server-rendered, but a failed SSR fetch used to leave the
  // selects permanently empty. Retry on the client as a safety net.
  useEffect(() => {
    if (initialCountries.length > 0 && initialZones.length > 0) return;

    let cancelled = false;
    (async () => {
      const [countryResponse, zoneResponse] = await Promise.all([
        initialCountries.length === 0
          ? getRequestSend<CountryOption[]>(
              `${ROOT_API}countrys?isActive=true&limit=500&sortBy=name&sortOrder=asc`
            )
          : Promise.resolve(null),
        initialZones.length === 0
          ? getRequestSend<ZoneOption[]>(
              `${ROOT_API}zones?isActive=true&limit=500&sortBy=name&sortOrder=asc`
            )
          : Promise.resolve(null),
      ]);

      if (cancelled) return;
      if (countryResponse?.data && Array.isArray(countryResponse.data)) {
        setCountries(countryResponse.data);
      }
      if (zoneResponse?.data && Array.isArray(zoneResponse.data)) {
        setZones(zoneResponse.data);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialCountries.length, initialZones.length]);

  // Keep the origin selection valid after countries load.
  useEffect(() => {
    if (countries.length === 0) return;
    if (countries.some((country) => country._id === fromCountry)) return;

    const bangladesh = countries.find(
      (country) => country.name.trim().toLowerCase() === "bangladesh"
    );
    setFromCountry(bangladesh?._id || countries[0]._id);
  }, [countries, fromCountry]);

  // Load every active rate chart for the selected origin so the destination
  // dropdown only contains real routes.
  useEffect(() => {
    if (!fromCountry) {
      setOriginCharts([]);
      setRouteLoading(false);
      return;
    }

    let cancelled = false;
    setRouteLoading(true);
    setNotice("");

    getRequestSend<PriceData[]>(
      `${ROOT_API}prices?from=${fromCountry}&isActive=true&limit=200`
    )
      .then((response) => {
        if (cancelled) return;
        if (response.status === 200 && Array.isArray(response.data)) {
          setOriginCharts(response.data);
          if (response.data.length === 0) {
            setNotice(
              "No rate chart is configured for this origin yet. Please contact support."
            );
          }
        } else {
          setOriginCharts([]);
          setNotice(
            response.message || "Could not load destinations for this origin."
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOriginCharts([]);
          setNotice("Could not load destinations for this origin.");
        }
      })
      .finally(() => {
        if (!cancelled) setRouteLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fromCountry]);

  // Select the first available destination whenever the origin/route list
  // changes. While a new origin is loading, keep the previous selection so the
  // control does not flicker.
  useEffect(() => {
    if (routeLoading) return;
    if (destinationChoices.length === 0) {
      if (toZone) setToZone("");
      return;
    }
    if (!destinationChoices.includes(toZone)) {
      setToZone(destinationChoices[0]);
    }
  }, [destinationChoices, routeLoading, toZone]);

  const resetResults = () => {
    setQuote(null);
    setRouteCharts([]);
    setError("");
    setNotice("");
  };

  const handleFromChange = (value: string) => {
    setFromCountry(value);
    setToZone("");
    setOriginCharts([]);
    setRouteCharts([]);
    setQuote(null);
    setError("");
    setNotice("");
    setRouteLoading(true);
  };

  const handleToChange = (value: string) => {
    setToZone(value);
    resetResults();
  };

  const handleCalculate = async () => {
    setError("");
    setNotice("");
    setQuote(null);
    setRouteCharts([]);

    if (!fromCountry) {
      setError("Please select an origin country");
      return;
    }
    if (!toZone) {
      setError("Please select a destination country");
      return;
    }

    const toCountryId = toZone.startsWith("c:")
      ? toZone.split(":")[2] || ""
      : "";
    const chartDestination = selectedZoneId || toCountryId;
    if (!chartDestination) {
      setError("Please select a destination country");
      return;
    }

    const fromCountryLabel =
      countries.find((country) => country._id === fromCountry)?.name || "";
    const toCountryLabel = toCountryId
      ? countries.find((country) => country._id === toCountryId)?.name || ""
      : "";
    const zoneLabel = selectedZoneId
      ? zoneNameById.get(selectedZoneId) || ""
      : "";

    const fromQuery = isObjectId(fromCountry)
      ? `from=${fromCountry}`
      : `fromName=${encodeURIComponent(fromCountryLabel || fromCountry)}`;
    // Prefer the selected country: the server resolves it to the correct zone,
    // so the chart still loads if the client-side zone mapping is stale.
    const destinationQuery = toCountryId
      ? isObjectId(toCountryId)
        ? `toCountryId=${toCountryId}`
        : `toName=${encodeURIComponent(toCountryLabel || toCountryId)}`
      : isObjectId(chartDestination)
        ? `to=${chartDestination}`
        : `toName=${encodeURIComponent(zoneLabel || chartDestination)}`;

    const parsedKg = Number(weightKg);
    const weightValid =
      Number.isFinite(parsedKg) && parsedKg > 0 && parsedKg <= MAX_WEIGHT_KG;

    setLoading(true);
    try {
      const chartPromise = getRequestSend<PriceData[]>(
        `${ROOT_API}prices?${fromQuery}&${destinationQuery}&isActive=true&limit=200`
      );

      let quoteResponse: {
        status: number;
        message: string;
        data: QuoteData | null;
      } | null = null;
      let chartResponse: {
        status: number;
        message: string;
        data: PriceData[] | null;
      } | null = null;

      if (weightValid) {
        const [quoteResult, chartResult] = await Promise.all([
          postRequestSend<Record<string, unknown>, QuoteData>(
            `${ROOT_API}prices/calculate`,
            undefined,
            {
              fromCountryId: fromCountry,
              ...(fromCountryLabel
                ? { fromCountryName: fromCountryLabel }
                : {}),
              ...(selectedZoneId
                ? { toZoneId: selectedZoneId, toZoneName: zoneLabel }
                : {}),
              ...(toCountryId
                ? { toCountryId, toCountryName: toCountryLabel }
                : {}),
              weight: Math.round(parsedKg * 1000),
            }
          ),
          chartPromise,
        ]);
        quoteResponse = quoteResult;
        chartResponse = chartResult;
      } else {
        chartResponse = await chartPromise;
      }

      const chartData =
        chartResponse?.status === 200 && Array.isArray(chartResponse.data)
          ? chartResponse.data
          : [];
      const noChart = chartData.length === 0;
      setRouteCharts(chartData);

      let quoteMessage = "";
      if (quoteResponse) {
        if (
          quoteResponse.status === 200 &&
          quoteResponse.data &&
          Array.isArray(quoteResponse.data.rates) &&
          quoteResponse.data.rates.length > 0
        ) {
          setQuote(quoteResponse.data);
        } else {
          quoteMessage =
            quoteResponse.message ||
            "No pricing found for this route yet. Please contact our support team.";
        }
      }

      if (!weightValid) {
        if (noChart) {
          setError(
            "Please enter a valid parcel weight. No rate chart is available for this route."
          );
        } else {
          setNotice(
            "Enter a valid parcel weight to see the exact price. The full rate chart is shown below."
          );
        }
      } else if (quoteMessage) {
        if (noChart) setError(quoteMessage);
        else setNotice(`${quoteMessage} The full rate chart is shown below.`);
      } else if (noChart) {
        setError(
          chartResponse?.message ||
            "No pricing found for this route yet. Please contact our support team."
        );
      }
    } catch {
      setError("Failed to fetch prices. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const sortedRates = quote
    ? [...quote.rates].sort((a, b) => a.finalPrice - b.finalPrice)
    : [];
  const cheapestPrice = sortedRates[0]?.finalPrice;

  const carriers = [
    {
      name: "DHL Express",
      logo: "/dhl-logo.png",
      deliveryTime: "1-3 business days",
    },
    {
      name: "FedEx",
      logo: "/fedex-logo.png",
      deliveryTime: "3-5 business days",
    },
    {
      name: "Aramex",
      logo: "/aramex-logo.png",
      deliveryTime: "5-7 business days",
    },
    { name: "UPS", logo: "/ups-logo.png", deliveryTime: "1-3 business days" },
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

      {/* Hero Section */}
      <div className="w-full bg-white">
        <div className="container mx-auto px-2 py-8">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-[#12352A] mb-6">
              Calculate Shipping Charges
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Select the origin country, destination zone and parcel weight to
              get an instant, all-in shipping quote.
            </p>
          </div>

          {/* Calculator Form */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-3">
              <div className="flex items-center mb-4">
                <Calculator
                  className="w-8 h-8 text-primary mr-3"
                  strokeWidth={1.5}
                />
                <h3 className="text-2xl font-bold text-[#12352A]">
                  Shipping Calculator
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* From Country */}
                <div>
                  <label
                    htmlFor="calc-from"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    From Country
                  </label>
                  <select
                    id="calc-from"
                    value={fromCountry}
                    onChange={(e) => handleFromChange(e.target.value)}
                    disabled={countries.length === 0}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {countries.length === 0 && (
                      <option value="">Loading countries...</option>
                    )}
                    {countries.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* To Country Zone */}
                <div>
                  <label
                    htmlFor="calc-to"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    To Country Zone
                  </label>
                  <select
                    id="calc-to"
                    value={toZone}
                    onChange={(e) => handleToChange(e.target.value)}
                    disabled={routeLoading || destinationChoices.length === 0}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {routeLoading && (
                      <option value="">Loading destinations...</option>
                    )}
                    {!routeLoading && destinationGroups.length === 0 && (
                      <option value="">No destinations available</option>
                    )}
                    {!routeLoading &&
                      destinationGroups.map((group) =>
                        group.countries.length > 0 ? (
                          <optgroup key={group.zoneId} label={group.zoneName}>
                            {group.countries.map((country) => (
                              <option
                                key={`${group.zoneId}:${country._id}`}
                                value={`c:${group.zoneId}:${country._id}`}
                              >
                                {country.name}
                              </option>
                            ))}
                          </optgroup>
                        ) : (
                          <optgroup key={group.zoneId} label={group.zoneName}>
                            <option value={`z:${group.zoneId}`}>
                              {group.zoneName} — all countries
                            </option>
                          </optgroup>
                        )
                      )}
                  </select>
                  {!routeLoading && destinationGroups.length > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      Countries are grouped by their destination zone.
                    </p>
                  )}
                  {routeLoading && (
                    <p className="mt-1 text-xs text-gray-500">
                      Loading rate-chart destinations for this origin...
                    </p>
                  )}
                </div>

                {/* Weight */}
                <div>
                  <label
                    htmlFor="calc-weight"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Parcel Weight (kg)
                  </label>
                  <input
                    id="calc-weight"
                    type="number"
                    inputMode="decimal"
                    min="0.1"
                    max={MAX_WEIGHT_KG}
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => {
                      setWeightKg(e.target.value);
                      resetResults();
                    }}
                    placeholder="e.g., 1.5"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
              </div>

              {countries.length === 0 && (
                <div className="mt-6 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 text-center text-sm">
                  Country list is loading. If this message stays, please refresh
                  the page or contact support.
                </div>
              )}

              {/* Calculate Button */}
              <div className="mt-8 text-center">
                <button
                  onClick={handleCalculate}
                  disabled={
                    loading ||
                    routeLoading ||
                    !fromCountry ||
                    !toZone ||
                    countries.length === 0
                  }
                  className="bg-primary text-white py-4 px-12 rounded-lg hover:bg-[#087F4F] transition-colors font-bold text-lg disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  {loading ? "Loading price chart..." : "Get Price Chart"}
                </button>
              </div>

              {/* Results */}
              {notice && !error && (
                <div className="mt-8 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 text-center">
                  {notice}
                </div>
              )}

              {error && (
                <div className="mt-8 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-center">
                  {error}
                </div>
              )}

              {quote && (
                <div className="mt-8">
                  <div className="bg-soft-green border border-gray-200 rounded-lg p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                      <h4 className="text-xl font-bold text-[#12352A]">
                        {quote.from?.name || getCountryName(fromCountry)} →{" "}
                        {selectedDestinationLabel || quote.to?.name || ""}
                      </h4>
                      <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full">
                        {quote.weightKg} kg • {quote.tierLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sortedRates.map((rate, index) => (
                        <div
                          key={`${rate.name}-${index}`}
                          className="p-4 bg-white rounded-lg border border-gray-200 flex flex-col gap-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-bold text-[#12352A] capitalize">
                              {rate.name}
                            </div>
                            {rate.finalPrice === cheapestPrice && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                                <BadgeCheck className="w-3.5 h-3.5" />
                                Best price
                              </span>
                            )}
                          </div>

                          <div className="text-3xl font-extrabold text-[#12352A]">
                            ${rate.finalPrice.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Base ${rate.basePrice.toFixed(2)} + fuel{" "}
                            {rate.fuel}% + service {rate.profitPercentage}%
                          </div>

                          {rate.serviceDetails.length > 0 && (
                            <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                              {rate.serviceDetails.map((detail, index) => (
                                <li key={index}>{detail}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>

                    <p className="mt-4 text-xs text-gray-500">
                      All prices are in USD and include the fuel surcharge and
                      service margin. Final charges may vary with packaging and
                      remote-area fees.
                    </p>
                  </div>
                </div>
              )}

              {/* Full rate chart for the selected route */}
              {routeCharts.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-lg font-bold text-[#12352A] mb-3">
                    Full rate chart
                  </h4>
                  <div className="space-y-4">
                    {routeCharts.map((chart, chartIndex) => {
                      const chartFrom =
                        getRefName(chart.from) || getCountryName(fromCountry);
                      const chartTo =
                        getRefName(chart.to) ||
                        zoneNameById.get(selectedZoneId) ||
                        selectedDestinationLabel ||
                        "";
                      const chartRates = Array.isArray(chart.rate)
                        ? chart.rate
                        : [];

                      return (
                        <div
                          key={chart._id || `chart-${chartIndex}`}
                          className="p-4 bg-white rounded-lg border border-gray-200"
                        >
                          <div className="font-bold text-[#12352A] mb-3">
                            {chartFrom} → {chartTo}
                          </div>

                          {chartRates.map((r, idx) => {
                            const tiers = Object.entries(r.price || {}).filter(
                              ([, value]) =>
                                typeof value === "number" && Number(value) > 0
                            );
                            if (tiers.length === 0) return null;

                            return (
                              <div
                                key={`${r.name}-${idx}`}
                                className="mb-4 last:mb-0"
                              >
                                <div className="font-bold text-[#12352A] capitalize mb-3">
                                  {r.name}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                                  {tiers.map(([key, value]) => (
                                    <div
                                      key={key}
                                      className="p-2 bg-gray-50 rounded flex items-center justify-between gap-2"
                                    >
                                      <div className="font-medium text-gray-600">
                                        {weightTierLabel(key)}
                                      </div>
                                      <div className="font-bold text-[#12352A]">
                                        ${Number(value).toFixed(3)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
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
            <Link
              href="/ship-and-track/create-shipment"
              className="bg-primary text-white py-2.5 px-7 rounded-lg hover:bg-[#087F4F] transition-colors font-semibold"
            >
              Create Shipment
            </Link>
            <Link
              href="/contact"
              className="border-2 border-white text-white py-2 px-8 rounded-lg hover:bg-white hover:text-[#12352A] transition-colors font-semibold"
            >
              Get Help
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
