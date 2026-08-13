import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/config/db";
import { Order } from "@/server/models/Order.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { createModeratorHandler } from "@/server/common/apiWrapper";

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCSV(orders: unknown[]): string {
  const headers = [
    "Track ID",
    "Status",
    "Order Date",
    "Service",
    "Priority",
    "Sender Name",
    "Sender Phone",
    "Receiver Name",
    "Receiver Phone",
    "Item Value",
    "Shipping Charge",
    "Insurance",
    "Discount",
    "Grand Total",
    "Payment Type",
  ];
  const rows = orders.map((o) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order = o as any;
    const itemsTotal = (order.parcel?.item || []).reduce(
      (sum: number, it: { totalPrice?: number }) => sum + (Number(it.totalPrice) || 0),
      0
    );
    const insurance = order.parcel?.insurance || {};
    const payment = order.payment || {};
    const grand =
      (Number(payment.pAmount) || 0) +
      (Number(payment.pExtraCharge) || 0) +
      (Number(insurance.charge) || 0) -
      (Number(payment.pDiscount) || 0) -
      (Number(payment.pOfferDiscount) || 0);
    return [
      order.trackId,
      order.status,
      order.orderDate ? new Date(order.orderDate).toISOString() : "",
      order.parcel?.serviceType || "",
      order.parcel?.priority || "",
      order.parcel?.sender?.name || "",
      order.parcel?.sender?.phone || "",
      order.parcel?.receiver?.name || "",
      order.parcel?.receiver?.phone || "",
      itemsTotal,
      payment.pAmount,
      insurance.enabled ? insurance.charge : 0,
      payment.pDiscount,
      grand,
      payment.pType || "",
    ];
  });
  const lines = [headers.join(","), ...rows.map((r) => r.map(csvEscape).join(","))];
  return lines.join("\n");
}

function toExcelXml(orders: unknown[]): string {
  const data = toCSV(orders)
    .split("\n")
    .map((line) => line.split(",").map((c) => c.replace(/^"|"$/g, "").replace(/""/g, '"')));
  const rows = data
    .map((row) => {
      const cells = row
        .map((c) => `<Cell><Data ss:Type="String">${escapeXml(c)}</Data></Cell>`)
        .join("");
      return `<Row>${cells}</Row>`;
    })
    .join("");
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Orders">
  <Table>${rows}</Table>
 </Worksheet>
</Workbook>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * GET /api/v1/orders/export?format=csv|xlsx&status=&from=&to=
 * Moderator/admin only.
 */
export const GET = createModeratorHandler(async ({ req }) => {
  try {
    await connectDB();

    const url = new URL(req.url);
    const format = (url.searchParams.get("format") || "csv").toLowerCase();
    const status = url.searchParams.get("status");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (status) query.status = status;
    if (from || to) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query.orderDate = {} as any;
      if (from) query.orderDate.$gte = new Date(from);
      if (to) query.orderDate.$lte = new Date(to);
    }

    const orders = await Order.find(query)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort({ createdAt: -1 } as any)
      .limit(5000)
      .lean();

    const isExcel = format === "xlsx" || format === "excel";
    const body = isExcel ? toExcelXml(orders) : toCSV(orders);
    const contentType = isExcel
      ? "application/vnd.ms-excel"
      : "text/csv; charset=utf-8";
    const ext = isExcel ? "xls" : "csv";
    const filename = `orders-export-${new Date().toISOString().split("T")[0]}.${ext}`;

    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to export orders";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});