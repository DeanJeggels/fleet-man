"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
  LayoutDashboard,
  Car,
  Wrench,
  Fuel,
  MoreHorizontal,
  Users,
  Building2,
  BarChart3,
  Settings,
  Briefcase,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useFleet } from "@/contexts/fleet-context";

type Tab = { label: string; icon: typeof LayoutDashboard; href: string; ownerOnly?: boolean };

const allMainTabs: Tab[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Vehicles", icon: Car, href: "/vehicles" },
  { label: "Maintenance", icon: Wrench, href: "/maintenance/new" },
  { label: "Contract", icon: Briefcase, href: "/contract", ownerOnly: true },
  { label: "Fuel", icon: Fuel, href: "/fuel", ownerOnly: true },
];

const allMoreTabs: Tab[] = [
  { label: "Drivers", icon: Users, href: "/drivers" },
  { label: "Suppliers", icon: Building2, href: "/suppliers", ownerOnly: true },
  { label: "Reports", icon: BarChart3, href: "/reports", ownerOnly: true },
  { label: "Settings", icon: Settings, href: "/settings" },
];

const driverMainTabs: Tab[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Fuel", icon: Fuel, href: "/fuel" },
  { label: "Trips", icon: Briefcase, href: "/contract/trips" },
];

export function BottomTabs() {
  const pathname = usePathname();
  const { isOwnerOrAdmin, isDriver } = useFleet();
  const [open, setOpen] = useState(false);

  const mainTabs = isDriver
    ? driverMainTabs
    : allMainTabs.filter((t) => isOwnerOrAdmin || !t.ownerOnly).slice(0, 4);
  const moreTabs = isDriver ? [] : allMoreTabs.filter((t) => isOwnerOrAdmin || !t.ownerOnly);

  const isMoreActive = moreTabs.some(
    (t) => pathname === t.href || pathname.startsWith(t.href)
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-white lg:hidden">
      {mainTabs.map((tab) => {
        const isActive =
          pathname === tab.href ||
          (tab.href !== "/dashboard" && pathname.startsWith(tab.href));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 text-xs transition-colors duration-150 ${
              isActive ? "text-[#3B82F6]" : "text-muted-foreground"
            }`}
          >
            <tab.icon className="h-5 w-5" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
      {moreTabs.length > 0 && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 text-xs transition-colors duration-150 cursor-pointer ${
              isMoreActive ? "text-[#3B82F6]" : "text-muted-foreground"
            }`}
            aria-label="More navigation options"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>More</span>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1" align="end" side="top">
            {moreTabs.map((tab) => {
              const isActive =
                pathname === tab.href || pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors duration-150 ${
                    isActive
                      ? "bg-accent/10 text-[#3B82F6]"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </PopoverContent>
        </Popover>
      )}
    </nav>
  );
}
