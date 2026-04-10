"use client";

import { useEffect, useState } from "react";
import { format, differenceInDays } from "date-fns";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { useFleet } from "@/contexts/fleet-context";

interface UpcomingService {
  id: string;
  registration: string;
  next_service_date: string | null;
  next_service_km: number | null;
}

function getDueStatus(dateStr: string | null): "overdue" | "soon" | "ok" {
  if (!dateStr) return "ok";
  const days = differenceInDays(new Date(dateStr), new Date());
  if (days < 0) return "overdue";
  if (days <= 14) return "soon";
  return "ok";
}

const statusStyles = {
  overdue: "text-[#EF4444]",
  soon: "text-[#F59E0B]",
  ok: "text-[#22C55E]",
} as const;

const statusDot = {
  overdue: "bg-[#EF4444]",
  soon: "bg-[#F59E0B]",
  ok: "bg-[#22C55E]",
} as const;

export function UpcomingServices() {
  const { fleetId } = useFleet();
  const [services, setServices] = useState<UpcomingService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fleetId) return;
    async function fetchData() {
      const supabase = createClient();
      const { data } = await supabase
        .from("service_schedules")
        .select("id, next_service_date, next_service_km, vehicle_id, vehicles(registration)")
        .eq("fleet_id", fleetId!)
        .not("next_service_date", "is", null)
        .order("next_service_date", { ascending: true })
        .limit(5);

      if (data) {
        setServices(
          data.map((d) => ({
            id: d.id,
            registration: (d.vehicles as unknown as { registration: string })?.registration ?? "Unknown",
            next_service_date: d.next_service_date,
            next_service_km: d.next_service_km,
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
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-sm font-medium text-muted-foreground">
        Upcoming Services
      </h3>
      {services.length === 0 ? (
        <p className="text-sm text-muted-foreground">No upcoming services</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">Vehicle</th>
                <th className="pb-2 font-medium">Due Date</th>
                <th className="pb-2 text-right font-medium">Due Km</th>
                <th className="pb-2 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => {
                const status = getDueStatus(s.next_service_date);
                return (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="py-2 font-medium">{s.registration}</td>
                    <td className={`py-2 font-mono ${statusStyles[status]}`}>
                      {s.next_service_date
                        ? format(new Date(s.next_service_date), "dd MMM yyyy")
                        : "-"}
                    </td>
                    <td className="py-2 text-right font-mono">
                      {s.next_service_km
                        ? s.next_service_km.toLocaleString()
                        : "-"}
                    </td>
                    <td className="py-2 text-right">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${statusDot[status]}`}
                        />
                        <span className={`text-xs capitalize ${statusStyles[status]}`}>
                          {status === "soon" ? "Due Soon" : status}
                        </span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
