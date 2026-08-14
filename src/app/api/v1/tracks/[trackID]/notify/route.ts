import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/config/db";
import { Track } from "@/server/models/Track.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { sendShipmentUpdateEmail } from "@/lib/email";

const countryName = (country: unknown): string => {
  if (!country) return "";
  if (typeof country === "string") return country;
  if (typeof country === "object") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = country as any;
    return c.name || c.code || "";
  }
  return "";
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ trackID: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();

    const { trackID } = await params;

    const track = await Track.findOne({ trackId: trackID })
      .populate({
        path: "order",
        populate: [
          { path: "parcel.from" },
          { path: "parcel.to" },
          { path: "parcel.sender.address.country" },
          { path: "parcel.receiver.address.country" },
        ],
      })
      .lean();
    if (!track) return errorResponse({ status: 404, message: "Track not found", req });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tracked = track as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order = tracked.order as any;
    if (!order?.parcel) {
      return errorResponse({ status: 404, message: "Order details not found", req });
    }

    const parcel = order.parcel;
    const receiver = parcel.receiver || {};
    const sender = parcel.sender || {};

    const recipients: { email: string; name: string }[] = [];
    if (sender.email) recipients.push({ email: sender.email, name: sender.name || "Sender" });
    if (receiver.email) recipients.push({ email: receiver.email, name: receiver.name || "Receiver" });

    if (recipients.length === 0) {
      return errorResponse({
        status: 400,
        message: "No email found for sender or receiver",
        req,
      });
    }

    const trackingUrl = `${process.env.PUBLIC_APP_URL}/ship-and-track/track-shipment?trackId=${encodeURIComponent(trackID)}`;

    for (const recipient of recipients) {
      await sendShipmentUpdateEmail({
        to: recipient.email,
        toName: recipient.name,
        trackId: trackID,
        awb: order.awb || "",
        orderId: order._id ? String(order._id) : "",
        currentStatus: tracked.currentStatus,
        estimatedDelivery: tracked.estimatedDelivery
          ? new Date(tracked.estimatedDelivery).toLocaleString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "",
        senderName: sender.name,
        senderPhone: sender.phone,
        senderCity: sender.address?.city
          ? `${sender.address.city}${
              countryName(sender.address.country)
                ? `, ${countryName(sender.address.country)}`
                : ""
            }`
          : "",
        receiverName: receiver.name,
        receiverPhone: receiver.phone,
        receiverCity: receiver.address?.city
          ? `${receiver.address.city}${
              countryName(receiver.address.country)
                ? `, ${countryName(receiver.address.country)}`
                : ""
            }`
          : "",
        weight: parcel.weight ? String(parcel.weight) : "",
        serviceType: parcel.serviceType || "",
        priority: parcel.priority || "",
        items: (parcel.item || []).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (it: any) => ({
            name: it.name || "",
            quantity: it.quantity || 0,
            totalPrice: it.totalPrice ?? it.unitPrice ?? 0,
          })
        ),
        trackingUrl,
      });
    }

    return successResponse({
      status: 200,
      message: `Shipment update email sent to ${recipients.length} recipient(s)`,
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to send shipment update email";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}
