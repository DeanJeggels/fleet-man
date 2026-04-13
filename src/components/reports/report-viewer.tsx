"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useFleet } from "@/contexts/fleet-context";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";

import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

export type ReportType =
  | "maintenance_history"
  | "vehicle_costs"
  | "supplier_spend"
  | "fuel_consumption"
  | "uber_performance"
  | "routine_vs_emergency"
  | "distance_analysis"
  | "contract_trips";

export interface ReportFilters {
  startDate: string | null;
  endDate: string | null;
  vehicleId: string | null;
  supplierId: string | null;
}

const zarFormat = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
});

function zar(val: number | null | undefined): string {
  return val != null ? zarFormat.format(val) : "-";
}

const COLUMN_CONFIGS: Record<ReportType, ColumnDef<Row>[]> = {
  maintenance_history: [
    { key: "event_date", header: "Date", sortable: true },
    { key: "vehicle_reg", header: "Vehicle", sortable: true },
    { key: "event_type_name", header: "Type" },
    { key: "category", header: "Category" },
    { key: "supplier_name", header: "Supplier" },
    { key: "cost_total", header: "Cost", sortable: true, render: (r) => zar(r.cost_total) },
  ],
  vehicle_costs: [
    { key: "vehicle_label", header: "Vehicle", sortable: true },
    { key: "total_maintenance_cost", header: "Maintenance Cost", sortable: true, render: (r) => zar(r.total_maintenance_cost) },
    { key: "total_fuel_cost", header: "Fuel Cost", sortable: true, render: (r) => zar(r.total_fuel_cost) },
    { key: "total_cost", header: "Total Cost", sortable: true, render: (r) => zar(r.total_cost) },
  ],
  supplier_spend: [
    { key: "supplier_name", header: "Supplier", sortable: true },
    { key: "event_count", header: "Event Count", sortable: true },
    { key: "total_spend", header: "Total Spend", sortable: true, render: (r) => zar(r.total_spend) },
  ],
  fuel_consumption: [
    { key: "vehicle_reg", header: "Vehicle", sortable: true },
    { key: "week_starting", header: "Date", sortable: true },
    { key: "litres", header: "Litres", sortable: true },
    { key: "cost_per_litre", header: "Cost/L", render: (r) => r.litres ? zar(r.cost / r.litres) : "-" },
    { key: "odometer_reading", header: "Odometer" },
  ],
  uber_performance: [
    { key: "vehicle_reg", header: "Vehicle", sortable: true },
    { key: "period_date", header: "Date", sortable: true },
    { key: "total_trips", header: "Trips", sortable: true },
    { key: "hours_online", header: "Hours", sortable: true },
    { key: "distance_km", header: "Distance", sortable: true },
    { key: "total_earnings", header: "Earnings", sortable: true, render: (r) => zar(r.total_earnings) },
  ],
  routine_vs_emergency: [
    { key: "category", header: "Category", sortable: true },
    { key: "count", header: "Count", sortable: true },
    { key: "total_cost", header: "Total Cost", sortable: true, render: (r) => zar(r.total_cost) },
    { key: "avg_cost", header: "Avg Cost", sortable: true, render: (r) => zar(r.avg_cost) },
  ],
  distance_analysis: [
    { key: "vehicle_label", header: "Vehicle", sortable: true },
    { key: "start_km", header: "Start Km", sortable: true },
    { key: "end_km", header: "End Km", sortable: true },
    { key: "distance", header: "Distance", sortable: true },
    { key: "period", header: "Period" },
  ],
  contract_trips: [
    { key: "trip_date", header: "Date", sortable: true },
    { key: "trip_time", header: "Time", sortable: true },
    { key: "client_name", header: "Client", sortable: true },
    { key: "driver_name", header: "Driver", sortable: true },
    { key: "vehicle_reg", header: "Vehicle" },
    { key: "company_label", header: "Company" },
    { key: "coordinator", header: "Co-ordinator" },
    { key: "area", header: "Area" },
    { key: "pax", header: "Pax" },
    { key: "amount", header: "Amount", sortable: true, render: (r) => zar(r.amount) },
  ],
};

