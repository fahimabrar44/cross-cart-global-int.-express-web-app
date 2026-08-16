"use client";

import {
  BadgeDollarSign,
  BarChart3,
  Bell,
  Boxes,
  BoxIcon,
  CircleUserRound,
  LayoutDashboard,
  LifeBuoy,
  Package,
  Radar,
  Rss,
  Send,
  Settings2,
  UserStar,
  Truck,
  TicketPercent,
  UserPlus,
  Users,
  Activity,
  FileDown,
} from "lucide-react";

// Navigation data for different user roles
export const AdminData = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
      items: [],
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: BarChart3,
      items: [
      
      ],
    },
    {
      title: "Profile",
      url: "/dashboard/profile",
      icon: CircleUserRound,
      items: [],
    },
    {
      title: "Pickups",
      url: "/dashboard/pickups",
      icon: Package,
      items: [],
    },
    {
      title: "Rate Charts",
      url: "/dashboard/rate-charts",
      icon: BadgeDollarSign,
      items: [
        { title: "Countrys", url: "/dashboard/rate-charts/countrys" },
        { title: "Zones", url: "/dashboard/rate-charts/zones" },
        { title: "Rate Charts", url: "/dashboard/rate-charts" },
        { title: "Address Book", url: "/dashboard/rate-charts/address" },
      ],
    },
    {
      title: "Orders",
      url: "/dashboard/orders",
      icon: Boxes,
      items: [],
    },
    {
      title: "Parcel Tracking",
      url: "/dashboard/parcel-tracking",
      icon: BoxIcon,
      items: [],
    },
    {
      title: "TrackingMore",
      url: "/dashboard/tracking-more",
      icon: Radar,
      items: [],
    },
    {
      title: "Riders",
      url: "/dashboard/riders",
      icon: Truck,
      items: [],
    },
    {
      title: "Coupons",
      url: "/dashboard/coupons",
      icon: TicketPercent,
      items: [],
    },
    {
      title: "Referrals",
      url: "/dashboard/referrals",
      icon: UserPlus,
      items: [],
    },
    {
      title: "Visitors",
      url: "/dashboard/visitors",
      icon: Users,
      items: [],
    },
    {
      title: "Activity",
      url: "/dashboard/activity",
      icon: Activity,
      items: [],
    },
    {
      title: "Export",
      url: "/dashboard/export",
      icon: FileDown,
      items: [],
    },
    {
      title: "Reviews",
      url: "/dashboard/reviews",
      icon: UserStar,
      items: [],
    },
    {
      title: "Content",
      url: "/dashboard/contents",
      icon: Rss,
      items: [
        { title: "All Contact", url: "/dashboard/contact" },
        { title: "Blog Posts", url: "/dashboard/contents/blogs" },
        { title: "Team Members", url: "/dashboard/contents/team-members" },
        { title: "FAQs", url: "/dashboard/contents/faqs" },
        { title: "Careers", url: "/dashboard/contents/careers" },
      ],
    },
    {
      title: "Notifications",
      url: "/dashboard/notifications",
      icon: Bell,
      items: [],
    },
    {
      title: "Users",
      url: "/dashboard/users",
      icon: CircleUserRound,
      items: [
        { title: "All Users", url: "/dashboard/users" },
        { title: "Normal User", url: "/dashboard/users?role=user" },
        { title: "Admin Users", url: "/dashboard/users?role=admin" },
        { title: "Moderator User", url: "/dashboard/users?role=moderator" },
      ],
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings2,
      items: [
        { title: "General", url: "/dashboard/settings" },
        { title: "Address", url: "/dashboard/settings/address" },
        { title: "Offers", url: "/dashboard/settings/offers" },
        { title: "Api Key", url: "/dashboard/settings/api-config-and-access" },
        { title: "Account Activity", url: "/dashboard/settings/login-history" },
        { title: "Tracking API", url: "/dashboard/settings/tracking-api" },
        { title: "Marketing Tools", url: "/dashboard/settings/marketing" },
      ],
    },
  ],
  navSecondary: [
    { title: "Support", url: "/dashboard/support", icon: LifeBuoy },
    { title: "Feedback", url: "/dashboard/feedback", icon: Send },
  ],
};

