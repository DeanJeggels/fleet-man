"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { KPICard } from "@/components/shared/kpi-card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Wrench, Fuel, DollarSign, MapPin } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ServiceScheduleCard } from "@/components/vehicles/service-schedule-card";
import type { Tables } from "@/types/database";
import { useFleet } from "@/contexts/fleet-context";

const formatZAR = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
});

interface OverviewTabProps {
  vehicle: Tables<"vehicles">;
}

interface MonthlyCost {
  month: string;
  maintenance: number;
  fuel: number;
}

export function OverviewTab({ vehicle }: OverviewTabProps) {
  const { fleetId } = useFleet();
  const [monthlyCosts, setMonthlyCosts] = useState<MonthlyCost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fleetId) return;
    async function fetchMonthlyCosts() {
      const supabase = createClient();

      const [{ data: maintenance }, { data: fuel }] = await Promise.all([
        supabase
          .from("maintenance_events")
          .select("event_date, cost_total")
          .eq("vehicle_id", vehicle.id)
          .eq("fleet_id", fleetId!)
          .order("event_date", { ascending: true }),
        supabase
          .from("fuel_logs")
          .select("week_starting, cost")
          .eq("vehicle_id", vehicle.id)
          .eq("fleet_id", fleetId!)
          .order("week_starting", { ascending: true }),
      ]);

      const costMap = new Map<string, MonthlyCost>();

      maintenance?.forEach((e) => {
        const month = format(parseISO(e.event_date), "yyyy-MM");
        const existing = costMap.get(month) || { month, maintenance: 0, fuel: 0 };
        existing.maintenance += e.cost_total;
        costMap.set(month, existing);
      });

      fuel?.forEach((f) => {
        const month = format(parseISO(f.week_starting), "yyyy-MM");
        const existing = costMap.get(month) || { month, maintenance: 0, fuel: 0 };
        existing.fuel += f.cost;
        costMap.set(month, existing);
      });

      const sorted = Array.from(costMap.values()).sort((a, b) =>
        a.month.localeCompare(b.month)
      );

      setMonthlyCosts(sorted);
      setLoading(false);
    }

    fetchMonthlyCosts();
  }, [vehicle.id, fleetId]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Maintenance"
          value={formatZAR.format(vehicle.total_maintenance_cost)}
          icon={Wrench}
          color="destructive"
        />
        <KPICard
          title="Total Fuel"
          value={formatZAR.format(vehicle.total_fuel_cost)}
          icon={Fuel}
          color="warning"
        />
        <KPICard
          title="Uber Earnings"
          value={formatZAR.format(vehicle.total_earnings)}
          icon={DollarSign}
          color="success"
        />
        <KPICard
          title="Distance"
          value={`${vehicle.total_distance_km.toLocaleString()} km`}
          icon={MapPin}
          color="accent"
        />
      </div>

      <ServiceScheduleCard
        vehicleId={vehicle.id}
        currentOdometer={vehicle.current_odometer}
      />

      <div className="rounded-lg border p-4">
        <h3 className="mb-4 text-sm font-medium">Monthly Costs</h3>
        {loading ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : monthlyCosts.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No cost data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyCosts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickFormatter={(v: string) => format(parseISO(`${v}-01`), "MMM yy")}
                fontSize={12}
              />
              <YAxis
                tickFormatter={(v: number) => formatZAR.format(v)}
                fontSize={12}
              />
              <Tooltip
                formatter={(value) => formatZAR.format(Number(value))}
                labelFormatter={(label) =>
                  format(parseISO(`${String(label)}-01`), "MMMM yyyy")
                }
              />
              <Area
                type="monotone"
                dataKey="maintenance"
                stackId="1"
                stroke="#EF4444"
                fill="#EF4444"
                fillOpacity={0.3}
                name="Maintenance"
              />
              <Area
                type="monotone"
                dataKey="fuel"
                stackId="1"
                stroke="#F59E0B"
                fill="#F59E0B"
                fillOpacity={0.3}
                name="Fuel"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
