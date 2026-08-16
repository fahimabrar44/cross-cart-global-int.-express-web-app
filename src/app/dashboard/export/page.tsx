"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RoleGuard } from "@/middleware/roleGuard";
import { useAuth } from "@/hooks/AuthContext";
import { FileDown, FileSpreadsheet, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import WorldLoader from "@/components/ui/world-loader";

export default function ExportPage() {
  const { user } = useAuth();
  const isStaff = user?.role === "admin" || user?.role === "moderator";
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [downloading, setDownloading] = useState(false);

  if (!isStaff) {
    return (
        <RoleGuard allowedRoles={["admin", "moderator"]}>
          <WorldLoader />
        </RoleGuard>
    );
  }

  const download = async (format: "csv" | "xlsx") => {
    try {
      setDownloading(true);
      const token = localStorage.getItem("accessToken");
      const params = new URLSearchParams({ format });
      if (status) params.set("status", status);
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const response = await fetch(
        `/api/v1/orders/export?${params.toString()}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data.message || "Export failed");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        response.headers
          .get("Content-Disposition")
          ?.match(/filename="?([^";]+)/)?.[1] || `orders.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["admin", "moderator"]}>
      <div className="space-y-6" data-testid="export-page">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Export Orders</h1>
          <p className="text-muted-foreground">
            Download all orders as CSV or Excel for offline analysis
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Status filter</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-ring"
                >
                  <option value="">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="picked-up">Picked Up</option>
                  <option value="in-transit">In Transit</option>
                  <option value="out-for-delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="returned">Returned</option>
                </select>
              </div>
              <div>
                <Label>From date</Label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div>
                <Label>To date</Label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                onClick={() => download("csv")}
                disabled={downloading}
                className="flex items-center space-x-2"
              >
                <FileDown className="h-4 w-4" />
                <span>{downloading ? "Exporting..." : "Download CSV"}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => download("xlsx")}
                disabled={downloading}
                className="flex items-center space-x-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>{downloading ? "Exporting..." : "Download Excel"}</span>
              </Button>
            </div>

            <div className="bg-section rounded-lg p-4 text-sm text-muted-foreground mt-2">
              <Download className="h-4 w-4 inline mr-1" />
              Note: Exports are limited to 5,000 most recent orders matching your
              filters.
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}