"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RoleGuard } from "@/middleware/roleGuard";
import { apiService } from "@/services/apiService";
import { Plus, Truck, RefreshCw, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Rider = any;

const statusColor: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  "on-delivery": "bg-amber-100 text-amber-700",
  offline: "bg-gray-100 text-gray-600",
  blocked: "bg-red-100 text-red-700",
};

export default function RidersPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    nidNumber: "",
    vehicleType: "bike",
    vehiclePlate: "",
    status: "available",
    zones: "",
  });

  const fetchRiders = async () => {
    try {
      setLoading(true);
      const response = await apiService.get("/riders", { limit: 200 });
      if (response.success) {
        setRiders((response.data as Rider[]) || []);
      } else {
        toast.error(response.message || "Failed to fetch riders");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    setSaving(true);
    try {
      const response = await apiService.post("/riders", {
        name: form.name,
        phone: form.phone,
        email: form.email,
        nidNumber: form.nidNumber,
        vehicleType: form.vehicleType,
        vehiclePlate: form.vehiclePlate,
        status: form.status,
        zones: form.zones
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      if (response.success) {
        toast.success("Rider added successfully");
        setIsDialogOpen(false);
        setForm({
          name: "",
          phone: "",
          email: "",
          nidNumber: "",
          vehicleType: "bike",
          vehiclePlate: "",
          status: "available",
          zones: "",
        });
        fetchRiders();
      } else {
        toast.error(response.message || "Failed to add rider");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (rider: Rider, status: string) => {
    try {
      const response = await apiService.put(`/riders/${rider._id}`, { status });
      if (response.success) {
        toast.success("Rider status updated");
        fetchRiders();
      } else {
        toast.error(response.message || "Failed to update status");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const handleDelete = async (rider: Rider) => {
    if (!confirm(`Remove rider "${rider.name}"?`)) return;
    try {
      const response = await apiService.delete(`/riders/${rider._id}`);
      if (response.success) {
        toast.success("Rider removed");
        fetchRiders();
      } else {
        toast.error(response.message || "Failed to remove rider");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const countByStatus = (r: string) =>
    riders.filter((x) => x.status === r).length;

  return (
    <RoleGuard allowedRoles={["admin", "moderator"]}>
      <div className="space-y-6" data-testid="riders-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Delivery Riders</h1>
            <p className="text-muted-foreground">
              Manage delivery riders and their availability
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={fetchRiders}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Rider</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{riders.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Available</p>
              <p className="text-2xl font-bold text-green-600">
                {countByStatus("available")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">On Delivery</p>
              <p className="text-2xl font-bold text-amber-600">
                {countByStatus("on-delivery")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Offline</p>
              <p className="text-2xl font-bold text-gray-500">
                {countByStatus("offline")}
              </p>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading riders...</p>
        ) : riders.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Truck className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-foreground">
                  No riders yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Add your first delivery rider to start assigning orders.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {riders.map((rider) => (
              <Card key={rider._id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-soft-green rounded-full p-3">
                        <Truck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {rider.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {rider.phone}
                        </p>
                      </div>
                    </div>
                    <Badge className={statusColor[rider.status] || ""}>
                      {rider.status}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-1 text-sm">
                    <p className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {rider.rating || 0} rating · {rider.totalDeliveries || 0}{" "}
                      deliveries
                    </p>
                    <p>
                      <span className="font-medium">Vehicle:</span>{" "}
                      {rider.vehicleType}
                      {rider.vehiclePlate && ` (${rider.vehiclePlate})`}
                    </p>
                    {rider.zones && rider.zones.length > 0 && (
                      <p>
                        <span className="font-medium">Zones:</span>{" "}
                        {rider.zones.join(", ")}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t">
                    {["available", "on-delivery", "offline"].map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={
                          rider.status === s ? "default" : "outline"
                        }
                        onClick={() => handleStatusChange(rider, s)}
                      >
                        {s}
                      </Button>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      onClick={() => handleDelete(rider)}
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Delivery Rider</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Rider name"
                  />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+8801XXXXXXXXX"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="rider@email.com"
                  />
                </div>
                <div>
                  <Label>NID Number</Label>
                  <Input
                    value={form.nidNumber}
                    onChange={(e) =>
                      setForm({ ...form, nidNumber: e.target.value })
                    }
                    placeholder="NID"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vehicle Type</Label>
                  <select
                    value={form.vehicleType}
                    onChange={(e) =>
                      setForm({ ...form, vehicleType: e.target.value })
                    }
                    className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-ring"
                  >
                    <option value="bike">Bike</option>
                    <option value="cycle">Cycle</option>
                    <option value="van">Van</option>
                    <option value="car">Car</option>
                    <option value="walking">Walking</option>
                  </select>
                </div>
                <div>
                  <Label>Vehicle Plate</Label>
                  <Input
                    value={form.vehiclePlate}
                    onChange={(e) =>
                      setForm({ ...form, vehiclePlate: e.target.value })
                    }
                    placeholder="Dhaka Metro-…"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-ring"
                  >
                    <option value="available">Available</option>
                    <option value="on-delivery">On Delivery</option>
                    <option value="offline">Offline</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
                <div>
                  <Label>Zones (comma separated)</Label>
                  <Input
                    value={form.zones}
                    onChange={(e) => setForm({ ...form, zones: e.target.value })}
                    placeholder="Mirpur, Dhanmondi"
                  />
                </div>
              </div>
              <Button
                onClick={handleCreate}
                disabled={saving}
                className="w-full flex items-center justify-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>{saving ? "Adding..." : "Add Rider"}</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}