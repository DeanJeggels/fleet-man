"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useFleet } from "@/contexts/fleet-context"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable, type ColumnDef } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OwnerOnlyGuard } from "@/components/shared/owner-only-guard"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Driver, DriverPayout } from "@/types/database"

const zar = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
})

type PayoutRow = DriverPayout & {
  driver: { first_name: string; last_name: string; commission_per_trip: number | null } | null
}

export default function PayoutsPage() {
  return (
    <OwnerOnlyGuard>
      <PayoutsContent />
    </OwnerOnlyGuard>
  )
}

function PayoutsContent() {
  const { fleetId } = useFleet()
  const [payouts, setPayouts] = useState<PayoutRow[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Dialog form state
  const [driverId, setDriverId] = useState("")
  const [periodStart, setPeriodStart] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"))
  const [periodEnd, setPeriodEnd] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"))
  const [preview, setPreview] = useState<{ tripCount: number; total: number } | null>(null)
  const [creating, setCreating] = useState(false)

  const fetchAll = useCallback(async () => {
    if (!fleetId) return
    setLoading(true)
    const supabase = createClient()
    const [payoutsRes, driversRes] = await Promise.all([
      supabase
        .from("driver_payouts")
        .select("*, driver:drivers(first_name, last_name, commission_per_trip)")
        .eq("fleet_id", fleetId!)
        .order("period_end", { ascending: false }),
      supabase
        .from("drivers")
        .select("*")
        .eq("fleet_id", fleetId!)
        .eq("category", "contract")
        .order("last_name"),
    ])
    setPayouts((payoutsRes.data ?? []) as unknown as PayoutRow[])
    setDrivers((driversRes.data ?? []) as Driver[])
    setLoading(false)
  }, [fleetId])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const selectedDriver = drivers.find((d) => d.id === driverId)
  const driverLabel = selectedDriver ? `${selectedDriver.first_name} ${selectedDriver.last_name}` : null

  async function previewPayout() {
    if (!fleetId || !driverId) return
    const supabase = createClient()
    const driver = drivers.find((d) => d.id === driverId)
    const commissionPerTrip = Number(driver?.commission_per_trip ?? 0)

    const { data } = await supabase
      .from("contract_trips")
      .select("id", { count: "exact", head: false })
      .eq("fleet_id", fleetId!)
      .eq("driver_id", driverId)
      .gte("trip_date", periodStart)
      .lte("trip_date", periodEnd)
    const tripCount = data?.length ?? 0
    setPreview({ tripCount, total: tripCount * commissionPerTrip })
  }

  async function createPayout() {
    if (!fleetId || !driverId || !preview) return
    setCreating(true)
    const supabase = createClient()
    const { error } = await supabase.from("driver_payouts").insert({
      fleet_id: fleetId!,
      driver_id: driverId,
      period_start: periodStart,
      period_end: periodEnd,
      trip_count: preview.tripCount,
      total_payout: preview.total,
    })
    setCreating(false)
    if (error) {
      console.error(error)
      toast.error("Failed to create payout.")
      return
    }
    toast.success("Payout created.")
    setDialogOpen(false)
    setPreview(null)
    setDriverId("")
    fetchAll()
  }

  async function markPaid(payoutId: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from("driver_payouts")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", payoutId)
      .eq("fleet_id", fleetId!)
    if (error) {
      console.error(error)
      toast.error("Failed to mark payout as paid.")
      return
    }
    toast.success("Payout marked as paid.")
    fetchAll()
  }

  const columns: ColumnDef<PayoutRow>[] = useMemo(
    () => [
      {
        key: "driver",
        header: "Driver",
        render: (row) =>
          row.driver ? `${row.driver.first_name} ${row.driver.last_name}` : "—",
      },
      {
        key: "period",
        header: "Period",
        render: (row) =>
          `${format(parseISO(row.period_start), "dd MMM")} – ${format(parseISO(row.period_end), "dd MMM yyyy")}`,
      },
      { key: "trip_count", header: "Trips" },
      {
        key: "total_payout",
        header: "Total",
        render: (row) => (
          <span className="font-mono font-medium">{zar.format(Number(row.total_payout))}</span>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (row) => (
          <Badge
            variant="outline"
            className={
              row.status === "paid"
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700"
            }
          >
            {row.status}
          </Badge>
        ),
      },
      {
        key: "actions",
        header: "",
        render: (row) =>
          row.status === "pending" ? (
            <Button
              size="sm"
              variant="outline"
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                markPaid(row.id)
              }}
            >
              Mark Paid
            </Button>
          ) : null,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fleetId]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Driver Payouts"
        description="Commission runs per driver per period"
        backHref="/contract"
        backLabel="Back to Contract"
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button className="cursor-pointer">
                  <Plus className="mr-1.5 h-4 w-4" />
                  New Payout Run
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Payout Run</DialogTitle>
                <DialogDescription>
                  Calculate driver commission for a period.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Driver *</Label>
                  <Select value={driverId} onValueChange={(v) => setDriverId(v ?? "")}>
                    <SelectTrigger className="w-full">
                      {driverLabel ? (
                        <span className="flex flex-1 text-left truncate">{driverLabel}</span>
                      ) : (
                        <SelectValue placeholder="Select driver" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.first_name} {d.last_name}{" "}
                          {d.commission_per_trip != null &&
                            `(${zar.format(Number(d.commission_per_trip))}/trip)`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label>Period Start</Label>
                    <Input
                      type="date"
                      value={periodStart}
                      onChange={(e) => setPeriodStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Period End</Label>
                    <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
                  </div>
                </div>
                <Button onClick={previewPayout} variant="outline" className="cursor-pointer">
                  Preview
                </Button>
                {preview && (
                  <div className="rounded-md border p-3 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Trips in period</span>
                      <span>{preview.tripCount}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Total payout</span>
                      <span className="font-mono">{zar.format(preview.total)}</span>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={createPayout} disabled={!preview || creating} className="cursor-pointer">
                  {creating ? "Creating..." : "Create Payout"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <DataTable<PayoutRow>
        columns={columns}
        data={payouts}
        loading={loading}
        emptyMessage="No payouts yet. Create your first payout run."
      />
    </div>
  )
}
