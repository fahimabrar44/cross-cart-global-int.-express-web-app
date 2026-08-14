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
import { BookOpen, Copy, KeyRound, Plus, RefreshCw, Trash2, X } from "lucide-react";
import Link from "next/link";
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
  const [createdKey, setCreatedKey] = useState<string | null>(null);

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newKey = (response.data as any)?.apiKey;
        if (newKey) setCreatedKey(newKey);
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

  const handleRegenerate = async (config: ApiConfig) => {
    if (
      !confirm(
        `Regenerate the key for "${config.name}"? The previous key will stop working immediately.`
      )
    ) {
      return;
    }
    try {
      const response = await apiService.patch(
        `/accounts/${phone}/api-config/${config._id}`,
        {}
      );
      if (response.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newKey = (response.data as any)?.apiKey;
        if (newKey) setCreatedKey(newKey);
        toast.success("New API key generated");
        fetchConfigs();
      } else {
        toast.error(response.message || "Failed to regenerate API key");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              API Config & Access
            </h1>
            <p className="text-muted-foreground">
              Manage API keys and access for your account
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/api-integration">
              <Button variant="outline" className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>API Docs</span>
              </Button>
            </Link>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create Config</span>
            </Button>
          </div>
        </div>

        {createdKey && (
          <Card className="border-primary">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 min-w-0">
                  <p className="text-sm font-semibold text-primary">
                    Your new API key has been generated
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Copy it now. For security, this key is shown only once and
                    cannot be retrieved later.
                  </p>
                  <code className="block break-all rounded-md bg-muted px-3 py-2 font-mono text-sm">
                    {createdKey}
                  </code>
                </div>
                <div className="flex flex-col space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(createdKey);
                      toast.success("API key copied");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    <span className="ml-1">Copy</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCreatedKey(null)}
                  >
                    <X className="h-4 w-4" />
                    <span className="ml-1">Dismiss</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

                  <div className="mt-4 flex flex-wrap space-x-2 pt-4 border-t">
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
                      className="flex items-center space-x-2"
                      onClick={() => handleRegenerate(config)}
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Regenerate</span>
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
          <DialogContent className="w-full max-w-md">
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