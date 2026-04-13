"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus } from "lucide-react"
import { format, parseISO } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { useFleet } from "@/contexts/fleet-context"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable, type ColumnDef } from "@/components/shared/data-table"
import { PaginationControls } from "@/components/shared/pagination-controls"
import { Button } from "@/components/ui/button"
import { ContractTripFormSheet } from "@/components/contract/contract-trip-form-sheet"
import { Badge } from "@/components/ui/badge"
import type { ContractTrip } from "@/types/database"

const PAGE_SIZE = 50

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

// Drivers can also access this page — RLS scopes the query to their own
// trips, and the form sheet locks driver + vehicle for isDriver.
export default function ContractTripsPage() {
  return <ContractTripsContent />
}

function ContractTripsContent() {
  const { fleetId } = useFleet()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pageParam = Number(searchParams.get("page") ?? "1")
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1

  const [trips, setTrips] = useState<TripRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<ContractTrip | null>(null)

  const fetchTrips = useCallback(async () => {
    if (!fleetId) return
    setLoading(true)
    const supabase = createClient()
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const { data, count } = await supabase
      .from("contract_trips")
      .select(
        "*, client:contract_clients(name), driver:drivers(first_name, last_name), vehicle:vehicles(registration)",
        { count: "exact" }
      )
      .eq("fleet_id", fleetId!)
      .order("trip_date", { ascending: false })
      .order("trip_time", { ascending: true })
      .range(from, to)
    setTrips((data ?? []) as unknown as TripRow[])
    setTotalCount(count ?? 0)
    setLoading(false)
  }, [fleetId, page])

  useEffect(() => {
    fetchTrips()
  }, [fetchTrips])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  function handlePageChange(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (nextPage === 1) params.delete("page")
    else params.set("page", String(nextPage))
    router.push(`?${params.toString()}`)
  }

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
        sortable: true,
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
      {
        key: "coordinator",
        header: "Co-ordinator",
        render: (row) => row.coordinator ?? "—",
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

      <PaginationControls
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={PAGE_SIZE}
        onPageChange={handlePageChange}
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
