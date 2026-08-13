import connectDB from "@/config/db";
import { createModeratorHandler } from "@/server/common/apiWrapper";
import { errorResponse, successResponse } from "@/server/common/response";
import { Order } from "@/server/models/Order.model";
import { Track } from "@/server/models/Track.model";
import { notificationService } from "@/services/notificationService";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseCSVOrders(csv: string): Record<string, any>[] {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const orders = [];

  for (let i = 1; i < lines.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: Record<string, any> = {};
    const cells = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    headers.forEach((h, idx) => {
      row[h] = cells[idx] !== undefined ? cells[idx] : "";
    });

    const sender = {
      name: row["senderName"] || row["sender_name"] || "",
      phone: row["senderPhone"] || row["sender_phone"] || "",
      email: row["senderEmail"] || row["sender_email"] || "",
    };
    const receiver = {
      name: row["receiverName"] || row["receiver_name"] || "",
      phone: row["receiverPhone"] || row["receiver_phone"] || "",
      email: row["receiverEmail"] || row["receiver_email"] || "",
    };
    const items = [
      {
        name: row["itemName"] || row["item_name"] || "General shipment",
        quantity: Number(row["quantity"]) || 1,
        unitPrice: Number(row["unitPrice"]) || Number(row["unit_price"]) || 0,
        totalPrice:
          (Number(row["quantity"]) || 1) * (Number(row["unitPrice"]) || Number(row["unit_price"]) || 0),
      },
    ];

    orders.push({
      parcel: {
        from: row["from"] || null,
        to: row["to"] || null,
        sender,
        receiver,
        weight: row["weight"] || "1",
        serviceType: row["serviceType"] || "",
        priority: row["priority"] || "normal",
        orderType: row["orderType"] || "parcel",
        item: items,
      },
      payment: {
        pType: row["pType"] || "Due",
        pAmount: Number(row["pAmount"]) || 0,
        pDiscount: Number(row["pDiscount"]) || 0,
      },
    });
  }

  return orders;
}

/**
 * POST /api/v1/orders/bulk
 * Body A: { orders: [...] }  (array of order payloads, same shape as single create)
 * Body B: { csv: "senderName,senderPhone,...\n..." }
 * Authenticated admin/moderator/seller.
 */
export const POST = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();
    const body = await req.json();

    let payloads: unknown[] = [];
    if (Array.isArray(body.orders)) {
      payloads = body.orders;
    } else if (typeof body.csv === "string") {
      payloads = parseCSVOrders(body.csv);
    } else if (typeof body.ordersCsv === "string") {
      payloads = parseCSVOrders(body.ordersCsv);
    } else {
      return errorResponse({ status: 400, message: "Provide 'orders' array or 'csv' string", req });
    }

    if (payloads.length === 0) {
      return errorResponse({ status: 400, message: "No valid orders to create", req });
    }
    if (payloads.length > 200) {
      return errorResponse({ status: 400, message: "Maximum 200 orders per bulk request", req });
    }

    const created: unknown[] = [];
    const errors: { index: number; message: string }[] = [];

    for (let i = 0; i < payloads.length; i++) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload = payloads[i] as any;
        const parcel = payload.parcel;

        if (
          !parcel ||
          !parcel.sender?.name ||
          !parcel.sender?.phone ||
          !parcel.receiver?.name ||
          !parcel.receiver?.phone
        ) {
          errors.push({ index: i, message: "sender & receiver name/phone required" });
          continue;
        }
        if (!parcel.from || !parcel.to) {
          errors.push({ index: i, message: "from/to country required" });
          continue;
        }

        const orderPayload = {
          parcel: {
            ...parcel,
            orderType: parcel.orderType || "parcel",
            priority: parcel.priority || "normal",
          },
          payment: {
            pType: payload.payment?.pType || "Due",
            pAmount: Number(payload.payment?.pAmount) || 0,
            pOfferDiscount: Number(payload.payment?.pOfferDiscount) || 0,
            pExtraCharge: Number(payload.payment?.pExtraCharge) || 0,
            pDiscount: Number(payload.payment?.pDiscount) || 0,
            pReceived: Number(payload.payment?.pReceived) || 0,
            pRefunded: Number(payload.payment?.pRefunded) || 0,
          },
          orderDate: new Date(),
          handover_by: { company: "", tracking: "", payment: 0 },
        };

        const order = new Order(orderPayload);
        await order.save();

        const track = new Track({
          order: order._id,
          currentStatus: "created",
          history: [
            {
              status: "created",
              description: "Order was created in bulk",
              location: { city: parcel.sender?.address?.city || "", country: "" },
              timestamp: new Date(),
            },
          ],
        });
        await track.save();

        created.push(order);

        if (parcel.sender?.phone) {
          try {
            await notificationService.sendNotification({
              phone: parcel.sender.phone,
              title: "Order Created",
              message: `Your order ${order.trackId} has been created.`,
              type: "success",
              category: "order",
              channels: ["inapp", "sms", "email"],
              actionUrl: `/ship-and-track/track-shipment?trackId=${order.trackId}`,
              actionText: "Track",
              data: { trackId: order.trackId },
            });
          } catch {
            // ignore notif errors
          }
        }
      } catch (err) {
        errors.push({
          index: i,
          message: err instanceof Error ? err.message : "Failed to create order",
        });
      }
    }

    return successResponse({
      status: 201,
      message: `Created ${created.length} of ${payloads.length} orders`,
      data: {
        created,
        createdCount: created.length,
        failedCount: errors.length,
        errors,
        trackIds: created.map((o) => (o as unknown as { trackId: string }).trackId),
      },
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to bulk create orders";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});