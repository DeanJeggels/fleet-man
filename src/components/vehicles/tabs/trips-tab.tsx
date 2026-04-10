"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, parseISO } from "date-fns";
import { useFleet } from "@/contexts/fleet-context";

const formatZAR = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
});

interface TripRow extends Record<string, unknown> {
  id: string;
  period_date: string;
  total_trips: number;
  hours_online: number;
  distance_km: number;
  total_earnings: number;
}

const columns: ColumnDef<TripRow>[] = [
  {
    key: "period_date",
    header: "Date",
    sortable: true,
    render: (row) => format(parseISO(row.period_date), "dd MMM yyyy"),
  },
  {
    key: "total_trips",
    header: "Trips",
    sortable: true,
  },
  {
    key: "hours_online",
    header: "Hours Online",
    render: (row) => row.hours_online.toFixed(1),
  },
  {
    key: "distance_km",
    header: "Distance (km)",
    sortable: true,
    render: (row) => row.distance_km.toLocaleString(),
  },
  {
    key: "total_earnings",
    header: "Earnings",
    sortable: true,
    render: (row) => formatZAR.format(row.total_earnings),
  },
];

interface TripsTabProps {
  vehicleId: string;
}

export function TripsTab({ vehicleId }: TripsTabProps) {
  const { fleetId } = useFleet();
  const [data, setData] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (!fleetId) return;
    async function fetchTrips() {
      setLoading(true);
      const supabase = createClient();
      let query = supabase
        .from("uber_trip_data")
        .select("id, period_date, total_trips, hours_online, distance_km, total_earnings")
        .eq("vehicle_id", vehicleId)
        .eq("fleet_id", fleetId!)
        .order("period_date", { ascending: false });

      if (dateFrom) {
        query = query.gte("period_date", dateFrom);
      }
      if (dateTo) {
        query = query.lte("period_date", dateTo);
      }

      const { data: trips } = await query;
      setData((trips as unknown as TripRow[]) ?? []);
      setLoading(false);
    }
    fetchTrips();
  }, [vehicleId, fleetId, dateFrom, dateTo]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label htmlFor="date-from">From</Label>
          <Input
            id="date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="date-to">To</Label>
          <Input
            id="date-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      <DataTable columns={columns} data={data} loading={loading} emptyMessage="No trip data available" />
    </div>
  );
}
