"use client";

import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import type { MaintenanceCategory } from "@/types/database";

const COLORS = ["#3B82F6", "#EF4444", "#22C55E", "#F59E0B", "#8B5CF6", "#F97316"];

const zarFormat = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

interface CategorySlice {
  name: string;
  value: number;
  count: number;
}

const CATEGORY_LABELS: Record<MaintenanceCategory, string> = {
  routine: "Routine",
  repair: "Repair",
  emergency: "Emergency",
  inspection: "Inspection",
  compliance: "Compliance",
  accident_related: "Accident",
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: CategorySlice }>;
}) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="text-sm font-medium">{d.name}</p>
      <p className="font-mono text-sm">{zarFormat.format(d.value)}</p>
      <p className="text-xs text-muted-foreground">{d.count} events</p>
    </div>
  );
}

export function CategoryDonut() {
  const [data, setData] = useState<CategorySlice[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: events } = await supabase
        .from("maintenance_events")
        .select("category, cost_total");

      if (!events) {
        setLoading(false);
        return;
      }

      const catMap = new Map<string, { value: number; count: number }>();
      events.forEach((e) => {
        const existing = catMap.get(e.category) ?? { value: 0, count: 0 };
        existing.value += e.cost_total;
        existing.count += 1;
        catMap.set(e.category, existing);
      });

      const slices = Array.from(catMap.entries())
        .map(([cat, d]) => ({
          name: CATEGORY_LABELS[cat as MaintenanceCategory] ?? cat,
          value: d.value,
          count: d.count,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      setData(slices);
      setTotalCount(events.length);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton className="mb-4 h-5 w-40" />
        <Skeleton className="mx-auto h-[300px] w-[300px] rounded-full" />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-sm font-medium text-muted-foreground">
        Maintenance by Category
      </h3>
      <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string) => (
              <span className="text-xs">{value}</span>
            )}
          />
          {/* Center label */}
          <text
            x="50%"
            y="45%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground font-mono text-2xl font-bold"
          >
            {totalCount}
          </text>
          <text
            x="50%"
            y="53%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground text-xs"
          >
            events
          </text>
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
