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
import { useState } from "react";

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
  from?: { name?: string };
  to?: { name?: string };
  rate: Rate[];
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

export default function ShippingCalculatorContent({
  initialCountries,
  initialZones,
}: {
  initialCountries: CountryOption[];
  initialZones: ZoneOption[];
}) {
  const [countries] = useState<CountryOption[]>(initialCountries);
  const [zones] = useState<ZoneOption[]>(initialZones);
  const [fromCountry, setFromCountry] = useState<string>(
    () =>
      initialCountries.find((c) => c.name === "Bangladesh")?._id ||
      initialCountries[0]?._id ||
      ""
  );
  const [toZone, setToZone] = useState<string>(() => initialZones[0]?._id || "");
  const [weightKg, setWeightKg] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [priceData, setPriceData] = useState<PriceData | null>(null);

  const getCountryName = (id: string) =>
    countries.find((c) => c._id === id)?.name || "";
  const getZoneName = (id: string) =>
    zones.find((z) => z._id === id)?.name || "";

  const resetResults = () => {
    setQuote(null);
    setPriceData(null);
    setError("");
  };

  const handleCalculate = async () => {
    setError("");
    setQuote(null);
    setPriceData(null);

    if (!fromCountry) {
      setError("Please select an origin country");
      return;
    }
    if (!toZone) {
      setError("Please select a destination zone");
      return;
    }

    const parsedKg = Number(weightKg);
    if (!Number.isFinite(parsedKg) || parsedKg <= 0) {
      setError("Please enter a valid parcel weight in kilograms");
      return;
    }
    if (parsedKg > MAX_WEIGHT_KG) {
      setError(`Weight cannot exceed ${MAX_WEIGHT_KG} kg`);
      return;
    }

    const weightGrams = Math.round(parsedKg * 1000);

    setLoading(true);
    try {
      // Quote for the exact weight + full rate chart for this route. The full
      // chart is already fee-inclusive on the public endpoint, so the values
      // must not be multiplied again in the UI.
      const [quoteResponse, chartResponse] = await Promise.all([
        postRequestSend<Record<string, unknown>, QuoteData>(
          `${ROOT_API}prices/calculate`,
          undefined,
          {
            fromCountryId: fromCountry,
            toZoneId: toZone,
            weight: weightGrams,
          }
        ),
        getRequestSend<PriceData[]>(
          `${ROOT_API}prices?from=${fromCountry}&to=${toZone}&limit=1`
        ),
      ]);

      if (
        quoteResponse.status === 200 &&
        quoteResponse.data &&
        Array.isArray(quoteResponse.data.rates) &&
        quoteResponse.data.rates.length > 0
      ) {
        setQuote(quoteResponse.data);
      } else {
        setError(
          quoteResponse.message ||
            "No pricing found for this route yet. Please contact our support team."
        );
      }

      if (
        chartResponse.status === 200 &&
        Array.isArray(chartResponse.data) &&
        chartResponse.data.length > 0
      ) {
        setPriceData(chartResponse.data[0]);
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
                    onChange={(e) => {
                      setFromCountry(e.target.value);
                      resetResults();
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    {countries.length === 0 && (
                      <option value="">Select Country</option>
                    )}
                    {countries.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* To Zone */}
                <div>
                  <label
                    htmlFor="calc-to"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    To Zone
                  </label>
                  <select
                    id="calc-to"
                    value={toZone}
                    onChange={(e) => {
                      setToZone(e.target.value);
                      resetResults();
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="">Select Zone</option>
                    {zones.map((z) => (
                      <option key={z._id} value={z._id}>
                        {z.name}
                      </option>
                    ))}
                  </select>
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

              {(countries.length === 0 || zones.length === 0) && (
                <div className="mt-6 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 text-center text-sm">
                  Shipping routes are being updated. Please contact support for a
                  manual quote.
                </div>
              )}

              {/* Calculate Button */}
              <div className="mt-8 text-center">
                <button
                  onClick={handleCalculate}
                  disabled={loading}
                  className="bg-primary text-white py-4 px-12 rounded-lg hover:bg-[#087F4F] transition-colors font-bold text-lg disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  {loading ? "Calculating..." : "Get Shipping Rates"}
                </button>
              </div>

              {/* Results */}
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
                        {quote.to?.name || getZoneName(toZone)}
                      </h4>
                      <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full">
                        {quote.weightKg} kg • {quote.tierLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sortedRates.map((rate) => (
                        <div
                          key={rate.name}
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
              {priceData && priceData.rate?.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-lg font-bold text-[#12352A] mb-3">
                    Full rate chart
                  </h4>
                  <div className="space-y-4">
                    {priceData.rate.map((r, idx) => {
                      const tiers = Object.entries(r.price || {}).filter(
                        ([, value]) =>
                          typeof value === "number" && Number(value) > 0
                      );
                      if (tiers.length === 0) return null;

                      return (
                        <div
                          key={`${r.name}-${idx}`}
                          className="p-4 bg-white rounded-lg border border-gray-200"
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
