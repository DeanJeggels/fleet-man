"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";
import { User, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useFleet } from "@/contexts/fleet-context";
import type { Driver, FleetCategory } from "@/types/database";

interface AssignmentRow {
  id: string;
  assigned_at: string;
  unassigned_at: string | null;
  driver: { first_name: string; last_name: string } | null;
}

interface DriverHistoryTabProps {
  vehicleId: string;
  vehicleCategory: FleetCategory;
  refreshToken?: number;
  onChanged?: () => void;
}

export function DriverHistoryTab({
  vehicleId,
  vehicleCategory,
  refreshToken,
  onChanged,
}: DriverHistoryTabProps) {
  const { fleetId, isOwnerOrAdmin } = useFleet();
  const [data, setData] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const fetchAssignments = useCallback(async () => {
    if (!fleetId) return;
    setLoading(true);
    const supabase = createClient();
    const { data: assignments } = await supabase
      .from("vehicle_driver_assignments")
      .select("id, assigned_at, unassigned_at, driver:drivers(first_name, last_name)")
      .eq("vehicle_id", vehicleId)
      .eq("fleet_id", fleetId!)
      .order("assigned_at", { ascending: false });
    setData((assignments as unknown as AssignmentRow[]) ?? []);
    setLoading(false);
  }, [vehicleId, fleetId]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments, refreshToken]);

  async function loadDrivers() {
    if (!fleetId) return;
    const supabase = createClient();
    const { data: list } = await supabase
      .from("drivers")
      .select("*")
      .eq("fleet_id", fleetId!)
      .eq("category", vehicleCategory)
      .eq("status", "active")
      .order("last_name");
    setDrivers((list ?? []) as Driver[]);
  }

  async function handleAssign() {
    if (!fleetId || !selectedDriverId) return;
    setAssigning(true);
    const supabase = createClient();

    // Unassign any currently-active assignment on this vehicle
    // (respects the partial unique index on vehicle_id WHERE unassigned_at IS NULL)
    const { error: unassignError } = await supabase
      .from("vehicle_driver_assignments")
      .update({ unassigned_at: new Date().toISOString() })
      .eq("vehicle_id", vehicleId)
      .eq("fleet_id", fleetId!)
      .is("unassigned_at", null);

    if (unassignError) {
      console.error(unassignError);
      toast.error("Could not release current assignment.");
      setAssigning(false);
      return;
    }

    // Insert new assignment
    const { error: insertError } = await supabase
      .from("vehicle_driver_assignments")
      .insert({
        fleet_id: fleetId!,
        vehicle_id: vehicleId,
        driver_id: selectedDriverId,
        assigned_at: new Date().toISOString(),
      });

    setAssigning(false);

    if (insertError) {
      console.error(insertError);
      toast.error("Could not assign driver.");
      return;
    }

    toast.success("Driver assigned.");
    setDialogOpen(false);
    setSelectedDriverId("");
    onChanged?.();
  }

  async function handleUnassignCurrent() {
    if (!fleetId) return;
    if (!window.confirm("Unassign the current driver from this vehicle?")) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("vehicle_driver_assignments")
      .update({ unassigned_at: new Date().toISOString() })
      .eq("vehicle_id", vehicleId)
      .eq("fleet_id", fleetId!)
      .is("unassigned_at", null);
    if (error) {
      console.error(error);
      toast.error("Could not unassign driver.");
      return;
    }
    toast.success("Driver unassigned.");
    onChanged?.();
  }

  const currentAssignment = data.find((a) => a.unassigned_at === null);
  const selectedDriver = drivers.find((d) => d.id === selectedDriverId);
  const selectedDriverLabel = selectedDriver
    ? `${selectedDriver.first_name} ${selectedDriver.last_name}`
    : null;

  return (
    <div className="space-y-4">
      {isOwnerOrAdmin && (
        <div className="flex items-center justify-end gap-2">
          {currentAssignment && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnassignCurrent}
              className="cursor-pointer"
            >
              Unassign Current
            </Button>
          )}
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (open) {
                loadDrivers();
                setSelectedDriverId("");
              }
            }}
          >
            <DialogTrigger
              render={
                <Button size="sm" className="cursor-pointer">
                  <UserPlus className="mr-1.5 h-4 w-4" />
                  {currentAssignment ? "Change Driver" : "Assign Driver"}
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {currentAssignment ? "Change Driver" : "Assign Driver"}
                </DialogTitle>
                <DialogDescription>
                  {currentAssignment
                    ? "The current driver will be unassigned and the new driver will take over."
                    : "Pick an active driver to assign to this vehicle."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-1.5">
                  <Label>Driver *</Label>
                  <Select
                    value={selectedDriverId}
                    onValueChange={(v) => setSelectedDriverId(v ?? "")}
                  >
                    <SelectTrigger className="w-full">
                      {selectedDriverLabel ? (
                        <span className="flex flex-1 text-left truncate">
                          {selectedDriverLabel}
                        </span>
                      ) : (
                        <SelectValue placeholder="Select driver" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No active {vehicleCategory} drivers available
                        </div>
                      ) : (
                        drivers.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.first_name} {d.last_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleAssign}
                  disabled={!selectedDriverId || assigning}
                  className="cursor-pointer"
                >
                  {assigning ? "Assigning..." : "Confirm"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {loading ? (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          Loading...
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          No driver assignments recorded
        </div>
      ) : (
        <div className="space-y-0">
          {data.map((assignment, index) => {
            const driverName = assignment.driver
              ? `${assignment.driver.first_name} ${assignment.driver.last_name}`
              : "Unknown Driver";
            const isCurrent = assignment.unassigned_at === null;

            return (
              <div key={assignment.id} className="relative flex gap-4 pb-8 last:pb-0">
                {index < data.length - 1 && (
                  <div className="absolute left-[19px] top-10 h-full w-px bg-border" />
                )}

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
      )}
    </div>
  );
}
