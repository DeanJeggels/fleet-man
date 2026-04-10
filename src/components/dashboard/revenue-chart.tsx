"use client";

import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, subMonths, startOfMonth } from "date-fns";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { useFleet } from "@/contexts/fleet-context";

interface MonthData {
  month: string;
  revenue: number;
  maintenance: number;
}

const zarFormat = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="mb-1 text-sm font-medium">{label}</p>
      {payload.map((entry) => (
        <p
          key={entry.name}
          className="font-mono text-sm"
          style={{ color: entry.color }}
        >
          {entry.name}: {zarFormat.format(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function RevenueChart() {
  const { fleetId } = useFleet();
  const [data, setData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!fleetId) return;
    async function fetchData() {
      const supabase = createClient();
      const now = new Date();
      const sixMonthsAgo = startOfMonth(subMonths(now, 5));
      const sixMonthsAgoStr = format(sixMonthsAgo, "yyyy-MM-dd");

      const [{ data: trips }, { data: maintenance }] = await Promise.all([
        supabase
          .from("uber_trip_data")
          .select("period_date, total_earnings")
          .eq("fleet_id", fleetId!)
          .gte("period_date", sixMonthsAgoStr),
        supabase
          .from("maintenance_events")
          .select("event_date, cost_total")
          .eq("fleet_id", fleetId!)
          .gte("event_date", sixMonthsAgoStr),
      ]);

      const monthMap = new Map<string, MonthData>();
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(now, i);
        const key = format(d, "yyyy-MM");
        monthMap.set(key, {
          month: format(d, "MMM yyyy"),
          revenue: 0,
          maintenance: 0,
        });
      }

      trips?.forEach((t) => {
        const key = t.period_date.substring(0, 7);
        const entry = monthMap.get(key);
        if (entry) entry.revenue += t.total_earnings;
      });

      maintenance?.forEach((m) => {
        const key = m.event_date.substring(0, 7);
        const entry = monthMap.get(key);
        if (entry) entry.maintenance += m.cost_total;
      });

      setData(Array.from(monthMap.values()));
      setLoading(false);
    }
    fetchData();
  }, [fleetId]);

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton className="mb-4 h-5 w-40" />
        <Skeleton className="h-[300px] w-full" />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-sm font-medium text-muted-foreground">
        Revenue vs Maintenance (6 months)
      </h3>
      <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: isMobile ? 10 : 12 }}
            className="text-muted-foreground"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(v: number) => `R${(v / 1000).toFixed(0)}k`}
            className="text-muted-foreground"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar
            dataKey="revenue"
            name="Revenue"
            fill="#3B82F6"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="maintenance"
            name="Maintenance"
            fill="#EF4444"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
