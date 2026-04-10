"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import { useFleet } from "@/contexts/fleet-context";

const formatZAR = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
});

interface FuelRow extends Record<string, unknown> {
  id: string;
  week_starting: string;
  litres: number | null;
  cost: number;
  odometer_reading: number | null;
}

const columns: ColumnDef<FuelRow>[] = [
  {
    key: "week_starting",
    header: "Date",
    sortable: true,
    render: (row) => format(parseISO(row.week_starting), "dd MMM yyyy"),
  },
  {
    key: "litres",
    header: "Litres",
    render: (row) => (row.litres != null ? row.litres.toFixed(1) : "-"),
  },
  {
    key: "cost",
    header: "Cost",
    sortable: true,
    render: (row) => formatZAR.format(row.cost),
  },
  {
    key: "odometer_reading",
    header: "Odometer",
    render: (row) =>
      row.odometer_reading != null
        ? row.odometer_reading.toLocaleString()
        : "-",
  },
];

interface FuelTabProps {
  vehicleId: string;
}

export function FuelTab({ vehicleId }: FuelTabProps) {
  const { fleetId } = useFleet();
  const [data, setData] = useState<FuelRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fleetId) return;
    async function fetchFuel() {
      const supabase = createClient();
      const { data: logs } = await supabase
        .from("fuel_logs")
        .select("id, week_starting, litres, cost, odometer_reading")
        .eq("vehicle_id", vehicleId)
        .eq("fleet_id", fleetId!)
        .order("week_starting", { ascending: true });

      setData((logs as unknown as FuelRow[]) ?? []);
      setLoading(false);
    }
    fetchFuel();
  }, [vehicleId, fleetId]);

  const chartData = data.map((row) => ({
    date: format(parseISO(row.week_starting), "dd MMM"),
    litres: row.litres ?? 0,
    cost: row.cost,
  }));

  return (
    <div className="space-y-6">
      {!loading && chartData.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-4 text-sm font-medium">Fuel Consumption Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="litres"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Litres"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <DataTable columns={columns} data={data} loading={loading} emptyMessage="No fuel logs recorded" />
    </div>
  );
}