async function fetchReportData(
  reportType: ReportType,
  filters: ReportFilters,
  fleetId: string
): Promise<Row[]> {
  const supabase = createClient();
  const { startDate, endDate, vehicleId, supplierId } = filters;

  switch (reportType) {
    case "maintenance_history": {
      let q = supabase
        .from("maintenance_events")
        .select("event_date, category, cost_total, vehicle:vehicles(registration), supplier:suppliers(name), event_type:maintenance_event_types(name)")
        .eq("fleet_id", fleetId)
        .order("event_date", { ascending: false })
        .limit(50);
      if (startDate) q = q.gte("event_date", startDate);
      if (endDate) q = q.lte("event_date", endDate);
      if (vehicleId) q = q.eq("vehicle_id", vehicleId);
      if (supplierId) q = q.eq("supplier_id", supplierId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((r: Row) => ({
        event_date: r.event_date,
        vehicle_reg: r.vehicle?.registration ?? "-",
        event_type_name: r.event_type?.name ?? "-",
        category: r.category,
        supplier_name: r.supplier?.name ?? "-",
        cost_total: r.cost_total,
      }));
    }

    case "vehicle_costs": {
      let q = supabase
        .from("vehicles")
        .select("registration, make, model, total_maintenance_cost, total_fuel_cost")
        .eq("fleet_id", fleetId)
        .order("registration")
        .limit(50);
      if (vehicleId) q = q.eq("id", vehicleId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((r: Row) => ({
        vehicle_label: `${r.registration} (${r.make} ${r.model})`,
        total_maintenance_cost: r.total_maintenance_cost,
        total_fuel_cost: r.total_fuel_cost,
        total_cost: (r.total_maintenance_cost ?? 0) + (r.total_fuel_cost ?? 0),
      }));
    }

    case "supplier_spend": {
      let q = supabase
        .from("suppliers")
        .select("name, event_count, total_spend")
        .eq("fleet_id", fleetId)
        .order("total_spend", { ascending: false })
        .limit(50);
      if (supplierId) q = q.eq("id", supplierId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((r: Row) => ({
        supplier_name: r.name,
        event_count: r.event_count,
        total_spend: r.total_spend,
      }));
    }

    case "fuel_consumption": {
      let q = supabase
        .from("fuel_logs")
        .select("week_starting, litres, cost, odometer_reading, vehicle:vehicles(registration)")
        .eq("fleet_id", fleetId)
        .order("week_starting", { ascending: false })
        .limit(50);
      if (startDate) q = q.gte("week_starting", startDate);
      if (endDate) q = q.lte("week_starting", endDate);
      if (vehicleId) q = q.eq("vehicle_id", vehicleId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((r: Row) => ({
        vehicle_reg: r.vehicle?.registration ?? "-",
        week_starting: r.week_starting,
        litres: r.litres,
        cost: r.cost,
        odometer_reading: r.odometer_reading ?? "-",
      }));
    }

    case "uber_performance": {
      let q = supabase
        .from("uber_trip_data")
        .select("period_date, total_trips, hours_online, distance_km, total_earnings, vehicle:vehicles(registration)")
        .eq("fleet_id", fleetId)
        .order("period_date", { ascending: false })
        .limit(50);
      if (startDate) q = q.gte("period_date", startDate);
      if (endDate) q = q.lte("period_date", endDate);
      if (vehicleId) q = q.eq("vehicle_id", vehicleId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((r: Row) => ({
        vehicle_reg: r.vehicle?.registration ?? "-",
        period_date: r.period_date,
        total_trips: r.total_trips,
        hours_online: r.hours_online,
        distance_km: r.distance_km,
        total_earnings: r.total_earnings,
      }));
    }

    case "routine_vs_emergency": {
      let q = supabase
        .from("maintenance_events")
        .select("category, cost_total")
        .eq("fleet_id", fleetId)
        .limit(1000);
      if (startDate) q = q.gte("event_date", startDate);
      if (endDate) q = q.lte("event_date", endDate);
      if (vehicleId) q = q.eq("vehicle_id", vehicleId);
      const { data, error } = await q;
      if (error) throw error;
      const grouped: Record<string, { count: number; total: number }> = {};
      for (const r of data ?? []) {
        const cat = r.category ?? "unknown";
        if (!grouped[cat]) grouped[cat] = { count: 0, total: 0 };
        grouped[cat].count++;
        grouped[cat].total += r.cost_total ?? 0;
      }
      return Object.entries(grouped).map(([cat, v]) => ({
        category: cat,
        count: v.count,
        total_cost: v.total,
        avg_cost: v.count > 0 ? v.total / v.count : 0,
      }));
    }

    case "contract_trips": {
      let q = supabase
        .from("contract_trips")
        .select(
          "trip_date, trip_time, company_label, coordinator, area, pax, amount, client:contract_clients(name), driver:drivers(first_name, last_name), vehicle:vehicles(registration)"
        )
        .eq("fleet_id", fleetId)
        .order("trip_date", { ascending: false })
        .order("trip_time", { ascending: true })
        .limit(500);
      if (startDate) q = q.gte("trip_date", startDate);
      if (endDate) q = q.lte("trip_date", endDate);
      if (vehicleId) q = q.eq("vehicle_id", vehicleId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((r: Row) => ({
        trip_date: r.trip_date,
        trip_time: r.trip_time ?? "-",
        client_name: r.client?.name ?? "-",
        driver_name: r.driver ? `${r.driver.first_name} ${r.driver.last_name}` : "-",
        vehicle_reg: r.vehicle?.registration ?? "-",
        company_label: r.company_label ?? "-",
        coordinator: r.coordinator ?? "-",
        area: r.area,
        pax: r.pax ?? "-",
        amount: r.amount,
      }));
    }

    case "distance_analysis": {
      let q = supabase
        .from("uber_trip_data")
        .select("period_date, distance_km, vehicle:vehicles(registration, make, model)")
        .eq("fleet_id", fleetId)
        .order("period_date", { ascending: true })
        .limit(1000);
      if (startDate) q = q.gte("period_date", startDate);
      if (endDate) q = q.lte("period_date", endDate);
      if (vehicleId) q = q.eq("vehicle_id", vehicleId);
      const { data, error } = await q;
      if (error) throw error;
      // Group by vehicle, compute start/end km
      const byVehicle: Record<string, { reg: string; periods: { date: string; km: number }[] }> = {};
      for (const r of (data ?? []) as Row[]) {
        const reg = r.vehicle?.registration ?? "Unknown";
        const label = reg;
        if (!byVehicle[label]) byVehicle[label] = { reg: label, periods: [] };
        byVehicle[label].periods.push({ date: r.period_date, km: r.distance_km });
      }
      return Object.values(byVehicle).map((v) => {
        const sorted = v.periods.sort((a, b) => a.date.localeCompare(b.date));
        const totalDist = sorted.reduce((s, p) => s + p.km, 0);
        return {
          vehicle_label: v.reg,
          start_km: 0,
          end_km: totalDist,
          distance: totalDist,
          period: sorted.length > 0 ? `${sorted[0].date} - ${sorted[sorted.length - 1].date}` : "-",
        };
      }).slice(0, 50);
    }

    default:
      return [];
  }
}

interface ReportViewerProps {
  reportType: ReportType;
  filters: ReportFilters;
  trigger: number; // increment to re-fetch
}

export function ReportViewer({ reportType, filters, trigger }: ReportViewerProps) {
  const { fleetId } = useFleet();
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [lastTrigger, setLastTrigger] = useState(0);

  const columns = COLUMN_CONFIGS[reportType];

  const doFetch = useCallback(async () => {
    if (!fleetId) return;
    setLoading(true);
    try {
      const result = await fetchReportData(reportType, filters, fleetId);
      setData(result);
      setHasFetched(true);
    } catch (err) {
      toast.error("Failed to generate report");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [reportType, filters, fleetId]);

  // Trigger fetch when trigger changes
  if (trigger > 0 && trigger !== lastTrigger) {
    setLastTrigger(trigger);
    doFetch();
  }

  async function handleDownloadCsv() {
    setDownloading(true);
    try {
      const supabase = createClient();
      // fleet_id is derived server-side from the caller's JWT; do not send it here.
      const { data: csvData, error } = await supabase.functions.invoke("fleet-csv-report", {
        body: {
          report_type: reportType,
          filters: {
            start_date: filters.startDate,
            end_date: filters.endDate,
            vehicle_id: filters.vehicleId,
            supplier_id: filters.supplierId,
          },
        },
      });

      if (error) throw error;

      const blob = new Blob([csvData], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportType}_report.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded");
    } catch (err) {
      toast.error("Failed to download CSV");
      console.error(err);
    } finally {
      setDownloading(false);
    }
  }

  if (!hasFetched && !loading) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Results</h2>
        {data.length > 0 && (
          <Button variant="outline" onClick={handleDownloadCsv} disabled={downloading}>
            {downloading ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-1.5 h-4 w-4" />
            )}
            Download CSV
          </Button>
        )}
      </div>
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        emptyMessage="No data found for the selected filters."
      />
    </div>
  );
}
