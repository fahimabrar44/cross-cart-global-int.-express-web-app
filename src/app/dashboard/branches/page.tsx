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
import { Network, Plus, Trash2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Branch = any;

const typeColor: Record<string, string> = {
  head: "bg-purple-100 text-purple-700",
  branch: "bg-blue-100 text-blue-700",
  hub: "bg-teal-100 text-teal-700",
};

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    code: "",
    type: "branch",
    address: "",
    city: "",
    phone: "",
    manager: "",
    managerPhone: "",
    openingHours: "9:00 AM - 6:00 PM",
    coverageText: "",
  });

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await apiService.get("/branches", { limit: 200 });
      if (response.success) {
        setBranches((response.data as Branch[]) || []);
      } else {
        toast.error(response.message || "Failed to fetch branches");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.code.trim() || !form.address.trim() || !form.city.trim() || !form.phone.trim()) {
      toast.error("Name, code, address, city and phone are required");
      return;
    }
    setSaving(true);
    try {
      const coverage = form.coverageText
        .split("\n")
        .map((line) => {
          const [area, charge, days] = line.split(",").map((s) => s.trim());
          if (!area) return null;
          return { name: area, city: form.city, area, isCovered: true, deliveryCharge: Number(charge) || 0, estimatedDays: days || "" };
        })
        .filter(Boolean);

      const response = await apiService.post("/branches", {
        name: form.name,
        code: form.code,
        type: form.type,
        address: form.address,
        city: form.city,
        phone: form.phone,
        manager: form.manager,
        managerPhone: form.managerPhone,
        openingHours: form.openingHours,
        coverage,
      });
      if (response.success) {
        toast.success("Branch created successfully");
        setIsDialogOpen(false);
        setForm({
          name: "", code: "", type: "branch", address: "", city: "",
          phone: "", manager: "", managerPhone: "", openingHours: "9:00 AM - 6:00 PM", coverageText: "",
        });
        fetchBranches();
      } else {
        toast.error(response.message || "Failed to create branch");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (branch: Branch) => {
    try {
      const response = await apiService.put(`/branches/${branch._id}`, {
        isActive: !branch.isActive,
      });
      if (response.success) {
        toast.success("Branch status updated");
        fetchBranches();
      } else {
        toast.error(response.message || "Failed to update branch");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const handleDelete = async (branch: Branch) => {
    if (!confirm(`Delete branch "${branch.name}"?`)) return;
    try {
      const response = await apiService.delete(`/branches/${branch._id}`);
      if (response.success) {
        toast.success("Branch deleted");
        fetchBranches();
      } else {
        toast.error(response.message || "Failed to delete branch");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  return (
    <RoleGuard allowedRoles={["admin", "moderator"]}>
      <div className="space-y-6" data-testid="branches-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Branches & Coverage</h1>
            <p className="text-muted-foreground">
              Manage branches, hubs and coverage zones
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchBranches} className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
            <Button onClick={() => setIsDialogOpen(true)} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Branch</span>
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading branches...</p>
        ) : branches.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Network className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-foreground">
                  No branches yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Add your first branch or hub to define delivery coverage.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {branches.map((branch) => (
              <Card key={branch._id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-soft-green rounded-full p-3">
                        <Network className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {branch.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {branch.code} · {branch.city}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={typeColor[branch.type] || ""}>
                        {branch.type}
                      </Badge>
                      <Badge variant={branch.isActive ? "default" : "secondary"}>
                        {branch.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Address:</span> {branch.address}
                    </p>
                    <p>
                      <span className="font-medium">Phone:</span> {branch.phone}
                    </p>
                    {branch.manager && (
                      <p>
                        <span className="font-medium">Manager:</span> {branch.manager}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Hours:</span> {branch.openingHours}
                    </p>
                    {branch.coverage && branch.coverage.length > 0 && (
                      <p>
                        <span className="font-medium">Coverage:</span>{" "}
                        {branch.coverage.length} zone(s)
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex space-x-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => handleToggleActive(branch)}>
                      {branch.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600"
                      onClick={() => handleDelete(branch)}
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
              <DialogTitle>Add Branch / Hub</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dhaka Main Office" />
                </div>
                <div>
                  <Label>Code *</Label>
                  <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="DAC-01" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-ring">
                    <option value="head">Head Office</option>
                    <option value="branch">Branch</option>
                    <option value="hub">Hub</option>
                  </select>
                </div>
                <div>
                  <Label>City *</Label>
                  <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Dhaka" />
                </div>
              </div>
              <div>
                <Label>Address *</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street address" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phone *</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+8801XXXXXXXXX" />
                </div>
                <div>
                  <Label>Opening Hours</Label>
                  <Input value={form.openingHours} onChange={(e) => setForm({ ...form, openingHours: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Manager</Label>
                  <Input value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} />
                </div>
                <div>
                  <Label>Manager Phone</Label>
                  <Input value={form.managerPhone} onChange={(e) => setForm({ ...form, managerPhone: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Coverage Zones (one per line: area, delivery charge, days)</Label>
                <Textarea value={form.coverageText} onChange={(e) => setForm({ ...form, coverageText: e.target.value })} placeholder={"Mirpur, 120, 1-2 days\nDhanmondi, 150, 1-2 days"} rows={4} />
              </div>
              <Button onClick={handleCreate} disabled={saving} className="w-full">
                {saving ? "Creating..." : "Create Branch"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}