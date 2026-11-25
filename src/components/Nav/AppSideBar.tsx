"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/AuthContext";
import Image from "next/image";
import { AdminData, ModeratorData, UserData } from "../ApiCall/data";
import { NavUser } from "./NavIUser";
import { NavMain } from "./NavMain";
import { NavSecondary } from "./NavSecondary";

export function AppSideBar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const auth = useAuth();

  const data =
    auth.user?.role == "user"
      ? {
          ...UserData,
          user: {
            name: auth.user?.name ?? "",
            email: auth.user?.email ?? "",
            avatar: "",
          },
        }
      : auth.user?.role == "moderator"
      ? {
          ...ModeratorData,
          user: {
            name: auth.user?.name ?? "",
            email: auth.user?.email ?? "",
            avatar: "",
          },
        }
      : auth.user?.role == "admin"
      ? {
          ...AdminData,
          user: {
            name: auth.user?.name ?? "",
            email: auth.user?.email ?? "",
            avatar: "",
          },
        }
      : {
          ...UserData,
          user: {
            name: auth.user?.name ?? "",
            email: auth.user?.email ?? "",
            avatar: "",
          },
        };

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="group-data-[collapsible=icon]:p-0!"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Image
                  src="/logos/logo.webp"
                  alt="Cross Cart Global"
                  width={40}
                  height={40}
                  className="size-8 shrink-0 rounded-full object-contain"
                />
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-bold">CROSSCART COURIER</span>
                  <span className="truncate text-xs font-semibold">
                    INTERNATIONAL COURIER
                  </span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
