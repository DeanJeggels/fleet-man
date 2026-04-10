"use client";

import { useEffect, useState } from "react";
import { Car, DollarSign, Wrench, Route } from "lucide-react";
import { startOfMonth, format } from "date-fns";
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
  const { fleetId } = useFleet();
  const [loading, setLoading] = useState(true);
  const [activeVehicles, setActiveVehicles] = useState(0);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [maintenanceSpend, setMaintenanceSpend] = useState(0);
  const [uberRevenue, setUberRevenue] = useState(0);
  const [fleetKm, setFleetKm] = useState(0);

  useEffect(() => {
    if (!fleetId) return;
    async function fetchKPIs() {
      const supabase = createClient();
      const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");

      const [
        { data: vehicleStatuses },
        { data: maintenanceCosts },
        { data: tripEarnings },
        { data: tripDistances },
      ] = await Promise.all([
        supabase.from("vehicles").select("status").eq("fleet_id", fleetId!),
        supabase
          .from("maintenance_events")
          .select("cost_total")
          .eq("fleet_id", fleetId!)
          .gte("event_date", monthStart),
        supabase
          .from("uber_trip_data")
          .select("total_earnings")
          .eq("fleet_id", fleetId!)
          .gte("period_date", monthStart),
        supabase
          .from("uber_trip_data")
          .select("distance_km")
          .eq("fleet_id", fleetId!)
          .gte("period_date", monthStart),
      ]);

      if (vehicleStatuses) {
        setTotalVehicles(vehicleStatuses.length);
        setActiveVehicles(
          vehicleStatuses.filter((v) => v.status === "active").length
        );
      }

      if (maintenanceCosts) {
        setMaintenanceSpend(
          maintenanceCosts.reduce((sum, m) => sum + m.cost_total, 0)
        );
      }

      if (tripEarnings) {
        setUberRevenue(
          tripEarnings.reduce((sum, t) => sum + t.total_earnings, 0)
        );
      }

      if (tripDistances) {
        setFleetKm(
          tripDistances.reduce((sum, t) => sum + t.distance_km, 0)
        );
      }

      setLoading(false);
    }
    fetchKPIs();
  }, [fleetId]);

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
        <KPICard
          title="Maintenance Spend MTD"
          value={zarFormat.format(maintenanceSpend)}
          icon={Wrench}
          color="destructive"
          subtitle="This month"
          loading={loading}
        />
        <KPICard
          title="Uber Revenue MTD"
          value={zarFormat.format(uberRevenue)}
          icon={DollarSign}
          color="success"
          subtitle="This month"
          loading={loading}
        />
        <KPICard
          title="Fleet Km MTD"
          value={Math.round(fleetKm)}
          icon={Route}
          color="warning"
          subtitle="This month"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RevenueChart />
        <CategoryDonut />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentMaintenance />
        <UpcomingServices />
      </div>
    </div>
  );
}
