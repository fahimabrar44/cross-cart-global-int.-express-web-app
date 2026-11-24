"use client";

import { createPriceColumns } from "@/components/prices/PriceColumns";
import { PriceForm } from "@/components/prices/PriceForm";
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
import { weightTierLabel } from "@/lib/weightTiers";
import { PriceFilters, priceService } from "@/services/priceService";
import { Country, PriceChart, Zone } from "@/types";
import {
  ArrowUpDown,
  DollarSign,
  Loader2,
  PowerOff,
  Route,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function RateChartsPage() {
  const { user } = useAuth();
  const [prices, setPrices] = useState<PriceChart[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<PriceChart | null>(null);

  // Filter and pagination
  const [filters, setFilters] = useState<PriceFilters>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    activeTotal: 0,
    totalPages: 0,
  });

  // Load prices
  const loadPrices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await priceService.getPrices(filters);

      if (response.status == 200 && response.data) {
        setPrices(
          Array.isArray(response.data) ? response.data : [response.data]
        );
        if (response.meta) {
          setPagination({
            page: response.meta.page || 1,
            limit: response.meta.limit || 10,
            total: response.meta.total || 0,
            activeTotal:
              typeof response.meta.activeTotal === "number"
                ? response.meta.activeTotal
                : response.data.filter((p) => p.isActive !== false).length,
            totalPages: response.meta.totalPages || 0,
          });
        }
      }
    } catch (error) {
      console.error("Failed to load price charts:", error);
      toast.error("Failed to load price charts");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadPrices();
  }, [loadPrices]);

  // CRUD handlers (unchanged; they call your priceService)
  {/*eslint-disable-next-line @typescript-eslint/no-explicit-any*/}
  const handleCreatePrice = async (data: any) => {
    try {
      setActionLoading(true);
      const response = await priceService.createPrice(data);

      if (response.status == 200) {
        setIsCreateModalOpen(false);
        loadPrices();
        toast.success("Price chart created successfully");
      }
    } catch (error) {
      console.error("Failed to create price chart:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create price chart"
      );
    } finally {
      setActionLoading(false);
    }
  };
{/*eslint-disable-next-line @typescript-eslint/no-explicit-any*/}
  const handleEditPrice = async (data: any) => {
    if (!selectedPrice?._id) return;

    try {
      setActionLoading(true);
      const response = await priceService.updatePrice(selectedPrice._id as string, data);

      if (response.status == 200) {
        toast.success("Price chart updated successfully");
        setIsEditModalOpen(false);
        setSelectedPrice(null);
        loadPrices();
      }
    } catch (error) {
      console.error("Failed to update price chart:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update price chart"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePrice = async () => {
    if (!selectedPrice?._id) return;

    try {
      setActionLoading(true);
      const response = await priceService.deletePrice(selectedPrice._id as string);

      if (response.status == 200) {
        toast.success("Price chart deleted successfully");
        setIsDeleteModalOpen(false);
        setSelectedPrice(null);
        loadPrices();
      }
    } catch (error) {
      console.error("Failed to delete price chart:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete price chart"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (price: PriceChart) => {
    if (!price._id) return;

    try {
      const response = await priceService.togglePriceStatus(
        price._id,
        price.isActive === false
      );

      if (response.status == 200) {
        toast.success(
          `Price chart ${
            price.isActive === false ? "activated" : "deactivated"
          } successfully`
        );
        loadPrices();
      }
    } catch (error) {
      console.error("Failed to toggle price status:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to toggle price status"
      );
    }
  };

  // Event handlers
  const handleViewPrice = (price: PriceChart) => {
    setSelectedPrice(price);
    setIsViewModalOpen(true);
  };

  const handleEditClick = (price: PriceChart) => {
    setSelectedPrice(price);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (price: PriceChart) => {
    setSelectedPrice(price);
    setIsDeleteModalOpen(true);
  };

  const handleSearch = (searchTerm: string) => {
    setFilters((prev) => ({ ...prev, search: searchTerm, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setFilters((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleRefresh = () => {
    loadPrices();
  };


  const columns = createPriceColumns({
    userRole: user?.role || "user",
    onView: handleViewPrice,
    onEdit: handleEditClick,
    onDelete: handleDeleteClick,
    onToggleStatus: handleToggleStatus,
  });

  const isAdminView = user?.role === "admin" || user?.role === "moderator";
  // helper to safely compute average of min final price per route
  const computeAvgMinBasePrice = () => {
    if (!prices || prices.length === 0) return "0.00";
    // Only routes that actually have a configured price count towards the
    // average; an empty route must not drag it down to $0.
    const routeMins = prices
      .map((p) => {
        const allPrices: number[] = (p.rate || []).flatMap((r) => {
          const vals = Object.values(r.price || {}).filter(
            (v): v is number => typeof v === "number" && v > 0
          );
          if (!vals.length) return [];
          if (isAdminView) {
            return vals.map((v) =>
              Number(
                v *
                  (1 + (r.fuel || 0) / 100) *
                  (1 + (r.profitPercentage || 0) / 100)
              )
            );
          }
          return vals;
        });
        return allPrices.length ? Math.min(...allPrices) : null;
      })
      .filter((v): v is number => v !== null);

    if (routeMins.length === 0) return "0.00";
    return (
      routeMins.reduce((sum, v) => sum + v, 0) / routeMins.length
    ).toFixed(2);
  };

  if (!user) return null;

  return (
    <div className="space-y-6" data-testid="rate-charts-page">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="rate-charts-title">
            Rate Charts
          </h1>
          <p className="text-muted-foreground">
            Manage shipping rates and pricing configurations
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Routes</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="total-routes">
              {pagination.total}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              Configured routes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Routes</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold text-green-600"
              data-testid="active-routes"
            >
              {pagination.activeTotal}
            </div>
            <p className="text-xs text-muted-foreground">
              Visible in the public calculator
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Routes</CardTitle>
            <PowerOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="inactive-routes">
              {Math.max(0, pagination.total - pagination.activeTotal)}
            </div>
            <p className="text-xs text-muted-foreground">
              Hidden from public pricing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Starting Price
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="avg-base-price">
              ${computeAvgMinBasePrice()}
            </div>
            <p className="text-xs text-muted-foreground">
              Lowest final price on this page
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Price Charts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Price Charts</CardTitle>
          <CardDescription>
            Configure shipping rates for different routes and service types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={prices}
            loading={loading}
            searchPlaceholder="Search by route, service type, or country..."
            onSearch={handleSearch}
            onRefresh={handleRefresh}
            onCreateNew={
              (user.role === "admin" || user.role === "moderator")
                ? () => setIsCreateModalOpen(true)
                : undefined
            }
            showCreateNew={(user.role === "admin" || user.role === "moderator")}
            createNewLabel="Create Price Chart"
            emptyMessage="No price charts found"
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

      {/* Create Price Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="create-price-modal-title">
              Create New Price Chart
            </DialogTitle>
            <DialogDescription>
              Set up pricing for a specific shipping route and service type
            </DialogDescription>
          </DialogHeader>
          <PriceForm
            onSubmit={handleCreatePrice}
            onCancel={() => setIsCreateModalOpen(false)}
            loading={actionLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Price Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="edit-price-modal-title">
              Edit Price Chart
            </DialogTitle>
            <DialogDescription>
              Update pricing information and weight tiers
            </DialogDescription>
          </DialogHeader>
          {selectedPrice && (
            <PriceForm
              price={selectedPrice}
              onSubmit={handleEditPrice}
              onCancel={() => {
                setIsEditModalOpen(false);
                setSelectedPrice(null);
              }}
              loading={actionLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Price Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="view-price-modal-title">
              Price Chart Details
            </DialogTitle>
          </DialogHeader>

          {selectedPrice && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">
                    {(typeof selectedPrice.from === "object" ? (selectedPrice.from as Country).name : selectedPrice.from) as string} →{" "}
                    {(typeof selectedPrice.to === "object" ? (selectedPrice.to as Zone).name : selectedPrice.to) as string}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={selectedPrice?.isActive !== false ? "default" : "secondary"}>
                      {selectedPrice?.isActive !== false ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Render rate-wise prices (from API response) */}
              <div>
                <h4 className="font-semibold mb-3">Rates</h4>
                <div className="space-y-4">{/*eslint-disable-next-line @typescript-eslint/no-explicit-any*/}
                  {(selectedPrice.rate || []).map((r: any, idx: number) => (
                    <div key={idx} className="p-3 bg-muted rounded">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{r.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Profit: {r.profitPercentage ?? 0}% • Gift:{" "}
                          {r.gift ?? 0} • Fuel: {r.fuel ?? 0}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        {Object.entries(r.price || {}).map(([k, v]) => (
                          <div
                            key={k}
                            className="p-2 bg-white/5 rounded flex items-center justify-between"
                          >
                            <div className="truncate">{weightTierLabel(k)}</div>
                            <div className="font-medium">
                              ${" "}
                              {isAdminView
                                ? Number(
                                    (Number(v) || 0) *
                                      (1 + (r.fuel || 0) / 100) *
                                      (1 + (r.profitPercentage || 0) / 100)
                                  ).toFixed(3)
                                : (Number(v) || 0).toFixed(3)}
                            </div>
                          </div>
                        ))}
                      </div>
                      {r.serviceDetails && r.serviceDetails.filter(Boolean).length > 0 && (
                        <ul className="mt-3 space-y-1 text-xs text-muted-foreground list-disc pl-5">
                          {r.serviceDetails.filter(Boolean).map((d: string, di: number) => (
                            <li key={di}>{d}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle data-testid="delete-price-modal-title">
              Delete Price Chart
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this price chart? This action
              cannot be undone. Orders using this pricing configuration may be
              affected.
              {selectedPrice && (
                <div className="mt-2 p-2 bg-muted rounded">
                  <strong>Route:</strong> {(typeof selectedPrice.from === "object" ? (selectedPrice.from as Country).name : selectedPrice.from) as string} →{" "}
                  {(typeof selectedPrice.to === "object" ? (selectedPrice.to as Zone).name : selectedPrice.to) as string}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete-price-btn">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePrice}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="confirm-delete-price-btn"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Price Chart"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
