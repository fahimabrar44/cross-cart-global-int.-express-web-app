import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/config/db";
import { Order } from "@/server/models/Order.model";
import { verifyAuth } from "@/middleware/auth";
import { Types } from "mongoose";

/**
 * GET /api/v1/orders/[id]/label
 * Returns a printable shipping label (browser "Print to PDF").
 * Access: auth OR ?track=<trackId>.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();

    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return new NextResponse("Invalid order id", { status: 400 });
    }

    const url = new URL(req.url);
    const trackQuery = url.searchParams.get("track");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order: any = await Order.findById(id)
      .populate("parcel.from")
      .populate("parcel.to")
      .lean();

    const authResult = await verifyAuth(req);
    if (
      !authResult.success &&
      !(trackQuery && order && order.trackId === trackQuery)
    ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    if (!order) return new NextResponse("Order not found", { status: 404 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const from = (order.parcel as any)?.from;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const to = (order.parcel as any)?.to;
    const sender = order.parcel?.sender || {};
    const receiver = order.parcel?.receiver || {};
    const awb = order?.awb || "";
    const trackId = order.trackId || "";
    const weight = order.parcel?.weight || "";
    const serviceType = order.parcel?.serviceType || "";
    const priority = order.parcel?.priority || "normal";
    const orderDate = order.orderDate
      ? new Date(order.orderDate).toLocaleDateString("en-GB")
      : "";

    const barcode = awb || trackId;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Shipping Label ${trackId}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Courier New', monospace; background: #fff; color: #000; width: 4in; }
    .label { border: 2px solid #000; padding: 12px; width: 4in; min-height: 6in; }
    .top { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 8px; }
    .brand { font-size: 18px; font-weight: 800; color: #006B45; letter-spacing: 1px; }
    .tagline { font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: #555; }
    .awb { text-align: right; }
    .awb .num { font-size: 20px; font-weight: 700; letter-spacing: 2px; }
    .awb .lbl { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #555; }
    .sections { display: flex; gap: 10px; margin-top: 10px; }
    .section { flex: 1; }
    .section h4 { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #999; padding-bottom: 3px; margin-bottom: 4px; }
    .section p { font-size: 11px; line-height: 1.5; }
    .route { text-align: center; margin: 12px 0; }
    .route .line { font-size: 22px; font-weight: 800; letter-spacing: 2px; }
    .route .sub { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #555; }
    .meta { display: flex; justify-content: space-between; font-size: 10px; border-top: 1px solid #999; border-bottom: 1px solid #999; padding: 6px 0; margin-top: 10px; }
    .meta span b { display: block; font-size: 9px; text-transform: uppercase; color: #555; }
    .barcode { text-align: center; margin-top: 12px; }
    .bars { display: flex; justify-content: center; gap: 1px; margin-bottom: 4px; }
    .bars i { display: inline-block; height: 42px; background: #000; }
    .barcode .num { font-size: 14px; letter-spacing: 4px; font-weight: 700; }
    .footer { margin-top: 8px; font-size: 8px; text-align: center; color: #555; text-transform: uppercase; letter-spacing: 1px; }
    .print-btn { position: fixed; top: 16px; right: 16px; padding: 10px 18px; background: #006B45; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-family: Arial, sans-serif; }
    @media print {
      .print-btn { display: none; }
      body { width: 4in; }
      @page { size: 4in 6in; margin: 0; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">Print Label</button>
  <div class="label">
    <div class="top">
      <div>
        <div class="brand">CROSSCART</div>
        <div class="tagline">Global Int Express</div>
      </div>
      <div class="awb">
        <div class="lbl">AWB No.</div>
        <div class="num">${barcode}</div>
      </div>
    </div>

    <div class="sections">
      <div class="section">
        <h4>From (Sender)</h4>
        <p>${sender.name || "-"}<br />${sender.phone || ""}<br />${sender.address?.address || ""}<br />${sender.address?.city || ""}, ${from?.name || ""}</p>
      </div>
      <div class="section">
        <h4>To (Receiver)</h4>
        <p>${receiver.name || "-"}<br />${receiver.phone || ""}<br />${receiver.address?.address || ""}<br />${receiver.address?.city || ""}, ${to?.name || ""}</p>
      </div>
    </div>

    <div class="route">
      <div class="line">${from?.name || "?"} → ${to?.name || "?"}</div>
      <div class="sub">${serviceType || "Standard"} Delivery</div>
    </div>

    <div class="meta">
      <span><b>Track ID</b>${trackId}</span>
      <span><b>Weight</b>${weight} KG</span>
      <span><b>Priority</b>${priority}</span>
      <span><b>Date</b>${orderDate}</span>
    </div>

    <div class="barcode">
      <div class="bars">
        ${Array.from({ length: 48 })
          .map(() => `<i style="width:${(Number(barcode.length) % 2) + 1}px"></i><span style="width:2px;display:inline-block"></span>`)
          .join("")}
      </div>
      <div class="num">${barcode}</div>
    </div>

    <div class="footer">CrossCart Global Int Express • Pickup: Dhaka, BD • crosscartglobal.com</div>
  </div>
  <script>window.addEventListener("load", () => { if (!window.__printed) window.print(); });</script>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to generate label";
    return new NextResponse(`<pre>${msg}</pre>`, { status: 500 });
  }
}
