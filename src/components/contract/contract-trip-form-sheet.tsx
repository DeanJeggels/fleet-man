"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ContractTrip, ContractClient, Vehicle, Driver } from "@/types/database"

interface ContractTripFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trip?: ContractTrip | null
  onSaved: () => void
}

export function ContractTripFormSheet({
  open,
  onOpenChange,
  trip,
  onSaved,
}: ContractTripFormSheetProps) {
  const { fleetId } = useFleet()
  const [saving, setSaving] = useState(false)
  const [clients, setClients] = useState<ContractClient[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])

  const [clientId, setClientId] = useState(trip?.client_id ?? "")
  const [vehicleId, setVehicleId] = useState(trip?.vehicle_id ?? "")
  const [driverId, setDriverId] = useState(trip?.driver_id ?? "")
  const [tripDate, setTripDate] = useState(trip?.trip_date ?? format(new Date(), "yyyy-MM-dd"))
  const [tripTime, setTripTime] = useState(trip?.trip_time ?? "")
  const [companyLabel, setCompanyLabel] = useState(trip?.company_label ?? "")
  const [area, setArea] = useState(trip?.area ?? "")
  const [pax, setPax] = useState(trip?.pax != null ? String(trip.pax) : "")
  const [amount, setAmount] = useState(trip?.amount != null ? String(trip.amount) : "")
  const [notes, setNotes] = useState(trip?.notes ?? "")

  useEffect(() => {
    if (!open || !fleetId) return
    async function load() {
      const supabase = createClient()
      const [clientsRes, vehiclesRes, driversRes] = await Promise.all([
        supabase.from("contract_clients").select("*").eq("fleet_id", fleetId!).order("name"),
        supabase
          .from("vehicles")
          .select("*")
          .eq("fleet_id", fleetId!)
          .eq("category", "contract")
          .order("registration"),
        supabase
          .from("drivers")
          .select("*")
          .eq("fleet_id", fleetId!)
          .eq("category", "contract")
          .order("last_name"),
      ])
      setClients((clientsRes.data ?? []) as ContractClient[])
      setVehicles((vehiclesRes.data ?? []) as Vehicle[])
      setDrivers((driversRes.data ?? []) as Driver[])

      // Reset form state
      setClientId(trip?.client_id ?? "")
      setVehicleId(trip?.vehicle_id ?? "")
      setDriverId(trip?.driver_id ?? "")
      setTripDate(trip?.trip_date ?? format(new Date(), "yyyy-MM-dd"))
      setTripTime(trip?.trip_time ?? "")
      setCompanyLabel(trip?.company_label ?? "")
      setArea(trip?.area ?? "")
      setPax(trip?.pax != null ? String(trip.pax) : "")
      setAmount(trip?.amount != null ? String(trip.amount) : "")
      setNotes(trip?.notes ?? "")
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fleetId, trip?.id])

  // Auto-fill amount from client default rate when client is selected and amount is empty
  useEffect(() => {
    if (!clientId || amount) return
    const client = clients.find((c) => c.id === clientId)
    if (client?.default_rate_per_trip != null) {
      setAmount(String(client.default_rate_per_trip))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientId) {
      toast.error("Client is required")
      return
    }
    if (!area.trim()) {
      toast.error("Area is required")
      return
    }
    const amountNum = Number(amount)
    if (!isFinite(amountNum) || amountNum < 0) {
      toast.error("Amount must be a positive number")
      return
    }
    const paxNum = pax ? Number(pax) : null
    if (paxNum !== null && (!Number.isInteger(paxNum) || paxNum < 0)) {
      toast.error("Pax must be a whole number")
      return
    }

    // Compute commission snapshot from driver's commission_per_trip if available
    const driver = drivers.find((d) => d.id === driverId)
    const commissionAmount = driver?.commission_per_trip ?? null

    setSaving(true)
    const supabase = createClient()

    const payload = {
      client_id: clientId,
      vehicle_id: vehicleId || null,
      driver_id: driverId || null,
      trip_date: tripDate,
      trip_time: tripTime || null,
      company_label: companyLabel.trim().slice(0, 100) || null,
      area: area.trim().slice(0, 200),
      pax: paxNum,
      amount: amountNum,
      commission_amount: commissionAmount,
      notes: notes.trim().slice(0, 1000) || null,
    }

    const { error } = trip
      ? await supabase
          .from("contract_trips")
          .update(payload)
          .eq("id", trip.id)
          .eq("fleet_id", fleetId!)
      : await supabase
          .from("contract_trips")
          .insert({ ...payload, fleet_id: fleetId! })

    setSaving(false)

    if (error) {
      console.error(error)
      toast.error("Something went wrong. Please try again.")
      return
    }

    toast.success(trip ? "Trip updated" : "Trip added")
    onOpenChange(false)
    onSaved()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{trip ? "Edit Trip" : "Add Trip"}</SheetTitle>
          <SheetDescription>
            Log a single contract trip.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 px-4 overflow-y-auto">
          <div className="space-y-1.5">
            <Label htmlFor="client">Client *</Label>
            <Select value={clientId} onValueChange={(v) => setClientId(v ?? "")}>
              <SelectTrigger id="client">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="driver">Driver</Label>
              <Select value={driverId} onValueChange={(v) => setDriverId(v ?? "")}>
                <SelectTrigger id="driver">
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.first_name} {d.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vehicle">Vehicle</Label>
              <Select value={vehicleId} onValueChange={(v) => setVehicleId(v ?? "")}>
                <SelectTrigger id="vehicle">
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.registration}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={tripDate}
                onChange={(e) => setTripDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={tripTime}
                onChange={(e) => setTripTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={companyLabel}
                onChange={(e) => setCompanyLabel(e.target.value)}
                placeholder="e.g. Lewis, TP"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="area">Area *</Label>
              <Input
                id="area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Athlone"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pax">Pax</Label>
              <Input
                id="pax"
                type="number"
                inputMode="numeric"
                min={0}
                value={pax}
                onChange={(e) => setPax(e.target.value)}
                placeholder="e.g. 4"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount (ZAR) *</Label>
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="e.g. 300"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <SheetFooter>
            <Button type="submit" disabled={saving} className="cursor-pointer">
              {saving ? "Saving..." : "Save"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
