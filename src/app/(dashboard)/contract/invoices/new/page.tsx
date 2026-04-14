"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useFleet } from "@/contexts/fleet-context"
import { PageHeader } from "@/components/shared/page-header"
import { OwnerOnlyGuard } from "@/components/shared/owner-only-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  ContractClient,
  ContractTrip,
  Driver,
  FleetSettings,
} from "@/types/database"

const zar = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
})

export default function NewInvoicePage() {
  return (
    <OwnerOnlyGuard>
      <NewInvoiceContent />
    </OwnerOnlyGuard>
  )
}

function NewInvoiceContent() {
  const router = useRouter()
  const { fleetId } = useFleet()
  const supabase = createClient()

  const [clients, setClients] = useState<ContractClient[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [settings, setSettings] = useState<FleetSettings | null>(null)

  const [clientId, setClientId] = useState("")
  const [driverId, setDriverId] = useState("")
  const [periodStart, setPeriodStart] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"))
  const [periodEnd, setPeriodEnd] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"))

  const [matchedTrips, setMatchedTrips] = useState<ContractTrip[]>([])
  const [loadingTrips, setLoadingTrips] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!fleetId) return
    async function loadRefs() {
      const [c, d, s] = await Promise.all([
        supabase.from("contract_clients").select("*").eq("fleet_id", fleetId!).order("name"),
        supabase
          .from("drivers")
          .select("*")
          .eq("fleet_id", fleetId!)
          .eq("category", "contract")
          .order("last_name"),
        supabase.from("fleet_settings").select("*").eq("fleet_id", fleetId!).single(),
      ])
      setClients((c.data ?? []) as ContractClient[])
      setDrivers((d.data ?? []) as Driver[])
      setSettings((s.data ?? null) as FleetSettings | null)
    }
    loadRefs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fleetId])

  const findTrips = useCallback(async () => {
    if (!fleetId || !clientId || !periodStart || !periodEnd) return
    setLoadingTrips(true)
    let query = supabase
      .from("contract_trips")
      .select("*")
      .eq("fleet_id", fleetId!)
      .eq("client_id", clientId)
      .gte("trip_date", periodStart)
      .lte("trip_date", periodEnd)
      .is("invoice_id", null)
      .order("trip_date", { ascending: true })
      .order("trip_time", { ascending: true })

    if (driverId) query = query.eq("driver_id", driverId)

    const { data } = await query
    setMatchedTrips((data ?? []) as ContractTrip[])
    setLoadingTrips(false)
  }, [fleetId, clientId, driverId, periodStart, periodEnd, supabase])

  const totalAmount = matchedTrips.reduce((s, t) => s + Number(t.amount ?? 0), 0)

  async function handleCreateInvoice() {
    if (!fleetId) return
    if (!clientId) return toast.error("Select a client")
    if (matchedTrips.length === 0) return toast.error("No trips to invoice")

    setCreating(true)

    // Get next invoice number and increment atomically
    const nextNum = settings?.next_invoice_number ?? 1
    const invoiceNumber = String(nextNum)

    const driver = drivers.find((d) => d.id === driverId)
    const driverName = driver ? `${driver.first_name} ${driver.last_name}` : null

    // Pull vehicle registration snapshot from the most-common vehicle in matched trips
    const vehicleCounts = new Map<string, number>()
    matchedTrips.forEach((t) => {
      if (t.vehicle_id) vehicleCounts.set(t.vehicle_id, (vehicleCounts.get(t.vehicle_id) ?? 0) + 1)
    })
    const topVehicleId = [...vehicleCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    let vehicleReg: string | null = null
    if (topVehicleId) {
      const { data: v } = await supabase
        .from("vehicles")
        .select("registration")
        .eq("id", topVehicleId)
        .eq("fleet_id", fleetId!)
        .single()
      vehicleReg = v?.registration ?? null
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from("contract_invoices")
      .insert({
        fleet_id: fleetId!,
        invoice_number: invoiceNumber,
        invoice_date: format(new Date(), "yyyy-MM-dd"),
        service_period_start: periodStart,
        service_period_end: periodEnd,
        client_id: clientId,
        driver_id: driverId || null,
        vehicle_id: topVehicleId ?? null,
        vehicle_registration_snapshot: vehicleReg,
        driver_name_snapshot: driverName,
        // Copy banking defaults from fleet_settings onto the invoice row
        bank_name: settings?.bank_name ?? null,
        bank_account_type: settings?.bank_account_type ?? null,
        bank_account_number: settings?.bank_account_number ?? null,
        bank_branch_code: settings?.bank_branch_code ?? null,
        bank_account_holder: settings?.bank_account_holder ?? null,
        subtotal: totalAmount,
        total: totalAmount,
      })
      .select("*")
      .single()

    if (invoiceError || !invoice) {
      console.error(invoiceError)
      setCreating(false)
      toast.error("Failed to create invoice.")
      return
    }

    // Assign invoice_id on each trip
    const tripIds = matchedTrips.map((t) => t.id)
    const { error: updateError } = await supabase
      .from("contract_trips")
      .update({ invoice_id: invoice.id })
      .in("id", tripIds)
      .eq("fleet_id", fleetId!)

    if (updateError) {
      console.error(updateError)
      toast.error("Invoice created but failed to assign trips. Check invoice detail page.")
    }

    // Increment next_invoice_number
    await supabase
      .from("fleet_settings")
      .update({ next_invoice_number: nextNum + 1 })
      .eq("fleet_id", fleetId!)

    setCreating(false)
    toast.success(`Invoice ${invoiceNumber} created with ${matchedTrips.length} trips.`)
    router.push(`/contract/invoices/${invoice.id}`)
  }

  // Derived labels — base-ui Select can't resolve UUIDs to labels automatically
  const selectedClient = clients.find((c) => c.id === clientId)
  const clientLabel = selectedClient?.name ?? null
  const selectedDriver = drivers.find((d) => d.id === driverId)
  const driverLabel = selectedDriver ? `${selectedDriver.first_name} ${selectedDriver.last_name}` : null

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Invoice"
        description="Bundle uninvoiced trips into a new client invoice"
        backHref="/contract/invoices"
        backLabel="Back to Invoices"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Client *</Label>
              <Select value={clientId} onValueChange={(v) => setClientId(v ?? "")}>
                <SelectTrigger className="w-full">
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
            <div className="space-y-1.5">
              <Label>Driver (optional filter)</Label>
              <Select value={driverId} onValueChange={(v) => setDriverId(v ?? "")}>
                <SelectTrigger className="w-full">
                  {driverLabel ? (
                    <span className="flex flex-1 text-left truncate">{driverLabel}</span>
                  ) : (
                    <SelectValue placeholder="All drivers" />
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
              <Label>Period Start *</Label>
              <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Period End *</Label>
              <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </div>
          </div>

          <Button onClick={findTrips} variant="outline" className="cursor-pointer">
            {loadingTrips ? "Finding trips..." : "Find uninvoiced trips"}
          </Button>
        </CardContent>
      </Card>

      {matchedTrips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Matched Trips ({matchedTrips.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="pb-2 text-left font-medium">Date</th>
                    <th className="pb-2 text-left font-medium">Time</th>
                    <th className="pb-2 text-left font-medium">Company</th>
                    <th className="pb-2 text-left font-medium">Area</th>
                    <th className="pb-2 text-right font-medium">Pax</th>
                    <th className="pb-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {matchedTrips.map((t) => (
                    <tr key={t.id} className="border-b last:border-0">
                      <td className="py-2">{format(parseISO(t.trip_date), "dd MMM yyyy")}</td>
                      <td className="py-2">{t.trip_time ?? ""}</td>
                      <td className="py-2">{t.company_label ?? ""}</td>
                      <td className="py-2">{t.area}</td>
                      <td className="py-2 text-right">{t.pax ?? ""}</td>
                      <td className="py-2 text-right font-mono">{zar.format(Number(t.amount))}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 font-medium">
                    <td colSpan={5} className="py-2 text-right">Total</td>
                    <td className="py-2 text-right font-mono">{zar.format(totalAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <Button onClick={handleCreateInvoice} disabled={creating} className="cursor-pointer">
                {creating ? "Creating..." : `Create Invoice ${settings?.next_invoice_number ?? ""}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
