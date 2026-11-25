"use client";
import { RoleGuard } from "@/middleware/roleGuard";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSideBar } from "@/components/Nav/AppSideBar";
import { useAuth } from "@/hooks/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BellRing, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { Fragment, useCallback, useState, useRef, useEffect } from "react";
import { NotificationPanel } from "@/components/Dashboard/NotificationPanel";
import { Badge } from "@/components/ui/badge";
import { NotificationService } from "@/services/dashboardService";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const notificationRef = useRef<HTMLDivElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);

  // Keep the full sidebar on large desktops, collapse it to an icon rail on
  // tablets, and let phones use the slide-over sidebar.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1280px)");
    const apply = () => setSidebarOpen(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  // Load the real unread count for the signed-in viewer. The API scopes the
  // list by role, so users see their own count while admins/moderators see the
  // whole system's unread count.
  const loadUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await NotificationService.getNotifications({
        limit: 1,
        read: false,
      });
      if (response.success) {
        setUnreadCount(
          typeof response.meta?.unread === "number"
            ? response.meta.unread
            : (response.data || []).filter((item) => !item.isRead).length
        );
      }
    } catch {
      // Keep the last known count if the refresh fails.
    }
  }, [user]);

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 60_000);
    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  // Pages and the notification panel emit this after creating, reading or
  // deleting a notification so the header badge stays in sync immediately.
  useEffect(() => {
    const handleNotificationsChanged = () => loadUnreadCount();
    window.addEventListener(
      "crosscart:notifications-changed",
      handleNotificationsChanged
    );
    return () => {
      window.removeEventListener(
        "crosscart:notifications-changed",
        handleNotificationsChanged
      );
    };
  }, [loadUnreadCount]);

  // Generate breadcrumb from pathname
  const pathNameArray = pathname
    .split("/")
    .filter((path) => path !== "" && path !== "dashboard")
    .map((path) => path.replace(/-/g, " "));

  // Close notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node) &&
        notificationButtonRef.current &&
        !notificationButtonRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <RoleGuard allowedRoles={["admin", "moderator", "user"]}>
      <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <AppSideBar />
        <SidebarInset className="min-w-0">
          <header
            className="sticky top-0 z-50 flex h-14 shrink-0 items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:h-16"
            data-testid="dashboard-header"
          >
            <div className="relative flex w-full min-w-0 items-center gap-1.5 px-3 sm:gap-2 sm:px-4">
              <SidebarTrigger
                className="-ml-1 size-9 shrink-0 sm:size-8"
                data-testid="sidebar-trigger"
              />
              <Separator
                orientation="vertical"
                className="mr-1 hidden data-[orientation=vertical]:h-4 sm:block"
              />
              <Breadcrumb className="min-w-0 flex-1">
                <BreadcrumbList className="flex-nowrap">
                  {pathNameArray.map((item, index) => (
                    <Fragment key={`${item}-${index}`}>
                      <BreadcrumbItem
                        className={
                          index === pathNameArray.length - 1
                            ? "flex min-w-0"
                            : "hidden min-w-0 md:flex"
                        }
                      >
                        <BreadcrumbLink
                          href={`/dashboard/${pathNameArray
                            .slice(0, index + 1)
                            .join("/")}`}
                          className="block max-w-[45vw] truncate capitalize sm:max-w-none"
                          data-testid={`breadcrumb-${item}`}
                        >
                          {item}
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      {index < pathNameArray.length - 1 && (
                        <BreadcrumbSeparator className="hidden md:block" />
                      )}
                    </Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>

              <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3">
                {/* Notification Button with Badge */}
                <div className="relative">
                  <button
                    ref={notificationButtonRef}
                    onClick={() => {
                      setIsNotificationOpen((open) => !open);
                      loadUnreadCount();
                    }}
                    className="relative grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-soft-green"
                    data-testid="notification-button"
                    aria-expanded={isNotificationOpen}
                    aria-label={
                      unreadCount > 0
                        ? `${unreadCount} unread notifications`
                        : "Notifications"
                    }
                  >
                    <BellRing
                      size={20}
                      className="cursor-pointer transition-colors hover:text-primary"
                    />
                    {/* Real unread count for the current viewer */}
                    {unreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] leading-none"
                        data-testid="notification-badge"
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Badge>
                    )}
                  </button>
                </div>

                <Avatar className="h-8 w-8 rounded-lg" data-testid="user-avatar">
                  <AvatarImage src={user?.avatar || ""} alt="USER PROFILE" />
                  <AvatarFallback className="rounded-lg">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>

          {/* Notification Panel Dropdown */}
          {isNotificationOpen && (
            <div
              ref={notificationRef}
              className="fixed inset-x-3 top-14 z-50 max-h-[calc(100dvh-4.5rem)] overflow-hidden rounded-xl border bg-white shadow-lg sm:absolute sm:inset-x-auto sm:right-4 sm:top-16 sm:max-h-[80vh] sm:w-96"
              data-testid="notification-panel"
            >
              <div className="flex items-center justify-between border-b p-4">
                <h3 className="font-semibold">Notifications</h3>
                <button
                  onClick={() => setIsNotificationOpen(false)}
                  className="rounded-full p-1 transition-colors hover:bg-soft-green"
                  aria-label="Close notifications"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="max-h-[calc(100dvh-8.5rem)] overflow-y-auto overscroll-contain sm:max-h-[calc(80vh-60px)]">
                <NotificationPanel onUnreadChange={loadUnreadCount} />
              </div>
            </div>
          )}

          <div
            className="flex min-w-0 flex-1 flex-col gap-4 p-3 sm:p-4 lg:p-6"
            data-testid="dashboard-content"
          >
            {children}
            <Toaster expand={false} position="top-center" closeButton />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </RoleGuard>
  );
}