export const ModeratorData = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
      items: [],
    },
    {
      title: "Profile",
      url: "/dashboard/profile",
      icon: CircleUserRound,
      items: [],
    },
    {
      title: "Pickups",
      url: "/dashboard/pickups",
      icon: Package,
      items: [],
    },
    {
      title: "Rate Charts",
      url: "/dashboard/rate-charts",
      icon: BadgeDollarSign,
      items: [
        { title: "Countrys", url: "/dashboard/rate-charts/countrys" },
        { title: "Zones", url: "/dashboard/rate-charts/zones" },
        { title: "Rate Charts", url: "/dashboard/rate-charts" },
        { title: "Address Book", url: "/dashboard/rate-charts/address" },
      ],
    },
    {
      title: "Orders",
      url: "/dashboard/orders",
      icon: Boxes,
      items: [],
    },
    {
      title: "Parcel Tracking",
      url: "/dashboard/parcel-tracking",
      icon: BoxIcon,
      items: [],
    },
    {
      title: "TrackingMore",
      url: "/dashboard/tracking-more",
      icon: Radar,
      items: [],
    },
    {
      title: "Riders",
      url: "/dashboard/riders",
      icon: Truck,
      items: [],
    },
    {
      title: "Coupons",
      url: "/dashboard/coupons",
      icon: TicketPercent,
      items: [],
    },
    {
      title: "Reviews",
      url: "/dashboard/reviews",
      icon: UserStar,
      items: [
        { title: "All Reviews", url: "/dashboard/reviews" },
        { title: "Pending Reviews", url: "/dashboard/reviews?status=pending" },
        {
          title: "Approved Reviews",
          url: "/dashboard/reviews?status=approved",
        },
      ],
    },
    {
      title: "Visitors",
      url: "/dashboard/visitors",
      icon: Users,
      items: [],
    },
    {
      title: "Activity",
      url: "/dashboard/activity",
      icon: Activity,
      items: [],
    },
    {
      title: "Content",
      url: "/dashboard/contents",
      icon: Rss,
      items: [
        { title: "All Contacts", url: "/dashboard/contents" },
        { title: "Blog Posts", url: "/dashboard/contents/blogs" },
      ],
    },
    {
      title: "Notifications",
      url: "/dashboard/notifications",
      icon: Bell,
      items: [
        { title: "All Notifications", url: "/dashboard/notifications" },
        {
          title: "Unread Notifications",
          url: "/dashboard/notifications?read=false",
        },
      ],
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings2,
      items: [
        { title: "General", url: "/dashboard/settings" },
        { title: "Address", url: "/dashboard/settings/address" },
        { title: "Api Key", url: "/dashboard/settings/api-config-and-access" },
        { title: "Account Activity", url: "/dashboard/settings/login-history" },
        { title: "Tracking API", url: "/dashboard/settings/tracking-api" },
        { title: "Marketing Tools", url: "/dashboard/settings/marketing" },
      ],
    },
  ],
  navSecondary: [
    { title: "Support", url: "/dashboard/support", icon: LifeBuoy },
    { title: "Feedback", url: "/dashboard/feedback", icon: Send },
  ],
};

export const UserData = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
      items: [],
    },
    {
      title: "Profile",
      url: "/dashboard/profile",
      icon: CircleUserRound,
      items: [],
    },
    {
      title: "Pickups",
      url: "/dashboard/pickups",
      icon: Package,
      items: [],
    },
    {
      title: "Rate Charts",
      url: "/dashboard/rate-charts",
      icon: BadgeDollarSign,
      items: [
        { title: "Countrys", url: "/dashboard/rate-charts/countrys" },
        { title: "Rate Charts", url: "/dashboard/rate-charts" },
      ],
    },
    {
      title: "Orders",
      url: "/dashboard/orders",
      icon: Boxes,
      items: [
        { title: "My Orders", url: "/dashboard/orders" },
      ],
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings2,
      items: [
        { title: "Profile", url: "/dashboard/settings" },
        { title: "Address", url: "/dashboard/settings/address" },
        { title: "API Keys", url: "/dashboard/settings/api-keys" },
        { title: "API Integration", url: "/api-integration" },
        { title: "Login History", url: "/dashboard/settings/login-history" },
      ],
    },
  ],
  navSecondary: [
    { title: "Support", url: "/dashboard/support", icon: LifeBuoy },
    { title: "Feedback", url: "/dashboard/feedback", icon: Send },
  ],
};

// Export navigation data getter function
export const getNavigationData = (role: "admin" | "moderator" | "user") => {
  switch (role) {
    case "admin":
      return AdminData;
    case "moderator":
      return ModeratorData;
    case "user":
      return UserData;
    default:
      return UserData;
  }
};

// Export constants for use in other components
export const USER_ROLES = {
  ADMIN: "admin",
  MODERATOR: "moderator",
  USER: "user",
} as const;

export const NAVIGATION_SECTIONS = {
  MAIN: "navMain",
  SECONDARY: "navSecondary",
} as const;
