"use client";

import { DataTable } from "@/components/Dashboard/DataTable";
import { RoleGuard } from "@/middleware/roleGuard";
import { NotificationService, UserService } from "@/services/dashboardService";
import { useAuth } from "@/hooks/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle,
  Info,
  Loader2,
  Mail,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Smartphone,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

type NotificationType = "success" | "error" | "info" | "warning";
type NotificationCategory =
  | "account"
  | "order"
  | "payment"
  | "system"
  | "security";
type Channel = "email" | "sms" | "inapp";

interface NotificationUser {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  channels: Channel[];
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
  userId?: string | NotificationUser;
}

interface UserOption {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

interface NotificationFormState {
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  channels: Channel[];
  audience: string;
}

const EMPTY_FORM: NotificationFormState = {
  title: "",
  message: "",
  type: "info",
  category: "system",
  channels: ["inapp"],
  audience: "all",
};

const TYPE_STYLES: Record<NotificationType, string> = {
  success: "border-green-200 bg-green-50 text-green-700",
  error: "border-red-200 bg-red-50 text-red-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
};

function recipientLabel(userId: Notification["userId"]): string {
  if (!userId) return "Unknown recipient";
  if (typeof userId === "string") return userId;
  return userId.name || userId.email || userId.phone || "Unknown recipient";
}

function recipientEmail(userId: Notification["userId"]): string {
  if (!userId || typeof userId === "string") return "";
  return userId.email || userId.phone || "";
}

function getTypeIcon(type: NotificationType) {
  switch (type) {
    case "success":
      return <CheckCircle className="h-3.5 w-3.5" />;
    case "error":
      return <AlertCircle className="h-3.5 w-3.5" />;
    case "warning":
      return <AlertTriangle className="h-3.5 w-3.5" />;
    default:
      return <Info className="h-3.5 w-3.5" />;
  }
}

function getChannelIcon(channel: Channel) {
  switch (channel) {
    case "email":
      return <Mail className="h-3 w-3" />;
    case "sms":
      return <MessageSquare className="h-3 w-3" />;
    default:
      return <Smartphone className="h-3 w-3" />;
  }
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "admin" || user?.role === "moderator";

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "view" | "edit">(
    "create"
  );
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [form, setForm] = useState<NotificationFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const notifyShell = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("crosscart:notifications-changed"));
    }
  };

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await NotificationService.getNotifications({
        limit: 200,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      if (response.success) {
        setNotifications((response.data || []) as Notification[]);
      } else {
        toast.error(response.message || "Failed to fetch notifications");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to fetch notifications"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!isAdmin) return;

    let active = true;
    UserService.getUsers({ role: "user", limit: 100 })
      .then((response) => {
        if (active && response.success) {
          setUsers((response.data || []) as UserOption[]);
        }
      })
      .catch(() => {
        // The recipient picker is optional; ignore list failures.
      });

    return () => {
      active = false;
    };
  }, [isAdmin]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchNotifications();
    setIsRefreshing(false);
    notifyShell();
    toast.success("Notifications refreshed");
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (activeTab === "unread" && notification.isRead) return false;
      if (activeTab === "read" && !notification.isRead) return false;
      if (typeFilter !== "all" && notification.type !== typeFilter) return false;
      if (
        categoryFilter !== "all" &&
        notification.category !== categoryFilter
      ) {
        return false;
      }
      return true;
    });
  }, [notifications, activeTab, typeFilter, categoryFilter]);

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;
  const readCount = notifications.length - unreadCount;
  const systemCount = notifications.filter(
    (notification) => notification.category === "system"
  ).length;

  const handleCreate = () => {
    setForm(EMPTY_FORM);
    setSelectedNotification(null);
    setDialogMode("create");
    setIsDialogOpen(true);
  };

  const handleView = (notification: Notification) => {
    setSelectedNotification(notification);
    setDialogMode("view");
    setIsDialogOpen(true);
  };

  const handleEdit = (notification: Notification) => {
    setSelectedNotification(notification);
    setForm({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      category: notification.category,
      channels:
        notification.channels && notification.channels.length > 0
          ? notification.channels
          : ["inapp"],
      audience: "all",
    });
    setDialogMode("edit");
    setIsDialogOpen(true);
  };

  const handleMarkAsRead = async (notification: Notification) => {
    try {
      const response = await NotificationService.markMultipleAsRead([
        notification._id,
      ]);
      if (response.success) {
        toast.success("Notification marked as read");
        await fetchNotifications();
        notifyShell();
      } else {
        toast.error(response.message || "Failed to mark as read");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications
      .filter((notification) => !notification.isRead)
      .map((notification) => notification._id);

    if (unreadIds.length === 0) {
      toast.info("No unread notifications to mark");
      return;
    }

    try {
      const response = await NotificationService.markMultipleAsRead(unreadIds);
      if (response.success) {
        toast.success(`${unreadIds.length} notifications marked as read`);
        await fetchNotifications();
        notifyShell();
      } else {
        toast.error(response.message || "Failed to mark notifications as read");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const handleDelete = async (notification: Notification) => {
    if (!confirm("Are you sure you want to delete this notification?")) {
      return;
    }

    try {
      const response = await NotificationService.deleteNotification(
        notification._id
      );
      if (response.success) {
        toast.success("Notification deleted");
        await fetchNotifications();
        notifyShell();
      } else {
        toast.error(response.message || "Failed to delete notification");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("Title and message are required");
      return;
    }

    if (form.channels.length === 0) {
      toast.error("Select at least one delivery channel");
      return;
    }

    try {
      setSubmitting(true);

      if (dialogMode === "create") {
        if (!isAdmin) {
          toast.error("Only admins can create notifications for other users");
          return;
        }

        if (form.audience === "all") {
          const response = await NotificationService.createNotification({
            title: form.title.trim(),
            message: form.message.trim(),
            type: form.type,
            category: form.category,
            channels: form.channels,
            broadcast: true,
          });

          if (response.success) {
            const count = response.data?.count ?? 0;
            toast.success(
              count > 0
                ? `Notification sent to ${count} user${count === 1 ? "" : "s"}`
                : response.message || "No active users to notify"
            );
          } else {
            toast.error(response.message || "Failed to create notification");
            return;
          }
        } else {
          const response = await NotificationService.createNotification({
            title: form.title.trim(),
            message: form.message.trim(),
            type: form.type,
            category: form.category,
            channels: form.channels,
            userId: form.audience,
          });

          if (response.success) {
            toast.success("Notification sent");
          } else {
            toast.error(response.message || "Failed to create notification");
            return;
          }
        }
      } else if (dialogMode === "edit" && selectedNotification) {
        const response = await NotificationService.updateNotification(
          selectedNotification._id,
          {
            title: form.title.trim(),
            message: form.message.trim(),
            type: form.type,
            category: form.category,
            channels: form.channels,
          }
        );

        if (response.success) {
          toast.success("Notification updated");
        } else {
          toast.error(response.message || "Failed to update notification");
          return;
        }
      }

      setIsDialogOpen(false);
      await fetchNotifications();
      notifyShell();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleChannel = (channel: Channel, checked: boolean) => {
    setForm((current) => ({
      ...current,
      channels: checked
        ? Array.from(new Set([...current.channels, channel]))
        : current.channels.filter((item) => item !== channel),
    }));
  };

  const columns = useMemo(() => {
    type NotificationColumn = {
      key: string;
      label: string;
      sortable?: boolean;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render?: (value: any, row: Notification) => ReactNode;
    };

    const baseColumns: NotificationColumn[] = [
      {
        key: "title",
        label: "Notification",
        sortable: true,
        render: (_value: unknown, row: Notification) => (
          <div className="min-w-[220px]">
            <div className="flex items-center gap-2">
              {!row.isRead && (
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
              )}
              <span className="font-medium text-foreground">{row.title}</span>
            </div>
            <p className="mt-0.5 line-clamp-2 max-w-md text-xs text-muted-foreground">
              {row.message}
            </p>
          </div>
        ),
      },
      {
        key: "type",
        label: "Type",
        render: (value: NotificationType) => (
          <Badge variant="outline" className={TYPE_STYLES[value]}>
            {getTypeIcon(value)}
            <span className="ml-1 capitalize">{value}</span>
          </Badge>
        ),
      },
      {
        key: "category",
        label: "Category",
        render: (value: string) => (
          <Badge variant="outline" className="capitalize">
            {value}
          </Badge>
        ),
      },
      {
        key: "channels",
        label: "Channels",
        render: (value: Channel[]) => (
          <div className="flex flex-wrap gap-1">
            {(value || []).map((channel) => (
              <Badge
                key={channel}
                variant="outline"
                className="flex items-center gap-1 text-xs"
              >
                {getChannelIcon(channel)}
                <span>{channel === "inapp" ? "App" : channel}</span>
              </Badge>
            ))}
          </div>
        ),
      },
      {
        key: "isRead",
        label: "Status",
        render: (value: boolean) => (
          <Badge variant={value ? "secondary" : "default"}>
            {value ? "Read" : "Unread"}
          </Badge>
        ),
      },
      {
        key: "createdAt",
        label: "Created",
        sortable: true,
        render: (value: string) => new Date(value).toLocaleString(),
      },
    ];

    if (isStaff) {
      baseColumns.splice(4, 0, {
        key: "recipient",
        label: "Recipient",
        render: (_value: unknown, row: Notification) => (
          <div className="min-w-[140px]">
            <p className="text-sm font-medium text-gray-700">
              {recipientLabel(row.userId)}
            </p>
            <p className="text-xs text-muted-foreground">
              {recipientEmail(row.userId)}
            </p>
          </div>
        ),
      });
    }

    return baseColumns;
  }, [isStaff]);

  const actions = useMemo(() => {
    const items: Array<{
      label: string;
      onClick: (item: Notification) => void;
      variant?: "default" | "destructive";
      condition?: (item: Notification) => boolean;
    }> = [
      {
        label: "Mark as read",
        onClick: handleMarkAsRead,
        condition: (notification) => !notification.isRead,
      },
    ];

    if (isStaff) {
      items.push({ label: "Edit", onClick: handleEdit });
    }

    items.push({
      label: "Delete",
      onClick: handleDelete,
      variant: "destructive",
    });

    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaff, notifications]);

  const statCards = [
    {
      label: isStaff ? "All notifications" : "My notifications",
      value: notifications.length,
      icon: Bell,
      className: "text-primary",
    },
    {
      label: "Unread",
      value: unreadCount,
      icon: AlertCircle,
      className: "text-amber-600",
    },
    {
      label: "Read",
      value: readCount,
      icon: CheckCircle,
      className: "text-green-600",
    },
    {
      label: "System alerts",
      value: systemCount,
      icon: Users,
      className: "text-blue-600",
    },
  ];

  return (
    <RoleGuard allowedRoles={["admin", "moderator", "user"]}>
      <div className="space-y-6" data-testid="notifications-page">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="mt-1 text-muted-foreground">
              {isStaff
                ? "Every notification in the system, with the recipient for each one."
                : "Notifications sent to your account."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              data-testid="refresh-notifications-btn"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            {isAdmin && (
              <Button onClick={handleCreate} data-testid="create-notification-btn">
                <Plus className="mr-2 h-4 w-4" />
                Create Notification
              </Button>
            )}
          </div>
        </div>

        {isStaff && (
          <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <Bell className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>
              Admin view: all notifications from every user are shown here. Use
              the Recipient column to see who each notification belongs to.
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.label} className="shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-gray-50 p-2">
                  <stat.icon className={`h-5 w-5 ${stat.className}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-sm">
          <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as "all" | "unread" | "read")
              }
            >
              <TabsList>
                <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
                <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
                <TabsTrigger value="read">Read ({readCount})</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[170px]">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="order">Order</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                </SelectContent>
              </Select>

              {unreadCount > 0 && (
                <Button variant="outline" onClick={handleMarkAllAsRead}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark all read
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <DataTable
          title={isStaff ? "All system notifications" : "My notifications"}
          data={filteredNotifications}
          columns={columns}
          searchKeys={["title", "message", "category", "userId.name", "userId.email"]}
          onView={handleView}
          loading={loading}
          actions={actions}
          itemsPerPage={10}
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {dialogMode === "create"
                  ? "Create Notification"
                  : dialogMode === "edit"
                    ? "Edit Notification"
                    : "Notification Details"}
              </DialogTitle>
            </DialogHeader>

            {dialogMode === "view" && selectedNotification ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold">
                    {selectedNotification.title}
                  </h3>
                  <Badge
                    variant="outline"
                    className={TYPE_STYLES[selectedNotification.type]}
                  >
                    {getTypeIcon(selectedNotification.type)}
                    <span className="ml-1 capitalize">
                      {selectedNotification.type}
                    </span>
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {selectedNotification.category}
                  </Badge>
                  <Badge
                    variant={selectedNotification.isRead ? "secondary" : "default"}
                  >
                    {selectedNotification.isRead ? "Read" : "Unread"}
                  </Badge>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="whitespace-pre-wrap text-sm">
                    {selectedNotification.message}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {isStaff && (
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Recipient
                      </Label>
                      <p className="mt-1 text-sm font-medium">
                        {recipientLabel(selectedNotification.userId)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {recipientEmail(selectedNotification.userId)}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Channels
                    </Label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(selectedNotification.channels || []).map((channel) => (
                        <Badge
                          key={channel}
                          variant="outline"
                          className="flex items-center gap-1 text-xs"
                        >
                          {getChannelIcon(channel)}
                          <span>{channel === "inapp" ? "App" : channel}</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Created
                    </Label>
                    <p className="mt-1 text-sm">
                      {new Date(selectedNotification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {selectedNotification.updatedAt && (
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Updated
                      </Label>
                      <p className="mt-1 text-sm">
                        {new Date(
                          selectedNotification.updatedAt
                        ).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                <DialogFooter className="gap-2">
                  {!selectedNotification.isRead && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleMarkAsRead(selectedNotification);
                        setIsDialogOpen(false);
                      }}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark as read
                    </Button>
                  )}
                  {isStaff && (
                    <Button onClick={() => handleEdit(selectedNotification)}>
                      Edit
                    </Button>
                  )}
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notification-title">Title</Label>
                  <Input
                    id="notification-title"
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Notification title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notification-message">Message</Label>
                  <Textarea
                    id="notification-message"
                    value={form.message}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        message: event.target.value,
                      }))
                    }
                    placeholder="Write the notification message"
                    rows={4}
                  />
                </div>

                {dialogMode === "create" && isAdmin && (
                  <div className="space-y-2">
                    <Label htmlFor="notification-audience">Send to</Label>
                    <Select
                      value={form.audience}
                      onValueChange={(value) =>
                        setForm((current) => ({ ...current, audience: value }))
                      }
                    >
                      <SelectTrigger id="notification-audience">
                        <SelectValue placeholder="Choose recipients" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          All active users (broadcast)
                        </SelectItem>
                        {users.map((recipient) => (
                          <SelectItem key={recipient._id} value={recipient._id}>
                            {recipient.name || recipient.email || recipient.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Broadcast creates one in-app notification for every active
                      normal user.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="notification-type">Type</Label>
                    <Select
                      value={form.type}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          type: value as NotificationType,
                        }))
                      }
                    >
                      <SelectTrigger id="notification-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notification-category">Category</Label>
                    <Select
                      value={form.category}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          category: value as NotificationCategory,
                        }))
                      }
                    >
                      <SelectTrigger id="notification-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="account">Account</SelectItem>
                        <SelectItem value="order">Order</SelectItem>
                        <SelectItem value="payment">Payment</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Channels</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {(["inapp", "email", "sms"] as Channel[]).map((channel) => (
                      <div
                        key={channel}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2"
                      >
                        <Checkbox
                          id={`notification-channel-${channel}`}
                          checked={form.channels.includes(channel)}
                          onCheckedChange={(checked) =>
                            toggleChannel(channel, checked === true)
                          }
                        />
                        <Label
                          htmlFor={`notification-channel-${channel}`}
                          className="flex cursor-pointer items-center gap-1 capitalize"
                        >
                          {getChannelIcon(channel)}
                          <span>{channel === "inapp" ? "In-App" : channel}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    {dialogMode === "create" ? "Send Notification" : "Save Changes"}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}
