"use client";

import { NOTIFICATION_API } from "@/components/ApiCall/url";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/AuthContext";
import {
  AlertCircle,
  Bell,
  CheckCircle,
  Info,
  Loader2,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface NotificationUser {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  category: "order" | "account" | "security" | "system" | "payment";
  priority?: "low" | "normal" | "high" | "urgent";
  isRead: boolean;
  createdAt: string;
  userId?: string | NotificationUser;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}

function recipientLabel(userId: Notification["userId"]): string {
  if (!userId) return "Unknown recipient";
  if (typeof userId === "string") return userId;
  return userId.name || userId.email || userId.phone || "Unknown recipient";
}

export function NotificationPanel({
  onUnreadChange,
}: {
  onUnreadChange?: () => void;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [limit, setLimit] = useState(20);
  const { user } = useAuth();
  const isStaff = user?.role === "admin" || user?.role === "moderator";

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      const queryParams = new URLSearchParams({
        limit: String(limit),
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      if (filter !== "all") {
        queryParams.append("read", filter === "read" ? "true" : "false");
      }

      const response = await fetch(`${NOTIFICATION_API}?${queryParams}`, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setNotifications(data.data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user, filter, limit]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationIds: string[]) => {
    if (!user || notificationIds.length === 0) return;

    try {
      const response = await fetch(NOTIFICATION_API, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          notificationIds,
          isRead: true,
        }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notificationIds.includes(notification._id)
              ? { ...notification, isRead: true }
              : notification
          )
        );
        onUnreadChange?.();
      }
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "normal":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Please sign in to view your notifications
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full border-0 shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilter(filter === "all" ? "unread" : "all")}
          >
            <Settings className="mr-1 h-4 w-4" />
            {filter === "all" ? "Show Unread" : "Show All"}
          </Button>
        </div>
        <CardDescription>
          {isStaff
            ? "All system notifications across every user"
            : "Updates and alerts for your account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center">
            <Bell className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <h3 className="mb-2 font-medium text-foreground">No notifications</h3>
            <p className="text-sm text-gray-600">
              {filter === "unread"
                ? "You're all caught up! No unread notifications."
                : isStaff
                  ? "No system notifications have been created yet."
                  : "You don't have any notifications yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {unreadCount > 0 && (
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm text-gray-600">
                  {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    markAsRead(
                      notifications
                        .filter((notification) => !notification.isRead)
                        .map((notification) => notification._id)
                    )
                  }
                >
                  Mark all as read
                </Button>
              </div>
            )}

            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`rounded-lg border p-4 transition-colors ${
                    notification.isRead
                      ? "border-gray-200 bg-white"
                      : "border-blue-200 bg-blue-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="mt-0.5">
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h4 className="truncate font-medium text-foreground">
                            {notification.title}
                          </h4>
                          {notification.priority && (
                            <Badge
                              variant="outline"
                              className={getPriorityBadgeColor(notification.priority)}
                            >
                              {notification.priority}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs capitalize">
                            {notification.category}
                          </Badge>
                        </div>
                        <p className="mb-2 text-sm text-gray-600">
                          {notification.message}
                        </p>
                        {isStaff && (
                          <p className="mb-1 text-xs font-medium text-gray-500">
                            To: {recipientLabel(notification.userId)}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead([notification._id])}
                        className="h-8 w-8 p-0"
                        title="Mark as read"
                        aria-label="Mark as read"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2 border-t pt-3">
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/notifications">View all</Link>
              </Button>
              {notifications.length >= limit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLimit((current) => current + 20)}
                >
                  Load more
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
