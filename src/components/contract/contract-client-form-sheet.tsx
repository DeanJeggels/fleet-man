"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useFleet } from "@/contexts/fleet-context"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ContractClient } from "@/types/database"

interface ContractClientFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: ContractClient | null
  onSaved: () => void
}

export function ContractClientFormSheet({
  open,
  onOpenChange,
  client,
  onSaved,
}: ContractClientFormSheetProps) {
  const { fleetId } = useFleet()
  const isEdit = !!client
  const [saving, setSaving] = useState(false)
  const [consented, setConsented] = useState(false)
  const [name, setName] = useState(client?.name ?? "")
  const [contactPerson, setContactPerson] = useState(client?.contact_person ?? "")
  const [phone, setPhone] = useState(client?.phone ?? "")
  const [email, setEmail] = useState(client?.email ?? "")
  const [addressLine, setAddressLine] = useState(client?.address_line ?? "")
  const [city, setCity] = useState(client?.city ?? "")
  const [province, setProvince] = useState(client?.province ?? "")
  const [postalCode, setPostalCode] = useState(client?.postal_code ?? "")
  const [defaultRate, setDefaultRate] = useState(
    client?.default_rate_per_trip != null ? String(client.default_rate_per_trip) : ""
  )
  const [notes, setNotes] = useState(client?.notes ?? "")

  const handleOpenChange = (value: boolean) => {
    if (value) {
      setName(client?.name ?? "")
      setContactPerson(client?.contact_person ?? "")
      setPhone(client?.phone ?? "")
      setEmail(client?.email ?? "")
      setAddressLine(client?.address_line ?? "")
      setCity(client?.city ?? "")
      setProvince(client?.province ?? "")
      setPostalCode(client?.postal_code ?? "")
      setDefaultRate(client?.default_rate_per_trip != null ? String(client.default_rate_per_trip) : "")
      setNotes(client?.notes ?? "")
      setConsented(false)
    }
    onOpenChange(value)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Name is required")
      return
    }
    const rate = defaultRate ? Number(defaultRate) : null
    if (rate !== null && (!isFinite(rate) || rate < 0)) {
      toast.error("Default rate must be a positive number")
      return
    }

    setSaving(true)
    const supabase = createClient()

    const payload = {
      name: name.trim().slice(0, 200),
      contact_person: contactPerson.trim().slice(0, 200) || null,
      phone: phone.trim().slice(0, 200) || null,
      email: email.trim().slice(0, 200) || null,
      address_line: addressLine.trim().slice(0, 500) || null,
      city: city.trim().slice(0, 100) || null,
      province: province.trim().slice(0, 100) || null,
      postal_code: postalCode.trim().slice(0, 20) || null,
      default_rate_per_trip: rate,
      notes: notes.trim().slice(0, 1000) || null,
    }

    const { error } = client
      ? await supabase
          .from("contract_clients")
          .update(payload)
          .eq("id", client.id)
          .eq("fleet_id", fleetId!)
      : await supabase
          .from("contract_clients")
          .insert({ ...payload, fleet_id: fleetId!, consented_at: new Date().toISOString() })

    setSaving(false)

    if (error) {
      console.error(error)
      toast.error("Something went wrong. Please try again.")
      return
    }

    toast.success(client ? "Client updated" : "Client added")
    onOpenChange(false)
    onSaved()
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{client ? "Edit Client" : "Add Client"}</SheetTitle>
          <SheetDescription>
            {client ? "Update client details." : "Add a new contract client."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 px-4 overflow-y-auto">
          <div className="space-y-1.5">
            <Label htmlFor="name">Company Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. WCL TRADING CC"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact">Contact Person</Label>
            <Input
              id="contact"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="e.g. John Smith"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 021 486 1600"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@example.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              placeholder="e.g. 1 Plein Street, Woodstock"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="province">Province</Label>
              <Input id="province" value={province} onChange={(e) => setProvince(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="postal">Postal Code</Label>
              <Input id="postal" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rate">Default Rate per Trip (ZAR)</Label>
            <Input
              id="rate"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={defaultRate}
              onChange={(e) => setDefaultRate(e.target.value)}
              placeholder="e.g. 300"
            />
            <p className="text-xs text-muted-foreground">
              Used as the default amount when adding new trips for this client.
            </p>
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
              I confirm consent has been obtained to store this client&apos;s contact information in accordance with POPI Act.
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
  )
}
