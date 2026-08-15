"use client";

import { createAddressColumns } from "@/components/addresses/AddressColumns";
import { AddressForm } from "@/components/addresses/AddressForm";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/AuthContext";
import { AddressFilters, addressService } from "@/services/addressService";
import { UserService } from "@/services/dashboardService";
import { hasPermission } from "@/types";
import {
  Building,
  Globe,
  Loader2,
  MapPin,
  TrendingUp,
  Users
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function AddressBookPage() {
  const { user } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  // Filter and pagination
  const [filters, setFilters] = useState<AddressFilters>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Load addresses
  const loadAddresses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await addressService.getAllAddresses(filters);

      if (response.status == 200 && response.data) {
        setAddresses(
          Array.isArray(response.data) ? response.data : [response.data]
        );
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
      console.error("Failed to load addresses:", error);
      toast.error("Failed to load addresses");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  // Event handlers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleViewAddress = (address: any) => {
    setSelectedAddress(address);
    setIsViewModalOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditClick = (address: any) => {
    setSelectedAddress(address);
    setIsEditModalOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDeleteClick = (address: any) => {
    setSelectedAddress(address);
    setIsDeleteModalOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSetDefault = async (address: any) => {
    try {
      const response = await addressService.updateGlobalAddress(address._id, {
        isDefault: true,
      });
      if (response.status == 200) {
        toast.success("Default address updated");
        loadAddresses();
      } else {
        toast.error(response.message || "Failed to set default");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to set default address"
      );
    }
  };

  const handleCreateNew = async () => {
    setSelectedUserId("");
    setIsCreateModalOpen(true);
    try {
      const response = await UserService.getUsers({ limit: 100 });
      if (response.status == 200 && response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCreateSubmit = async (data: any) => {
    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }
    setActionLoading(true);
    try {
      const response = await addressService.createGlobalAddress({
        userId: selectedUserId,
        ...data,
      });
      if (response.status == 200) {
        toast.success("Address created successfully");
        setIsCreateModalOpen(false);
        loadAddresses();
      } else {
        toast.error(response.message || "Failed to create address");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create address"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditSubmit = async (data: any) => {
    if (!selectedAddress) return;
    setActionLoading(true);
    try {
      const response = await addressService.updateGlobalAddress(
        selectedAddress._id,
        data
      );
      if (response.status == 200) {
        toast.success("Address updated successfully");
        setIsEditModalOpen(false);
        setSelectedAddress(null);
        loadAddresses();
      } else {
        toast.error(response.message || "Failed to update address");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update address"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedAddress) return;
    setActionLoading(true);
    try {
      const response = await addressService.deleteGlobalAddress(
        selectedAddress._id
      );
      if (response.status == 200) {
        toast.success("Address deleted successfully");
        setIsDeleteModalOpen(false);
        setSelectedAddress(null);
        loadAddresses();
      } else {
        toast.error(response.message || "Failed to delete address");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete address"
      );
    } finally {
      setActionLoading(false);
    }
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
    loadAddresses();
  };

  const columns = createAddressColumns({
    userRole: user?.role || "user",
    onView: handleViewAddress,
    onEdit: handleEditClick,
    onDelete: handleDeleteClick,
    onSetDefault: handleSetDefault,
    showUserInfo: true,
  });

  // Calculate stats
  const uniqueCountries =
    new Set(addresses.map((addr) => addr?.country?.name)).size ?? 0;
  const uniqueCities =
    new Set(addresses.map((addr) => addr?.city)).size ?? 0;
  const defaultAddresses =
    addresses.filter((addr) => addr?.isDefault).length ?? 0;

  if (!user) return null;

  // Check permissions for viewing global address book
  if (!hasPermission(user.role, "users", "read")) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Access Denied</h3>
              <p className="text-muted-foreground">
                You don{"'"}t have permission to view the global address book.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="address-book-page">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="address-book-title">
            Address Book
          </h1>
          <p className="text-muted-foreground">
            Global address directory for all users
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Addresses</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="total-addresses">
              {addresses.length}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              Across all users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="unique-countries">
              {uniqueCountries}
            </div>
            <p className="text-xs text-muted-foreground">Global coverage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cities</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="unique-cities">
              {uniqueCities}
            </div>
            <p className="text-xs text-muted-foreground">Different locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Default Addresses</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="default-addresses">
              {defaultAddresses}
            </div>
            <p className="text-xs text-muted-foreground">User defaults set</p>
          </CardContent>
        </Card>
      </div>

      {/* Address Book Table */}
      <Card>
        <CardHeader>
          <CardTitle>Global Address Directory</CardTitle>
          <CardDescription>
            View, add, edit and delete addresses across all user accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={addresses}
            loading={loading}
            searchPlaceholder="Search addresses by user, label, city, or country..."
            onSearch={handleSearch}
            onRefresh={handleRefresh}
            showCreateNew={true}
            createNewLabel="Add Address"
            onCreateNew={handleCreateNew}
            showExport={true}
            emptyMessage="No addresses found in the system"
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

      {/* View Address Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="w-full max-w-2xl">
          <DialogHeader>
            <DialogTitle data-testid="view-address-modal-title">
              Address Details
            </DialogTitle>
          </DialogHeader>
          {selectedAddress && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-full bg-primary/10">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold flex items-center space-x-2">
                    <span>{selectedAddress.label}</span>
                    {selectedAddress.isDefault && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Default
                      </Badge>
                    )}
                  </h3>
                  <p className="text-muted-foreground">
                    User: {selectedAddress.user?.name || "-"} (
                    {selectedAddress.user?.phone || selectedAddress.phone ||
                      "-"}
                    )
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Address</h4>
                <div className="space-y-1 text-muted-foreground">
                  <div>{selectedAddress.addressLine || "-"}</div>
                  <div>
                    {selectedAddress.city || ""}
                    {selectedAddress.state &&
                      `, ${selectedAddress.state}`}
                    {selectedAddress.country?.name
                      ? `, ${selectedAddress.country.name}`
                      : ""}
                  </div>
                  {selectedAddress.zipCode && (
                    <div>ZIP: {selectedAddress.zipCode}</div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Contact Person</h4>
                <div className="space-y-1 text-muted-foreground">
                  <div>
                    <strong>Name:</strong> {selectedAddress.name || "-"}
                  </div>
                  <div>
                    <strong>Phone:</strong> {selectedAddress.phone || "-"}
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                <div>
                  Created:{" "}
                  {new Date(selectedAddress.createdAt).toLocaleString()}
                </div>
                <div>
                  Updated:{" "}
                  {new Date(selectedAddress.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Address Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Address</DialogTitle>
            <DialogDescription>
              Update this user&apos;s address details
            </DialogDescription>
          </DialogHeader>
          {selectedAddress && (
            <AddressForm
              address={selectedAddress}
              onSubmit={handleEditSubmit}
              onCancel={() => {
                setIsEditModalOpen(false);
                setSelectedAddress(null);
              }}
              loading={actionLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Address Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
            <DialogDescription>
              Create an address for a user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>User *</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u._id} value={u._id}>
                      {u.name} — {u.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <AddressForm
              onSubmit={handleCreateSubmit}
              onCancel={() => setIsCreateModalOpen(false)}
              loading={actionLoading}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this address? This action cannot
              be undone.
              {selectedAddress && (
                <div className="mt-2 p-2 bg-muted rounded">
                  <strong>Address:</strong> {selectedAddress?.label} —{" "}
                  {selectedAddress?.addressLine}, {selectedAddress?.city}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSubmit}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Address"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}