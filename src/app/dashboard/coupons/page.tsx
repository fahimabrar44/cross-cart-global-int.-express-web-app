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
import { TicketPercent, Plus, Trash2, Copy, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Coupon = any;

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    minOrderAmount: "",
    maxDiscount: "",
    usageLimit: "",
    perUserLimit: "1",
    validFrom: "",
    validUntil: "",
    appliesTo: "all",
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await apiService.get("/coupons", { limit: 200 });
      if (response.success) {
        setCoupons((response.data as Coupon[]) || []);
      } else {
        toast.error(response.message || "Failed to fetch coupons");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ123456789";
    let code = "CC-";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    setForm((f) => ({ ...f, code }));
  };

  const handleCreate = async () => {
    if (!form.code.trim() || !form.discountValue || !form.validUntil) {
      toast.error("Code, discount value and valid until are required");
      return;
    }
    setSaving(true);
    try {
      const response = await apiService.post("/coupons", {
        code: form.code,
        description: form.description,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderAmount: Number(form.minOrderAmount) || 0,
        maxDiscount: Number(form.maxDiscount) || 0,
        usageLimit: Number(form.usageLimit) || 0,
        perUserLimit: Number(form.perUserLimit) || 1,
        validFrom: form.validFrom || undefined,
        validUntil: form.validUntil,
        appliesTo: form.appliesTo,
      });
      if (response.success) {
        toast.success("Coupon created successfully");
        setIsDialogOpen(false);
        setForm({
          code: "", description: "", discountType: "percentage", discountValue: "",
          minOrderAmount: "", maxDiscount: "", usageLimit: "", perUserLimit: "1",
          validFrom: "", validUntil: "", appliesTo: "all",
        });
        fetchCoupons();
      } else {
        toast.error(response.message || "Failed to create coupon");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (coupon: Coupon) => {
    try {
      const response = await apiService.put(`/coupons/${coupon._id}`, {
        isActive: !coupon.isActive,
      });
      if (response.success) {
        toast.success("Coupon updated");
        fetchCoupons();
      } else {
        toast.error(response.message || "Failed to update coupon");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(`Delete coupon "${coupon.code}"?`)) return;
    try {
      const response = await apiService.delete(`/coupons/${coupon._id}`);
      if (response.success) {
        toast.success("Coupon deleted");
        fetchCoupons();
      } else {
        toast.error(response.message || "Failed to delete coupon");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Copied ${code}`);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (    <RoleGuard allowedRoles={["admin", "moderator"]}>
      <div className="space-y-6" data-testid="coupons-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
            <p className="text-muted-foreground">
              Create and manage promo codes & discounts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchCoupons} className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
            <Button onClick={() => setIsDialogOpen(true)} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Create Coupon</span>
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading coupons...</p>
        ) : coupons.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <TicketPercent className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-foreground">
                  No coupons yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Create your first promo code to boost orders.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {coupons.map((coupon) => (
              <Card key={coupon._id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-soft-green rounded-full p-3">
                        <TicketPercent className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-foreground">
                            {coupon.code}
                          </h3>
                          <button
                            onClick={() => copy(coupon.code)}
                            className="text-gray-400 hover:text-primary"
                            aria-label="Copy code"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {coupon.discountValue}
                          {coupon.discountType === "percentage" ? "% off" : " BDT off"}
                          {coupon.minOrderAmount > 0 && ` on ${coupon.minOrderAmount}+`}
                        </p>
                      </div>
                    </div>
                    <Badge variant={coupon.isActive ? "default" : "secondary"}>
                      {coupon.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-1 text-sm">
                    {coupon.description && <p>{coupon.description}</p>}
                    <p>
                      <span className="font-medium">Valid:</span>{" "}
                      {new Date(coupon.validFrom).toLocaleDateString()} —{" "}
                      {new Date(coupon.validUntil).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="font-medium">Usage:</span>{" "}
                      {coupon.usedCount || 0}
                      {coupon.usageLimit > 0 && ` / ${coupon.usageLimit}`}
                      {coupon.usageLimit === 0 && " (unlimited)"}
                    </p>
                    <p>
                      <span className="font-medium">Applies to:</span>{" "}
                      {coupon.appliesTo || "all"}
                    </p>
                  </div>

                  <div className="mt-4 flex space-x-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => handleToggle(coupon)}>
                      {coupon.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600"
                      onClick={() => handleDelete(coupon)}
                    >
                      <Trash2 className="h-4 w-4" />
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
              <DialogTitle>Create Coupon</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Coupon Code *</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="CC-SAVE10"
                  />
                  <Button variant="outline" onClick={generateCode} type="button">
                    Generate
                  </Button>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What does this coupon do?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Discount Type</Label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                    className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-ring"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (BDT)</option>
                  </select>
                </div>
                <div>
                  <Label>Discount Value *</Label>
                  <Input
                    type="number"
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    placeholder={form.discountType === "percentage" ? "10" : "200"}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Min Order Amount</Label>
                  <Input
                    type="number"
                    value={form.minOrderAmount}
                    onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Max Discount Cap</Label>
                  <Input
                    type="number"
                    value={form.maxDiscount}
                    onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                    placeholder="0 = no cap"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Usage Limit</Label>
                  <Input
                    type="number"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    placeholder="0 = unlimited"
                  />
                </div>
                <div>
                  <Label>Per User Limit</Label>
                  <Input
                    type="number"
                    value={form.perUserLimit}
                    onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })}
                    placeholder="1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valid From</Label>
                  <Input
                    type="date"
                    value={form.validFrom}
                    onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Valid Until *</Label>
                  <Input
                    type="date"
                    value={form.validUntil}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Applies To</Label>
                <select
                  value={form.appliesTo}
                  onChange={(e) => setForm({ ...form, appliesTo: e.target.value })}
                  className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-ring"
                >
                  <option value="all">All orders</option>
                  <option value="first-order">First order only</option>
                  <option value="specific">Specific orders</option>
                </select>
              </div>
              <Button onClick={handleCreate} disabled={saving} className="w-full">
                {saving ? "Creating..." : "Create Coupon"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}