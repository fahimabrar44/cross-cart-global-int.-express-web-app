"use client";

import { createOrderColumns } from "@/components/orders/OrderColumns";
import { OrderForm } from "@/components/orders/OrderForm";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/AuthContext";
import { OrderFilters, orderService } from "@/services/orderService";
import { Order, hasPermission } from "@/types";
import { apiService } from "@/services/apiService";
import {
  Calculator,
  CheckCircle,
  CreditCard,
  Loader2,
  Lock,
  RefreshCw,
  PackageSearch,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface PaymentData {
  pType: string;
  pAmount: number;
  pOfferDiscount: number;
  pExtraCharge: number;
  pDiscount: number;
  pReceived: number;
  pRefunded: number;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Courier tracking update state
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [trackingCompany, setTrackingCompany] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  // Payment form state
  const [paymentData, setPaymentData] = useState<PaymentData>({
    pType: "cash",
    pAmount: 0,
    pOfferDiscount: 0,
    pExtraCharge: 0,
    pDiscount: 0,
    pReceived: 0,
    pRefunded: 0,
  });

  // Rider assignment state
  interface RiderOption {
    _id: string;
    name?: string;
    phone?: string;
    status?: string;
  }
  const [riders, setRiders] = useState<RiderOption[]>([]);
  const [selectedRiderId, setSelectedRiderId] = useState("");

  const loadRiders = async () => {
    try {
      const response = await apiService.get("/riders", {
        status: "available",
        limit: 200,
      });
      if (response.success) setRiders((response.data as RiderOption[]) || []);
    } catch {
      // riders are optional for assignment
    }
  };

  // Filter and pagination
  const [filters, setFilters] = useState<OrderFilters>({
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

  // Check if user has payment permission 
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const canProcessPayment = hasPermission(user?.role, "orders", "update");

  // Load orders and stats
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrders(filters);

      if (response.status == 200 && response.data) {
        setOrders(
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
      console.error("Failed to load orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // CRUD handlers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCreateOrder = async (data: any) => {
    try {
      setActionLoading(true);
      const response = await orderService.createOrder(data);

      if (response.status == 201) {
        toast.success("Order created successfully");
        setIsCreateModalOpen(false);
        loadOrders();
      }
    } catch (error) {
      console.error("Failed to create order:", error);
      toast.error("Failed to create order");
    } finally {
      setActionLoading(false);
    }
  };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditOrder = async (data: any) => {
    if (!selectedOrder) return;

    try {
      setActionLoading(true);
      const response = await orderService.updateOrder(selectedOrder._id, data);

      if (response.status == 200) {
        toast.success("Order updated successfully");
        setIsEditModalOpen(false);
        setSelectedOrder(null);
        loadOrders();
      }
    } catch (error) {
      console.error("Failed to update order:", error);
      toast.error("Failed to update order");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!selectedOrder) return;

    try {
      setActionLoading(true);
      const response = await orderService.deleteOrder(selectedOrder._id);

      if (response.status == 200) {
        toast.success("Order deleted successfully");
        setIsDeleteModalOpen(false);
        setSelectedOrder(null);
        loadOrders();
      }
    } catch (error) {
      console.error("Failed to delete order:", error);
      toast.error("Failed to delete order");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (order: Order, status: Order["status"]) => {
    try {
      const response = await orderService.updateOrderStatus(order._id, status);

      if (response.status == 200) {
        toast.success(`Order status updated to ${status}`);
        loadOrders();
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
      toast.error("Failed to update order status");
    }
  };

  // Courier tracking update handlers
  const handleTrackingClick = (order: Order) => {
    setSelectedOrder(order);
    setTrackingCompany(order.handover_by?.company || "");
    setTrackingNumber(order.handover_by?.tracking || "");
    setIsTrackingModalOpen(true);
  };

  const handleSaveTrackingUpdate = async () => {
    if (!selectedOrder) return;

    if (!trackingNumber.trim()) {
      toast.error("Enter the courier tracking number");
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `/api/v1/orders/${selectedOrder._id}/tracking-update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            company: trackingCompany.trim(),
            tracking: trackingNumber.trim(),
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast.success(
          result.data?.syncMessage || "Tracking update saved successfully"
        );
        setIsTrackingModalOpen(false);
        setSelectedOrder(null);
        loadOrders();
      } else {
        toast.error(result.message || "Failed to save tracking update");
      }
    } catch (error) {
      console.error("Failed to update tracking:", error);
      toast.error("Failed to update tracking");
    } finally {
      setActionLoading(false);
    }
  };

  // Payment handlers
  const handlePaymentClick = (order: Order) => {
    // Check if user has permission to process payments
    if (!canProcessPayment) {
      toast.error("You don't have permission to process payments");
      return;
    }

    setSelectedOrder(order);

    // Initialize payment data with current values
    setPaymentData({
      pType: order.payment.pType || "cash",
      pAmount: order.payment.pAmount || 0,
      pOfferDiscount: order.payment.pOfferDiscount || 0,
      pExtraCharge: order.payment.pExtraCharge || 0,
      pDiscount: order.payment.pDiscount || 0,
      pReceived: order.payment.pReceived || 0,
      pRefunded: order.payment.pRefunded || 0,
    });
    setIsPaymentModalOpen(true);
  };

  const handleUpdatePayment = async () => {
    if (!selectedOrder) return;

    // Check if user has permission to process payments
    if (!canProcessPayment) {
      toast.error("You don't have permission to update payments");
      return;
    }

    try {
      setActionLoading(true);

      // Call the payment API
      const response = await fetch(
        `/api/v1/orders/${selectedOrder._id}/payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify(paymentData),
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast.success("Payment details updated successfully");
        setIsPaymentModalOpen(false);
        loadOrders();
      } else {
        toast.error(result.message || "Failed to update payment");
      }
    } catch (error) {
      console.error("Failed to update payment:", error);
      toast.error("Failed to update payment");
    } finally {
      setActionLoading(false);
    }
  };

  // Event handlers
  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
    loadRiders();
  };

  const handleAssignRider = async () => {
    if (!selectedOrder || !selectedRiderId) {
      toast.error("Select a rider first");
      return;
    }
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `/api/v1/orders/${selectedOrder._id}/assignment`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ rider: selectedRiderId }),
        }
      );
      const result = await response.json();
      if (result.success) {
        toast.success("Rider assigned successfully");
        setSelectedRiderId("");
        loadOrders();
      } else {
        toast.error(result.message || "Failed to assign rider");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Assignment failed");
    }
  };

  const handleEditClick = (order: Order) => {
    setSelectedOrder(order);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (order: Order) => {
    setSelectedOrder(order);
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
    loadOrders();
  };

  const handleExport = async () => {
    try {
      toast.info("Exporting orders...");
      const blob = await orderService.exportOrders(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "orders.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Orders exported successfully");
    } catch (error) {
      console.error("Failed to export orders:", error);
      toast.error("Failed to export orders");
    }
  };

  // Bulk actions
  const bulkActions = [];
  if (hasPermission(user?.role || "user", "orders", "delete")) {
    bulkActions.push({
      label: "Delete Selected",
      variant: "destructive" as const,
      onClick: (selectedOrders: Order[]) => {
        toast.info(`Selected ${selectedOrders.length} orders for deletion`);
      },
    });
  }

                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  if (hasPermission(user?.role || "user", "orders", "payment")) {
    bulkActions.push({
      label: "Process Payment",
      variant: "default" as const,
      onClick: (selectedOrders: Order[]) => {
        toast.info(
          `Selected ${selectedOrders.length} orders for payment processing`
        );
      },
    });
  }

  const columns = createOrderColumns({
    userRole: user?.role || "user",
    onView: handleViewOrder,
    onEdit: handleEditClick,
    onDelete: handleDeleteClick,
    onUpdateStatus: handleUpdateStatus,
    
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
    onPayment: handlePaymentClick,
    onTrackingUpdate: handleTrackingClick,
  });

  if (!user) return null;

  // Helper function to format address
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatAddress = (address: any) => {
    if (!address) return "—";
    const parts = [
      address.address,
      address.city,
      address.zipcode,
      address.country?.name,
    ].filter(Boolean);
    return parts.join(", ") || "—";
  };

  // Calculate total quantity and value for packing list
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calculateTotals = (items: any[]) => {
    const totalQuantity = items.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );
    const totalValue = items.reduce(
      (sum, item) => sum + (item.unitPrice || 0) * (item.quantity || 0),
      0
    );
    return { totalQuantity, totalValue };
  };

  // Calculate payment totals
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calculatePaymentTotals = (payment: any) => {
    const amount = payment.pAmount || 0;
    const discount = payment.pDiscount || 0;
    const extraCharge = payment.pExtraCharge || 0;
    const received = payment.pReceived || 0;
    const refunded = payment.pRefunded || 0;

    const totalDue = amount - discount + extraCharge;
    const balance = totalDue - received + refunded;

    return {
      amount,
      discount,
      extraCharge,
      received,
      refunded,
      totalDue,
      balance,
    };
  };

  // Calculate new balance based on payment data
  const calculateNewBalance = () => {
    if (!selectedOrder) return 0;

    const amount = paymentData.pAmount || 0;
    const discount = paymentData.pDiscount || 0;
    const extraCharge = paymentData.pExtraCharge || 0;
    const received = paymentData.pReceived || 0;
    const refunded = paymentData.pRefunded || 0;

    const totalDue = amount - discount + extraCharge;
    const balance = totalDue - received + refunded;

    return balance;
  };

  return (
    <div className="space-y-6" data-testid="orders-page">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="orders-title">
            Orders
          </h1>
          <p className="text-muted-foreground">
            Manage and track all shipment orders
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          data-testid="refresh-orders-btn"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>
            View and manage orders with detailed tracking information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={orders}
            loading={loading}
            searchPlaceholder="Search orders by track ID, sender, or receiver..."
            onSearch={handleSearch}
            onRefresh={handleRefresh}
            onExport={handleExport}
            onCreateNew={
              hasPermission(user.role, "orders", "create")
                ? () => setIsCreateModalOpen(true)
                : undefined
            }
            showCreateNew={hasPermission(user.role, "orders", "create")}
            createNewLabel="Create Order"
            emptyMessage="No orders found"
            pagination={{
              page: pagination.page,
              limit: pagination.limit,
              total: pagination.total,
              onPageChange: handlePageChange,
              onLimitChange: handleLimitChange,
            }}
            bulkActions={bulkActions}
          />
        </CardContent>
      </Card>

      {/* Create Order Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="create-order-modal-title">
              Create New Order
            </DialogTitle>
            <DialogDescription>
              Fill in the order details to create a new shipment
            </DialogDescription>
          </DialogHeader>
          <OrderForm
            onSubmit={handleCreateOrder}
            onCancel={() => setIsCreateModalOpen(false)}
            loading={actionLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Order Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="edit-order-modal-title">
              Edit Order
            </DialogTitle>
            <DialogDescription>Update the order details</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <OrderForm
              order={selectedOrder}
              onSubmit={handleEditOrder}
              onCancel={() => {
                setIsEditModalOpen(false);
                setSelectedOrder(null);
              }}
              loading={actionLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Tracking Update Modal */}
      <Dialog open={isTrackingModalOpen} onOpenChange={setIsTrackingModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle data-testid="tracking-update-modal-title">
              Courier Tracking Update
            </DialogTitle>
            <DialogDescription>
              Add the carrier{"'"}s tracking number so the tracking page pulls
              the courier{"'"}s live timeline for this shipment.
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <Label>Order / Track ID</Label>
                <div className="mt-1 rounded-md border bg-muted px-3 py-2 text-sm font-medium">
                  {selectedOrder.trackId}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tracking-company">Courier Company</Label>
                <Input
                  id="tracking-company"
                  value={trackingCompany}
                  onChange={(e) => setTrackingCompany(e.target.value)}
                  placeholder="e.g., DHL, FedEx, Aramex, Steadfast"
                  data-testid="tracking-company-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tracking-number">
                  Courier Tracking Number *
                </Label>
                <Input
                  id="tracking-number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g., 132-12345678"
                  data-testid="tracking-number-input"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsTrackingModalOpen(false)}
                  data-testid="cancel-tracking-update"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveTrackingUpdate}
                  disabled={actionLoading}
                  data-testid="save-tracking-update"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <PackageSearch className="mr-2 h-4 w-4" />
                      Save & Sync
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Order Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-3xl overflow-auto h-[100vh] p-4">
          <DialogHeader>
            <DialogTitle data-testid="view-order-modal-title">
              Order Details
            </DialogTitle>
            <DialogDescription>
              {selectedOrder && (
                <div className="flex flex-wrap items-center gap-4">
                  <a
                    href={`/api/v1/orders/${selectedOrder._id}/invoice?track=${selectedOrder.trackId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    data-testid="invoice-link"
                  >
                    View / Print Invoice (PDF)
                  </a>
                  <a
                    href={`/api/v1/orders/${selectedOrder._id}/label?track=${selectedOrder.trackId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    data-testid="label-link"
                  >
                    Print Shipping Label
                  </a>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Track ID</h3>
                  <p data-testid="view-track-id">{selectedOrder.trackId}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Order Type</h3>
                  <Badge data-testid="view-order-type">
                    {selectedOrder.parcel.orderType}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">AWB Number</h3>
                  <p data-testid="view-awb">{selectedOrder.awb || "—"}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Status</h3>
                  <Badge data-testid="view-status">{selectedOrder.status || "pending"}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Weight</h3>
                  <p data-testid="view-weight">
                    {selectedOrder.parcel.weight} KG
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Priority</h3>
                  <Badge data-testid="view-order-priority">
                    {selectedOrder.parcel.priority}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {selectedOrder.parcel.insurance?.enabled && (
                  <div>
                    <h3 className="font-semibold">Insurance</h3>
                    <p>
                      Declared: $
                      {(selectedOrder.parcel.insurance.declaredValue || 0).toFixed(
                        2
                      )}{" "}
                      · Charge: $
                      {(selectedOrder.parcel.insurance.charge || 0).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Assigned Rider</h3>
                  {typeof selectedOrder.assignment?.rider === "object" &&
                    selectedOrder.assignment?.rider ? (
                      <p>
                        {(selectedOrder.assignment.rider as { name?: string }).name ||
                          String(selectedOrder.assignment.rider)}
                      </p>
                    ) : selectedOrder.assignment?.rider ? (
                      <p>{String(selectedOrder.assignment.rider)}</p>
                    ) : (
                    <p className="text-sm text-muted-foreground">Not assigned</p>
                  )}
                  {canProcessPayment && (
                    <div className="mt-2 space-y-2">
                      <select
                        value={selectedRiderId}
                        onChange={(e) => setSelectedRiderId(e.target.value)}
                        className="w-full p-2 border border-border rounded-lg text-sm"
                      >
                        <option value="">Assign a rider...</option>
                        {riders.map((rider) => (
                          <option key={rider._id} value={rider._id}>
                            {rider.name} ({rider.phone})
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAssignRider}
                        className="w-full"
                      >
                        Assign Rider
                      </Button>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">Coupon</h3>
                  {selectedOrder.parcel.couponCode ? (
                    <p>
                      {selectedOrder.parcel.couponCode} (-
                      $(selectedOrder.parcel.couponDiscount || 0).toFixed(2))
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Route</h3>
                <p>
                  
                    {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                    {/* @ts-expect-error */}
                  {selectedOrder.parcel.from?.name} →{" "} {selectedOrder.parcel.to?.name}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Sender</h3>
                  <div className="space-y-1">
                    <p>{selectedOrder.parcel.sender.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.parcel.sender.phone}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.parcel.sender.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatAddress(selectedOrder.parcel.sender.address)}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Receiver</h3>
                  <div className="space-y-1">
                    <p>{selectedOrder.parcel.receiver.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.parcel.receiver.phone}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.parcel.receiver.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatAddress(selectedOrder.parcel.receiver.address)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 w-full">
                <div className="mt-4 w-full">
                  <h3 className="font-semibold mb-3">Packing List</h3>

                  {selectedOrder?.parcel?.item &&
                  selectedOrder.parcel.item.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden w-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[60px] text-center">
                              #
                            </TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead className="text-center">
                              Quantity
                            </TableHead>
                            <TableHead className="text-center">
                              Unit Price
                            </TableHead>
                            <TableHead className="text-right">
                              Value ($)
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedOrder.parcel.item.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="text-center font-medium">
                                {index + 1}
                              </TableCell>
                              <TableCell>{item.name || "—"}</TableCell>
                              <TableCell className="text-center">
                                {item.quantity || "—"}
                              </TableCell>
                              <TableCell className="text-center">
                                {item.unitPrice
                                  ? `$${item.unitPrice.toFixed(2)}`
                                  : "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.unitPrice
                                  ? `$${(
                                      item.unitPrice * item.quantity
                                    ).toFixed(2)}`
                                  : "—"}
                              </TableCell>
                            </TableRow>
                          ))}

                          <TableRow className="bg-muted/40 font-semibold">
                            <TableCell colSpan={2}>Total</TableCell>
                            <TableCell className="text-center">
                              {
                                calculateTotals(selectedOrder.parcel.item)
                                  .totalQuantity
                              }
                            </TableCell>
                            <TableCell colSpan={2} className="text-right">
                              $
                              {calculateTotals(
                                selectedOrder.parcel.item
                              ).totalValue.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No items in this order
                    </p>
                  )}
                </div>

                {/* Payment Table */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Payment Details</h3>
                    {canProcessPayment ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePaymentClick(selectedOrder)}
                        data-testid="payment-action-btn"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Update Payment
                      </Button>
                    ) : (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Lock className="h-4 w-4 mr-1" />
                        Payment restricted to Admin/Moderator
                      </div>
                    )}
                  </div>
                  <div className="border rounded-lg overflow-hidden w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Payment Detail</TableHead>
                          <TableHead className="text-right">
                            Amount ($)
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Type</TableCell>
                          <TableCell className="text-right">
                            {selectedOrder.payment.pType || "N/A"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Amount</TableCell>
                          <TableCell className="text-right">
                            {selectedOrder.payment.pAmount?.toFixed(2) ||
                              "0.00"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            Discount
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            -
                            {selectedOrder.payment.pDiscount?.toFixed(2) ||
                              "0.00"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            Extra Charge
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            +
                            {selectedOrder.payment.pExtraCharge?.toFixed(2) ||
                              "0.00"}
                          </TableCell>
                        </TableRow>
                        <TableRow className="bg-muted/40 font-semibold">
                          <TableCell>Total Due</TableCell>
                          <TableCell className="text-right">
                            {calculatePaymentTotals(
                              selectedOrder.payment
                            ).totalDue.toFixed(2)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            Received
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            -
                            {selectedOrder.payment.pReceived?.toFixed(2) ||
                              "0.00"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            Refunded
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            +
                            {selectedOrder.payment.pRefunded?.toFixed(2) ||
                              "0.00"}
                          </TableCell>
                        </TableRow>
                        <TableRow className="bg-muted/40 font-semibold">
                          <TableCell>Balance</TableCell>
                          <TableCell
                            className={`text-right ${
                              calculatePaymentTotals(selectedOrder.payment)
                                .balance > 0
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {calculatePaymentTotals(
                              selectedOrder.payment
                            ).balance.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Update Payment Details
            </DialogTitle>
            <DialogDescription>
              {selectedOrder && <span>Order #{selectedOrder.trackId}</span>}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Current Payment Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Current Payment Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Due</p>
                      <p className="text-xl font-bold">
                        $
                        {calculatePaymentTotals(
                          selectedOrder.payment
                        ).totalDue.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Current Balance
                      </p>
                      <p
                        className={`text-xl font-bold ${
                          calculatePaymentTotals(selectedOrder.payment)
                            .balance > 0
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        $
                        {calculatePaymentTotals(
                          selectedOrder.payment
                        ).balance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Update All Payment Fields
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pType">Payment Type</Label>
                    <Select
                      value={paymentData.pType}
                      onValueChange={(value) =>
                        setPaymentData({ ...paymentData, pType: value })
                      }
                      disabled={!canProcessPayment}
                    >
                      <SelectTrigger data-testid="payment-type-select">
                        <SelectValue placeholder="Select payment type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                        <SelectItem value="mobile">Mobile Payment</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {!canProcessPayment && (
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Lock className="h-3 w-3 mr-1" />
                        Only Admin/Moderator can modify
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pAmount">Amount</Label>
                    <Input
                      id="pAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={paymentData.pAmount}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          pAmount: parseFloat(e.target.value) || 0,
                        })
                      }
                      disabled={!canProcessPayment}
                      data-testid="payment-amount-input"
                    />
                    {!canProcessPayment && (
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Lock className="h-3 w-3 mr-1" />
                        Only Admin/Moderator can modify
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pDiscount">Discount</Label>
                    <Input
                      id="pDiscount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={paymentData.pDiscount}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          pDiscount: parseFloat(e.target.value) || 0,
                        })
                      }
                      disabled={!canProcessPayment}
                      data-testid="payment-discount-input"
                    />
                    {!canProcessPayment && (
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Lock className="h-3 w-3 mr-1" />
                        Only Admin/Moderator can modify
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pExtraCharge">Extra Charge</Label>
                    <Input
                      id="pExtraCharge"
                      type="number"
                      step="0.01"
                      min="0"
                      value={paymentData.pExtraCharge}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          pExtraCharge: parseFloat(e.target.value) || 0,
                        })
                      }
                      disabled={!canProcessPayment}
                      data-testid="payment-extra-charge-input"
                    />
                    {!canProcessPayment && (
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Lock className="h-3 w-3 mr-1" />
                        Only Admin/Moderator can modify
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pReceived">Received</Label>
                    <Input
                      id="pReceived"
                      type="number"
                      step="0.01"
                      min="0"
                      value={paymentData.pReceived}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          pReceived: parseFloat(e.target.value) || 0,
                        })
                      }
                      disabled={!canProcessPayment}
                      data-testid="payment-received-input"
                    />
                    {!canProcessPayment && (
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Lock className="h-3 w-3 mr-1" />
                        Only Admin/Moderator can modify
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pRefunded">Refunded</Label>
                    <Input
                      id="pRefunded"
                      type="number"
                      step="0.01"
                      min="0"
                      value={paymentData.pRefunded}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          pRefunded: parseFloat(e.target.value) || 0,
                        })
                      }
                      disabled={!canProcessPayment}
                      data-testid="payment-refunded-input"
                    />
                    {!canProcessPayment && (
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Lock className="h-3 w-3 mr-1" />
                        Only Admin/Moderator can modify
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pOfferDiscount">Offer Discount</Label>
                  <Textarea
                    id="pOfferDiscount"
                    value={paymentData.pOfferDiscount}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-expect-error
                        pOfferDiscount: e.target.value,
                      })
                    }
                    placeholder="Offer discount details"
                    rows={3}
                    disabled={!canProcessPayment}
                    data-testid="payment-offer-discount-input"
                  />
                  {!canProcessPayment && (
                    <p className="text-xs text-muted-foreground flex items-center">
                      <Lock className="h-3 w-3 mr-1" />
                      Only Admin/Moderator can modify
                    </p>
                  )}
                </div>

                {/* Payment Summary */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Updated Payment Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span>${paymentData.pAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span className="text-green-600">
                          -${paymentData.pDiscount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Extra Charge:</span>
                        <span className="text-red-600">
                          +${paymentData.pExtraCharge.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold pt-2 border-t">
                        <span>Total Due:</span>
                        <span>
                          $
                          {(
                            paymentData.pAmount -
                            paymentData.pDiscount +
                            paymentData.pExtraCharge
                          ).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Received:</span>
                        <span className="text-green-600">
                          -${paymentData.pReceived.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Refunded:</span>
                        <span className="text-red-600">
                          +${paymentData.pRefunded.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-2 border-t">
                        <span>New Balance:</span>
                        <span
                          className={
                            calculateNewBalance() > 0
                              ? "text-red-600"
                              : "text-green-600"
                          }
                        >
                          ${calculateNewBalance().toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsPaymentModalOpen(false)}
                    data-testid="payment-cancel-btn"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdatePayment}
                    disabled={actionLoading || !canProcessPayment}
                    data-testid="payment-submit-btn"
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Update Payment
                      </>
                    )}
                  </Button>
                  {!canProcessPayment && (
                    <p className="text-xs text-muted-foreground flex items-center mt-2">
                      <Lock className="h-3 w-3 mr-1" />
                      Only Admin/Moderator can update payments
                    </p>
                  )}
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
            <AlertDialogTitle data-testid="delete-order-modal-title">
              Delete Order
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this order? This action cannot be
              undone.
              {selectedOrder && (
                <div className="mt-2 p-2 bg-muted rounded">
                  <strong>Track ID:</strong> {selectedOrder.trackId}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete-btn">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrder}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="confirm-delete-btn"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Order"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
