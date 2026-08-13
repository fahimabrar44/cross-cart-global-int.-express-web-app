"use client";
import { useState, useEffect, useCallback } from "react";
import { DataTable } from "@/components/Dashboard/DataTable";
import { RoleGuard } from "@/middleware/roleGuard";
import { NotificationService } from "@/services/dashboardService";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Mail,
  MessageSquare,
  Smartphone,
  X
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

interface NotificationFormData {
  title: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  category: "account" | "order" | "payment" | "system" | "security";
  channels: ("email" | "sms" | "inapp")[];
  priority: "low" | "normal" | "high" | "urgent";
  scheduledAt?: string;
  recipients?: string[];
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  category: "account" | "order" | "payment" | "system" | "security";
  channels: ("email" | "sms" | "inapp")[];
  priority: "low" | "normal" | "high" | "urgent";
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
  scheduledAt?: string;
  sentAt?: string;
  recipients?: string[];
  readCount?: number;
  totalRecipients?: number;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "view" | "edit">("create");
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NotificationFormData>({
    defaultValues: {
      title: "",
      message: "",
      type: "info",
      category: "system",
      channels: ["inapp"],
      priority: "normal",
    },
  });

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await NotificationService.getNotifications({ limit: 100 });
      if (response.status == 200) {
        setNotifications(response.data);
      } else {
        toast.error(response.message || "Failed to fetch notifications");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchNotifications();
    setIsRefreshing(false);
    toast.success("Notifications refreshed");
  };

