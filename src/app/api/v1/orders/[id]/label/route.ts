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

    // AWB number (barcode value) = the tracking number. Never show anything else.
    const awbNumber = awb || trackId;
    const trackingUrl = `${(process.env.PUBLIC_APP_URL || "").replace(/\/+$/, "")}/ship-and-track/track-shipment?trackId=${encodeURIComponent(trackId)}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Shipping Label ${trackId}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #fff; color: #000; width: 4in; }
    .label { border: 2px solid #006B45; padding: 14px; width: 4in; min-height: 6in; }
    .top { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #006B45; padding-bottom: 10px; }
    .brand { font-size: 18px; font-weight: 900; color: #006B45; letter-spacing: 0.5px; line-height: 1; }
    .tagline { font-size: 8px; letter-spacing: 2.5px; text-transform: uppercase; color: #777; margin-top: 3px; }
    .awb { text-align: right; }
    .awb .lbl { font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #777; }
    .awb .num { font-size: 18px; font-weight: 800; letter-spacing: 2px; color: #006B45; }
    .sections { display: flex; gap: 12px; margin-top: 12px; }
    .section { flex: 1; }
    .section h4 { font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; background: #EAF3EE; color: #006B45; padding: 4px 6px; border-left: 3px solid #F5C400; margin-bottom: 5px; }
    .section p { font-size: 11px; line-height: 1.5; color: #222; }
    .route { text-align: center; margin: 14px 0; padding: 10px 0; border-top: 1px dashed #006B45; border-bottom: 1px dashed #006B45; }
    .route .line { font-size: 24px; font-weight: 800; letter-spacing: 2px; color: #006B45; }
    .route .sub { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #777; }
    .meta { display: flex; justify-content: space-between; font-size: 10px; padding: 8px 0; }
    .meta span { text-align: center; }
    .meta b { display: block; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #777; margin-bottom: 2px; }
    .meta .val { font-weight: 700; font-size: 12px; color: #222; }
    .barcode-area { text-align: center; margin-top: 8px; border-top: 1px solid #E4EEEA; padding-top: 10px; }
    .barcode-area .lbl { font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: #777; margin-bottom: 6px; }
    .bars svg, .bars img { max-width: 100%; height: 42px; }
    .barcode .num { font-size: 15px; letter-spacing: 4px; font-weight: 700; color: #006B45; }
    .qr-row { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 12px; border-top: 1px solid #E4EEEA; }
    .qr-cell svg { width: 55px; height: 55px; }
    .qr-cell .lbl { font-size: 8px; letter-spacing: 1px; text-transform: uppercase; color: #777; text-align: center; margin-top: 4px; }
    .qr-hint { font-size: 10px; color: #555; line-height: 1.5; width: 66%; }
    .qr-hint b { color: #006B45; }
    .footer { margin-top: 12px; font-size: 8px; text-align: center; color: #777; text-transform: uppercase; letter-spacing: 1.5px; }
    .print-btn { position: fixed; top: 16px; right: 16px; padding: 10px 18px; background: #006B45; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
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
        <div class="brand">CROSS CART</div>
        <div class="tagline">Global International Express</div>
      </div>
      <div class="awb">
        <div class="lbl">AWB No.</div>
        <div class="num">${awbNumber}</div>
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
      <span><b>Track ID</b><span class="val">${trackId}</span></span>
      <span><b>Weight</b><span class="val">${weight} KG</span></span>
      <span><b>Priority</b><span class="val">${priority}</span></span>
      <span><b>Date</b><span class="val">${orderDate}</span></span>
    </div>

    <div class="barcode-area">
      <div class="lbl">Tracking Number (Barcode)</div>
      <div class="bars"><svg id="barcode"></svg></div>
    </div>

    <div class="qr-row">
      <div class="qr-cell">
        <div id="qrcode"></div>
        <div class="lbl">Scan to Track</div>
      </div>
      <div class="qr-hint">
        <b>Scan the QR code</b> to view live tracking status for this shipment.
        <br />Or track online at <b>crosscartglobal.com</b>.
      </div>
    </div>

    <div class="footer">Cross Cart Global International Express • Pickup: Dhaka, BD • crosscartglobal.com</div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
  <script>
    (function () {
      try {
        JsBarcode("#barcode", ${JSON.stringify(awbNumber)}, {
          format: "CODE128",
          width: 2,
          height: 42,
          displayValue: true,
          fontSize: 14,
          font: "monospace",
          margin: 4,
        });
      } catch (e) { document.getElementById("barcode").outerHTML = '<div style="font-size:16px;font-weight:700;color:#006B45;letter-spacing:3px;">' + ${JSON.stringify(awbNumber)} + '</div>'; }

      try {
        new QRCode(document.getElementById("qrcode"), ${JSON.stringify(trackingUrl)});
      } catch (e) { document.getElementById("qrcode").outerHTML = '<div style="font-size:9px;color:#555;">Tracking: ' + ${JSON.stringify(trackId)} + '</div>'; }
    })();
  </script>
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
