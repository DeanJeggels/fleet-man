"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { format, parseISO } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { useFleet } from "@/contexts/fleet-context"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable, type ColumnDef } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { OwnerOnlyGuard } from "@/components/shared/owner-only-guard"
import { ContractTripFormSheet } from "@/components/contract/contract-trip-form-sheet"
import { Badge } from "@/components/ui/badge"
import type { ContractTrip } from "@/types/database"

const zar = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

type TripRow = ContractTrip & {
  client: { name: string } | null
  driver: { first_name: string; last_name: string } | null
  vehicle: { registration: string } | null
}

export default function ContractTripsPage() {
  return (
    <OwnerOnlyGuard>
      <ContractTripsContent />
    </OwnerOnlyGuard>
  )
}

function ContractTripsContent() {
  const { fleetId } = useFleet()
  const [trips, setTrips] = useState<TripRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<ContractTrip | null>(null)

  const fetchTrips = useCallback(async () => {
    if (!fleetId) return
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("contract_trips")
      .select(
        "*, client:contract_clients(name), driver:drivers(first_name, last_name), vehicle:vehicles(registration)"
      )
      .eq("fleet_id", fleetId!)
      .order("trip_date", { ascending: false })
      .limit(500)
    setTrips((data ?? []) as unknown as TripRow[])
    setLoading(false)
  }, [fleetId])

  useEffect(() => {
    fetchTrips()
  }, [fetchTrips])

  const columns: ColumnDef<TripRow>[] = useMemo(
    () => [
      {
        key: "trip_date",
        header: "Date",
        sortable: true,
        render: (row) => format(parseISO(row.trip_date), "dd MMM yyyy"),
      },
      {
        key: "trip_time",
        header: "Time",
        render: (row) => row.trip_time ?? "",
      },
      {
        key: "client",
        header: "Client",
        render: (row) => row.client?.name ?? "—",
      },
      {
        key: "driver",
        header: "Driver",
        render: (row) =>
          row.driver ? `${row.driver.first_name} ${row.driver.last_name}` : "—",
      },
      {
        key: "vehicle",
        header: "Vehicle",
        render: (row) => row.vehicle?.registration ?? "—",
      },
      {
        key: "company_label",
        header: "Company",
        render: (row) => row.company_label ?? "—",
      },
      { key: "area", header: "Area" },
      { key: "pax", header: "Pax", render: (row) => row.pax ?? "—" },
      {
        key: "amount",
        header: "Amount",
        sortable: true,
        render: (row) => (
          <span className="font-mono">{zar.format(Number(row.amount))}</span>
        ),
      },
      {
        key: "invoice_id",
        header: "Invoice",
        render: (row) =>
          row.invoice_id ? (
            <Badge variant="outline" className="bg-green-100 text-green-700">Invoiced</Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-100 text-amber-700">Pending</Badge>
          ),
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contract Trips"
        description="Log and view individual trips"
        action={
          <Button
            onClick={() => {
              setEditing(null)
              setSheetOpen(true)
            }}
            className="cursor-pointer"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Trip
          </Button>
        }
      />

      <DataTable<TripRow>
        columns={columns}
        data={trips}
        loading={loading}
        searchable
        searchKey="area"
        searchPlaceholder="Search by area..."
        emptyMessage="No trips yet. Add your first trip to get started."
        onRowClick={(row) => {
          setEditing(row)
          setSheetOpen(true)
        }}
      />

      <ContractTripFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        trip={editing}
        onSaved={fetchTrips}
      />
    </div>
  )
}
