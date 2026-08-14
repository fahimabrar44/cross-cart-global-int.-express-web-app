"use client";

import { createZoneColumns } from "@/components/zones/ZoneColumns";
import { ZoneForm } from "@/components/zones/ZoneForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/AuthContext";
import { ZoneFilters, zoneService } from "@/services/zoneService";
import { Zone, hasPermission } from "@/types";
import { Globe2, Layers, Loader2, MapPinned, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function ZonesPage() {
  const { user } = useAuth();
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

  // Filter and pagination
  const [filters, setFilters] = useState<ZoneFilters>({
    page: 1,
    limit: 10,
    sortBy: "name",
    sortOrder: "asc",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const loadZones = useCallback(async () => {
    try {
      setLoading(true);
      const response = await zoneService.getZones(filters);

      if (response.status == 200 && response.data) {
        setZones(Array.isArray(response.data) ? response.data : [response.data]);
        if (response.meta) {
          setPagination({
            page: response.meta.page || 1,
            limit: response.meta.limit || 10,
            total: response.meta.total || 0,
            totalPages: response.meta.totalPages || 0,
          });
        }
      }
    } catch (error) {
      console.error("Failed to load zones:", error);
      toast.error("Failed to load zones");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadZones();
  }, [loadZones]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCreateZone = async (data: any) => {
    try {
      setActionLoading(true);
      const response = await zoneService.createZone(data);

      if (response.status == 200) {
        toast.success("Zone created successfully");
        setIsCreateModalOpen(false);
        loadZones();
      }
    } catch (error) {
      console.error("Failed to create zone:", error);
      toast.error("Failed to create zone");
    } finally {
      setActionLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditZone = async (data: any) => {
    if (!selectedZone) return;

    try {
      setActionLoading(true);
      const response = await zoneService.updateZone(selectedZone._id, data);

      if (response.status == 200) {
        toast.success("Zone updated successfully");
        setIsEditModalOpen(false);
        setSelectedZone(null);
        loadZones();
      }
    } catch (error) {
      console.error("Failed to update zone:", error);
      toast.error("Failed to update zone");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteZone = async () => {
    if (!selectedZone) return;

    try {
      setActionLoading(true);
      const response = await zoneService.deleteZone(selectedZone._id);

      if (response.status == 200) {
        toast.success("Zone deleted successfully");
        setIsDeleteModalOpen(false);
        setSelectedZone(null);
        loadZones();
      }
    } catch (error) {
      console.error("Failed to delete zone:", error);
      toast.error("Failed to delete zone");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (zone: Zone) => {
    try {
      const response = await zoneService.toggleZoneStatus(zone._id, !zone.isActive);

      if (response.status == 200) {
        toast.success(`Zone ${!zone.isActive ? "activated" : "deactivated"} successfully`);
        loadZones();
      }
    } catch (error) {
      console.error("Failed to toggle zone status:", error);
      toast.error("Failed to toggle zone status");
    }
  };

  const handleViewZone = (zone: Zone) => {
    setSelectedZone(zone);
    setIsViewModalOpen(true);
  };

  const handleEditClick = (zone: Zone) => {
    setSelectedZone(zone);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (zone: Zone) => {
    setSelectedZone(zone);
    setIsDeleteModalOpen(true);
  };

  const handleSearch = (searchTerm: string) => {
    setFilters({ ...filters, search: searchTerm, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handleLimitChange = (limit: number) => {
    setFilters({ ...filters, limit, page: 1 });
  };

  const handleRefresh = () => {
    loadZones();
  };

  const activeCount = zones.filter((z) => z.isActive).length;
  const totalCountryLinks = zones.reduce(
    (sum, z) => sum + (Array.isArray(z.countryIds) ? z.countryIds.length : 0),
    0
  );

  const columns = createZoneColumns({
    userRole: user?.role || "user",
    onView: handleViewZone,
    onEdit: handleEditClick,
    onDelete: handleDeleteClick,
    onToggleStatus: handleToggleStatus,
  });

  if (!user) return null;

  return (
    <div className="space-y-6" data-testid="zones-page">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="zones-title">
            Zones
          </h1>
          <p className="text-muted-foreground">
            Group countries into shipping zones for rate calculations
          </p>
        </div>
      </div>

      {/* Stats Cards - Only for admin/moderator */}
      {user.role !== "user" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Zones</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="total-zones">
                {zones.length}
              </div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                Shipping zones
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Zones
              </CardTitle>
              <Globe2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="active-zones">
                {activeCount}
              </div>
              <p className="text-xs text-muted-foreground">
                {zones.length - activeCount} inactive
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Country Links
              </CardTitle>
              <MapPinned className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="total-country-links">
                {totalCountryLinks}
              </div>
              <p className="text-xs text-muted-foreground">
                Countries assigned to zones
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Zones Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Zones</CardTitle>
          <CardDescription>
            Manage shipping zones and their country groupings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={zones}
            loading={loading}
            searchPlaceholder="Search zones by name or code..."
            onSearch={handleSearch}
            onRefresh={handleRefresh}
            onCreateNew={
              hasPermission(user.role, "orders", "create")
                ? () => setIsCreateModalOpen(true)
                : undefined
            }
            showCreateNew={hasPermission(user.role, "orders", "create")}
            createNewLabel="Add Zone"
            emptyMessage="No zones found"
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

      {/* Create Zone Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Zone</DialogTitle>
            <DialogDescription>
              Create a shipping zone and group its countries
            </DialogDescription>
          </DialogHeader>
          <ZoneForm
            onSubmit={handleCreateZone}
            onCancel={() => setIsCreateModalOpen(false)}
            loading={actionLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Zone Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Zone</DialogTitle>
            <DialogDescription>
              Update zone information and country groupings
            </DialogDescription>
          </DialogHeader>
          {selectedZone && (
            <ZoneForm
              zone={selectedZone}
              onSubmit={handleEditZone}
              onCancel={() => {
                setIsEditModalOpen(false);
                setSelectedZone(null);
              }}
              loading={actionLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Zone Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="w-full max-w-2xl">
          <DialogHeader>
            <DialogTitle>Zone Details</DialogTitle>
          </DialogHeader>
          {selectedZone && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Globe2 className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="text-xl font-semibold">{selectedZone.name}</h3>
                  {selectedZone.code && (
                    <p className="text-muted-foreground">
                      Zone Code: {selectedZone.code}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">Status</h4>
                  <Badge
                    variant={selectedZone.isActive ? "default" : "secondary"}
                  >
                    {selectedZone.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold">Countries</h4>
                  <p>
                    {Array.isArray(selectedZone.countries)
                      ? selectedZone.countries.length
                      : Array.isArray(selectedZone.countryIds)
                      ? selectedZone.countryIds.length
                      : 0}{" "}
                    countries
                  </p>
                </div>
              </div>

              {Array.isArray(selectedZone.countries) &&
                selectedZone.countries.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Country List</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedZone.countries.map((c) => (
                        <Badge key={c._id} variant="secondary">
                          {c.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Zone</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this zone? This action cannot be
              undone. Rate charts using this zone may be affected.
              {selectedZone && (
                <div className="mt-2 p-2 bg-muted rounded">
                  <strong>Zone:</strong> {selectedZone.name}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteZone}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Zone"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
