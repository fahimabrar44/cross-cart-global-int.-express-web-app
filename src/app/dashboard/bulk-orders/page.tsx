"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RoleGuard } from "@/middleware/roleGuard";
import { apiService } from "@/services/apiService";
import { ClipboardList, Upload, Layers } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BulkResult = any;

const CSV_TEMPLATE = `senderName,senderPhone,receiverName,receiverPhone,from,to,weight,serviceType,itemName,quantity,unitPrice`;

export default function BulkOrdersPage() {
  const [mode, setMode] = useState<"json" | "csv">("json");
  const [jsonText, setJsonText] = useState(
    JSON.stringify(
      {
        orders: [
          {
            parcel: {
              from: "679…countryId…",
              to: "678…countryId…",
              sender: { name: "Sender A", phone: "+8801711111111" },
              receiver: { name: "Receiver A", phone: "+8801812345678" },
              weight: "1 kg",
              serviceType: "express",
              priority: "normal",
              item: [{ name: "Gadget", quantity: 1, unitPrice: 5000 }],
              insurance: { enabled: true, declaredValue: 20000, charge: 150 },
            },
          },
        ],
      },
      null,
      2
    )
  );
  const [csvText, setCsvText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<BulkResult>(null);
  const [submitting, setSubmitting] = useState(false);

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE + "\n"], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk-orders-template.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result || "");
      setCsvText(text);
      setMode("csv");
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    let body;
    if (mode === "json") {
      try {
        body = JSON.parse(jsonText);
      } catch {
        toast.error("Invalid JSON");
        return;
      }
      if (!body.orders || !Array.isArray(body.orders)) {
        toast.error("JSON must contain an 'orders' array");
        return;
      }
    } else {
      if (!csvText.trim()) {
        toast.error("Paste CSV or upload a file first");
        return;
      }
      body = { csv: csvText };
    }

    setSubmitting(true);
    setResult(null);
    try {
      const response = await apiService.post("/orders/bulk", body);
      if (response.success) {
        setResult(response.data);
        toast.success(response.message);
      } else {
        toast.error(response.message || "Bulk create failed");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["admin", "moderator"]}>
      <div className="space-y-6" data-testid="bulk-orders-page">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bulk Create Orders</h1>
          <p className="text-muted-foreground">
            Create many orders at once via JSON or CSV (max 200 per request)
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-soft-green rounded-full p-3">
                  <Layers className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Input Method</h3>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={mode === "json" ? "default" : "outline"}
                  onClick={() => setMode("json")}
                >
                  JSON
                </Button>
                <Button
                  variant={mode === "csv" ? "default" : "outline"}
                  onClick={() => setMode("csv")}
                >
                  CSV
                </Button>
              </div>

              {mode === "json" ? (
                <div>
                  <textarea
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    rows={14}
                    className="w-full p-3 border border-border rounded-lg font-mono text-sm focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Provide an <code>{`{"orders": [...]}`}</code> object. Each order
                    follows the same parcel shape as a single create.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload CSV
                    </Button>
                    <Button variant="outline" onClick={downloadTemplate}>
                      Download Template
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                  <textarea
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    rows={10}
                    placeholder={CSV_TEMPLATE}
                    className="w-full p-3 border border-border rounded-lg font-mono text-sm focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground">
                    Headers: senderName, senderPhone, receiverName, receiverPhone,
                    from, to, weight, serviceType, itemName, quantity, unitPrice
                  </p>
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full"
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                {submitting ? "Creating..." : "Create Orders"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-soft-green rounded-full p-3">
                  <Layers className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Result</h3>
              </div>

              {!result && (
                <p className="text-sm text-muted-foreground">
                  Results will appear here after submitting.
                </p>
              )}

              {result && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-section rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-primary">
                        {result.createdCount}
                      </p>
                      <p className="text-xs text-muted-foreground">Created</p>
                    </div>
                    <div className="bg-section rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-red-600">
                        {result.failedCount}
                      </p>
                      <p className="text-xs text-muted-foreground">Failed</p>
                    </div>
                    <div className="bg-section rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold">
                        {result.trackIds?.length}
                      </p>
                      <p className="text-xs text-muted-foreground">Track IDs</p>
                    </div>
                  </div>

                  {result.trackIds && result.trackIds.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Tracking IDs</h4>
                      <div className="bg-section rounded-lg p-3 max-h-40 overflow-y-auto text-sm space-y-1">
                        {result.trackIds.map((id: string) => (
                          <p key={id} className="font-mono">
                            {id}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.errors && result.errors.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-red-600">Errors</h4>
                      <div className="bg-section rounded-lg p-3 max-h-40 overflow-y-auto text-sm space-y-1">
                        {result.errors.map((err: { index: number; message: string }, i: number) => (
                          <p key={i}>
                            Row {err.index + 1}: {err.message}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}