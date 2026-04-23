"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { useFleet } from "@/contexts/fleet-context"
import { useFormDraft } from "@/hooks/use-form-draft"
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
import { AreaMultiInput } from "@/components/shared/area-multi-input"
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
  const { fleetId, isDriver, driverId: myDriverId } = useFleet()
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
  const [coordinator, setCoordinator] = useState(trip?.coordinator ?? "")
  const [areas, setAreas] = useState<string[]>(
    (trip?.areas && trip.areas.length > 0) ? trip.areas : (trip?.area ? [trip.area] : [])
  )
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
          .eq("status", "active")
          .order("last_name"),
      ])
      setClients((clientsRes.data ?? []) as ContractClient[])
      setVehicles((vehiclesRes.data ?? []) as Vehicle[])
      setDrivers((driversRes.data ?? []) as Driver[])

      // For drivers creating a new trip, fetch their own assigned vehicle
      let driverVehicleId: string | null = null;
      if (isDriver && myDriverId && !trip) {
        const { data: assignment } = await supabase
          .from("vehicle_driver_assignments")
          .select("vehicle_id")
          .eq("driver_id", myDriverId)
          .eq("fleet_id", fleetId!)
          .is("unassigned_at", null)
          .maybeSingle();
        driverVehicleId = assignment?.vehicle_id ?? null;
      }

      // Reset form state
      setClientId(trip?.client_id ?? "")
      setVehicleId(
        trip?.vehicle_id ?? (isDriver && !trip ? driverVehicleId ?? "" : "")
      )
      setDriverId(trip?.driver_id ?? (isDriver && !trip ? myDriverId ?? "" : ""))
      setTripDate(trip?.trip_date ?? format(new Date(), "yyyy-MM-dd"))
      setTripTime(trip?.trip_time ?? "")
      setCompanyLabel(trip?.company_label ?? "")
      setCoordinator(trip?.coordinator ?? "")
      setAreas(
        trip?.areas && trip.areas.length > 0
          ? trip.areas
          : trip?.area
            ? [trip.area]
            : []
      )
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

  // Draft persistence — add mode only. Declared after the reset effect so
  // restored values aren't clobbered by the [open, trip?.id] load effect.
  const draftKey = !trip && fleetId ? `fleet:${fleetId}:draft:contract-trip-new` : null
  const { clearDraft } = useFormDraft({
    key: draftKey,
    enabled: open,
    changeSignal:
      clientId + "|" + vehicleId + "|" + driverId + "|" + tripDate + "|" + tripTime + "|" +
      companyLabel + "|" + coordinator + "|" + areas.join(",") + "|" + pax + "|" + amount + "|" + notes,
    getValues: () => ({
      clientId, vehicleId, driverId, tripDate, tripTime,
      companyLabel, coordinator, areas, pax, amount, notes,
    }),
    applyValues: (v) => {
      setClientId(v.clientId ?? "")
      setVehicleId(v.vehicleId ?? "")
      setDriverId(v.driverId ?? "")
      setTripDate(v.tripDate ?? format(new Date(), "yyyy-MM-dd"))
      setTripTime(v.tripTime ?? "")
      setCompanyLabel(v.companyLabel ?? "")
      setCoordinator(v.coordinator ?? "")
      setAreas(Array.isArray(v.areas) ? v.areas : [])
      setPax(v.pax ?? "")
      setAmount(v.amount ?? "")
      setNotes(v.notes ?? "")
    },
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Owners must pick a client; drivers don't see the field and leave it
    // null for the owner to backfill later.
    if (!isDriver && !clientId) {
      toast.error("Client is required")
      return
    }
    if (areas.length === 0) {
      toast.error("At least one area is required")
      return
    }

    // Amount: owners must enter it; drivers leave it blank and the owner
    // fills it in when billing.
    let amountNum: number | null = null
    if (!isDriver) {
      const n = Number(amount)
      if (!isFinite(n) || n < 0) {
        toast.error("Amount must be a positive number")
        return
      }
      amountNum = n
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

    const cleanAreas = areas.map((a) => a.trim().slice(0, 200)).filter(Boolean)

    const payload = {
      client_id: isDriver ? null : clientId || null,
      vehicle_id: vehicleId || null,
      driver_id: driverId || null,
      trip_date: tripDate,
      trip_time: tripTime || null,
      company_label: companyLabel.trim().slice(0, 100) || null,
      coordinator: coordinator.trim().slice(0, 100) || null,
      // Store both columns for now: `area` (legacy TEXT) gets the first
      // entry for backward compat, `areas` holds the full array.
      area: cleanAreas[0] ?? null,
      areas: cleanAreas,
      pax: paxNum,
      amount: amountNum,
      commission_amount: isDriver ? null : commissionAmount,
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
    clearDraft()
    onOpenChange(false)
    onSaved()
  }

  // Derive display labels so the SelectTrigger shows the actual name,
  // not the raw UUID (base-ui Select can't resolve labels when value is set programmatically)
  const selectedClient = clients.find((c) => c.id === clientId)
  const clientLabel = selectedClient?.name ?? null

  const selectedDriver = drivers.find((d) => d.id === driverId)
  const driverLabel = selectedDriver ? `${selectedDriver.first_name} ${selectedDriver.last_name}` : null

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId)
  const vehicleLabel = selectedVehicle?.registration ?? null

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
          {/* Client picker is hidden for drivers — owner assigns/bills later. */}
          {!isDriver && (
            <div className="space-y-1.5">
              <Label htmlFor="client">Client *</Label>
              <Select value={clientId} onValueChange={(v) => setClientId(v ?? "")}>
                <SelectTrigger id="client" className="w-full">
                  {clientLabel ? (
                    <span className="flex flex-1 text-left truncate">{clientLabel}</span>
                  ) : (
                    <SelectValue placeholder="Select client" />
                  )}
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
          )}

          {isDriver ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Driver</Label>
                <div className="flex h-9 items-center rounded-md border bg-muted/50 px-3 text-sm">
                  {driverLabel ?? "—"}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Vehicle</Label>
                <div className="flex h-9 items-center rounded-md border bg-muted/50 px-3 text-sm">
                  {vehicleLabel ?? "No vehicle assigned"}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="driver">Driver</Label>
                <Select value={driverId} onValueChange={(v) => setDriverId(v ?? "")}>
                  <SelectTrigger id="driver" className="w-full">
                    {driverLabel ? (
                      <span className="flex flex-1 text-left truncate">{driverLabel}</span>
                    ) : (
                      <SelectValue placeholder="Select driver" />
                    )}
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
                  <SelectTrigger id="vehicle" className="w-full">
                    {vehicleLabel ? (
                      <span className="flex flex-1 text-left truncate">{vehicleLabel}</span>
                    ) : (
                      <SelectValue placeholder="Select vehicle" />
                    )}
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
          )}

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
              <Label htmlFor="coordinator">Co-ordinator</Label>
              <Input
                id="coordinator"
                value={coordinator}
                onChange={(e) => setCoordinator(e.target.value)}
                placeholder="Who co-ordinated this trip"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Areas *</Label>
            <AreaMultiInput
              value={areas}
              onChange={setAreas}
              placeholder="Start typing an area..."
            />
          </div>

          <div className={isDriver ? "space-y-1.5" : "grid grid-cols-2 gap-3"}>
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
            {/* Amount is hidden for drivers — owner sets it at billing time. */}
            {!isDriver && (
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
            )}
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
