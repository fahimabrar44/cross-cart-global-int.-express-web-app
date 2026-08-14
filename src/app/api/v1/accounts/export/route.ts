import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/config/db";
import { User } from "@/server/models/User.model";
import { errorResponse } from "@/server/common/response";
import { verifyAuth } from "@/middleware/auth";

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCSV(users: unknown[]): string {
  const headers = [
    "Name",
    "Email",
    "Phone",
    "Role",
    "Status",
    "Verified",
    "Last Login",
    "Created At",
  ];
  const rows = users.map((u) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = u as any;
    return [
      user.name,
      user.email,
      user.phone,
      user.role,
      user.isActive ? "active" : "inactive",
      user.isVerified ? "verified" : "unverified",
      user.lastLogin ? new Date(user.lastLogin).toISOString() : "",
      user.createdAt ? new Date(user.createdAt).toISOString() : "",
    ];
  });
  const lines = [headers.join(","), ...rows.map((r) => r.map(csvEscape).join(","))];
  return lines.join("\n");
}

/**
 * GET /api/v1/accounts/export?format=csv|xlsx&role=&isActive=&isVerified=&search=
 * Admin/Moderator only.
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (authResult.user.role !== "admin" && authResult.user.role !== "moderator") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    await connectDB();

    const url = new URL(req.url);
    const format = (url.searchParams.get("format") || "csv").toLowerCase();
    const role = url.searchParams.get("role");
    const isActiveParam = url.searchParams.get("isActive");
    const isVerifiedParam = url.searchParams.get("isVerified");
    const search = url.searchParams.get("search");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};

    if (role && ["user", "admin", "moderator"].includes(role)) query.role = role;
    if (isActiveParam !== null) query.isActive = isActiveParam === "true";
    if (isVerifiedParam !== null) query.isVerified = isVerifiedParam === "true";

    if (search) {
      const sanitizedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { name: { $regex: sanitizedSearch, $options: "i" } },
        { email: { $regex: sanitizedSearch, $options: "i" } },
        { phone: { $regex: sanitizedSearch, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-password -refreshTokens")
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean();

    if (format === "xlsx" || format === "excel") {
      const rows = toCSV(users)
        .split("\n")
        .map((line) => line.split(",").map((c) => c.replace(/^"|"$/g, "").replace(/""/g, '"')));
      const xmlRows = rows
        .map((row) => {
          const cells = row
            .map((c) => `<Cell><Data ss:Type="String">${c.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")}</Data></Cell>`)
            .join("");
          return `<Row>${cells}</Row>`;
        })
        .join("");

      const body = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Users">
  <Table>${xmlRows}</Table>
 </Worksheet>
</Workbook>`;

      return new NextResponse(body, {
        headers: {
          "Content-Type": "application/vnd.ms-excel",
          "Content-Disposition": `attachment; filename="users-export-${new Date().toISOString().split("T")[0]}.xls"`,
        },
      });
    }

    return new NextResponse(toCSV(users), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="users-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to export users";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}