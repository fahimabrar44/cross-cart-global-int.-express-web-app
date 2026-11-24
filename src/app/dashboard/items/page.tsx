"use client";

import { createItemColumns } from "@/components/items/ItemColumns";
import { ItemForm } from "@/components/items/ItemForm";
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
import { ItemFilters, itemService } from "@/services/itemService";
import { CreateItemData, Item } from "@/types";
import { Boxes, CheckCircle2, Loader2, PowerOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function ItemsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const [filters, setFilters] = useState<ItemFilters>({
    page: 1,
    limit: 10,
    sortBy: "name",
    sortOrder: "asc",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    activeTotal: 0,
    totalPages: 0,
  });

  const canManage = user?.role === "admin" || user?.role === "moderator";

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await itemService.getItems(filters);

      if (response.status == 200 && response.data) {
        setItems(Array.isArray(response.data) ? response.data : []);
        if (response.meta) {
          setPagination({
            page: response.meta.page || 1,
            limit: response.meta.limit || 10,
            total: response.meta.total || 0,
            activeTotal:
              typeof response.meta.activeTotal === "number"
                ? response.meta.activeTotal
                : (response.data || []).filter((item) => item.isActive).length,
            totalPages: response.meta.totalPages || 0,
          });
        }
      }
    } catch (error) {
      console.error("Failed to load items:", error);
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleCreateItem = async (data: CreateItemData) => {
    try {
      setActionLoading(true);
      const response = await itemService.createItem(data);

      if (response.status == 200) {
        toast.success("Item added successfully");
        setIsCreateModalOpen(false);
        loadItems();
      }
    } catch (error) {
      console.error("Failed to create item:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create item"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditItem = async (data: CreateItemData) => {
    if (!selectedItem) return;

    try {
      setActionLoading(true);
      const response = await itemService.updateItem(selectedItem._id, data);

      if (response.status == 200) {
        toast.success("Item updated successfully");
        setIsEditModalOpen(false);
        setSelectedItem(null);
        loadItems();
      }
    } catch (error) {
      console.error("Failed to update item:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update item"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;

    try {
      setActionLoading(true);
      const response = await itemService.deleteItem(selectedItem._id);

      if (response.status == 200) {
        toast.success("Item deleted successfully");
        setIsDeleteModalOpen(false);
        setSelectedItem(null);
        loadItems();
      }
    } catch (error) {
      console.error("Failed to delete item:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete item"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (item: Item) => {
    try {
      const response = await itemService.toggleItemStatus(
        item._id,
        !item.isActive
      );

      if (response.status == 200) {
        toast.success(
          `Item ${item.isActive ? "deactivated" : "activated"} successfully`
        );
        loadItems();
      }
    } catch (error) {
      console.error("Failed to toggle item status:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to toggle item status"
      );
    }
  };

  const handleEditClick = (item: Item) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (item: Item) => {
    setSelectedItem(item);
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

  const columns = createItemColumns({
    userRole: user?.role || "user",
    onEdit: handleEditClick,
    onDelete: handleDeleteClick,
    onToggleStatus: handleToggleStatus,
  });

  if (!user) return null;

  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
          <CardDescription>
            Only admins and moderators can manage the item list.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="items-page">
      <div>
        <h1 className="text-3xl font-bold" data-testid="items-title">
          Items
        </h1>
        <p className="text-muted-foreground">
          Maintain the reusable item list used while creating orders
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="total-items">
              {pagination.total}
            </div>
            <p className="text-xs text-muted-foreground">
              Saved item names
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Items</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold text-green-600"
              data-testid="active-items"
            >
              {pagination.activeTotal}
            </div>
            <p className="text-xs text-muted-foreground">
              Shown as order suggestions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Items</CardTitle>
            <PowerOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="inactive-items">
              {Math.max(0, pagination.total - pagination.activeTotal)}
            </div>
            <p className="text-xs text-muted-foreground">
              Hidden from suggestions
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Item List</CardTitle>
          <CardDescription>
            Add the products you ship most often, with their default unit price
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={items}
            loading={loading}
            searchPlaceholder="Search items by name, description, or unit..."
            onSearch={handleSearch}
            onRefresh={loadItems}
            onCreateNew={() => setIsCreateModalOpen(true)}
            showCreateNew
            createNewLabel="Add Item"
            showExport={false}
            emptyMessage="No items yet. Add your first item to use it in orders."
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

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="create-item-modal-title">
              Add New Item
            </DialogTitle>
            <DialogDescription>
              This item will be available as a suggestion when creating orders.
            </DialogDescription>
          </DialogHeader>
          <ItemForm
            onSubmit={handleCreateItem}
            onCancel={() => setIsCreateModalOpen(false)}
            loading={actionLoading}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="edit-item-modal-title">
              Edit Item
            </DialogTitle>
            <DialogDescription>
              Changes affect future orders only; existing orders keep their
              saved item details.
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <ItemForm
              item={selectedItem}
              onSubmit={handleEditItem}
              onCancel={() => {
                setIsEditModalOpen(false);
                setSelectedItem(null);
              }}
              loading={actionLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete “{selectedItem?.name}”? Existing
              orders are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
