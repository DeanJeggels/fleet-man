"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useFleet } from "@/contexts/fleet-context";
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
import type { Database } from "@/types/database";

type Supplier = Database["public"]["Tables"]["suppliers"]["Row"];

interface SupplierFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier | null;
  onSaved: () => void;
}

export function SupplierFormSheet({
  open,
  onOpenChange,
  supplier,
  onSaved,
}: SupplierFormSheetProps) {
  const { fleetId } = useFleet();
  const isEdit = !!supplier;
  const [saving, setSaving] = useState(false);
  const [consented, setConsented] = useState(false);
  const [name, setName] = useState(supplier?.name ?? "");
  const [phone, setPhone] = useState(supplier?.phone ?? "");
  const [email, setEmail] = useState(supplier?.email ?? "");
  const [location, setLocation] = useState(supplier?.location ?? "");
  const [notes, setNotes] = useState(supplier?.notes ?? "");

  // Reset form when sheet opens with new supplier data
  const handleOpenChange = (value: boolean) => {
    if (value) {
      setName(supplier?.name ?? "");
      setPhone(supplier?.phone ?? "");
      setEmail(supplier?.email ?? "");
      setLocation(supplier?.location ?? "");
      setNotes(supplier?.notes ?? "");
      setConsented(false);
    }
    onOpenChange(value);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const payload = {
      name: name.trim().slice(0, 200),
      phone: phone.trim().slice(0, 200) || null,
      email: email.trim().slice(0, 200) || null,
      location: location.trim().slice(0, 200) || null,
      notes: notes.trim().slice(0, 1000) || null,
    };

    const { error } = supplier
      ? await supabase.from("suppliers").update(payload).eq("id", supplier.id).eq("fleet_id", fleetId!)
      : await supabase.from("suppliers").insert({ ...payload, fleet_id: fleetId!, consented_at: new Date().toISOString() });

    setSaving(false);

    if (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
      return;
    }

    toast.success(supplier ? "Supplier updated" : "Supplier added");
    onOpenChange(false);
    onSaved();
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{supplier ? "Edit Supplier" : "Add Supplier"}</SheetTitle>
          <SheetDescription>
            {supplier
              ? "Update supplier details."
              : "Add a new supplier to your fleet."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 px-4 overflow-y-auto">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Supplier name"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+27 ..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="supplier@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City or address"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
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
              I confirm consent has been obtained to store this supplier&apos;s contact information in accordance with POPI Act.
            </label>
          )}

          <SheetFooter>
            <Button type="submit" disabled={saving || (!isEdit && !consented)} className="cursor-pointer">
              {saving ? "Saving..." : "Save"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
