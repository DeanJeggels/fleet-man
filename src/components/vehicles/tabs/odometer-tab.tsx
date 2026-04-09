"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
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
import type { Tables } from "@/types/database";

type OdometerRow = Tables<"odometer_readings">;

const sourceColors: Record<string, string> = {
  manual: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  service: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  fuel_log: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  uber_sync: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
};

interface OdometerTabProps {
  vehicleId: string;
}

export function OdometerTab({ vehicleId }: OdometerTabProps) {
  const [data, setData] = useState<OdometerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReadings() {
      const supabase = createClient();
      const { data: readings } = await supabase
        .from("odometer_readings")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .order("reading_date", { ascending: true });

      setData(readings ?? []);
      setLoading(false);
    }
    fetchReadings();
  }, [vehicleId]);

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  const chartData = data.map((row) => ({
    date: format(parseISO(row.reading_date), "dd MMM yy"),
    reading: row.reading,
  }));

  return (
    <div className="space-y-6">
      {chartData.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-4 text-sm font-medium">Odometer Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis
                tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                fontSize={12}
              />
              <Tooltip
                formatter={(value) => [
                  `${Number(value).toLocaleString()} km`,
                  "Odometer",
                ]}
              />
              <Line
                type="monotone"
                dataKey="reading"
                stroke="#22C55E"
                strokeWidth={2}
                dot={{ r: 4, fill: "#22C55E" }}
                name="Reading"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Reading</th>
              <th className="px-4 py-3 text-left font-medium">Source</th>
            </tr>
          </thead>
          <tbody>
            {[...data].reverse().map((row) => (
              <tr key={row.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  {format(parseISO(row.reading_date), "dd MMM yyyy")}
                </td>
                <td className="px-4 py-3 font-mono">
                  {row.reading.toLocaleString()} km
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={sourceColors[row.source] ?? ""}
                  >
                    {row.source.replace("_", " ")}
                  </Badge>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No odometer readings recorded
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
