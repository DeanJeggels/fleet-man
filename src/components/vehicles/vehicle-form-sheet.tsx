"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Vehicle, VehicleStatus } from "@/types/database";
import { toast } from "sonner";
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
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";

const STATUS_OPTIONS: VehicleStatus[] = [
  "active",
  "maintenance",
  "retired",
  "sold",
];

interface VehicleFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: Vehicle | null;
  onSaved: () => void;
}

export function VehicleFormSheet({
  open,
  onOpenChange,
  vehicle,
  onSaved,
}: VehicleFormSheetProps) {
  const isEdit = !!vehicle;

  const [registration, setRegistration] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [vin, setVin] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [color, setColor] = useState("");
  const [status, setStatus] = useState<VehicleStatus>("active");
  const [dateAdded, setDateAdded] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setRegistration(vehicle.registration);
      setMake(vehicle.make);
      setModel(vehicle.model);
      setYear(vehicle.year != null ? String(vehicle.year) : "");
      setVin(vehicle.vin ?? "");
      setVehicleType(vehicle.vehicle_type ?? "");
      setColor(vehicle.color ?? "");
      setStatus(vehicle.status);
      setDateAdded(vehicle.date_added ? parseISO(vehicle.date_added) : undefined);
      setNotes(vehicle.notes ?? "");
    } else {
      setRegistration("");
      setMake("");
      setModel("");
      setYear("");
      setVin("");
      setVehicleType("");
      setColor("");
      setStatus("active");
      setDateAdded(undefined);
      setNotes("");
    }
  }, [vehicle, open]);

  async function handleSave() {
    if (!registration.trim() || !make.trim() || !model.trim()) {
      toast.error("Registration, Make and Model are required.");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const payload = {
      registration: registration.trim(),
      make: make.trim(),
      model: model.trim(),
      year: year ? Number(year) : null,
      vin: vin.trim() || null,
      vehicle_type: vehicleType.trim() || null,
      color: color.trim() || null,
      status,
      date_added: dateAdded ? format(dateAdded, "yyyy-MM-dd") : undefined,
      notes: notes.trim() || null,
    };

    if (isEdit && vehicle) {
      const { error } = await supabase
        .from("vehicles")
        .update(payload)
        .eq("id", vehicle.id);

      if (error) {
        toast.error("Failed to update vehicle", { description: error.message });
        setSaving(false);
        return;
      }
      toast.success("Vehicle updated");
    } else {
      const { error } = await supabase.from("vehicles").insert(payload);

      if (error) {
        toast.error("Failed to add vehicle", { description: error.message });
        setSaving(false);
        return;
      }
      toast.success("Vehicle added");
    }

    setSaving(false);
    onOpenChange(false);
    onSaved();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit Vehicle" : "Add Vehicle"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update the vehicle details below."
              : "Fill in the details to add a new vehicle."}
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-4 px-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="registration">Registration *</Label>
            <Input
              id="registration"
              value={registration}
              onChange={(e) => setRegistration(e.target.value)}
              placeholder="e.g. CA 123-456"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="make">Make *</Label>
              <Input
                id="make"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="e.g. Toyota"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="model">Model *</Label>
              <Input
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Corolla"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g. 2022"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. White"
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="vin">VIN</Label>
            <Input
              id="vin"
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              placeholder="Vehicle Identification Number"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="vehicleType">Vehicle Type</Label>
              <Input
                id="vehicleType"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                placeholder="e.g. Sedan"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(val) => setStatus(val as VehicleStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Date Added</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger
                render={
                  <Button variant="outline" className="w-full justify-start font-normal" />
                }
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateAdded ? format(dateAdded, "dd MMM yyyy") : "Pick a date"}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateAdded}
                  onSelect={(day) => {
                    setDateAdded(day);
                    setCalendarOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={3}
            />
          </div>
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
          <Button onClick={handleSave} disabled={saving} className="cursor-pointer">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Update Vehicle" : "Add Vehicle"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
