"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { User } from "lucide-react";
import { useFleet } from "@/contexts/fleet-context";

interface AssignmentRow {
  id: string;
  assigned_at: string;
  unassigned_at: string | null;
  driver: { first_name: string; last_name: string } | null;
}

interface DriverHistoryTabProps {
  vehicleId: string;
}

export function DriverHistoryTab({ vehicleId }: DriverHistoryTabProps) {
  const { fleetId } = useFleet();
  const [data, setData] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fleetId) return;
    async function fetchAssignments() {
      const supabase = createClient();
      const { data: assignments } = await supabase
        .from("vehicle_driver_assignments")
        .select("id, assigned_at, unassigned_at, driver:drivers(first_name, last_name)")
        .eq("vehicle_id", vehicleId)
        .eq("fleet_id", fleetId!)
        .order("assigned_at", { ascending: false });

      setData((assignments as unknown as AssignmentRow[]) ?? []);
      setLoading(false);
    }
    fetchAssignments();
  }, [vehicleId, fleetId]);

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No driver assignments recorded
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {data.map((assignment, index) => {
        const driverName = assignment.driver
          ? `${assignment.driver.first_name} ${assignment.driver.last_name}`
          : "Unknown Driver";
        const isCurrent = assignment.unassigned_at === null;

        return (
          <div key={assignment.id} className="relative flex gap-4 pb-8 last:pb-0">
            {/* Timeline line */}
            {index < data.length - 1 && (
              <div className="absolute left-[19px] top-10 h-full w-px bg-border" />
            )}

            {/* Timeline dot */}
            <div
              className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${
                isCurrent
                  ? "border-green-500 bg-green-50 dark:bg-green-950"
                  : "border-muted-foreground/30 bg-muted"
              }`}
            >
              <User
                className={`h-4 w-4 ${
                  isCurrent ? "text-green-600" : "text-muted-foreground"
                }`}
              />
            </div>

            {/* Content */}
            <div className="flex flex-col gap-1 pt-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{driverName}</span>
                {isCurrent && (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                    Current
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {format(parseISO(assignment.assigned_at), "dd MMM yyyy")}
                {" - "}
                {assignment.unassigned_at
                  ? format(parseISO(assignment.unassigned_at), "dd MMM yyyy")
                  : "Present"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
