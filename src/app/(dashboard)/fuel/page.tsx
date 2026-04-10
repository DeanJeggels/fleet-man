"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useFleet } from "@/contexts/fleet-context";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { BatchFuelForm } from "@/components/fuel/batch-fuel-form";

interface Vehicle {
  id: string;
  registration: string;
}

type FuelLogRow = Record<string, unknown> & {
  id: string;
  vehicle_registration: string;
  week_starting: string;
  litres: number | null;
  cost: number;
  odometer_reading: number | null;
  created_at: string;
};

const zarFormat = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
});

const columns: ColumnDef<Record<string, unknown>>[] = [
  {
    key: "vehicle_registration",
    header: "Vehicle",
  },
  {
    key: "week_starting",
    header: "Date",
    render: (row) => String(row.week_starting ?? ""),
  },
  {
    key: "litres",
    header: "Litres",
    render: (row) => {
      const val = row.litres as number | null;
      return val != null ? val.toFixed(2) : "—";
    },
  },
  {
    key: "cost",
    header: "Cost (ZAR)",
    render: (row) => zarFormat.format(row.cost as number),
  },
  {
    key: "odometer_reading",
    header: "Odometer",
    render: (row) => {
      const val = row.odometer_reading as number | null;
      return val != null ? (
        <span className="font-mono">{val.toLocaleString()}</span>
      ) : (
        "—"
      );
    },
  },
];

export default function FuelPage() {
  const { fleetId } = useFleet();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [logs, setLogs] = useState<FuelLogRow[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);

  const supabase = createClient();

  const fetchLogs = useCallback(async () => {
    if (!fleetId) return;
    setLoadingLogs(true);
    const { data } = await supabase
      .from("fuel_logs")
      .select("*, vehicle:vehicles(registration)")
      .eq("fleet_id", fleetId!)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      setLogs(
        data.map((row) => ({
          id: row.id,
          vehicle_registration: (row.vehicle as unknown as { registration: string })?.registration ?? "Unknown",
          week_starting: row.week_starting,
          litres: row.litres,
          cost: row.cost,
          odometer_reading: row.odometer_reading,
          created_at: row.created_at,
        }))
      );
    }
    setLoadingLogs(false);
  }, [supabase, fleetId]);

  useEffect(() => {
    if (!fleetId) return;

    async function fetchVehicles() {
      const { data } = await supabase
        .from("vehicles")
        .select("id, registration")
        .eq("fleet_id", fleetId!)
        .eq("status", "active")
        .order("registration");

      if (data) setVehicles(data);
      setLoadingVehicles(false);
    }

    fetchVehicles();
    fetchLogs();
  }, [supabase, fetchLogs, fleetId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fuel Log"
        description="Record fuel purchases and track consumption across your fleet."
      />

      {!loadingVehicles && vehicles.length > 0 && (
        <BatchFuelForm vehicles={vehicles} onSaved={fetchLogs} />
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold">Recent Entries</h2>
        <DataTable
          columns={columns}
          data={logs as Record<string, unknown>[]}
          loading={loadingLogs}
          emptyMessage="No fuel entries recorded yet."
        />
      </div>
    </div>
  );
}
