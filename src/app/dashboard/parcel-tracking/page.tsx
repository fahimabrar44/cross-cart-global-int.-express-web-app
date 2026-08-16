"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/AuthContext";
import { hasPermission } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  Filter,
  Loader2,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Updated Track interface to match the API response
interface Track {
  _id: string;
  order: {
    _id: string;
    trackId: string;
    parcel: {
      from: string;
      to: string;
      sender: {
        name: string;
        phone: string;
        email: string;
        address: {
          address: string;
          city: string;
          zipCode: string;
          country: string;
        };
      };
      receiver: {
        name: string;
        phone: string;
        email: string;
        address: {
          address: string;
          city: string;
          zipCode: string;
          country: string;
        };
      };
      weight: string;
      serviceType: string;
      priority: string;
      orderType: string;
      item: Array<{
        name: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
      }>;
      customerNote: string;
    };
    orderDate: string;
    payment: {
      pType: string;
      pAmount: number;
      pOfferDiscount: number;
      pExtraCharge: number;
      pDiscount: number;
      pReceived: number;
      pRefunded: number;
    };
    handover_by: {
      company: string;
      tracking: string;
      payment: number;
    };
    createdAt: string;
    updatedAt: string;
  };
  currentStatus: string;
  history: {
    status: string;
    description: string;
    location: {
      city: string;
      country: string;
    };
    updatedBy: string | null;
    timestamp: string;
  }[];
  estimatedDelivery: string | null;
  trackId: string;
  createdAt: string;
  updatedAt: string;
}

interface TrackFilters {
  trackId?: string;
  currentStatus?: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: string;
  search?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Updated status options to match backend
const statusOptions = [
  "created",
  "pickup-pending",
  "picked-up",
  "in-transit",
  "arrived-at-hub",
  "customs-clearance",
  "out-for-delivery",
  "delivered",
  "failed",
  "cancelled",
  "returned",
];

const statusColors: Record<string, string> = {
  created: "bg-gray-100 text-gray-800",
  "pickup-pending": "bg-blue-100 text-blue-800",
  "picked-up": "bg-indigo-100 text-indigo-800",
  "in-transit": "bg-yellow-100 text-yellow-800",
  "arrived-at-hub": "bg-orange-100 text-orange-800",
  "customs-clearance": "bg-purple-100 text-purple-800",
  "out-for-delivery": "bg-pink-100 text-pink-800",
  delivered: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-red-100 text-red-800",
  returned: "bg-red-100 text-red-800",
};

const statusIcons: Record<string, React.ReactNode> = {
  created: <Clock className="h-4 w-4" />,
  "pickup-pending": <Loader2 className="h-4 w-4" />,
  "picked-up": <Package className="h-4 w-4" />,
  "in-transit": <Package className="h-4 w-4" />,
  "arrived-at-hub": <MapPin className="h-4 w-4" />,
  "customs-clearance": <AlertCircle className="h-4 w-4" />,
  "out-for-delivery": <MapPin className="h-4 w-4" />,
  delivered: <CheckCircle className="h-4 w-4" />,
  failed: <AlertCircle className="h-4 w-4" />,
  cancelled: <AlertCircle className="h-4 w-4" />,
  returned: <AlertCircle className="h-4 w-4" />,
};

export default function ParcelTrackingPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Regular users should not access the parcel-tracking management panel
  useEffect(() => {
    if (user?.role === "user") {
      router.replace("/dashboard");
    }
  }, [user, router]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddHistoryModalOpen, setIsAddHistoryModalOpen] = useState(false);

  // Form states
  const [filters, setFilters] = useState<TrackFilters>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [newTrack, setNewTrack] = useState({
    order: "",
    currentStatus: "created",
    estimatedDelivery: "",
  });
  const [updateTrack, setUpdateTrack] = useState({
    currentStatus: "",
    description: "",
    location: {
      city: "",
      country: "",
    },
    timestamp: new Date().toISOString().slice(0, 16),
  });

  // Check permissions
  
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const canCreateTrack = hasPermission(user?.role || "user","tracks","create");
  
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const canUpdateTrack = hasPermission(user?.role || "user","tracks","update");
  
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const canDeleteTrack = hasPermission(user?.role || "user","tracks","delete");

