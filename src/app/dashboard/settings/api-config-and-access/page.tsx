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
import { useAuth } from "@/hooks/AuthContext";
import { RoleGuard } from "@/middleware/roleGuard";
import { apiService } from "@/services/apiService";
import { Copy, KeyRound, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiConfig = any;

export default function ApiConfigPage() {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<ApiConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");

  const phone = user?.phone || "";

  const fetchConfigs = async () => {
    if (!phone) return;
    try {
      setLoading(true);
      const response = await apiService.get(`/accounts/${phone}/api-config`);
      if (response.success) {
        setConfigs((response.data as ApiConfig[]) || []);
      } else {
        toast.error(response.message || "Failed to fetch API configs");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (phone) fetchConfigs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Config name is required");
      return;
    }
    setSaving(true);
    try {
      const response = await apiService.post(`/accounts/${phone}/api-config`, {
        name: name.trim(),
      });
      if (response.success) {
        toast.success("API config created successfully");
        setIsDialogOpen(false);
        setName("");
        fetchConfigs();
      } else {
        toast.error(response.message || "Failed to create API config");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (config: ApiConfig) => {
    if (!confirm(`Are you sure you want to delete "${config.name}"?`)) return;
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `/api/v1/accounts/${phone}/api-config`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ configId: config._id }),
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success("API config deleted successfully");
        fetchConfigs();
      } else {
        toast.error(data.message || "Failed to delete API config");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  return (
    <RoleGuard allowedRoles={["admin", "moderator", "user"]}>
      <div className="space-y-6" data-testid="api-config-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              API Config & Access
            </h1>
            <p className="text-muted-foreground">
              Manage API keys and access for your account
            </p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Config</span>
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading API configs...</p>
        ) : configs.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <KeyRound className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-foreground">
                  No API configs yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Create an API config to generate access keys for integrations.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {configs.map((config) => (
              <Card key={config._id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {config.name}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {config.apiKey || "Key hidden for security"}
                      </p>
                    </div>
                    <Badge variant={config.isActive ? "default" : "secondary"}>
                      {config.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Scopes:</span>{" "}
                      {(config.scopes || ["read"]).join(", ")}
                    </p>
                    <p>
                      <span className="font-medium">Rate limit:</span>{" "}
                      {config.rateLimit?.maxRequests || 60} req /{" "}
                      {((config.rateLimit?.windowMs || 60000) / 60000).toFixed(0)}{" "}
                      min
                    </p>
                    {config.expiresAt && (
                      <p>
                        <span className="font-medium">Expires:</span>{" "}
                        {new Date(config.expiresAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex space-x-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      className="flex items-center space-x-2"
                      onClick={() => {
                        if (config.apiKey) {
                          navigator.clipboard.writeText(config.apiKey);
                          toast.success("API key copied");
                        }
                      }}
                    >
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center space-x-2 text-red-600"
                      onClick={() => handleDelete(config)}
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create API Config</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Config Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. My Integration"
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={saving}
                className="w-full flex items-center justify-center space-x-2"
              >
                <KeyRound className="h-4 w-4" />
                <span>{saving ? "Creating..." : "Create Config"}</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}