  const filterNotifications = useCallback(() => {
    let filtered = [...notifications];
    
    // Filter by tab
    if (activeTab === "unread") {
      filtered = filtered.filter(n => !n.isRead);
    } else if (activeTab === "sent") {
      filtered = filtered.filter(n => n.sentAt);
    } else if (activeTab === "scheduled") {
      filtered = filtered.filter(n => n.scheduledAt && !n.sentAt);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter(n => n.type === typeFilter);
    }
    
    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter(n => n.category === categoryFilter);
    }
    
    setFilteredNotifications(filtered);
  }, [notifications, activeTab, searchTerm, typeFilter, categoryFilter]);

  useEffect(() => {
    filterNotifications();
  }, [filterNotifications]);

  const handleCreate = () => {
    reset();
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
    setDialogMode("edit");
    reset({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      category: notification.category,
      channels: notification.channels,
      priority: notification.priority || "normal",
    });
    setIsDialogOpen(true);
  };

  const handleMarkAsRead = async (notification: Notification) => {
    try {
      const response = await NotificationService.markAsRead(notification._id);
      if (response.status == 200) {
        toast.success("Notification marked as read");
        fetchNotifications();
      } else {
        toast.error(response.message || "Failed to mark as read");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n._id);
      if (unreadIds.length === 0) {
        toast.info("No unread notifications to mark");
        return;
      }
      
                    {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                    {/* @ts-expect-error */}
      const response = await NotificationService.markMultipleAsRead(unreadIds);
      if (response.status == 200) {
        toast.success(`${unreadIds.length} notifications marked as read`);
        fetchNotifications();
      } else {
        toast.error(response.message || "Failed to mark notifications as read");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const handleDelete = async (notification: Notification) => {
    if (!confirm(`Are you sure you want to delete this notification?`)) {
      return;
    }

    try {
      const response = await NotificationService.deleteNotification(notification._id);
      if (response.status == 200) {
        toast.success("Notification deleted successfully");
        fetchNotifications();
      } else {
        toast.error(response.message || "Failed to delete notification");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const onSubmit = async (data: NotificationFormData) => {
    try {
      if (dialogMode === "create") {
        // For creating notifications, we'd need a user ID or broadcast functionality
        toast.info("Notification creation requires user selection - feature not fully implemented");
      } else if (dialogMode === "edit" && selectedNotification) {
        const response = await NotificationService.updateNotification(selectedNotification._id, data);
        if (response.status == 200) {
          toast.success("Notification updated successfully");
          fetchNotifications();
          setIsDialogOpen(false);
        } else {
          toast.error(response.message || "Failed to update notification");
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      success: CheckCircle,
      error: AlertCircle,
      warning: AlertTriangle,
      info: Info,
    };
    const Icon = icons[type as keyof typeof icons] || Info;
    return <Icon className="h-4 w-4" />;
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      success: "default",
      error: "destructive",
      warning: "secondary",
      info: "outline",
    } as const;
    
    return (
      <Badge variant={variants[type as keyof typeof variants] || "outline"}>
        {getTypeIcon(type)}
        <span className="ml-1 capitalize">{type}</span>
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      urgent: "bg-red-100 text-red-800 border-red-200",
      high: "bg-orange-100 text-orange-800 border-orange-200",
      normal: "bg-blue-100 text-blue-800 border-blue-200",
      low: "bg-gray-100 text-gray-800 border-gray-200",
    };
    
    return (
      <Badge variant="outline" className={colors[priority as keyof typeof colors] || colors.normal}>
        {priority}
      </Badge>
    );
  };

  const getCategoryBadge = (category: string) => (
    <Badge variant="outline" className="capitalize">
      {category}
    </Badge>
  );

  const getChannelIcon = (channel: string) => {
    const icons = {
      email: Mail,
      sms: MessageSquare,
      inapp: Smartphone,
    };
    const Icon = icons[channel as keyof typeof icons] || Bell;
    return <Icon className="h-3 w-3" />;
  };

  const columns = [
    {
      key: "title",
      label: "Title",
      sortable: true,
    },
    {
      key: "type",
      label: "Type",
      render: (value: string) => getTypeBadge(value),
    },
    {
      key: "category",
      label: "Category",
      render: (value: string) => getCategoryBadge(value),
    },
    {
      key: "priority",
      label: "Priority",
      render: (value: string) => getPriorityBadge(value),
    },
    {
      key: "channels",
      label: "Channels",
      render: (value: string[]) => (
        <div className="flex space-x-1">
          {value?.map((channel, index) => (
            <Badge key={index} variant="outline" className="text-xs flex items-center gap-1">
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
      render: (value: boolean, row: Notification) => (
        <div className="flex items-center gap-2">
          <Badge variant={value ? "default" : "secondary"}>
            {value ? "Read" : "Unread"}
          </Badge>
          {row.readCount && row.totalRecipients && (
            <span className="text-xs text-gray-500">
              {row.readCount}/{row.totalRecipients}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (value: string) => new Date(value).toLocaleString(),
    },
  ];

  const NotificationDetails = ({ notification }: { notification: Notification }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getTypeIcon(notification.type)}
          <h3 className="text-lg font-semibold">{notification.title}</h3>
        </div>
        <div className="flex space-x-2">
          {getTypeBadge(notification.type)}
          {getCategoryBadge(notification.category)}
          {getPriorityBadge(notification.priority)}
        </div>
      </div>
      
      <div className="bg-section p-4 rounded-lg">
        <p className="text-sm">{notification.message}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-gray-500">Channels</Label>
          <div className="flex space-x-1 mt-1">
            {notification.channels?.map((channel, index) => (
              <Badge key={index} variant="outline" className="text-xs flex items-center gap-1">
                {getChannelIcon(channel)}
                <span>{channel === "inapp" ? "App" : channel}</span>
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-500">Status</Label>
          <div className="mt-1">
            <Badge variant={notification.isRead ? "default" : "secondary"}>
              {notification.isRead ? "Read" : "Unread"}
            </Badge>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-500">Created At</Label>
          <p className="mt-1 text-sm">{new Date(notification.createdAt).toLocaleString()}</p>
        </div>

        {notification.scheduledAt && (
          <div>
            <Label className="text-sm font-medium text-gray-500">Scheduled For</Label>
            <p className="mt-1 text-sm">{new Date(notification.scheduledAt).toLocaleString()}</p>
          </div>
        )}

        {notification.sentAt && (
          <div>
            <Label className="text-sm font-medium text-gray-500">Sent At</Label>
            <p className="mt-1 text-sm">{new Date(notification.sentAt).toLocaleString()}</p>
          </div>
        )}

        {notification.updatedAt && (
          <div>
            <Label className="text-sm font-medium text-gray-500">Updated At</Label>
            <p className="mt-1 text-sm">{new Date(notification.updatedAt).toLocaleString()}</p>
          </div>
        )}
      </div>

      {notification.recipients && notification.recipients.length > 0 && (
        <div>
          <Label className="text-sm font-medium text-gray-500">Recipients</Label>
          <div className="mt-1 flex flex-wrap gap-1">
            {notification.recipients.slice(0, 5).map((recipient, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {recipient}
              </Badge>
            ))}
            {notification.recipients.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{notification.recipients.length - 5} more
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const watchedChannels = watch("channels");

  return (
    <RoleGuard allowedRoles={["admin", "moderator"]}>
      <div className="space-y-6" data-testid="notifications-page">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              Manage system notifications and alerts
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              data-testid="refresh-notifications-btn"
            >
              {isRefreshing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
            <Button onClick={handleCreate} data-testid="create-notification-btn">
              <Plus className="h-4 w-4 mr-2" />
              Create Notification
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{notifications.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Read</p>
                  <p className="text-2xl font-bold">
                    {notifications.filter((n) => n.isRead).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Unread</p>
                  <p className="text-2xl font-bold">
                    {notifications.filter((n) => !n.isRead).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Urgent</p>
                  <p className="text-2xl font-bold">
                    {notifications.filter((n) => n.priority === "urgent").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="search-notifications-input"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by type" />
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
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by category" />
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different notification views */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            </TabsList>
            {activeTab === "unread" && notifications.filter(n => !n.isRead).length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                data-testid="mark-all-read-btn"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark All as Read
              </Button>
            )}
          </div>

          <TabsContent value={activeTab} className="space-y-4">
            <DataTable
              title="Notifications"
              data={filteredNotifications}
              columns={columns}
              searchKeys={["title", "message", "category"]}
              onView={handleView}
              loading={loading}
              emptyMessage="No notifications found"
              actions={[
                {
                  label: "View Details",
                  onClick: handleView,
                  variant: "default",
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
                  icon: Eye,
                },
                {
                  label: "Edit",
                  onClick: handleEdit,
                  variant: "default",
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
                  icon: Filter,
                },
                {
                  label: "Mark as Read",
                  onClick: handleMarkAsRead,
                  variant: "default",
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
                  icon: CheckCircle,
                  condition: (notification) => !notification.isRead,
                },
                {
                  label: "Delete",
                  onClick: handleDelete,
                  variant: "destructive",
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
                  icon: X,
                },
              ]}
            />
          </TabsContent>
        </Tabs>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>
                  {dialogMode === "create" 
                    ? "Create Notification" 
                    : dialogMode === "edit" 
                    ? "Edit Notification" 
                    : "Notification Details"}
                </DialogTitle>
                {dialogMode === "view" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(selectedNotification!)}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </DialogHeader>

            {dialogMode === "view" && selectedNotification ? (
              <NotificationDetails notification={selectedNotification} />
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    {...register("title", { required: "Title is required" })}
                    placeholder="Notification title"
                    data-testid="notification-title-input"
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    {...register("message", { required: "Message is required" })}
                    placeholder="Notification message"
                    rows={4}
                    data-testid="notification-message-input"
                  />
                  {errors.message && (
                    <p className="text-sm text-red-600">{errors.message.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={watch("type")}// eslint-disable-next-line @typescript-eslint/no-explicit-any
                      onValueChange={(value) => setValue("type", value as any)}
                    >
                      <SelectTrigger data-testid="notification-type-select">
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
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={watch("category")}// eslint-disable-next-line @typescript-eslint/no-explicit-any
                      onValueChange={(value) => setValue("category", value as any)}
                    >
                      <SelectTrigger data-testid="notification-category-select">
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

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={watch("priority")}// eslint-disable-next-line @typescript-eslint/no-explicit-any
                      onValueChange={(value) => setValue("priority", value as any)}
                    >
                      <SelectTrigger data-testid="notification-priority-select">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Channels</Label>
                  <div className="grid grid-cols-3 gap-4">
                    {["inapp", "email", "sms"].map((channel) => (
                      <div key={channel} className="flex items-center space-x-2">
                        <Checkbox
                          id={channel}// eslint-disable-next-line @typescript-eslint/no-explicit-any
                          checked={watchedChannels?.includes(channel as any)}
                          onCheckedChange={(checked) => {
                            const current = watchedChannels || [];
                            if (checked) {// eslint-disable-next-line @typescript-eslint/no-explicit-any
                              setValue("channels", [...current, channel as any]);
                            } else {
                              setValue("channels", current.filter(c => c !== channel));
                            }
                          }}
                          data-testid={`notification-channel-${channel}`}
                        />
                        <Label htmlFor={channel} className="capitalize flex items-center gap-1">
                          {getChannelIcon(channel)}
                          <span>{channel === "inapp" ? "In-App" : channel}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduledAt">Schedule (Optional)</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    {...register("scheduledAt")}
                    data-testid="notification-schedule-input"
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="notification-form-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    data-testid="notification-form-submit"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        {dialogMode === "create" ? "Creating..." : "Updating..."}
                      </>
                    ) : (
                      <>
                        {dialogMode === "create" ? "Create" : "Update"} Notification
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}