  // Load tracks
  const loadTracks = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          queryParams.append(key, String(value));
        }
      });

      const response = await fetch(`/api/v1/tracks?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        setTracks(result.data || []);
        if (result.meta) {
          setPagination(result.meta);
        }
      } else {
        toast.error(result.message || "Failed to load tracks");
      }
    } catch (error) {
      console.error("Failed to load tracks:", error);
      toast.error("Failed to load tracks");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  // Handle view track
  const handleViewTrack = (track: Track) => {
    setSelectedTrack(track);
    setIsViewModalOpen(true);
  };

  // Handle create track
  const handleCreateTrack = async () => {
    if (!newTrack.order) {
      toast.error("Order is required");
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch("/api/v1/tracks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          ...newTrack,
          order: newTrack.order, // Just send the order ID as a string
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Track created successfully");
        setIsCreateModalOpen(false);
        setNewTrack({
          order: "",
          currentStatus: "created",
          estimatedDelivery: "",
        });
        loadTracks();
      } else {
        toast.error(result.message || "Failed to create track");
      }
    } catch (error) {
      console.error("Failed to create track:", error);
      toast.error("Failed to create track");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle update track
  const handleUpdateTrack = async () => {
    if (!selectedTrack) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/v1/tracks/${selectedTrack.trackId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          currentStatus: updateTrack.currentStatus,
          description: updateTrack.description,
          location: updateTrack.location,
          updatedBy: null,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Track updated successfully");
        setIsAddHistoryModalOpen(false);
        setSelectedTrack(null);
        setUpdateTrack({
          currentStatus: "",
          description: "",
          location: {
            city: "",
            country: "",
          },
          timestamp: new Date().toISOString().slice(0, 16),
        });
        loadTracks();
      } else {
        toast.error(result.message || "Failed to update track");
      }
    } catch (error) {
      console.error("Failed to update track:", error);
      toast.error("Failed to update track");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete track
  const handleDeleteTrack = async () => {
    if (!selectedTrack) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/v1/tracks/${selectedTrack.trackId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Track deleted successfully");
        setIsDeleteModalOpen(false);
        setSelectedTrack(null);
        loadTracks();
      } else {
        toast.error(result.message || "Failed to delete track");
      }
    } catch (error) {
      console.error("Failed to delete track:", error);
      toast.error("Failed to delete track");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle add history
  const handleAddHistory = (track: Track) => {
    setSelectedTrack(track);
    setUpdateTrack({
      currentStatus: track.currentStatus,
      description: "",
      location: {
        city: "",
        country: "",
      },
      timestamp: new Date().toISOString().slice(0, 16),
    });
    setIsAddHistoryModalOpen(true);
  };

  // Handle sync tracking from carrier API
  const handleSyncTracking = async (track: Track) => {
    try {
      setActionLoading(true);
      const response = await fetch(
        `/api/v1/tracks/${track.trackId}/sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({
            carrier: track.order?.handover_by?.company || "",
            trackingNumber: track.order?.handover_by?.tracking || "",
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || "Tracking synced successfully");
        loadTracks();
      } else {
        toast.error(result.message || "Failed to sync tracking");
      }
    } catch (error) {
      console.error("Failed to sync tracking:", error);
      toast.error("Failed to sync tracking");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle search
  const handleSearch = (searchTerm: string) => {
    setFilters({ ...filters, search: searchTerm, page: 1 });
  };

  // Handle filter change
  const handleFilterChange = (key: string, value: string) => {
    // Convert "all" back to empty string for the API
    const apiValue = value === "all" ? "" : value;
    setFilters({ ...filters, [key]: apiValue, page: 1 });
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  // Handle limit change
  const handleLimitChange = (limit: number) => {
    setFilters({ ...filters, limit, page: 1 });
  };

  // Format date - improved version
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  // Table columns
  const columns: ColumnDef<Track>[] = [
    {
      header: "Track ID",
      accessorKey: "trackId",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.trackId || "N/A"}</div>
      ),
    },
    {
      header: "Route",
      accessorKey: "route",
      cell: ({ row }) => {
        // Safely access nested properties with optional chaining
        const senderCity =
          row.original.order?.parcel?.sender?.address?.city || "N/A";
        const receiverCity =
          row.original.order?.parcel?.receiver?.address?.city || "N/A";
        return (
          <div className="text-sm">
            {senderCity} → {receiverCity}
          </div>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "currentStatus",
      cell: ({ row }) => (
        <Badge
          className={
            statusColors[row.original.currentStatus] ||
            "bg-gray-100 text-gray-800"
          }
        >
          <span className="mr-1">
            {statusIcons[row.original.currentStatus]}
          </span>
          {row.original.currentStatus
            ? row.original.currentStatus.replace(/-/g, " ")
            : "N/A"}
        </Badge>
      ),
    },
    {
      header: "Est. Delivery",
      accessorKey: "estimatedDelivery",
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.estimatedDelivery
            ? new Date(row.original.estimatedDelivery).toLocaleDateString()
            : "Not set"}
        </div>
      ),
    },
    {
      header: "Last Updated",
      accessorKey: "updatedAt",
      cell: ({ row }) => (
        <div className="text-sm">{formatDate(row.original.updatedAt)}</div>
      ),
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewTrack(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {canUpdateTrack && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddHistory(row.original)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSyncTracking(row.original)}
            disabled={actionLoading}
            title="Sync from carrier tracking API"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          {canDeleteTrack && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedTrack(row.original);
                setIsDeleteModalOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (!user) return null;

  return (
    <div className="space-y-6" data-testid="parcel-tracking-page">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="tracking-title">
            Parcel Tracking
          </h1>
          <p className="text-muted-foreground">
            Track and manage shipment status
          </p>
        </div>
        <div className="flex flex-wrap items-center space-x-2">
          {canCreateTrack && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              data-testid="create-track-btn"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Track
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={loadTracks}
            disabled={loading}
            data-testid="refresh-tracks-btn"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="trackId">Track ID</Label>
              <Input
                id="trackId"
                placeholder="Enter track ID"
                value={filters.trackId || ""}
                onChange={(e) => handleFilterChange("trackId", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="currentStatus">Status</Label>
              <Select
                value={filters.currentStatus || "all"}
                onValueChange={(value) =>
                  handleFilterChange("currentStatus", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/-/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sortBy">Sort By</Label>
              <Select
                value={filters.sortBy || "createdAt"}
                onValueChange={(value) => handleFilterChange("sortBy", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="updatedAt">Updated Date</SelectItem>
                  <SelectItem value="currentStatus">Status</SelectItem>
                  <SelectItem value="trackId">Track ID</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Select
                value={filters.sortOrder || "desc"}
                onValueChange={(value) =>
                  handleFilterChange("sortOrder", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tracks Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Tracks</CardTitle>
          <CardDescription>
            View and manage parcel tracking information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={tracks}
            loading={loading}
            searchPlaceholder="Search tracks by description..."
            onSearch={handleSearch}
            pagination={{
              page: pagination.page,
              limit: pagination.limit,
              total: pagination.total,
              onPageChange: handlePageChange,
              onLimitChange: handleLimitChange,
            }}
          />
        </CardContent>
      </Card>

      {/* View Track Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="view-track-modal-title">
              Track Details
            </DialogTitle>
            <DialogDescription>
              {selectedTrack && (
                <span>Track ID: {selectedTrack.trackId || "N/A"}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedTrack && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Shipment Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Track ID:
                      </span>
                      <span>{selectedTrack.trackId || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Route:
                      </span>
                      <span>
                        {selectedTrack.order?.parcel?.sender?.address?.city ||
                          "N/A"}{" "}
                        →{" "}
                        {selectedTrack.order?.parcel?.receiver?.address?.city ||
                          "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Current Status:
                      </span>
                      <Badge
                        className={
                          statusColors[selectedTrack.currentStatus] ||
                          "bg-gray-100 text-gray-800"
                        }
                      >
                        <span className="mr-1">
                          {statusIcons[selectedTrack.currentStatus]}
                        </span>
                        {selectedTrack.currentStatus
                          ? selectedTrack.currentStatus.replace(/-/g, " ")
                          : "N/A"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Est. Delivery:
                      </span>
                      <span>
                        {selectedTrack.estimatedDelivery
                          ? new Date(
                              selectedTrack.estimatedDelivery
                            ).toLocaleDateString()
                          : "Not set"}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Timestamps</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Created:
                      </span>
                      <span>{formatDate(selectedTrack.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Last Updated:
                      </span>
                      <span>{formatDate(selectedTrack.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Tracking History</h3>
                <div className="space-y-4">
                  {selectedTrack.history && selectedTrack.history.length > 0 ? (
                    selectedTrack.history.map((step, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-4 p-4 border rounded-lg"
                      >
                        <div className="flex-shrink-0 mt-1">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              statusColors[step.status] ||
                              "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {statusIcons[step.status]}
                          </div>
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">
                              {step.status
                                ? step.status.replace(/-/g, " ")
                                : "N/A"}
                            </h4>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(step.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm mt-1">
                            {step.description || "No description"}
                          </p>
                          {step.location && (
                            <div className="flex items-center mt-2 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3 mr-1" />
                              {step.location.city || "N/A"},{" "}
                              {step.location.country || "N/A"}
                            </div>
                          )}
                          {step.updatedBy && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Updated by: {step.updatedBy}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No tracking history available
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Track Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="w-full max-w-md">
          <DialogHeader>
            <DialogTitle data-testid="create-track-modal-title">
              Create New Track
            </DialogTitle>
            <DialogDescription>
              Create a new tracking entry for an order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="order">Order ID</Label>
              <Input
                id="order"
                placeholder="Enter order ID"
                value={newTrack.order}
                onChange={(e) =>
                  setNewTrack({ ...newTrack, order: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="currentStatus">Initial Status</Label>
              <Select
                value={newTrack.currentStatus}
                onValueChange={(value) =>
                  setNewTrack({ ...newTrack, currentStatus: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/-/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="estimatedDelivery">Estimated Delivery</Label>
              <Input
                id="estimatedDelivery"
                type="date"
                value={newTrack.estimatedDelivery}
                onChange={(e) =>
                  setNewTrack({
                    ...newTrack,
                    estimatedDelivery: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTrack}
              disabled={actionLoading || !newTrack.order}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Track"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add History Modal */}
      <Dialog
        open={isAddHistoryModalOpen}
        onOpenChange={setIsAddHistoryModalOpen}
      >
        <DialogContent className="w-full max-w-md">
          <DialogHeader>
            <DialogTitle data-testid="add-history-modal-title">
              Add Tracking History
            </DialogTitle>
            <DialogDescription>
              Add a new status update to the tracking history
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="currentStatus">Status</Label>
              <Select
                value={updateTrack.currentStatus}
                onValueChange={(value) =>
                  setUpdateTrack({ ...updateTrack, currentStatus: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/-/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter status description"
                value={updateTrack.description}
                onChange={(e) =>
                  setUpdateTrack({
                    ...updateTrack,
                    description: e.target.value,
                  })
                }
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="City"
                  value={updateTrack.location.city}
                  onChange={(e) =>
                    setUpdateTrack({
                      ...updateTrack,
                      location: {
                        ...updateTrack.location,
                        city: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  placeholder="Country"
                  value={updateTrack.location.country}
                  onChange={(e) =>
                    setUpdateTrack({
                      ...updateTrack,
                      location: {
                        ...updateTrack.location,
                        country: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="timestamp">Timestamp</Label>
              <Input
                id="timestamp"
                type="datetime-local"
                value={updateTrack.timestamp}
                onChange={(e) =>
                  setUpdateTrack({ ...updateTrack, timestamp: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddHistoryModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateTrack}
              disabled={
                actionLoading ||
                !updateTrack.currentStatus ||
                !updateTrack.description
              }
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Add History"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle data-testid="delete-track-modal-title">
              Delete Track
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this track? This action cannot be
              undone.
              {selectedTrack && (
                <div className="mt-2 p-2 bg-muted rounded">
                  <strong>Track ID:</strong> {selectedTrack.trackId || "N/A"}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTrack}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Track"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
