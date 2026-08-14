"use client";

import { getRequestSend, postRequestSend } from "@/components/ApiCall/methord";
import { ROOT_API } from "@/components/ApiCall/url";
import PageHeader from "@/utilities/PageHeader";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  Package,
  Plane,
  RefreshCw,
  Search,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface TrackingStep {
  status: string;
  location: {
    city: string;
    country: string;
  };
  description: string;
  timestamp: string;
  updatedBy?: string | null;
}

interface TrackingData {
  _id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order: any;
  trackId: string;
  currentStatus: string;
  history: TrackingStep[];
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt: string;
}

const TrackShipmentContent = () => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifyError, setNotifyError] = useState("");
  const searchParams = useSearchParams();

  useEffect(() => {
    const trackId = searchParams.get("trackId");
    if (trackId) {
      setTrackingNumber(trackId);
      handleTrackPackage(trackId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTrackPackage = async (trackId?: string) => {
    const trackingId = trackId || trackingNumber;

    if (!trackingId.trim()) {
      setError("Please enter a tracking number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getRequestSend<TrackingData>(
        `${ROOT_API}tracks/${trackingId.trim()}`
      );

      if (response.status === 200 && response.data) {
        setTrackingData(response.data);
        setError("");
      } else {
        setError(response.message || "Tracking number not found");
        setTrackingData(null);
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setError("Failed to fetch tracking information. Please try again.");
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleNotify = async () => {
    if (!trackingData) return;
    setNotifyLoading(true);
    setNotifyMessage("");
    setNotifyError("");

    try {
      const response = await postRequestSend<
        never,
        { message: string }
      >(`${ROOT_API}tracks/${trackingData.trackId}/notify`);
      if (response.status === 200) {
        setNotifyMessage(
          response.data?.message ||
            "Shipment update email sent to sender and receiver"
        );
      } else {
        setNotifyError(
          response.message || "Failed to send update. Please try again."
        );
      }
    } catch {
      setNotifyError("Failed to send update. Please try again.");
    } finally {
      setNotifyLoading(false);
    }
  };

  const escapeReceiptHtml = (value: unknown): string =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const handleDownloadReceipt = () => {
    if (!trackingData) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order = trackingData.order as any;
    const parcel = order?.parcel || {};
    const sender = parcel.sender || {};
    const receiver = parcel.receiver || {};
    const countryName = (country: unknown) => {
      if (!country) return "";
      if (typeof country === "string") return country;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof country === "object") return (country as any).name || "";
      return "";
    };

    const itemsRows = (parcel.item || [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (it: any) => `
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;text-align:left;">${escapeReceiptHtml(it.name)}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">${escapeReceiptHtml(it.quantity)}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${escapeReceiptHtml(it.totalPrice ?? it.unitPrice ?? 0)}</td>
          </tr>`
      )
      .join("");

    const historyRows = (trackingData.history || [])
      .map(
        (step) => `
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;text-align:left;">${escapeReceiptHtml(step.location?.city)}${step.location?.country ? `, ${escapeReceiptHtml(step.location.country)}` : ""}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;text-align:left;">${escapeReceiptHtml(step.description)}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${escapeReceiptHtml(formatDate(step.timestamp))}</td>
          </tr>`
      )
      .join("");

    const receiverCity = receiver.address?.city
      ? `${escapeReceiptHtml(receiver.address.city)}${
          countryName(receiver.address.country)
            ? `, ${escapeReceiptHtml(countryName(receiver.address.country))}`
            : ""
        }`
      : "N/A";
    const senderCity = sender.address?.city
      ? `${escapeReceiptHtml(sender.address.city)}${
          countryName(sender.address.country)
            ? `, ${escapeReceiptHtml(countryName(sender.address.country))}`
            : ""
        }`
      : "N/A";

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Shipment Receipt - ${escapeReceiptHtml(trackingData.trackId)}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #12352A; margin: 0; padding: 24px; }
            .header { background: #006B45; color: #fff; padding: 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 22px; }
            .header p { margin: 4px 0 0; opacity: 0.9; }
            h3 { color: #12352A; border-bottom: 2px solid #F5C400; padding-bottom: 6px; margin: 22px 0 10px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th { background: #12352A; color: #fff; padding: 8px; text-align: left; }
            td { padding: 8px; border: 1px solid #e5e7eb; }
            .status { display: inline-block; background: #F5C400; color: #12352A; font-weight: bold; padding: 6px 14px; border-radius: 4px; }
            .brand { color: #F5C400; }
            @media print { body { padding: 8px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CrossCart Global Int Express</h1>
            <p>Shipment Receipt</p>
          </div>

          <div style="text-align:right; margin:16px 0;">
            <span class="status">${escapeReceiptHtml(formatStatus(trackingData.currentStatus))}</span>
          </div>

          <h3>Tracking Information</h3>
          <table>
            <tr><td style="width:45%; background:#f4f4f7;">Tracking Number</td><td><strong>${escapeReceiptHtml(trackingData.trackId)}</strong></td></tr>
            <tr><td style="background:#f4f4f7;">AWB Number</td><td>${escapeReceiptHtml(order?.awb || "N/A")}</td></tr>
            ${order?._id ? `<tr><td style="background:#f4f4f7;">Order ID</td><td>${escapeReceiptHtml(order._id)}</td></tr>` : ""}
            ${trackingData.estimatedDelivery ? `<tr><td style="background:#f4f4f7;">Estimated Delivery</td><td>${escapeReceiptHtml(formatDate(trackingData.estimatedDelivery))}</td></tr>` : ""}
            ${parcel.weight ? `<tr><td style="background:#f4f4f7;">Weight</td><td>${escapeReceiptHtml(parcel.weight)}</td></tr>` : ""}
            ${parcel.serviceType ? `<tr><td style="background:#f4f4f7;">Service Type</td><td>${escapeReceiptHtml(parcel.serviceType)}</td></tr>` : ""}
            ${parcel.priority ? `<tr><td style="background:#f4f4f7;">Priority</td><td>${escapeReceiptHtml(parcel.priority)}</td></tr>` : ""}
          </table>

          <h3>Parcel Details</h3>
          <table>
            <tr><th style="width:50%;">Recipient</th><th>Sender</th></tr>
            <tr>
              <td><strong>${escapeReceiptHtml(receiver.name || "N/A")}</strong><br/>${escapeReceiptHtml(receiver.phone || "")}<br/>${receiverCity}</td>
              <td><strong>${escapeReceiptHtml(sender.name || "N/A")}</strong><br/>${escapeReceiptHtml(sender.phone || "")}<br/>${senderCity}</td>
            </tr>
          </table>

          ${
            itemsRows
              ? `<h3>Items</h3>
            <table>
              <thead><tr><th>Item</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Price</th></tr></thead>
              <tbody>${itemsRows}</tbody>
            </table>`
              : ""
          }

          ${
            historyRows
              ? `<h3>Tracking History</h3>
            <table>
              <thead><tr><th>Location</th><th>Status Detail</th><th style="text-align:right;">Time</th></tr></thead>
              <tbody>${historyRows}</tbody>
            </table>`
              : ""
          }

          <p style="margin-top:24px; font-size:11px; color:#6b7280; text-align:center;">
            Track online: ${escapeReceiptHtml(
              `${process.env.NEXT_PUBLIC_APP_URL || "https://crosscartglobal.com"}/ship-and-track/track-shipment?trackId=${trackingData.trackId}`
            )}
            <br/>This is a system-generated receipt from CrossCart Global Int Express.
          </p>
        </body>
      </html>
    `;

    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(receiptHtml);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "created":
      case "pickup-pending":
        return <Package className="w-6 h-6 text-blue-500" strokeWidth={1.5} />;
      case "picked-up":
      case "in-transit":
        return <Truck className="w-6 h-6 text-yellow-500" strokeWidth={1.5} />;
      case "arrived-at-hub":
      case "customs-clearance":
        return <Plane className="w-6 h-6 text-purple-500" strokeWidth={1.5} />;
      case "out-for-delivery":
        return <Truck className="w-6 h-6 text-orange-500" strokeWidth={1.5} />;
      case "delivered":
        return (
          <CheckCircle className="w-6 h-6 text-green-500" strokeWidth={1.5} />
        );
      case "failed":
      case "cancelled":
      case "returned":
        return (
          <AlertCircle className="w-6 h-6 text-red-500" strokeWidth={1.5} />
        );
      default:
        return <Package className="w-6 h-6 text-gray-400" strokeWidth={1.5} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "text-green-600";
      case "failed":
      case "cancelled":
      case "returned":
        return "text-red-600";
      case "out-for-delivery":
        return "text-orange-600";
      case "in-transit":
      case "arrived-at-hub":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const normalizeCountryName = (
    country: unknown
  ): string => {
    if (!country) return "";
    if (typeof country === "string") return country;
    if (typeof country === "object") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c = country as any;
      return c.name || c.code || "";
    }
    return "";
  };

  const formatStatus = (status: string) => {
    return status
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const features = [
    {
      icon: <Clock className="w-6 h-6 text-[#F5C400]" strokeWidth={1.5} />,
      title: "Real-time Updates",
      description: "Get live tracking updates as your package moves",
    },
    {
      icon: <MapPin className="w-6 h-6 text-[#F5C400]" strokeWidth={1.5} />,
      title: "Location Details",
      description: "See exact location and facility information",
    },
    {
      icon: <Package className="w-6 h-6 text-[#F5C400]" strokeWidth={1.5} />,
      title: "Multiple Carriers",
      description: "Track packages from all our carrier partners",
    },
    {
      icon: <Search className="w-6 h-6 text-[#F5C400]" strokeWidth={1.5} />,
      title: "Easy Search",
      description: "Search by tracking number, reference, or phone",
    },
  ];

  return (
    <div className="w-full h-auto bg-soft-green">
      <PageHeader
        title="SHIP AND TRACK"
        subtitle="TRACK SHIPMENT"
        mainLink="/ship-and-track"
        subLink="/ship-and-track/track-shipment"
      />

      {/* Hero Section */}
      <div className="w-full bg-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#12352A] mb-6">
              Track Your Shipment
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Enter your tracking number to get real-time updates on your
              package location, delivery status, and estimated delivery time.
            </p>
          </div>

          {/* Tracking Form */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-8">
              <div className="flex items-center mb-6">
                <Search
                  className="w-8 h-8 text-primary mr-3"
                  strokeWidth={1.5}
                />
                <h3 className="text-2xl font-bold text-[#12352A]">
                  Track Your Package
                </h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tracking Number
                  </label>
                  <div className="flex gap-4 flex-col sm:flex-row">
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter your tracking number"
                      className="flex-1 p-4 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-lg"
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleTrackPackage()
                      }
                    />
                    <button
                      onClick={() => handleTrackPackage()}
                      disabled={loading}
                      className="bg-primary text-white px-8 py-4 rounded-lg hover:bg-[#087F4F] transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Tracking..." : "Track"}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    You can track using tracking ID from your shipment receipt
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                      <p className="text-red-700">{error}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tracking Results */}
          {trackingData && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                <div className="bg-[#12352A] text-white p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-xl font-bold">
                        Tracking Number: {trackingData.trackId}
                      </h3>
                      <p className="text-gray-300">
                        Order ID:{" "}
                        {typeof trackingData.order === "object" &&
                        trackingData.order?._id
                          ? trackingData.order._id
                          : trackingData.order}
                        {typeof trackingData.order === "object" &&
                          trackingData.order?.awb && (
                            <span className="ml-4">
                              AWB: {trackingData.order.awb}
                            </span>
                          )}
                      </p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-bold text-lg ${getStatusColor(
                          trackingData.currentStatus
                        )}`}
                      >
                        {formatStatus(trackingData.currentStatus)}
                      </div>
                      {trackingData.estimatedDelivery && (
                        <div className="text-sm text-gray-300">
                          Expected: {formatDate(trackingData.estimatedDelivery)}
                        </div>
                      )}
                      <button
                        onClick={() =>
                          handleTrackPackage(trackingData.trackId)
                        }
                        className="mt-3 inline-flex items-center text-xs text-gray-300 hover:text-white underline"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Refresh status
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  {/* Parcel Details */}
                  <div className="mb-8">
                    <h4 className="text-xl font-semibold text-[#12352A] mb-4">
                      Parcel Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex items-start">
                        <Package className="w-5 h-5 text-primary mr-3 mt-0.5" strokeWidth={1.5} />
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Recipient Name
                          </p>
                          <p className="text-lg font-semibold text-[#12352A]">
                            {typeof trackingData.order === "object" &&
                            trackingData.order?.parcel?.receiver?.name
                              ? trackingData.order.parcel.receiver.name
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <MapPin className="w-5 h-5 text-primary mr-3 mt-0.5" strokeWidth={1.5} />
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Destination City
                          </p>
                          <p className="text-lg font-semibold text-[#12352A]">
                            {typeof trackingData.order === "object" &&
                            trackingData.order?.parcel?.receiver?.address
                              ?.city
                              ? `${trackingData.order.parcel.receiver.address.city}${
                                  normalizeCountryName(
                                    trackingData.order.parcel.receiver.address
                                      .country
                                  )
                                    ? `, ${normalizeCountryName(
                                        trackingData.order.parcel.receiver
                                          .address.country
                                      )}`
                                    : ""
                                }`
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tracking Timeline */}
                  <div>
                    <h4 className="text-xl font-semibold text-[#12352A] mb-6">
                      Tracking History
                    </h4>
                    {trackingData.history.length > 0 ? (
                      <div className="space-y-6">
                        {trackingData.history.map((step, index) => (
                          <div key={index} className="flex items-start">
                            <div className="flex-shrink-0 mr-4">
                              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100">
                                {getStatusIcon(step.status)}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                                <h5
                                  className={`font-semibold ${getStatusColor(
                                    step.status
                                  )}`}
                                >
                                  {formatStatus(step.status)}
                                </h5>
                                <span className="text-sm text-gray-600">
                                  {formatDate(step.timestamp)}
                                </span>
                              </div>
                              {step.description && (
                                <p className="text-sm text-gray-700 mb-1">
                                  {step.description}
                                </p>
                              )}
                              {(step.location.city ||
                                step.location.country) && (
                                <p className="text-xs text-gray-600">
                                  ðŸ“ {step.location.city}{" "}
                                  {normalizeCountryName(step.location.country)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">
                          No tracking history available yet.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    {notifyMessage && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                        <p className="text-green-700">{notifyMessage}</p>
                      </div>
                    )}
                    {notifyError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                        <p className="text-red-700">{notifyError}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-4">
                      <button
                        onClick={handleNotify}
                        disabled={notifyLoading}
                        className="bg-primary text-white py-2 px-6 rounded-lg hover:bg-[#087F4F] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {notifyLoading
                          ? "Sending..."
                          : "Get Shipment Update by Email"}
                      </button>
                      <button
                        onClick={handleDownloadReceipt}
                        className="border-2 border-[#12352A] text-[#12352A] py-2 px-6 rounded-lg hover:bg-[#12352A] hover:text-white transition-colors font-semibold"
                      >
                        Download Receipt
                      </button>
                      <button className="border-2 border-gray-300 text-gray-700 py-2 px-6 rounded-lg hover:bg-section transition-colors font-semibold">
                        Contact Support
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="w-full bg-[#12352A]">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Tracking Features
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Advanced tracking capabilities to keep you informed every step of
              the way
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

      {/* FAQ Section */}
      <div className="w-full bg-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#12352A] mb-4">
              Tracking FAQ
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Common questions about package tracking and delivery
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-[#12352A] mb-2">
                  How often is tracking updated?
                </h4>
                <p className="text-gray-600 text-sm">
                  Tracking information is updated in real-time as your package
                  moves through our network, typically every few hours.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-[#12352A] mb-2">
                  What if my tracking number doesn{"'"}t work?
                </h4>
                <p className="text-gray-600 text-sm">
                  It may take up to 24 hours for tracking to become active after
                  shipping. If issues persist, contact our support team.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-[#12352A] mb-2">
                  Can I change delivery address?
                </h4>
                <p className="text-gray-600 text-sm">
                  Address changes may be possible before final transit. Contact
                  support with your tracking number for assistance.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-[#12352A] mb-2">
                  What does {'"In Transit"'} mean?
                </h4>
                <p className="text-gray-600 text-sm">
                  {'"In Transit"'} means your package is moving through our
                  delivery network towards its destination.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-[#12352A] mb-2">
                  How do I get delivery notifications?
                </h4>
                <p className="text-gray-600 text-sm">
                  Enable SMS or email notifications during shipping, or click{" "}
                  {'"Get SMS Updates"'} on the tracking page.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-[#12352A] mb-2">
                  What if my package is delayed?
                </h4>
                <p className="text-gray-600 text-sm">
                  Delays can occur due to customs, weather, or high volume. We
                  {"'"}ll update you with new delivery estimates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="w-full bg-section">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold text-[#12352A] mb-4">
            Need Help with Tracking?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Can{"'"}t find your package or have questions about delivery? Our
            customer support team is here to help 24/7.
          </p>
          <div className="flex justify-center align-middle items-center flex-col sm:flex-row gap-3">
            <button className="bg-[#12352A] text-white py-3 px-8 rounded-lg hover:bg-[#1c4a36] transition-colors font-semibold border-2 border-[#12352A]">
              Contact Support
            </button>
            <button className="border-2 border-[#12352A] text-[#12352A] py-3 px-8 rounded-lg hover:bg-[#12352A] hover:text-white transition-colors font-semibold">
              Report Issue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TrackShipment = () => (
  <Suspense
    fallback={
      <div className="min-h-screen bg-section flex items-center justify-center">
        <div className="text-center">
          <Package className="h-10 w-10 text-primary mx-auto animate-bounce" />
          <p className="mt-4 text-sm text-muted-foreground">Loading tracker...</p>
        </div>
      </div>
    }
  >
    <TrackShipmentContent />
  </Suspense>
);

export default TrackShipment;
