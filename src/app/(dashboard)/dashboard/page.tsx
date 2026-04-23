"use client";

import Link from "next/link";
import { Car, DollarSign, Wrench, Route, Fuel, Briefcase } from "lucide-react";
import { startOfMonth, format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useFleet } from "@/contexts/fleet-context";
import { KPICard } from "@/components/shared/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { CategoryDonut } from "@/components/dashboard/category-donut";
import { RecentMaintenance } from "@/components/dashboard/recent-maintenance";
import { UpcomingServices } from "@/components/dashboard/upcoming-services";

const zarFormat = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default function DashboardPage() {
  const { fleetId, isOwnerOrAdmin, isDriver, displayName } = useFleet();

  // Single batched KPI query — same key shape as useRoutePrefetch (excluding
  // `isDriver` gate here because prefetch runs for the owner navigation).
  const { data, isPending } = useQuery({
    queryKey: ["dashboard-kpis", fleetId],
    enabled: !!fleetId && !isDriver,
    queryFn: async () => {
      const supabase = createClient();
      const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const [vehiclesRes, maintRes, uberRes] = await Promise.all([
        supabase
          .from("vehicles")
          .select("id, status, category")
          .eq("fleet_id", fleetId!),
        supabase
          .from("maintenance_events")
          .select("cost_total, event_date")
          .eq("fleet_id", fleetId!)
          .gte("event_date", monthStart),
        supabase
          .from("uber_trip_data")
          .select("total_earnings, distance_km, period_date")
          .eq("fleet_id", fleetId!)
          .gte("period_date", monthStart),
      ]);
      return {
        vehicles: vehiclesRes.data ?? [],
        maintenance: maintRes.data ?? [],
        uber: uberRes.data ?? [],
      };
    },
  });

  const loading = isPending;
  const totalVehicles = data?.vehicles.length ?? 0;
  const activeVehicles =
    data?.vehicles.filter((v) => v.status === "active").length ?? 0;
  const maintenanceSpend =
    data?.maintenance.reduce((sum, m) => sum + Number(m.cost_total ?? 0), 0) ?? 0;
  const uberRevenue =
    data?.uber.reduce((sum, t) => sum + Number(t.total_earnings ?? 0), 0) ?? 0;
  const fleetKm =
    data?.uber.reduce((sum, t) => sum + Number(t.distance_km ?? 0), 0) ?? 0;

  if (isDriver) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={`Welcome${displayName ? `, ${displayName}` : ""}`}
          description="Log your trips and fuel receipts from your phone."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/fuel"
            className="group flex items-start gap-4 rounded-lg border-2 border-transparent bg-white p-6 shadow-sm transition-colors hover:border-blue-500/40"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-600">
              <Fuel className="h-6 w-6" />
            </div>
            <div>
              <p className="text-base font-semibold">Log Fuel Receipt</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Snap a photo of your receipt — we&apos;ll fill in the rest.
              </p>
            </div>
          </Link>
          <Link
            href="/contract/trips"
            className="group flex items-start gap-4 rounded-lg border-2 border-transparent bg-white p-6 shadow-sm transition-colors hover:border-blue-500/40"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-600">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <p className="text-base font-semibold">Log a Trip</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Record a contract trip you just completed.
              </p>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Fleet overview and key metrics"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPICard
          title="Active Vehicles"
          value={activeVehicles}
          icon={Car}
          color="accent"
          subtitle={`${totalVehicles} total`}
          loading={loading}
        />
        {isOwnerOrAdmin && (
          <>
            <KPICard
              title="Maintenance Spend MTD"
              value={zarFormat.format(maintenanceSpend)}
              icon={Wrench}
              color="destructive"
              subtitle="This month"
              loading={loading}
            />
            <KPICard
              title="E-Hailing Revenue MTD"
              value={zarFormat.format(uberRevenue)}
              icon={DollarSign}
              color="success"
              subtitle="This month"
              loading={loading}
            />
          </>
        )}
        <KPICard
          title="Fleet Km MTD"
          value={Math.round(fleetKm)}
          icon={Route}
          color="warning"
          subtitle="This month"
          loading={loading}
        />
      </div>

      {isOwnerOrAdmin && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <RevenueChart />
          <CategoryDonut />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentMaintenance />
        <UpcomingServices />
      </div>
    </div>
  );
}
