"use client";

import { getRequestSend, postRequestSend } from "@/components/ApiCall/methord";
import { ROOT_API } from "@/components/ApiCall/url";
import { useAuth } from "@/hooks/AuthContext";
import { UserService } from "@/services/dashboardService";
import PageHeader from "@/utilities/PageHeader";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  Package,
  Shield,
  Truck,
  User,
} from "lucide-react";
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

interface OrderFormData {
  parcel: {
    from: string;
    to: string;
    sender: {
      name: string;
      phone: string;
      email: string;
      address: {
        address: string;
        city: string;
        zipCode: string;
        country: string;
      };
    };
    receiver: {
      name: string;
      phone: string;
      email: string;
      address: {
        address: string;
        city: string;
        zipCode: string;
        country: string;
      };
    };
    weight: string;
    serviceType: string;
    priority: "normal" | "express" | "super-express";
    orderType: "document" | "parcel" | "e-commerce";
    item: Array<{
      name: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
    customerNote: string;
    insurance?: {
      enabled: boolean;
      declaredValue: number;
      charge: number;
    };
    couponCode?: string;
    couponDiscount?: number;
  };
  payment?: {
    pType: string;
    pAmount: number;
    pOfferDiscount: number;
    pExtraCharge: number;
    pDiscount: number;
    pReceived: number;
    pRefunded: number;
  };
}

interface ApiResponse {
  _id: string;
  trackId: string;
  orderDate: string;
  createdAt: string;
  updatedAt: string;
}

const CreateShipment = () => {
  const [formData, setFormData] = useState<OrderFormData>({
    parcel: {
      from: "",
      to: "",
      sender: {
        name: "",
        phone: "",
        email: "",
        address: {
          address: "",
          city: "",
          zipCode: "",
          country: "",
        },
      },
      receiver: {
        name: "",
        phone: "",
        email: "",
        address: {
          address: "",
          city: "",
          zipCode: "",
          country: "",
        },
      },
      weight: "",
      serviceType: "standard",
      priority: "normal",
      orderType: "parcel",
      item: [
        {
          name: "",
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0,
        },
      ],
      customerNote: "",
      insurance: {
        enabled: false,
        declaredValue: 0,
        charge: 0,
      },
      couponCode: "",
      couponDiscount: 0,
    },
  });

  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [zones, setZones] = useState<ZoneOption[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<ApiResponse | null>(null);
  const [error, setError] = useState("");
  const [couponMsg, setCouponMsg] = useState<{
    type: "success" | "error";
    text: string;
    discount?: number;
  } | null>(null);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await getRequestSend<CountryOption[]>(
          `${ROOT_API}countrys`
        );
        if (response.status === 200 && response.data) {
          setCountries(response.data);
        }
      } catch {
        // Countries are optional for the form; user can still type manually
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
        if (response.status === 200 && response.data) {
          setZones(response.data);
        }
      } catch {
        // Zones are optional for the form
      }
    };
    fetchZones();
  }, []);

  useEffect(() => {
    if (!user?.phone) return;
    UserService.getUserAddresses(user.phone)
      .then((response) => {
        if (response.status === 200 && response.data) {
          setSavedAddresses(response.data);
        }
      })
      .catch(() => {
        // Saved addresses are optional; the form still works without them
      });
  }, [user]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applySavedAddress = (addr: any) => {
    const countryId =
      addr.country && typeof addr.country === "object"
        ? addr.country._id
        : addr.country || "";
    setFormData((prev) => ({
      ...prev,
      parcel: {
        ...prev.parcel,
        from: countryId || prev.parcel.from,
        sender: {
          ...prev.parcel.sender,
          name: addr.name || prev.parcel.sender.name,
          phone: addr.phone || prev.parcel.sender.phone,
          address: {
            address: addr.addressLine || "",
            city: addr.city || "",
            zipCode: addr.zipCode || "",
            country: countryId,
          },
        },
      },
    }));
  };

  const serviceTypes = [
    {
      value: "express",
      label: "Express Delivery",
      time: "1-3 days",
      icon: "⚡",
      priority: "super-express" as const,
    },
    {
      value: "standard",
      label: "Standard Delivery",
      time: "3-5 days",
      icon: "““¦",
      priority: "express" as const,
    },
    {
      value: "economy",
      label: "Economy Delivery",
      time: "5-7 days",
      icon: "“š›",
      priority: "normal" as const,
    },
  ];

  const packageTypes = [
    {
      value: "document",
      label: "Document",
      description: "Letters, papers, certificates",
      maxWeight: "0.5 kg",
    },
    {
      value: "parcel",
      label: "Parcel",
      description: "General packages and goods",
      maxWeight: "30 kg",
    },
    {
      value: "e-commerce",
      label: "E-commerce",
      description: "Online store items",
      maxWeight: "No limit",
    },
  ];

  const updateFormField = (
    section: "sender" | "receiver",
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      parcel: {
        ...prev.parcel,
        [section]: {
          ...prev.parcel[section],
          [field]: value,
        },
      },
    }));
  };

  const updateAddressField = (
    section: "sender" | "receiver",
    field: string,
    value: string
  ) => {
    setFormData((prev) => {
      const address = {
        ...prev.parcel[section].address,
        [field]: value,
      };
      return {
        ...prev,
        parcel: {
          ...prev.parcel,
          ...(section === "sender" && field === "country"
            ? { from: value }
            : {}),
          ...(section === "receiver" && field === "country"
            ? { to: value }
            : {}),
          [section]: {
            ...prev.parcel[section],
            address,
          },
        },
      };
    });
  };

  const updateParcelField = (
    field: string,
    value: string | number | { enabled: boolean; declaredValue: number; charge: number }
  ) => {
    setFormData((prev) => ({
      ...prev,
      parcel: {
        ...prev.parcel,
        [field]: value,
      },
    }));
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    setFormData((prev) => {
      const newItems = [...prev.parcel.item];
      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };

      // Auto-calculate totalPrice
      if (field === "quantity" || field === "unitPrice") {
        newItems[index].totalPrice =
          newItems[index].quantity * newItems[index].unitPrice;
      }

      return {
        ...prev,
        parcel: {
          ...prev.parcel,
          item: newItems,
        },
      };
    });
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      parcel: {
        ...prev.parcel,
        item: [
          ...prev.parcel.item,
          {
            name: "",
            quantity: 1,
            unitPrice: 0,
            totalPrice: 0,
          },
        ],
      },
    }));
  };

  const removeItem = (index: number) => {
    if (formData.parcel.item.length > 1) {
      setFormData((prev) => ({
        ...prev,
        parcel: {
          ...prev.parcel,
          item: prev.parcel.item.filter((_, i) => i !== index),
        },
      }));
    }
  };

  const validateCoupon = async () => {
    const code = String(formData.parcel.couponCode || "").trim().toUpperCase();
    if (!code) {
      setCouponMsg({ type: "error", text: "Please enter a promo code first" });
      return;
    }
    const orderAmount = formData.parcel.item.reduce(
      (sum, it) => sum + (Number(it.totalPrice) || Number(it.quantity) * Number(it.unitPrice) || 0),
      0
    );
    try {
      const response = await postRequestSend<
        { code: string; orderAmount: number },
        { discount: number }
      >(
        `${ROOT_API}coupons/validate`,
        {},
        { code, orderAmount }
      );
      if (response.status === 200 && response.data) {
        updateParcelField("couponDiscount", Number(response.data.discount));
        setCouponMsg({
          type: "success",
          text: `Coupon applied! You save BDT ${Number(response.data.discount).toFixed(2)}`,
          discount: Number(response.data.discount),
        });
      } else {
        updateParcelField("couponDiscount", 0);
        setCouponMsg({ type: "error", text: response.message || "Invalid coupon code" });
      }
    } catch {
      updateParcelField("couponDiscount", 0);
      setCouponMsg({ type: "error", text: "Could not validate coupon right now" });
    }
  };

  const validateForm = (): string | null => {
    const { parcel } = formData;

    if (!parcel.sender.name.trim()) return "Sender name is required";
    if (!parcel.sender.phone.trim()) return "Sender phone is required";
    if (!parcel.sender.email.trim()) return "Sender email is required";
    if (!parcel.sender.address.address.trim())
      return "Sender address is required";
    if (!parcel.from.trim()) return "Origin country is required";

    if (!parcel.receiver.name.trim()) return "Receiver name is required";
    if (!parcel.receiver.phone.trim()) return "Receiver phone is required";
    if (!parcel.receiver.address.address.trim())
      return "Receiver address is required";
    if (!parcel.to.trim()) return "Destination zone is required";

    if (!parcel.weight.trim()) return "Package weight is required";

    for (let i = 0; i < parcel.item.length; i++) {
      const item = parcel.item[i];
      if (!item.name.trim()) return `Item ${i + 1} name is required`;
      if (item.quantity <= 0)
        return `Item ${i + 1} quantity must be greater than 0`;
      if (item.unitPrice < 0)
        return `Item ${i + 1} unit price cannot be negative`;
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await postRequestSend<OrderFormData, ApiResponse>(
        `${ROOT_API}orders`,
        {},
        formData
      );

      if (response.status === 201 && response.data) {
        setSuccess(response.data);
        setError("");
        // Reset form
        setFormData({
          parcel: {
            from: "",
            to: "",
            sender: {
              name: "",
              phone: "",
              email: "",
              address: { address: "", city: "", zipCode: "", country: "" },
            },
            receiver: {
              name: "",
              phone: "",
              email: "",
              address: { address: "", city: "", zipCode: "", country: "" },
            },
            weight: "",
            serviceType: "standard",
            priority: "normal",
            orderType: "parcel",
            item: [{ name: "", quantity: 1, unitPrice: 0, totalPrice: 0 }],
            customerNote: "",
            insurance: { enabled: false, declaredValue: 0, charge: 0 },
            couponCode: "",
            couponDiscount: 0,
          },
        });
      } else {
        setError(response.message || "Failed to create shipment");
      }
    } catch {
      setError("Failed to create shipment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <Truck className="w-6 h-6 text-primary" strokeWidth={1.5} />,
      title: "Doorstep Pickup",
      description: "Free pickup from your location",
    },
    {
      icon: <Shield className="w-6 h-6 text-primary" strokeWidth={1.5} />,
      title: "Insurance Coverage",
      description: "Full protection up to declared value",
    },
    {
      icon: <Clock className="w-6 h-6 text-primary" strokeWidth={1.5} />,
      title: "Real-time Tracking",
      description: "Monitor your shipment 24/7",
    },
    {
      icon: <Package className="w-6 h-6 text-primary" strokeWidth={1.5} />,
      title: "Professional Packaging",
      description: "Expert handling and packaging service",
    },
  ];

  const steps = [
    "Fill in shipment details",
    "Choose delivery service",
    "Schedule pickup time",
    "Make payment",
    "Track your shipment",
  ];

  if (success) {
    return (
      <div className="w-full h-auto bg-soft-green">
        <PageHeader
          title="SHIP AND TRACK"
          subtitle="CREATE SHIPMENT"
          mainLink="/ship-and-track"
          subLink="/ship-and-track/create-shipment"
        />

        <div className="w-full bg-white">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-2xl mx-auto text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-8 mb-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-green-700 mb-4">
                  Shipment Created Successfully!
                </h2>
                <p className="text-green-600 mb-6">
                  Your package has been registered and is ready for pickup.
                </p>

                <div className="bg-white rounded-lg p-6 border border-green-200">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Shipment Details
                  </h3>
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between">
                      <span className="font-medium">Tracking ID:</span>
                      <span className="font-bold text-[#12352A]">
                        {success.trackId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Order ID:</span>
                      <span>{success._id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Created:</span>
                      <span>
                        {new Date(success.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() =>
                    (window.location.href = `/ship-and-track/track-shipment`)
                  }
                  className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-[#087F4F] transition-colors font-bold"
                >
                  Track Your Shipment
                </button>
                <button
                  onClick={() => setSuccess(null)}
                  className="border-2 border-[#12352A] text-[#12352A] px-8 py-3 rounded-lg hover:bg-[#12352A] hover:text-white transition-colors font-bold"
                >
                  Create Another Shipment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-auto bg-soft-green">
      <PageHeader
        title="SHIP AND TRACK"
        subtitle="CREATE SHIPMENT"
        mainLink="/ship-and-track"
        subLink="/ship-and-track/create-shipment"
      />

      {/* Hero Section */}
      <div className="w-full bg-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#12352A] mb-6">
              Create Your Shipment
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Send your package anywhere in the world with our reliable shipping
              service. Fill in the details below and we{"'"}ll handle the rest
              with doorstep pickup.
            </p>
          </div>

          {/* Shipment Form */}
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-xl border border-gray-200">
              {/* Form Header */}
              <div className="bg-[#12352A] text-white p-6 rounded-t-lg">
                <div className="flex items-center">
                  <Package
                    className="w-8 h-8 text-[#F5C400] mr-3"
                    strokeWidth={1.5}
                  />
                  <h3 className="text-2xl font-bold">Shipment Details</h3>
                </div>
              </div>

              <div className="p-8">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                      <p className="text-red-700">{error}</p>
                    </div>
                  </div>
                )}

                {/* Sender Information */}
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <User
                      className="w-6 h-6 text-primary mr-2"
                      strokeWidth={1.5}
                    />
                    <h4 className="text-xl font-semibold text-[#12352A]">
                      Sender Information
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {savedAddresses.length > 0 && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Use Saved Pickup Address
                        </label>
                        <select
                          value=""
                          onChange={(e) => {
                            const selected = savedAddresses.find(
                              (a) => a._id === e.target.value
                            );
                            if (selected) applySavedAddress(selected);
                          }}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                        >
                          <option value="">-- Select a saved address --</option>
                          {savedAddresses.map((addr) => (
                            <option key={addr._id} value={addr._id}>
                              {addr.label
                                ? `${addr.label} — ${addr.city} - ${addr.name}`
                                : `${addr.city}, ${
                                    addr.country?.name || addr.country || ""
                                  }`}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Selecting a saved address fills in your pickup
                          details automatically
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={formData.parcel.sender.name}
                        onChange={(e) =>
                          updateFormField("sender", "name", e.target.value)
                        }
                        placeholder="Enter sender's name"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={formData.parcel.sender.phone}
                        onChange={(e) =>
                          updateFormField("sender", "phone", e.target.value)
                        }
                        placeholder="+880 1XXX XXXXXX"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={formData.parcel.sender.email}
                        onChange={(e) =>
                          updateFormField("sender", "email", e.target.value)
                        }
                        placeholder="sender@example.com"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country *
                      </label>
                      <select
                        value={formData.parcel.from}
                        onChange={(e) =>
                          updateAddressField(
                            "sender",
                            "country",
                            e.target.value
                          )
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                      >
                        <option value="">Select origin country</option>
                        {countries.map((country) => (
                          <option key={country._id} value={country._id}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.parcel.sender.address.city}
                        onChange={(e) =>
                          updateAddressField("sender", "city", e.target.value)
                        }
                        placeholder="City name"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pickup Address *
                      </label>
                      <textarea
                        rows={3}
                        value={formData.parcel.sender.address.address}
                        onChange={(e) =>
                          updateAddressField(
                            "sender",
                            "address",
                            e.target.value
                          )
                        }
                        placeholder="Enter complete pickup address with area, city, and postal code"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Recipient Information */}
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <MapPin
                      className="w-6 h-6 text-primary mr-2"
                      strokeWidth={1.5}
                    />
                    <h4 className="text-xl font-semibold text-[#12352A]">
                      Recipient Information
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={formData.parcel.receiver.name}
                        onChange={(e) =>
                          updateFormField("receiver", "name", e.target.value)
                        }
                        placeholder="Enter recipient's name"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={formData.parcel.receiver.phone}
                        onChange={(e) =>
                          updateFormField("receiver", "phone", e.target.value)
                        }
                        placeholder="Recipient's phone number"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.parcel.receiver.email}
                        onChange={(e) =>
                          updateFormField("receiver", "email", e.target.value)
                        }
                        placeholder="recipient@example.com"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.parcel.receiver.address.city}
                        onChange={(e) =>
                          updateAddressField("receiver", "city", e.target.value)
                        }
                        placeholder="City name"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Destination Zone *
                      </label>
                      <select
                        value={formData.parcel.to}
                        onChange={(e) =>
                          updateAddressField(
                            "receiver",
                            "country",
                            e.target.value
                          )
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                      >
                        <option value="">Select destination zone</option>
                        {zones.map((zone) => (
                          <option key={zone._id} value={zone._id}>
                            {zone.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={formData.parcel.receiver.address.zipCode}
                        onChange={(e) =>
                          updateAddressField(
                            "receiver",
                            "zipCode",
                            e.target.value
                          )
                        }
                        placeholder="Postal/ZIP code"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery Address *
                      </label>
                      <textarea
                        rows={3}
                        value={formData.parcel.receiver.address.address}
                        onChange={(e) =>
                          updateAddressField(
                            "receiver",
                            "address",
                            e.target.value
                          )
                        }
                        placeholder="Enter complete delivery address"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Package Information */}
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <Package
                      className="w-6 h-6 text-primary mr-2"
                      strokeWidth={1.5}
                    />
                    <h4 className="text-xl font-semibold text-[#12352A]">
                      Package Information
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {packageTypes.map((type) => (
                      <div
                        key={type.value}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          formData.parcel.orderType === type.value
                            ? "border-primary bg-soft-green"
                            : "border-gray-300 hover:border-primary hover:bg-soft-green"
                        }`}
                        onClick={() =>
                          updateParcelField("orderType", type.value)
                        }
                      >
                        <div className="flex items-center mb-2">
                          <input
                            type="radio"
                            name="packageType"
                            value={type.value}
                            checked={formData.parcel.orderType === type.value}
                            onChange={() =>
                              updateParcelField("orderType", type.value)
                            }
                            className="mr-3"
                          />
                          <h5 className="font-semibold text-[#12352A]">
                            {type.label}
                          </h5>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {type.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          Max: {type.maxWeight}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Weight (kg) *
                      </label>
                      <input
                        type="text"
                        value={formData.parcel.weight}
                        onChange={(e) =>
                          updateParcelField("weight", e.target.value)
                        }
                        placeholder="0.0"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Special Instructions
                      </label>
                      <input
                        type="text"
                        value={formData.parcel.customerNote}
                        onChange={(e) =>
                          updateParcelField("customerNote", e.target.value)
                        }
                        placeholder="Any special instructions"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Insurance & Coupon */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 p-4 border border-gray-200 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.parcel.insurance?.enabled || false}
                            onChange={(e) => {
                              const enabled = e.target.checked;
                              updateParcelField("insurance", {
                                enabled,
                                declaredValue: formData.parcel.insurance?.declaredValue || 0,
                                charge: enabled ? Math.round((formData.parcel.insurance?.declaredValue || 0) * 0.01 * 100) / 100 : 0,
                              });
                            }}
                            className="h-4 w-4 accent-[#006B45]"
                          />
                          Shipment Insurance
                        </span>
                      </label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Protect your parcel up to its declared value (1% charge).
                      </p>
                      <input
                        type="number"
                        min="0"
                        disabled={!formData.parcel.insurance?.enabled}
                        value={formData.parcel.insurance?.declaredValue || 0}
                        onChange={(e) => {
                          const declaredValue = Number(e.target.value) || 0;
                          updateParcelField("insurance", {
                            enabled: formData.parcel.insurance?.enabled || true,
                            declaredValue,
                            charge: formData.parcel.insurance?.enabled
                              ? Math.round(declaredValue * 0.01 * 100) / 100
                              : 0,
                          });
                        }}
                        placeholder="Declared value (e.g. 20000)"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                      />
                      {formData.parcel.insurance?.enabled && (
                        <p className="text-xs text-primary mt-1">
                          Insurance charge: BDT {(formData.parcel.insurance.charge || 0).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Promo Code
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.parcel.couponCode || ""}
                          onChange={(e) =>
                            updateParcelField("couponCode", e.target.value.toUpperCase())
                          }
                          placeholder="e.g. CC-SAVE10"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={validateCoupon}
                          className="shrink-0 px-4 py-3 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-[#087F4F] transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                      {couponMsg && (
                        <p
                          className={`text-xs mt-1 ${
                            couponMsg.type === "success"
                              ? "text-primary font-medium"
                              : "text-red-600"
                          }`}
                        >
                          {couponMsg.text}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Apply a coupon for extra savings.
                      </p>
                    </div>
                  </div>

                  {/* Items */}
                  <div>
                    <h5 className="text-lg font-semibold text-[#12352A] mb-4">
                      Package Contents
                    </h5>
                    {formData.parcel.item.map((item, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-4 border border-gray-200 rounded-lg"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Item Name *
                          </label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) =>
                              updateItem(index, "name", e.target.value)
                            }
                            placeholder="Item name"
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quantity *
                          </label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "quantity",
                                parseInt(e.target.value) || 0
                              )
                            }
                            min="1"
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Unit Price (à§³)
                          </label>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "unitPrice",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            min="0"
                            step="0.01"
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Total Price (à§³)
                          </label>
                          <input
                            type="number"
                            value={item.totalPrice}
                            readOnly
                            className="w-full p-2 border border-gray-300 rounded-lg bg-section"
                          />
                        </div>
                        <div className="flex items-end">
                          {formData.parcel.item.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800 p-2"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addItem}
                      className="text-primary hover:text-[#087F4F] font-medium"
                    >
                      + Add Another Item
                    </button>
                  </div>
                </div>

                {/* Service Selection */}
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <Clock
                      className="w-6 h-6 text-primary mr-2"
                      strokeWidth={1.5}
                    />
                    <h4 className="text-xl font-semibold text-[#12352A]">
                      Service Type
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {serviceTypes.map((service) => (
                      <div
                        key={service.value}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          formData.parcel.serviceType === service.value
                            ? "border-primary bg-soft-green"
                            : "border-gray-300 hover:border-primary hover:bg-soft-green"
                        }`}
                        onClick={() => {
                          updateParcelField("serviceType", service.value);
                          updateParcelField("priority", service.priority);
                        }}
                      >
                        <div className="flex items-center mb-2">
                          <input
                            type="radio"
                            name="serviceType"
                            value={service.value}
                            checked={
                              formData.parcel.serviceType === service.value
                            }
                            onChange={() => {
                              updateParcelField("serviceType", service.value);
                              updateParcelField("priority", service.priority);
                            }}
                            className="mr-3"
                          />
                          <span className="text-2xl mr-2">{service.icon}</span>
                          <h5 className="font-semibold text-[#12352A]">
                            {service.label}
                          </h5>
                        </div>
                        <p className="text-sm text-gray-600">
                          Delivery: {service.time}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Create Shipment Button */}
                <div className="text-center">
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-primary text-white py-4 px-12 rounded-lg hover:bg-[#087F4F] transition-colors font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Creating Shipment..." : "Create Shipment"}
                  </button>
                  <p className="text-sm text-gray-500 mt-3">
                    You{"'"}ll receive a tracking number after creating the
                    shipment
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="w-full bg-[#12352A]">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Why Ship with CrossCart Global Int Express?
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Experience hassle-free shipping with our comprehensive service
              features
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

      {/* Process Steps */}
      <div className="w-full bg-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#12352A] mb-4">
              How It Works
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Simple 5-step process to get your package delivered anywhere in
              the world
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {steps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="bg-primary rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-white">
                      {index + 1}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 font-medium">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="w-full bg-section">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold text-[#12352A] mb-4">
            Need Help Creating Your Shipment?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Our customer support team is available 24/7 to assist you with any
            questions or help you create your shipment.
          </p>
          <div className="flex justify-center gap-3 items-center align-middle flex-col sm:flex-row">
            <button className="bg-[#12352A] text-white py-3 px-8 rounded-lg hover:bg-[#1c4a36] transition-colors font-semibold border-2 border-[#12352A]">
              Contact Support
            </button>
            <button className="border-2 border-[#12352A] text-[#12352A] py-3 px-8 rounded-lg hover:bg-[#12352A] hover:text-white transition-colors font-semibold">
              Calculate Rates First
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateShipment;
