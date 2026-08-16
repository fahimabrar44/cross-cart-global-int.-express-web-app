"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/AuthContext";
import { Loader2, Search, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Courier {
  courier_name?: string;
  courier_code?: string;
  courier_country_iso2?: string;
  courier_type?: string;
  courier_logo?: string;
}

export default function TrackingMorePage() {
  const { user } = useAuth();
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Detect courier
  const [detectNumber, setDetectNumber] = useState("");
  const [detectResult, setDetectResult] = useState<Courier[]>([]);
  const [detectLoading, setDetectLoading] = useState(false);

  // Create tracking
  const [createForm, setCreateForm] = useState({
    tracking_number: "",
    courier_code: "",
  });
  const [createLoading, setCreateLoading] = useState(false);

  const loadCouriers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/tracking/couriers", {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      const result = await res.json();
      if (res.ok) {
        setCouriers(result.data || []);
      } else {
        toast.error(result.message || "Failed to load couriers");
      }
    } catch {
      toast.error("Failed to load couriers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCouriers();
  }, []);

  const handleDetect = async () => {
    if (!detectNumber.trim()) {
      toast.error("Enter a tracking number to detect");
      return;
    }
    try {
      setDetectLoading(true);
      const res = await fetch("/api/v1/tracking/detect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ tracking_number: detectNumber.trim() }),
      });
      const result = await res.json();
      if (res.ok) {
        setDetectResult(result.data || []);
        const first = result.data?.[0];
        if (first?.courier_code) {
          setCreateForm((f) => ({ ...f, courier_code: first.courier_code }));
        }
        toast.success("Courier detected");
      } else {
        toast.error(result.message || "Failed to detect courier");
      }
    } catch {
      toast.error("Failed to detect courier");
    } finally {
      setDetectLoading(false);
    }
  };

  const handleCreateTracking = async () => {
    if (!createForm.tracking_number.trim() || !createForm.courier_code.trim()) {
      toast.error("Tracking number and courier code are required");
      return;
    }
    try {
      setCreateLoading(true);
      const res = await fetch("/api/v1/tracking/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(createForm),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success("Tracking created on TrackingMore");
      } else {
        toast.error(result.message || "Failed to create tracking");
      }
    } catch {
      toast.error("Failed to create tracking");
    } finally {
      setCreateLoading(false);
    }
  };

  const filteredCouriers = couriers.filter(
    (c) =>
      (c.courier_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.courier_code || "").toLowerCase().includes(search.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">TrackingMore Integration</h1>
          <p className="text-muted-foreground">
            Detect couriers, create trackings, and sync carrier tracking events
          </p>
        </div>
        <Button variant="outline" onClick={loadCouriers} disabled={loading}>
          <Truck className="h-4 w-4 mr-2" />
          {loading ? (
            <>
              <img src="/world.svg" alt="" className="h-4 w-4" />
              Refreshing...
            </>
          ) : (
            "Refresh Couriers"
          )}
        </Button>
      </div>

      {/* Detect & Create */}
      <Card>
        <CardHeader>
          <CardTitle>Detect & Create Tracking</CardTitle>
          <CardDescription>
            Detect the carrier from a tracking number, then create a realtime
            tracking with TrackingMore
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tracking Number</Label>
              <Input
                placeholder="e.g. 771066256450"
                value={detectNumber}
                onChange={(e) => setDetectNumber(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleDetect} disabled={detectLoading}>
                {detectLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Detect Courier
              </Button>
            </div>
          </div>

          {detectResult.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {detectResult.map((c, i) => (
                <Badge key={i} variant="secondary">
                  {c.courier_name} ({c.courier_code})
                </Badge>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
            <div>
              <Label>Tracking Number</Label>
              <Input
                placeholder="Tracking number"
                value={createForm.tracking_number}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, tracking_number: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Courier Code</Label>
              <Input
                placeholder="e.g. usps"
                value={createForm.courier_code}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, courier_code: e.target.value }))
                }
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleCreateTracking} disabled={createLoading}>
                {createLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Tracking
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Couriers list */}
      <Card>
        <CardHeader>
          <CardTitle>Supported Couriers ({filteredCouriers.length})</CardTitle>
          <CardDescription>
            All couriers supported by TrackingMore searchable by name or code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search couriers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-[480px] overflow-x-auto overflow-y-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="text-left p-3">Courier</th>
                  <th className="text-left p-3">Code</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Country</th>
                </tr>
              </thead>
              <tbody>
                {filteredCouriers.map((c, i) => (
                  <tr key={`${c.courier_code}-${i}`} className="border-t hover:bg-muted/50">
                    <td className="p-3 font-medium">{c.courier_name || "-"}</td>
                    <td className="p-3">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {c.courier_code || "-"}
                      </code>
                    </td>
                    <td className="p-3">{c.courier_type || "-"}</td>
                    <td className="p-3">{c.courier_country_iso2 || "-"}</td>
                  </tr>
                ))}
                {filteredCouriers.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-muted-foreground">
                      No couriers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}