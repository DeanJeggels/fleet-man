"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useFleet } from "@/contexts/fleet-context"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable, type ColumnDef } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { OwnerOnlyGuard } from "@/components/shared/owner-only-guard"
import { ContractClientFormSheet } from "@/components/contract/contract-client-form-sheet"
import type { ContractClient } from "@/types/database"

const zar = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
})

export default function ContractClientsPage() {
  return (
    <OwnerOnlyGuard>
      <ContractClientsContent />
    </OwnerOnlyGuard>
  )
}

function ContractClientsContent() {
  const { fleetId } = useFleet()
  const [clients, setClients] = useState<ContractClient[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<ContractClient | null>(null)

  const fetchClients = useCallback(async () => {
    if (!fleetId) return
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("contract_clients")
      .select("*")
      .eq("fleet_id", fleetId!)
      .order("name")
    setClients((data ?? []) as ContractClient[])
    setLoading(false)
  }, [fleetId])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const columns: ColumnDef<ContractClient>[] = useMemo(
    () => [
      { key: "name", header: "Name", sortable: true },
      { key: "contact_person", header: "Contact" },
      { key: "phone", header: "Phone" },
      { key: "city", header: "City" },
      {
        key: "default_rate_per_trip",
        header: "Default Rate",
        render: (row) =>
          row.default_rate_per_trip != null ? (
            <span className="font-mono">{zar.format(Number(row.default_rate_per_trip))}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contract Clients"
        description="Companies you bill for contract work"
        backHref="/contract"
        backLabel="Back to Contract"
        action={
          <Button
            onClick={() => {
              setEditing(null)
              setSheetOpen(true)
            }}
            className="cursor-pointer"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Client
          </Button>
        }
      />

      <DataTable<ContractClient>
        columns={columns}
        data={clients}
        loading={loading}
        searchable
        searchKey="name"
        searchPlaceholder="Search clients..."
        emptyMessage="No clients yet. Add your first client to start logging trips."
        onRowClick={(row) => {
          setEditing(row)
          setSheetOpen(true)
        }}
      />

      <ContractClientFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        client={editing}
        onSaved={fetchClients}
      />
    </div>
  )
}
