"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useFleet } from "@/contexts/fleet-context";
import { useFormDraft } from "@/hooks/use-form-draft";
import { toast } from "sonner";
import { format } from "date-fns";
import { Archive, CalendarIcon, Trash2 } from "lucide-react";
import type { Driver, DriverStatus, FleetCategory, Vehicle } from "@/types/database";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface DriverFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver?: Driver | null;
  onSaved: () => void;
}

const STATUS_OPTIONS: { value: DriverStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

export function DriverFormSheet({
  open,
  onOpenChange,
  driver,
  onSaved,
}: DriverFormSheetProps) {
  const supabase = createClient();
  const { fleetId, isOwnerOrAdmin } = useFleet();
  const queryClient = useQueryClient();
  const isEdit = !!driver;

  // Invalidate both drivers and vehicles lists so the assigned-vehicle /
  // current-driver columns stay consistent across the app after any change
  // originating from this form sheet.
  function invalidateDriverVehicleQueries() {
    queryClient.invalidateQueries({ queryKey: ["drivers", fleetId] });
    queryClient.invalidateQueries({ queryKey: ["vehicles", fleetId] });
  }

  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [historyCounts, setHistoryCounts] = useState<{
    trips: number;
    invoices: number;
    payouts: number;
  } | null>(null);
  const [consented, setConsented] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState<Date | undefined>(
    undefined
  );
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<DriverStatus>("active");
  const [category, setCategory] = useState<FleetCategory>("e_hailing");
  const [commissionPerTrip, setCommissionPerTrip] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [uberDriverId, setUberDriverId] = useState("");
  const [notes, setNotes] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [assignedVehicleId, setAssignedVehicleId] = useState<string>("");
  const [initialVehicleId, setInitialVehicleId] = useState<string>("");

  useEffect(() => {
    if (driver) {
      setFirstName(driver.first_name);
      setLastName(driver.last_name);
      setLicenseNumber(driver.license_number);
      setLicenseExpiry(new Date(driver.license_expiry));
      setEmail(driver.email ?? "");
      setPhone(driver.phone ?? "");
      setStatus(driver.status);
      setCategory(driver.category);
      setCommissionPerTrip(driver.commission_per_trip != null ? String(driver.commission_per_trip) : "");
      setUberDriverId(driver.uber_driver_id ?? "");
      setNotes(driver.notes ?? "");

      // Bank account is encrypted at rest — fetch via RPC (owner/admin only)
      setBankAccountNumber("");
      void supabase
        .rpc("get_driver_bank_account", { target_driver_id: driver.id })
        .then(({ data, error }) => {
          if (error) {
            console.error("[driver-form] failed to read bank account:", error);
            return;
          }
          setBankAccountNumber((data as string | null) ?? "");
        });
    } else {
      setFirstName("");
      setLastName("");
      setLicenseNumber("");
      setLicenseExpiry(undefined);
      setEmail("");
      setPhone("");
      setStatus("active");
      setCategory("e_hailing");
      setCommissionPerTrip("");
      setBankAccountNumber("");
      setUberDriverId("");
      setNotes("");
      setConsented(false);
      setAssignedVehicleId("");
      setInitialVehicleId("");
    }
  }, [driver, open]);

  useEffect(() => {
    if (!open || !fleetId) return;
    async function loadVehicles() {
      const { data } = await supabase
        .from("vehicles")
        .select("*")
        .eq("fleet_id", fleetId!)
        .eq("category", category)
        .order("registration");
      setVehicles((data ?? []) as Vehicle[]);
    }
    loadVehicles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fleetId, category]);

  useEffect(() => {
    if (!open || !driver || !fleetId) {
      if (!driver) {
        setAssignedVehicleId("");
        setInitialVehicleId("");
        setHistoryCounts(null);
      }
      return;
    }
    async function loadCurrentAssignment() {
      const { data } = await supabase
        .from("vehicle_driver_assignments")
        .select("vehicle_id")
        .eq("driver_id", driver!.id)
        .eq("fleet_id", fleetId!)
        .is("unassigned_at", null)
        .maybeSingle();
      const vid = data?.vehicle_id ?? "";
      setAssignedVehicleId(vid);
      setInitialVehicleId(vid);
    }
    async function loadHistoryCounts() {
      const [tripsRes, invoicesRes, payoutsRes] = await Promise.all([
        supabase
          .from("contract_trips")
          .select("id", { count: "exact", head: true })
          .eq("driver_id", driver!.id)
          .eq("fleet_id", fleetId!),
        supabase
          .from("contract_invoices")
          .select("id", { count: "exact", head: true })
          .eq("driver_id", driver!.id)
          .eq("fleet_id", fleetId!),
        supabase
          .from("driver_payouts")
          .select("id", { count: "exact", head: true })
          .eq("driver_id", driver!.id)
          .eq("fleet_id", fleetId!),
      ]);
      setHistoryCounts({
        trips: tripsRes.count ?? 0,
        invoices: invoicesRes.count ?? 0,
        payouts: payoutsRes.count ?? 0,
      });
    }
    loadCurrentAssignment();
    loadHistoryCounts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, driver, fleetId]);

  // Draft persistence (add mode only). Declared AFTER the reset effects so
  // the restore applies AFTER the [driver, open] effect clears state,
  // otherwise the reset would clobber the restored values.
  const draftKey = !driver && fleetId ? `fleet:${fleetId}:draft:driver-new` : null;
  const { clearDraft } = useFormDraft({
    key: draftKey,
    enabled: open,
    changeSignal:
      firstName + "|" + lastName + "|" + licenseNumber + "|" +
      (licenseExpiry?.toISOString() ?? "") + "|" + email + "|" + phone + "|" +
      status + "|" + category + "|" + commissionPerTrip + "|" +
      bankAccountNumber + "|" + uberDriverId + "|" + notes + "|" +
      assignedVehicleId + "|" + (consented ? "1" : "0"),
    getValues: () => ({
      firstName, lastName, licenseNumber,
      licenseExpiryIso: licenseExpiry ? licenseExpiry.toISOString() : null,
      email, phone, status, category,
      commissionPerTrip, bankAccountNumber, uberDriverId, notes,
      assignedVehicleId, consented,
    }),
    applyValues: (v) => {
      setFirstName(v.firstName ?? "");
      setLastName(v.lastName ?? "");
      setLicenseNumber(v.licenseNumber ?? "");
      setLicenseExpiry(v.licenseExpiryIso ? new Date(v.licenseExpiryIso) : undefined);
      setEmail(v.email ?? "");
      setPhone(v.phone ?? "");
      setStatus((v.status as DriverStatus) ?? "active");
      setCategory((v.category as FleetCategory) ?? "e_hailing");
      setCommissionPerTrip(v.commissionPerTrip ?? "");
      setBankAccountNumber(v.bankAccountNumber ?? "");
      setUberDriverId(v.uberDriverId ?? "");
      setNotes(v.notes ?? "");
      setAssignedVehicleId(v.assignedVehicleId ?? "");
      setConsented(Boolean(v.consented));
    },
  });

  async function handleSave() {
    if (!firstName || !lastName || !licenseNumber || !licenseExpiry) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);

    // Trim text fields before save
    const trimmedFirstName = firstName.trim().slice(0, 200);
    const trimmedLastName = lastName.trim().slice(0, 200);
    const trimmedLicense = licenseNumber.trim().slice(0, 200);
    const trimmedEmail = email.trim().slice(0, 200);
    const trimmedPhone = phone.trim().slice(0, 200);

    const commission = commissionPerTrip ? Number(commissionPerTrip) : null;
    if (commission !== null && (!isFinite(commission) || commission < 0)) {
      toast.error("Commission must be a positive number");
      setSaving(false);
      return;
    }

    const payload = {
      first_name: trimmedFirstName,
      last_name: trimmedLastName,
      license_number: trimmedLicense,
      license_expiry: format(licenseExpiry, "yyyy-MM-dd"),
      email: trimmedEmail || null,
      phone: trimmedPhone || null,
      status,
      category,
      commission_per_trip: commission,
      // bank_account_number is encrypted at rest — set via RPC after the row is saved
      uber_driver_id: uberDriverId || null,
      notes: notes || null,
    };

    let error;
    let savedDriverId: string | null = driver?.id ?? null;
    if (isEdit && driver) {
      ({ error } = await supabase
        .from("drivers")
        .update(payload)
        .eq("id", driver.id)
        .eq("fleet_id", fleetId!));
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("drivers")
        .insert({ ...payload, fleet_id: fleetId!, consented_at: new Date().toISOString() })
        .select("id")
        .single();
      error = insertError;
      savedDriverId = inserted?.id ?? null;
    }

    if (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
      setSaving(false);
      return;
    }

    // Encrypt + persist the bank account via the SECURITY DEFINER RPC.
    // (RPC enforces owner/admin auth; passes through pgcrypto + Vault key.)
    if (savedDriverId) {
      const { error: bankErr } = await supabase.rpc("set_driver_bank_account", {
        target_driver_id: savedDriverId,
        // Null is valid — the SQL function uses it to clear the bank account.
        // Supabase's type generator recently stopped marking text params
        // nullable, so we cast through unknown.
        plaintext: (bankAccountNumber.trim().slice(0, 200) || null) as unknown as string,
      });
      if (bankErr) {
        console.error("[driver-form] failed to save bank account:", bankErr);
        toast.error("Driver saved, but bank account could not be encrypted.");
      }
    }

    // Handle vehicle assignment swap if changed
    if (savedDriverId && assignedVehicleId !== initialVehicleId) {
      const nowIso = new Date().toISOString();

      if (initialVehicleId) {
        const { error: unassignError } = await supabase
          .from("vehicle_driver_assignments")
          .update({ unassigned_at: nowIso })
          .eq("driver_id", savedDriverId)
          .eq("fleet_id", fleetId!)
          .is("unassigned_at", null);
        if (unassignError) {
          console.error(unassignError);
          toast.error("Driver saved, but could not release previous vehicle.");
          setSaving(false);
          return;
        }
      }

      if (assignedVehicleId) {
        // Release any other driver currently on the chosen vehicle
        const { error: releaseError } = await supabase
          .from("vehicle_driver_assignments")
          .update({ unassigned_at: nowIso })
          .eq("vehicle_id", assignedVehicleId)
          .eq("fleet_id", fleetId!)
          .is("unassigned_at", null);
        if (releaseError) {
          console.error(releaseError);
          toast.error("Driver saved, but could not clear existing assignment on that vehicle.");
          setSaving(false);
          return;
        }

        const { error: assignError } = await supabase
          .from("vehicle_driver_assignments")
          .insert({
            fleet_id: fleetId!,
            vehicle_id: assignedVehicleId,
            driver_id: savedDriverId,
            assigned_at: nowIso,
          });
        if (assignError) {
          console.error(assignError);
          toast.error("Driver saved, but vehicle assignment failed.");
          setSaving(false);
          return;
        }
      }
    }

    setSaving(false);
    toast.success(isEdit ? "Driver updated" : "Driver added");
    clearDraft();
    invalidateDriverVehicleQueries();
    onOpenChange(false);
    onSaved();
  }

  async function handleArchive() {
    if (!driver || !fleetId) return;
    if (!window.confirm(
      `Archive ${driver.first_name} ${driver.last_name}? They will be hidden from pickers but their history is preserved. You can restore them later by editing and changing status back to Active.`
    )) return;

    setArchiving(true);
    const nowIso = new Date().toISOString();

    // Release any active vehicle assignment
    const { error: unassignError } = await supabase
      .from("vehicle_driver_assignments")
      .update({ unassigned_at: nowIso })
      .eq("driver_id", driver.id)
      .eq("fleet_id", fleetId!)
      .is("unassigned_at", null);

    if (unassignError) {
      console.error(unassignError);
      toast.error("Could not release active vehicle assignment.");
      setArchiving(false);
      return;
    }

    const { error } = await supabase
      .from("drivers")
      .update({ status: "inactive" as DriverStatus })
      .eq("id", driver.id)
      .eq("fleet_id", fleetId!);

    setArchiving(false);

    if (error) {
      console.error(error);
      toast.error("Could not archive driver.");
      return;
    }

    toast.success("Driver archived.");
    invalidateDriverVehicleQueries();
    onOpenChange(false);
    onSaved();
  }

  async function handleDelete() {
    if (!driver || !fleetId) return;
    if (!historyCounts) return;
    const total = historyCounts.trips + historyCounts.invoices + historyCounts.payouts;
    if (total > 0) {
      toast.error("Cannot delete: driver has trip, invoice or payout history. Archive instead.");
      return;
    }
    if (!window.confirm(
      `Permanently delete ${driver.first_name} ${driver.last_name}? This cannot be undone.`
    )) return;

    setDeleting(true);

    const { error } = await supabase
      .from("drivers")
      .delete()
      .eq("id", driver.id)
      .eq("fleet_id", fleetId!);

    setDeleting(false);

    if (error) {
      console.error(error);
      toast.error(`Delete failed: ${error.message}`);
      return;
    }

    toast.success("Driver deleted.");
    invalidateDriverVehicleQueries();
    onOpenChange(false);
    onSaved();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit Driver" : "Add Driver"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update the driver details below."
              : "Fill in the details to add a new driver."}
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-4 px-4 pb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number *</Label>
              <Input
                id="licenseNumber"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
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
                  {licenseExpiry
                    ? format(licenseExpiry, "PPP")
                    : "Pick a date"}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={licenseExpiry}
                    onSelect={(date) => {
                      setLicenseExpiry(date);
                      setCalendarOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory((v ?? "e_hailing") as FleetCategory)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="e_hailing">E-Hailing</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus((v ?? "active") as DriverStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="uberDriverId">Uber Driver ID (if applicable)</Label>
              <Input
                id="uberDriverId"
                value={uberDriverId}
                onChange={(e) => setUberDriverId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Assigned Vehicle</Label>
              <Select
                value={assignedVehicleId || "__none__"}
                onValueChange={(v) => setAssignedVehicleId(v === "__none__" ? "" : (v ?? ""))}
              >
                <SelectTrigger className="w-full">
                  {assignedVehicleId ? (
                    (() => {
                      const v = vehicles.find((x) => x.id === assignedVehicleId);
                      return (
                        <span className="flex flex-1 text-left truncate">
                          {v ? `${v.registration} (${v.make} ${v.model})` : "Loading..."}
                        </span>
                      );
                    })()
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

          {category === "contract" && (
            <div className="grid grid-cols-2 gap-4 rounded-md border p-3 bg-muted/20">
              <div className="space-y-2 col-span-2">
                <p className="text-xs font-medium text-muted-foreground">Contract driver details</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="commission">Commission per Trip (ZAR)</Label>
                <Input
                  id="commission"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={commissionPerTrip}
                  onChange={(e) => setCommissionPerTrip(e.target.value)}
                  placeholder="e.g. 150"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank">Bank Account</Label>
                <Input
                  id="bank"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="Account number"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {!isEdit && (
            <label className="flex items-start gap-2 cursor-pointer text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={consented}
                onChange={(e) => setConsented(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-primary"
              />
              I confirm consent has been obtained to store this driver&apos;s personal information in accordance with POPI Act.
            </label>
          )}
        </div>

        {isEdit && isOwnerOrAdmin && historyCounts && (
          <div className="px-4 pb-2">
            <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Danger zone</p>
              <p className="mt-1">
                This driver has {historyCounts.trips} trip
                {historyCounts.trips === 1 ? "" : "s"}, {historyCounts.invoices} invoice
                {historyCounts.invoices === 1 ? "" : "s"} and {historyCounts.payouts} payout
                {historyCounts.payouts === 1 ? "" : "s"} on record.
                {historyCounts.trips + historyCounts.invoices + historyCounts.payouts > 0
                  ? " Permanent delete is disabled — archive instead to preserve history."
                  : " No history — permanent delete is allowed."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleArchive}
                  disabled={archiving || deleting || driver?.status === "inactive"}
                  className="cursor-pointer"
                >
                  <Archive className="mr-1.5 h-4 w-4" />
                  {archiving
                    ? "Archiving..."
                    : driver?.status === "inactive"
                    ? "Already Archived"
                    : "Archive Driver"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={
                    deleting ||
                    archiving ||
                    historyCounts.trips + historyCounts.invoices + historyCounts.payouts > 0
                  }
                  className="cursor-pointer border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  {deleting ? "Deleting..." : "Delete Permanently"}
                </Button>
              </div>
            </div>
          </div>
        )}

        <SheetFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving || archiving || deleting}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || archiving || deleting || (!isEdit && !consented)}
            className="cursor-pointer"
          >
            {saving ? "Saving..." : isEdit ? "Update Driver" : "Add Driver"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
