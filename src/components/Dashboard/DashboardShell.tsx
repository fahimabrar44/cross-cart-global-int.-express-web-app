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
import { useState, useRef, useEffect } from "react";
import { NotificationPanel } from "@/components/Dashboard/NotificationPanel";
import { Badge } from "@/components/ui/badge";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);

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
      <SidebarProvider>
        <AppSideBar />
        <SidebarInset>
          <header
            className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-t-xl"
            data-testid="dashboard-header"
          >
            <div className="flex items-center gap-2 px-4 relative w-full">
              <SidebarTrigger className="-ml-1" data-testid="sidebar-trigger" />
              <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  {pathNameArray.map((item, index) => (
                    <div key={item} className="hidden items-center align-middle gap-2 md:flex">
                      <BreadcrumbItem>
                        <BreadcrumbLink
                          href={`/dashboard/${pathNameArray.slice(0, index + 1).join("/")}`}
                          className="capitalize"
                          data-testid={`breadcrumb-${item}`}
                        >
                          {item}
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      {index < pathNameArray.length - 1 && <BreadcrumbSeparator />}
                    </div>
                  ))}
                  {pathNameArray.length > 0 && (
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        href={`/dashboard/${pathNameArray.join("/")}`}
                        className="capitalize md:hidden block"
                        data-testid={`mobile-breadcrumb-${pathNameArray[pathNameArray.length - 1]}`}
                      >
                        {pathNameArray[pathNameArray.length - 1]}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  )}
                </BreadcrumbList>
              </Breadcrumb>

              <div className="absolute right-5 top-[8%] flex justify-center align-middle items-center gap-5">
                {/* Notification Button with Badge */}
                <div className="relative">
                  <button
                    ref={notificationButtonRef}
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="relative p-1 rounded-full hover:bg-soft-green transition-colors"
                    data-testid="notification-button"
                  >
                    <BellRing
                      size={24}
                      className="cursor-pointer hover:text-primary transition-colors"
                    />
                    {/* Notification Badge */}
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      data-testid="notification-badge"
                    >
                      3
                    </Badge>
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
              className="absolute top-16 right-4 z-50 w-96 max-h-[80vh] overflow-hidden bg-white shadow-lg rounded-lg border"
              data-testid="notification-panel"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">Notifications</h3>
                <button
                  onClick={() => setIsNotificationOpen(false)}
                  className="p-1 rounded-full hover:bg-soft-green transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(80vh-60px)]">
                <NotificationPanel />
              </div>
            </div>
          )}

          <div className="flex flex-1 flex-col gap-4 p-4" data-testid="dashboard-content">
            {children}
            <Toaster expand={false} position="top-center" closeButton />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </RoleGuard>
  );
}
