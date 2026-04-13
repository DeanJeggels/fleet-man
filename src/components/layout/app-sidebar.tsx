"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Car,
  Wrench,
  Users,
  Building2,
  Fuel,
  BarChart3,
  Settings,
  Briefcase,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useFleet } from "@/contexts/fleet-context";

// ownerOnly items are hidden from members
const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", ownerOnly: false },
  { label: "Vehicles", icon: Car, href: "/vehicles", ownerOnly: false },
  { label: "Maintenance", icon: Wrench, href: "/maintenance/new", ownerOnly: false },
  { label: "Drivers", icon: Users, href: "/drivers", ownerOnly: false },
  { label: "Contract", icon: Briefcase, href: "/contract", ownerOnly: true },
  { label: "Suppliers", icon: Building2, href: "/suppliers", ownerOnly: true },
  { label: "Fuel Log", icon: Fuel, href: "/fuel", ownerOnly: true },
  { label: "Reports", icon: BarChart3, href: "/reports", ownerOnly: true },
  { label: "Settings", icon: Settings, href: "/settings", ownerOnly: false },
];

const driverNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Fuel Log", icon: Fuel, href: "/fuel" },
  { label: "Contract Trips", icon: Briefcase, href: "/contract/trips" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isOwnerOrAdmin, isDriver } = useFleet();

  const visibleItems = isDriver
    ? driverNavItems
    : navItems.filter((item) => isOwnerOrAdmin || !item.ownerOnly);

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#3B82F6]">
            <Car className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            Fleet Manager
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href));
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      className="cursor-pointer"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarTrigger className="cursor-pointer" />
      </SidebarFooter>
    </Sidebar>
  );
}
