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
import { Textarea } from "@/components/ui/textarea";
import { RoleGuard } from "@/middleware/roleGuard";
import { apiService } from "@/services/apiService";
import { BadgePercent, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Offer = any;

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    offerType: "discount",
    percentage: "",
    modifier: "",
    affectedRates: "",
    validFrom: "",
    validUntil: "",
    targetUsers: "all",
  });

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const response = await apiService.get("/offers", { limit: 100 });
      if (response.success) {
        setOffers((response.data as Offer[]) || []);
      } else {
        toast.error(response.message || "Failed to fetch offers");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      toast.error("Name and description are required");
      return;
    }
    if (!form.validFrom || !form.validUntil) {
      toast.error("Valid from and valid until dates are required");
      return;
    }

    setSaving(true);
    try {
      const offerDetails =
        form.offerType === "discount"
          ? {
              type: "discount",
              percentage: Number(form.percentage) || 0,
            }
          : {
              type: "rate_modifier",
              modifier: Number(form.modifier) || 0,
              affectedRates: form.affectedRates
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            };

      const response = await apiService.post("/offers", {
        name: form.name,
        description: form.description,
        offerDetails,
        validFrom: form.validFrom,
        validUntil: form.validUntil,
        targetUsers: form.targetUsers,
      });
      if (response.success) {
        toast.success("Offer created successfully");
        setIsDialogOpen(false);
        setForm({
          name: "",
          description: "",
          offerType: "discount",
          percentage: "",
          modifier: "",
          affectedRates: "",
          validFrom: "",
          validUntil: "",
          targetUsers: "all",
        });
        fetchOffers();
      } else {
        toast.error(response.message || "Failed to create offer");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (offer: Offer) => {
    try {
      const response = await apiService.put(`/offers/${offer._id}`, {
        isActive: !offer.isActive,
      });
      if (response.success) {
        toast.success("Offer status updated");
        fetchOffers();
      } else {
        toast.error(response.message || "Failed to update offer");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const handleDelete = async (offer: Offer) => {
    if (!confirm(`Are you sure you want to delete "${offer.name}"?`)) return;
    try {
      const response = await apiService.delete(`/offers/${offer._id}`);
      if (response.success) {
        toast.success("Offer deleted successfully");
        fetchOffers();
      } else {
        toast.error(response.message || "Failed to delete offer");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  return (
    <RoleGuard allowedRoles={["admin", "moderator"]}>
      <div className="space-y-6" data-testid="offers-page">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Offers</h1>
            <p className="text-muted-foreground">
              Create and manage promotional offers and rate modifiers
            </p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center space-x-2"
            data-testid="create-offer-btn"
          >
            <Plus className="h-4 w-4" />
            <span>Create Offer</span>
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading offers...</p>
        ) : offers.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <BadgePercent className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-foreground">
                  No offers yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Create your first offer to start promoting discounts.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {offers.map((offer) => (
              <Card key={offer._id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {offer.name}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {offer.description}
                      </p>
                    </div>
                    <Badge
                      variant={offer.isActive ? "default" : "secondary"}
                    >
                      {offer.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Type:</span>{" "}
                      {offer.offerDetails?.type || "discount"}
                    </p>
                    {offer.offerDetails?.type === "discount" && (
                      <p>
                        <span className="font-medium">Discount:</span>{" "}
                        {offer.offerDetails.percentage}%
                      </p>
                    )}
                    {offer.offerDetails?.type === "rate_modifier" && (
                      <p>
                        <span className="font-medium">Modifier:</span>{" "}
                        {offer.offerDetails.modifier}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Valid:</span>{" "}
                      {new Date(offer.validFrom).toLocaleDateString()} —{" "}
                      {new Date(offer.validUntil).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="font-medium">Audience:</span>{" "}
                      {offer.targetUsers || "all"}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap space-x-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => handleToggleActive(offer)}
                      className="flex items-center space-x-2"
                    >
                      <BadgePercent className="h-4 w-4" />
                      <span>{offer.isActive ? "Deactivate" : "Activate"}</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center space-x-2 text-red-600"
                      onClick={() => handleDelete(offer)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Offer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. 10% Off First Shipment"
                />
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Describe the offer"
                />
              </div>
              <div>
                <Label>Offer Type</Label>
                <select
                  value={form.offerType}
                  onChange={(e) =>
                    setForm({ ...form, offerType: e.target.value })
                  }
                  className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-ring"
                >
                  <option value="discount">Discount</option>
                  <option value="rate_modifier">Rate Modifier</option>
                </select>
              </div>
              {form.offerType === "discount" && (
                <div>
                  <Label>Percentage (%)</Label>
                  <Input
                    type="number"
                    value={form.percentage}
                    onChange={(e) =>
                      setForm({ ...form, percentage: e.target.value })
                    }
                    placeholder="e.g. 10"
                  />
                </div>
              )}
              {form.offerType === "rate_modifier" && (
                <>
                  <div>
                    <Label>Modifier</Label>
                    <Input
                      type="number"
                      value={form.modifier}
                      onChange={(e) =>
                        setForm({ ...form, modifier: e.target.value })
                      }
                      placeholder="e.g. 1.2"
                    />
                  </div>
                  <div>
                    <Label>Affected Rates (comma separated)</Label>
                    <Input
                      value={form.affectedRates}
                      onChange={(e) =>
                        setForm({ ...form, affectedRates: e.target.value })
                      }
                      placeholder="e.g. express, standard"
                    />
                  </div>
                </>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Valid From *</Label>
                  <Input
                    type="date"
                    value={form.validFrom}
                    onChange={(e) =>
                      setForm({ ...form, validFrom: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Valid Until *</Label>
                  <Input
                    type="date"
                    value={form.validUntil}
                    onChange={(e) =>
                      setForm({ ...form, validUntil: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Target Users</Label>
                <select
                  value={form.targetUsers}
                  onChange={(e) =>
                    setForm({ ...form, targetUsers: e.target.value })
                  }
                  className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-ring"
                >
                  <option value="all">All users</option>
                  <option value="new">New users</option>
                  <option value="specific_group">Specific group</option>
                </select>
              </div>
              <Button
                onClick={handleCreate}
                disabled={saving}
                className="w-full flex items-center justify-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>{saving ? "Creating..." : "Create Offer"}</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}