"use client";

import { getRequestSend } from "@/components/ApiCall/methord";
import { ROOT_API } from "@/components/ApiCall/url";
import PageHeader from "@/utilities/PageHeader";
import { Calculator, Clock, DollarSign, Globe, Loader2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface CountryOption {
  _id: string;
  name: string;
  code: string;
  phoneCode?: string;
  isActive?: boolean;
}

interface ZoneOption {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  price: Record<string, number>;
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

const CalculateShippingCharge = () => {
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [fromCountry, setFromCountry] = useState("");
  const [toZone, setToZone] = useState("");
  const [shipmentType, setShipmentType] = useState("b2b");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [priceData, setPriceData] = useState<PriceData | null>(null);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await getRequestSend<CountryOption[]>(
          `${ROOT_API}countrys?isActive=true&limit=250&sortBy=name&sortOrder=asc`
        );
        if (response.status === 200 && Array.isArray(response.data)) {
          setCountries(response.data);
          const bangladesh = response.data.find((c) => c.name === "Bangladesh");
          setFromCountry(bangladesh?._id || response.data[0]?._id || "");
        }
      } catch {
        // countries are optional
      }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const response = await getRequestSend<ZoneOption[]>(
          `${ROOT_API}zones?isActive=true&limit=100&sortBy=name&sortOrder=asc`
        );
        if (response.status === 200 && Array.isArray(response.data)) {
          setZones(response.data);
          if (!toZone) {
            setToZone(response.data[0]?._id || "");
          }
        }
      } catch {
        // zones are optional
      }
    };
    fetchZones();
  }, [toZone]);

  const getCountryName = (id: string) =>
    countries.find((c) => c._id === id)?.name || "";

  const getZoneName = (id: string) => zones.find((z) => z._id === id)?.name || "";

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
        `${ROOT_API}prices?${params.toString()}`
      );
      if (response.status === 200 && Array.isArray(response.data) && response.data.length > 0) {
        setPriceData(response.data[0]);
      } else {
        setError(
          "No pricing found for this route yet. Please contact our support team."
        );
      }
    } catch {
      setError("Failed to fetch prices. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const priceWithFees = (base: any, rate: any) =>
    Number(base * (1 + (rate.fuel || 0) / 100) * (1 + (rate.profitPercentage || 0) / 100)).toFixed(3);
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
              Select origin country, destination zone and shipment type (B2B
              or B2C) to get instant shipping quotes.
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* From Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Country
                  </label>
                  <select
                    value={fromCountry}
                    onChange={(e) => setFromCountry(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    {countries.length === 0 && <option value="">Select Country</option>}
                    {countries.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* To Zone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Zone
                  </label>
                  <select
                    value={toZone}
                    onChange={(e) => setToZone(e.target.value)}
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
              </div>

              {/* Shipment Type */}
              <div className="mt-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipment Type
                </label>
                <select
                  value={shipmentType}
                  onChange={(e) => setShipmentType(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  <option value="b2b">B2B (Business to Business)</option>
                  <option value="b2c">B2C (Business to Customer)</option>
                </select>
              </div>

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

              {priceData && (
                <div className="mt-8">
                  <div className="bg-soft-green border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xl font-bold text-[#12352A]">
                        {priceData.from?.name || getCountryName(fromCountry)} →{" "}
                        {priceData.to?.name || getZoneName(toZone)}
                      </h4>
                      <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full">
                        {shipmentType === "b2b" ? "B2B" : "B2C"}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {(priceData.rate || []).map((r, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-white rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="font-bold text-[#12352A] capitalize">
                              {r.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Profit: {r.profitPercentage ?? 0}% • Gift:{" "}
                              {r.gift ?? 0} • Fuel: {r.fuel ?? 0}%
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                            {Object.entries(r.price || {})
                              .filter(([, v]) => typeof v === "number" && Number(v) > 0)
                              .map(([k, v]) => (
                                <div
                                  key={k}
                                  className="p-2 bg-gray-50 rounded flex items-center justify-between"
                                >
                                  <div className="font-medium text-gray-600 truncate">
                                    {WEIGHT_LABELS[k] || k}
                                  </div>
                                  <div className="font-bold text-[#12352A] pl-2">
                                    ${priceWithFees(v, r)}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
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
};

export default CalculateShippingCharge;
