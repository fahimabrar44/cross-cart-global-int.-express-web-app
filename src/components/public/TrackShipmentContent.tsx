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
  Star,
  Truck,
  X,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export interface RequiredField {
  name: string;
  label: string;
  placeholder: string;
}

export interface TrackingData {
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

export default function TrackShipmentContent({
  initialTrackId,
  initialTrackingData,
  initialError,
  initialNeededFields,
}: {
  initialTrackId: string;
  initialTrackingData: TrackingData | null;
  initialError: string;
  initialNeededFields: RequiredField[] | null;
}) {
  const [trackingNumber, setTrackingNumber] = useState(initialTrackId);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(
    initialTrackingData
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const [neededFields, setNeededFields] = useState<RequiredField[] | null>(
    initialNeededFields
  );
  const [neededFieldValues, setNeededFieldValues] = useState<
    Record<string, string>
  >({});
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifyError, setNotifyError] = useState("");
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    name: "",
    phone: "",
    email: "",
    rating: 0,
    comment: "",
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");

  const handleTrackPackage = async (trackId?: string) => {
    const trackingId = trackId || trackingNumber;

    if (!trackingId.trim()) {
      setError("Please enter a tracking number");
      return;
    }

    setLoading(true);
    setError("");
    setNeededFields(null);

    try {
      const response = await getRequestSend<TrackingData>(
        `${ROOT_API}tracks/${trackingId.trim()}`
      );

      if (response.status === 200 && response.data) {
        setTrackingData(response.data);
        setError("");
      } else if (
        response.meta?.needsFields &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (response.meta.requiredFields as any[])?.length
      ) {
        // Courier requires extra info (e.g. DPD receiver postal code) — show
        // inputs for the missing special fields instead of a raw error.
        setTrackingData(null);
        setNeededFieldValues({});
        setNeededFields(response.meta.requiredFields);
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

  const handleTrackPackageWithFields = async () => {
    if (!neededFields || !neededFields.length) return;

    setLoading(true);
    setError("");
    setTrackingData(null);

    try {
      // Send the entered special-field values back so the courier can create
      // the tracking (e.g. ?tracking_postal_code=10115&tracking_destination_country=DE).
      const query = new URLSearchParams();
      for (const field of neededFields) {
        const value = (neededFieldValues[field.name] || "").trim();
        if (value) query.set(field.name, value);
      }
      if (!query.toString()) {
        setError(
          "Please fill in the required fields to continue tracking this package"
        );
        return;
      }

      const response = await getRequestSend<TrackingData>(
        `${ROOT_API}tracks/${trackingNumber.trim()}?${query.toString()}`
      );

      if (response.status === 200 && response.data) {
        setTrackingData(response.data);
        setError("");
        setNeededFields(null);
        setNeededFieldValues({});
      } else if (
        response.meta?.needsFields &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (response.meta.requiredFields as any[])?.length
      ) {
        setNeededFields(response.meta.requiredFields as RequiredField[]);
        setNeededFieldValues({});
        setError("");
      } else {
        setError(response.message || "Tracking number not found");
        setNeededFields(null);
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setError("Failed to fetch tracking information. Please try again.");
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

  const handleSubmitReview = async () => {
    if (!trackingData) return;
    setReviewMessage("");
    setReviewError("");

    if (!reviewForm.name.trim()) {
      setReviewError("Please enter your name");
      return;
    }
    if (reviewForm.rating < 1) {
      setReviewError("Please select a star rating");
      return;
    }
    if (!reviewForm.comment.trim()) {
      setReviewError("Please write your review details");
      return;
    }

    setReviewSubmitting(true);
    try {
      const response = await postRequestSend<
        { name: string; phone: string; email: string; rating: number; comment: string },
        { message: string }
      >(`${ROOT_API}tracks/${trackingData.trackId}/review`, undefined, {
        name: reviewForm.name,
        phone: reviewForm.phone,
        email: reviewForm.email,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      if (response.status === 201 || response.status === 200) {
        setReviewMessage(
          response.data?.message ||
            "Review submitted successfully. Thank you for your feedback!"
        );
        setIsReviewOpen(false);
        setReviewForm({ name: "", phone: "", email: "", rating: 0, comment: "" });
      } else {
        setReviewError(
          response.message || "Failed to submit review. Please try again."
        );
      }
    } catch {
      setReviewError("Failed to submit review. Please try again.");
    } finally {
      setReviewSubmitting(false);
    }
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

                {/* Required Fields Form */}
                {neededFields && neededFields.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
                    <div className="flex items-start mb-4">
                      <AlertCircle className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-amber-800 font-semibold">
                          Additional information required
                        </p>
                        <p className="text-amber-700 text-sm mt-1">
                          This carrier needs a little more information to look
                          up your shipment.
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {neededFields.map((field) => (
                        <div key={field.name}>
                          <label className="block text-sm font-medium text-amber-900 mb-1">
                            {field.label}
                          </label>
                          <input
                            type="text"
                            value={neededFieldValues[field.name] || ""}
                            onChange={(e) =>
                              setNeededFieldValues({
                                ...neededFieldValues,
                                [field.name]: e.target.value,
                              })
                            }
                            placeholder={field.placeholder}
                            className="w-full p-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-white"
                          />
                        </div>
                      ))}
                      <button
                        onClick={handleTrackPackageWithFields}
                        disabled={loading}
                        className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-[#087F4F] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? "Tracking..." : "Continue Tracking"}
                      </button>
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
                                  ““ {step.location.city}{" "}
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
                    {reviewMessage && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                        <p className="text-green-700">{reviewMessage}</p>
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
                      {trackingData.currentStatus === "delivered" ? (
                        <button
                          onClick={() => {
                            setReviewMessage("");
                            setReviewError("");
                            setIsReviewOpen(true);
                          }}
                          className="bg-[#F5C400] text-[#12352A] py-2 px-6 rounded-lg hover:bg-[#FFD93D] transition-colors font-semibold inline-flex items-center gap-2"
                        >
                          <Star className="w-4 h-4" strokeWidth={1.5} />
                          Give Review
                        </button>
                      ) : (
                        <button
                          disabled
                          title="Reviews are available after your shipment is delivered"
                          className="border-2 border-gray-300 text-gray-400 py-2 px-6 rounded-lg font-semibold cursor-not-allowed inline-flex items-center gap-2"
                        >
                          <Star className="w-4 h-4" strokeWidth={1.5} />
                          Give Review
                        </button>
                      )}
                      <Link href="/contact">
                        <button className="border-2 border-gray-300 text-gray-700 py-2 px-6 rounded-lg hover:bg-section transition-colors font-semibold">
                          Contact Support
                        </button>
                      </Link>
                    </div>
                    {trackingData.currentStatus !== "delivered" && (
                      <p className="text-sm text-gray-500 mt-3">
                        You can review this shipment after it has been delivered.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Review Modal */}
          {isReviewOpen && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
              onClick={() => setIsReviewOpen(false)}
            >
              <div
                className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-[#12352A]">
                    Give Your Review
                  </h3>
                  <button
                    onClick={() => setIsReviewOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Track #:{" "}
                  <strong className="text-[#12352A]">{trackingData?.trackId}</strong>
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your Rating *
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() =>
                            setReviewForm({ ...reviewForm, rating: star })
                          }
                          className="focus:outline-none"
                        >
                          <Star
                            className={`w-8 h-8 ${
                              star <= reviewForm.rating
                                ? "text-[#F5C400] fill-[#F5C400]"
                                : "text-gray-300"
                            }`}
                            strokeWidth={1.5}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      value={reviewForm.name}
                      onChange={(e) =>
                        setReviewForm({ ...reviewForm, name: e.target.value })
                      }
                      placeholder="Enter your name"
                      className="w-full p-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={reviewForm.phone}
                        onChange={(e) =>
                          setReviewForm({ ...reviewForm, phone: e.target.value })
                        }
                        placeholder="Phone number"
                        className="w-full p-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={reviewForm.email}
                        onChange={(e) =>
                          setReviewForm({ ...reviewForm, email: e.target.value })
                        }
                        placeholder="Email address"
                        className="w-full p-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Review Details *
                    </label>
                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) =>
                        setReviewForm({ ...reviewForm, comment: e.target.value })
                      }
                      placeholder="Share your experience with this shipment..."
                      rows={4}
                      className="w-full p-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                    />
                  </div>

                  {reviewError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start">
                      <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                      <p className="text-red-700 text-sm">{reviewError}</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setIsReviewOpen(false)}
                      className="border-2 border-gray-300 text-gray-700 py-2 px-6 rounded-lg hover:bg-section transition-colors font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitReview}
                      disabled={reviewSubmitting}
                      className="bg-primary text-white py-2 px-6 rounded-lg hover:bg-[#087F4F] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {reviewSubmitting ? "Submitting..." : "Submit Review"}
                    </button>
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
}
