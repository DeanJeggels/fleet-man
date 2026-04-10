"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { createClient } from "@/lib/supabase/client";
import { useFleet } from "@/contexts/fleet-context";
import type { MaintenanceCategory } from "@/types/database";

interface MaintenanceRow {
  id: string;
  event_date: string;
  description: string | null;
  category: MaintenanceCategory;
  cost_total: number;
  vehicle: { registration: string } | null;
}

const CATEGORY_LABELS: Record<MaintenanceCategory, string> = {
  routine: "Routine",
  repair: "Repair",
  emergency: "Emergency",
  inspection: "Inspection",
  compliance: "Compliance",
  accident_related: "Accident",
};

const CATEGORY_COLORS: Record<MaintenanceCategory, string> = {
  routine: "bg-blue-100 text-blue-700",
  repair: "bg-red-100 text-red-700",
  emergency: "bg-orange-100 text-orange-700",
  inspection: "bg-purple-100 text-purple-700",
  compliance: "bg-green-100 text-green-700",
  accident_related: "bg-amber-100 text-amber-700",
};

const zarFormat = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function RecentMaintenance() {
  const { fleetId } = useFleet();
  const [rows, setRows] = useState<MaintenanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!fleetId) return;
    async function fetchData() {
      const supabase = createClient();
      const { data } = await supabase
        .from("maintenance_events")
        .select(
          "id, event_date, description, category, cost_total, vehicle:vehicles(registration)"
        )
        .eq("fleet_id", fleetId!)
        .order("event_date", { ascending: false })
        .limit(8);

      if (data) {
        setRows(
          data.map((d) => ({
            ...d,
            vehicle: d.vehicle as unknown as { registration: string } | null,
          }))
        );
      }
      setLoading(false);
    }
    fetchData();
  }, [fleetId]);

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton className="mb-4 h-5 w-40" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="mb-2 h-8 w-full" />
        ))}
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Recent Maintenance
        </h3>
        <Link
          href="/reports"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View all
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No maintenance events recorded yet
        </p>
      ) : isMobile ? (
        <div className="space-y-3 max-h-[360px] overflow-y-auto">
          {rows.map((row) => (
            <div
              key={row.id}
              className="rounded-lg border p-3 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(row.event_date), "dd MMM yyyy")}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[row.category]}`}
                >
                  {CATEGORY_LABELS[row.category]}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">
                  {row.vehicle?.registration ?? "—"}
                </span>
                <span className="text-sm font-mono font-medium">
                  {zarFormat.format(row.cost_total)}
                </span>
              </div>
              {row.description && (
                <p className="text-xs text-muted-foreground truncate">
                  {row.description}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="max-h-[360px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="pb-2 text-left font-medium">Date</th>
                <th className="pb-2 text-left font-medium">Vehicle</th>
                <th className="pb-2 text-left font-medium">Description</th>
                <th className="pb-2 text-left font-medium">Category</th>
                <th className="pb-2 text-right font-medium">Cost</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="py-2 text-muted-foreground whitespace-nowrap">
                    {format(new Date(row.event_date), "dd MMM yyyy")}
                  </td>
                  <td className="py-2 font-medium whitespace-nowrap">
                    {row.vehicle?.registration ?? "—"}
                  </td>
                  <td className="py-2 max-w-[200px] truncate text-muted-foreground">
                    {row.description ?? "—"}
                  </td>
                  <td className="py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[row.category]}`}
                    >
                      {CATEGORY_LABELS[row.category]}
                    </span>
                  </td>
                  <td className="py-2 text-right font-mono whitespace-nowrap">
                    {zarFormat.format(row.cost_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
