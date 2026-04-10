"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useFleet } from "@/contexts/fleet-context";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { Driver, DriverStatus } from "@/types/database";

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
  const { fleetId } = useFleet();
  const isEdit = !!driver;

  const [saving, setSaving] = useState(false);
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
  const [uberDriverId, setUberDriverId] = useState("");
  const [notes, setNotes] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (driver) {
      setFirstName(driver.first_name);
      setLastName(driver.last_name);
      setLicenseNumber(driver.license_number);
      setLicenseExpiry(new Date(driver.license_expiry));
      setEmail(driver.email ?? "");
      setPhone(driver.phone ?? "");
      setStatus(driver.status);
      setUberDriverId(driver.uber_driver_id ?? "");
      setNotes(driver.notes ?? "");
    } else {
      setFirstName("");
      setLastName("");
      setLicenseNumber("");
      setLicenseExpiry(undefined);
      setEmail("");
      setPhone("");
      setStatus("active");
      setUberDriverId("");
      setNotes("");
      setConsented(false);
    }
  }, [driver, open]);

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

    const payload = {
      first_name: trimmedFirstName,
      last_name: trimmedLastName,
      license_number: trimmedLicense,
      license_expiry: format(licenseExpiry, "yyyy-MM-dd"),
      email: trimmedEmail || null,
      phone: trimmedPhone || null,
      status,
      uber_driver_id: uberDriverId || null,
      notes: notes || null,
    };

    let error;
    if (isEdit && driver) {
      ({ error } = await supabase
        .from("drivers")
        .update(payload)
        .eq("id", driver.id)
        .eq("fleet_id", fleetId!));
    } else {
      ({ error } = await supabase.from("drivers").insert({ ...payload, fleet_id: fleetId!, consented_at: new Date().toISOString() }));
    }

    setSaving(false);

    if (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
      return;
    }

    toast.success(isEdit ? "Driver updated" : "Driver added");
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
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as DriverStatus)}>
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
              <Label htmlFor="uberDriverId">Uber Driver ID</Label>
              <Input
                id="uberDriverId"
                value={uberDriverId}
                onChange={(e) => setUberDriverId(e.target.value)}
              />
            </div>
          </div>

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

        <SheetFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || (!isEdit && !consented)} className="cursor-pointer">
            {saving ? "Saving..." : isEdit ? "Update Driver" : "Add Driver"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
