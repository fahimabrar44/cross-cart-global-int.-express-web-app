import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/config/db";
import { Order } from "@/server/models/Order.model";
import { verifyAuth } from "@/middleware/auth";
import { Types } from "mongoose";

function money(n: number | undefined): string {
  return (Number(n) || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * GET /api/v1/orders/[id]/label
 * Returns a printable shipping label (2 copies on A4 landscape).
 * Access via auth OR ?track=<trackId>.
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
    const from = order.parcel?.from as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const to = order.parcel?.to as any;
    const sender = order.parcel?.sender || {};
    const receiver = order.parcel?.receiver || {};
    const payment = order.payment || {};
    const boxCount = order.parcel?.boxCount || 0;
    const packagingType = order.parcel?.packagingType || "—";
    const dimensions = order.parcel?.dimensions || {};
    const insurance = order.parcel?.insurance || {};
    const awb = order.awb || "";

    const card = `
    <div class="label">
      <div class="label-head">
        <img class="logo" src="/full-logo.png" alt="CrossCart Global" />
        <div class="head-right">
          <div class="ship">SHIPPING LABEL</div>
          <div class="track">${order.trackId}</div>
        </div>
      </div>
      <div class="barcode" aria-hidden="true"></div>
      <div class="addr">
        <div class="from">
          <span class="tag">FROM</span>
          <div class="name">${sender.name || "-"}</div>
          <div>${sender.phone || ""}</div>
          <div>${from?.name || ""}${sender.address?.city ? ` - ${sender.address.city}` : ""}</div>
        </div>
        <div class="to">
          <span class="tag">TO</span>
          <div class="name">${receiver.name || "-"}</div>
          <div>${receiver.phone || ""}</div>
          <div>${to?.name || ""}${receiver.address?.city ? ` - ${receiver.address.city}` : ""}</div>
        </div>
      </div>
      <div class="info">
        <span>Service: ${order.parcel?.serviceType || "-"}</span>
        <span>Priority: ${order.parcel?.priority || "normal"}</span>
        <span>Weight: ${order.parcel?.weight || "0"} kg</span>
        <span>Packaging: ${packagingType}</span>
        <span>Boxes: ${boxCount}</span>
        <span>Dim: ${dimensions.length || 0} × ${dimensions.width || 0} × ${dimensions.height || 0} cm</span>
        ${awb ? `<span>AWB: ${awb}</span>` : ""}
        ${insurance.enabled ? `<span>Insurance: Yes</span>` : ""}
        <span>Amount: ${money(payment.pAmount)}</span>
      </div>
      <div class="foot">CrossCart Global Int Express · +8801622541719 · ${order.orderDate ? new Date(order.orderDate).toDateString() : ""}</div>
    </div>`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Shipping Label ${order.trackId}</title>
  <style>
    @page { size: A4 landscape; margin: 6mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a202c; margin: 0; padding: 0; }
    .sheet { display: flex; gap: 6mm; width: 100%; height: calc(210mm - 12mm); }
    .label { flex: 1; border: 2px solid #006B45; border-radius: 10px; padding: 10px; display: flex; flex-direction: column; gap: 8px; overflow: hidden; }
    .label-head { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #006B45; padding-bottom: 6px; }
    .logo { height: 36px; width: auto; object-fit: contain; }
    .head-right { text-align: right; }
    .ship { font-weight: 800; color: #006B45; letter-spacing: 1px; font-size: 13px; }
    .track { font-family: 'Courier New', monospace; font-size: 18px; font-weight: 700; letter-spacing: 1px; }
    .barcode { height: 36px; background: repeating-linear-gradient(90deg, #111 0 2px, #fff 2px 4px, #111 4px 5px, #fff 5px 9px, #111 9px 12px, #fff 12px 14px); border: 1px solid #111; border-radius: 3px; }
    .addr { display: flex; gap: 10px; }
    .from, .to { flex: 1; border: 1px solid #ddd; border-radius: 6px; padding: 8px; }
    .tag { background: #006B45; color: #fff; display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; margin-bottom: 4px; }
    .name { font-weight: 700; font-size: 15px; margin-bottom: 2px; }
    .info { display: flex; flex-wrap: wrap; gap: 6px; font-size: 12px; }
    .info span { background: #f3faf7; border: 1px solid #cfe9df; border-radius: 4px; padding: 3px 8px; }
    .foot { margin-top: auto; font-size: 10px; color: #718096; text-align: center; border-top: 1px dashed #ccc; padding-top: 5px; }
    .print-btn { position: fixed; top: 8px; right: 8px; padding: 10px 18px; background: #006B45; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; z-index: 10; }
    @media print { .print-btn { display: none; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  <div class="sheet">
    ${card}
    ${card}
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to generate label";
    return new NextResponse(`<pre>${msg}</pre>`, { status: 500 });
  }
}
