"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { useFleet } from "@/contexts/fleet-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { Driver, Vehicle } from "@/types/database";

interface DriverRow extends Driver {
  profile_user_id: string | null;
}

interface PendingInvite {
  id: string;
  email: string;
  driver_id: string | null;
  assigned_vehicle_id: string | null;
  created_at: string;
}

export function DriverAccountsTab() {
  const { fleetId, role: myRole } = useFleet();
  const canManage = myRole === "owner" || myRole === "admin";

  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Invite form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState<Date | undefined>(undefined);
  const [phone, setPhone] = useState("");
  const [commissionPerTrip, setCommissionPerTrip] = useState("");
  const [assignedVehicleId, setAssignedVehicleId] = useState<string>("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!fleetId) return;
    setLoading(true);
    const supabase = createClient();
    const [driversRes, invitesRes, profilesRes, vehiclesRes] = await Promise.all([
      supabase.from("drivers").select("*").eq("fleet_id", fleetId!).order("last_name"),
      supabase
        .from("fleet_invites")
        .select("id, email, driver_id, assigned_vehicle_id, created_at")
        .eq("fleet_id", fleetId!)
        .eq("role", "driver")
        .is("accepted_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles_fleet")
        .select("user_id, driver_id")
        .eq("fleet_id", fleetId!)
        .not("driver_id", "is", null),
      supabase
        .from("vehicles")
        .select("*")
        .eq("fleet_id", fleetId!)
        .order("registration"),
    ]);

    const profileByDriver = new Map<string, string>();
    for (const p of profilesRes.data ?? []) {
      if (p.driver_id) profileByDriver.set(p.driver_id as string, p.user_id as string);
    }

    const driversWithStatus: DriverRow[] = ((driversRes.data ?? []) as Driver[]).map((d) => ({
      ...d,
      profile_user_id: profileByDriver.get(d.id) ?? null,
    }));

    setDrivers(driversWithStatus);
    setInvites((invitesRes.data ?? []) as PendingInvite[]);
    setVehicles((vehiclesRes.data ?? []) as Vehicle[]);
    setLoading(false);
  }, [fleetId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  function resetForm() {
    setFirstName("");
    setLastName("");
    setEmail("");
    setLicenseNumber("");
    setLicenseExpiry(undefined);
    setPhone("");
    setCommissionPerTrip("");
    setAssignedVehicleId("");
  }

  async function handleInvite() {
    if (!fleetId) return;
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !licenseNumber.trim() || !licenseExpiry) {
      toast.error("First name, last name, email, license number and expiry are required.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    const { data, error } = await supabase.functions.invoke("invite-driver", {
      body: {
        fleet_id: fleetId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        license_number: licenseNumber.trim(),
        license_expiry: format(licenseExpiry, "yyyy-MM-dd"),
        phone: phone.trim() || null,
        commission_per_trip: commissionPerTrip ? Number(commissionPerTrip) : null,
        assigned_vehicle_id: assignedVehicleId || null,
        category: "contract",
      },
    });

    setSubmitting(false);

    if (error || (data && data.error)) {
      console.error(error ?? data?.error);
      toast.error(`Failed to invite driver: ${error?.message ?? data?.error ?? "Unknown error"}`);
      return;
    }

    toast.success(`Invite sent to ${email}.`);
    resetForm();
    setDialogOpen(false);
    fetchAll();
  }

  async function handleCancelInvite(id: string) {
    if (!window.confirm("Cancel this pending invite?")) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("fleet_invites")
      .delete()
      .eq("id", id)
      .eq("fleet_id", fleetId!);
    if (error) {
      console.error(error);
      toast.error("Failed to cancel invite.");
      return;
    }
    toast.success("Invite cancelled.");
    fetchAll();
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  const selectedVehicle = vehicles.find((v) => v.id === assignedVehicleId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle>Driver Accounts</CardTitle>
              <CardDescription>
                Invite drivers to log in. Drivers see only their own fuel logs and contract trips.
              </CardDescription>
            </div>
            {canManage && (
              <Dialog
                open={dialogOpen}
                onOpenChange={(o) => {
                  setDialogOpen(o);
                  if (!o) resetForm();
                }}
              >
                <DialogTrigger
                  render={
                    <Button className="cursor-pointer">
                      <Plus className="mr-1.5 h-4 w-4" />
                      Invite Driver
                    </Button>
                  }
                />
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Invite Driver</DialogTitle>
                    <DialogDescription>
                      Creates the driver record and sends an email invite. The driver will set their password before accessing the app.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3 py-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>First Name *</Label>
                        <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Last Name *</Label>
                        <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="driver@example.com"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>License Number *</Label>
                        <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>License Expiry *</Label>
                        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                          <PopoverTrigger
                            render={
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !licenseExpiry && "text-muted-foreground"
                                )}
                              />
                            }
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {licenseExpiry ? format(licenseExpiry, "PPP") : "Pick a date"}
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={licenseExpiry}
                              onSelect={(d) => {
                                setLicenseExpiry(d);
                                setCalendarOpen(false);
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Phone</Label>
                        <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Commission per Trip (ZAR)</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="0.01"
                          value={commissionPerTrip}
                          onChange={(e) => setCommissionPerTrip(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Assigned Vehicle</Label>
                      <Select
                        value={assignedVehicleId || "__none__"}
                        onValueChange={(v) => setAssignedVehicleId(v === "__none__" ? "" : (v ?? ""))}
                      >
                        <SelectTrigger className="w-full">
                          {selectedVehicle ? (
                            <span className="flex flex-1 text-left truncate">
                              {selectedVehicle.registration} ({selectedVehicle.make} {selectedVehicle.model})
                            </span>
                          ) : (
                            <SelectValue placeholder="No vehicle" />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">No vehicle</SelectItem>
                          {vehicles.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.registration} ({v.make} {v.model})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleInvite}
                      disabled={submitting}
                      className="cursor-pointer"
                    >
                      {submitting ? "Sending..." : "Send Invite"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {drivers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No drivers yet.</p>
          ) : (
            drivers.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {d.first_name} {d.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {d.email ?? "no email"} • {d.category}
                  </p>
                </div>
                {d.profile_user_id ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                    Account active
                  </Badge>
                ) : (
                  <Badge variant="outline">No account</Badge>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Driver Invites</CardTitle>
            <CardDescription>Drivers who have been invited but not yet signed up.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {invites.map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{i.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Invited {format(new Date(i.created_at), "dd MMM yyyy")}
                  </p>
                </div>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => handleCancelInvite(i.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
