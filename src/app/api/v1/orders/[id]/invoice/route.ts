import connectDB from "@/config/db";
import { verifyAuth } from "@/middleware/auth";
import { Order } from "@/server/models/Order.model";
import { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

function money(n: number | undefined): string {
  return (Number(n) || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * GET /api/v1/orders/[id]/invoice
 * Returns a printable HTML invoice (browser "Print to PDF").
 * Public access if trackId available is not exposed; requires auth or valid trackId query.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await connectDB();

    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return new NextResponse("Invalid order id", { status: 400 });
    }

    // Allow access via auth OR ?track=<trackId>
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
    const items = order.parcel?.item || [];
    const payment = order.payment || {};

    const itemsTotal = items.reduce(
      (sum: number, it: { totalPrice?: number }) =>
        sum + (Number(it.totalPrice) || 0),
      0,
    );
    const boxCount = order.parcel?.boxCount || 0;
    const packagingType = order.parcel?.packagingType || "—";
    const dimensions = order.parcel?.dimensions || {};
    const insurance = order.parcel?.insurance || {};


    const totalWeight = Number(order.parcel?.weight) || 0;

const shippingCharge = Number(payment.pAmount) || 0;
const insuranceCharge = Number(insurance?.charge) || 0;
const discount = Number(payment.pDiscount) || 0;
const offerDiscount = Number(payment.pOfferDiscount) || 0;
const extraCharge = Number(payment.pExtraCharge) || 0;

// Per KG Shipping Charge
const perKgShippingCharge =
  totalWeight > 0 ? shippingCharge / totalWeight : 0;

// Grand Total
const grandTotal =
  shippingCharge +
  extraCharge +
  insuranceCharge -
  discount -
  offerDiscount;

    const rowLoop = items
      .map(
        (it: {
          name?: string;
          quantity?: number;
          unitPrice?: number;
          totalPrice?: number;
        }) => `
          <tr>
            <td style="padding:8px;border:1px solid #ddd;">${it.name || "-"}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:center;">${Number(it.quantity) || 0}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:right;">${money(it.unitPrice)}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:right;">${money(it.totalPrice)}</td>
          </tr>`,
      )
      .join("");

    const totalQuantity = items.reduce(
      (
        sum: number,
        item: {
          name?: string;
          quantity?: number;
          unitPrice?: number;
          totalPrice?: number;
        },
      ) => sum + (Number(item.quantity) || 0),
      0,
    );

    const totalUnitPrice = items.reduce(
      (
        sum: number,
        item: {
          name?: string;
          quantity?: number;
          unitPrice?: number;
          totalPrice?: number;
        },
      ) => sum + (Number(item.unitPrice) || 0),
      0,
    );

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${order.trackId}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a202c; margin: 24px; }
    .header { display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #006B45; padding-bottom:16px; }
    .brand-logo { height: 60px; width: auto; }
    .sub { color:#667eea; font-size:12px; letter-spacing:2px; text-transform:uppercase; }
    h1 { font-size:26px; margin:8px 0 0; }
    .meta { display:flex; gap:48px; margin-top:24px; }
    .meta .col p { margin:2px 0; font-size:14px; }
    .label { color:#718096; text-transform:uppercase; font-size:11px; letter-spacing:1px; }
    table { width:100%; border-collapse:collapse; margin-top:24px; font-size:14px; }
    th { background:#006B45; color:#fff; padding:8px; text-align:left; }
    .totals { margin-top:16px; text-align:right; }
    .totals p { margin:4px 0; font-size:14px; }
    .grand { font-size:18px; font-weight:700; color:#006B45; border-top:2px solid #006B45; padding-top:8px; }
    .footer { margin-top:32px; border-top:1px solid #eee; padding-top:12px; font-size:12px; color:#718096; text-align:center; }
    @media print { body { margin:0; } }
    .print-btn { float:right; margin-bottom:16px; padding:10px 18px; background:#006B45; color:#fff; border:none; border-radius:6px; cursor:pointer; font-size:14px; }
    @media print { .print-btn { display:none; } }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  <div class="header">
    <div>
      <img class="brand-logo" src="/full-logo.png" alt="CrossCart Global" />
      <div class="sub">International Courier Invoice</div>
    </div>
    <div style="text-align:right;">
      <h1>INVOICE</h1>
      <p style="margin:4px 0;">#${order.trackId}</p>
      <p style="margin:2px 0;font-size:12px;color:#718096;">${order.orderDate ? new Date(order.orderDate).toDateString() : ""}</p>
    </div>
  </div>

  <div class="meta">
    <div class="col">
      <p class="label">From</p>
      <p>${sender.name || "-"}</p>
      <p>${sender.phone || ""}</p>
      <p>${sender.email || ""}</p>
      <p>${sender.address?.city && sender.address?.address && sender.address?.zipCode ? `${sender.address?.address} - ${sender.address.city} - ${sender.address?.zipCode}` : ""} - ${from?.name || ""}</p>
    </div>
    <div class="col">
      <p class="label">To</p>
      <p>${receiver.name || "-"}</p>
      <p>${receiver.phone || ""}</p>
      <p>${receiver.email || ""}</p>
      <p>${receiver.address?.city && receiver.address?.address && receiver.address?.zipCode ? `${receiver.address?.address} - ${receiver.address.city} - ${receiver.address?.zipCode}` : ""} - ${to?.name || ""}</p>
    </div>
    <div class="col">
      <p class="label">Shipment Details</p>
      <p>Service: ${order.parcel?.serviceType || "-"}</p>
      <p>Priority: ${order.parcel?.priority || "normal"}</p>
       <p>Weight: ${order.parcel?.weight || "0"} kg</p>
       <p>Packaging: ${packagingType}</p>
       <p>Boxes: ${boxCount}</p>
       <p>Dimensions: ${dimensions.length || 0} × ${dimensions.width || 0} × ${dimensions.height || 0} cm</p>
    </div>
  </div>

  <table>
    <thead>
      <tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
    </thead>
    <tbody>
      ${rowLoop || `<tr><td colspan="4" style="padding:8px;border:1px solid #ddd;text-align:center;">No line items</td></tr>`}
      
  <tr style="background:#f1f5f9;font-weight:700;">
    <td style="padding:10px;border:1px solid #ddd;text-align:right;">
      TOTAL
    </td>
    <td style="padding:10px;border:1px solid #ddd;text-align:center;">
      ${totalQuantity}
    </td>
    <td style="padding:10px;border:1px solid #ddd;text-align:right;">
      $${money(totalUnitPrice)}
    </td>
    <td style="padding:10px;border:1px solid #ddd;text-align:right;">
      $${money(itemsTotal)}
    </td>
    </tbody>
  </table>

  <div class="payment-section">
  <h3>Shipping & Payment Breakdown</h3>

  <table class="payment-table">
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align:right;">Amount</th>
      </tr>
    </thead>

    <tbody>
      <tr>
        <td>Total Weight</td>
        <td style="text-align:right;">
          ${totalWeight} KG
        </td>
      </tr>

      <tr>
        <td>Per KG Shipping Charge</td>
        <td style="text-align:right;">
          $${money(perKgShippingCharge)}
        </td>
      </tr>

      <tr>
        <td>Total Shipping Charge</td>
        <td style="text-align:right;">
          $${money(shippingCharge)}
        </td>
      </tr>

      ${
        insurance.enabled
          ? `
          <tr>
            <td>Insurance Charge</td>
            <td style="text-align:right;">
              + $${money(insuranceCharge)}
            </td>
          </tr>
        `
          : ""
      }

      ${
        extraCharge > 0
          ? `
          <tr>
            <td>Extra Charge</td>
            <td style="text-align:right;">
              + $${money(extraCharge)}
            </td>
          </tr>
        `
          : ""
      }

      ${
        discount > 0
          ? `
          <tr>
            <td>Discount</td>
            <td style="text-align:right;">
              - $${money(discount)}
            </td>
          </tr>
        `
          : ""
      }

      ${
        offerDiscount > 0
          ? `
          <tr>
            <td>Offer Discount</td>
            <td style="text-align:right;">
              - $${money(offerDiscount)}
            </td>
          </tr>
        `
          : ""
      }

      <tr class="payment-grand-total grand">
        <td>Grand Total</td>
        <td style="text-align:right;">
          $${money(grandTotal)}
        </td>
      </tr>
    </tbody>
  </table>

  <p class="payment-method">
    <strong>Payment Method:</strong> ${payment.pType || "Not set"}
  </p>
</div>

  <div class="footer">
    CrossCart Global International Express · Warehouse No.1, Bhiend SKS Tower, Mohakhali, Dhaka 1206, Bangladesh · +8801410144466<br/>
    © ${new Date().getFullYear()} Cross Cart Global International Express. All rights reserved.<br/>
    Thank you for shipping with us!
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to generate invoice";
    return new NextResponse(`<pre>${msg}</pre>`, { status: 500 });
  }
}
