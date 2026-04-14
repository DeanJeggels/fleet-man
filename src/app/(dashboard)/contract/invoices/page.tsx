"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { format, parseISO } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { useFleet } from "@/contexts/fleet-context"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable, type ColumnDef } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { OwnerOnlyGuard } from "@/components/shared/owner-only-guard"
import { InvoiceStatusBadge } from "@/components/contract/invoice-status-badge"
import type { ContractInvoice } from "@/types/database"

const zar = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
})

type InvoiceRow = ContractInvoice & {
  client: { name: string } | null
  driver: { first_name: string; last_name: string } | null
}

export default function ContractInvoicesPage() {
  return (
    <OwnerOnlyGuard>
      <ContractInvoicesContent />
    </OwnerOnlyGuard>
  )
}

function ContractInvoicesContent() {
  const router = useRouter()
  const { fleetId } = useFleet()
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInvoices = useCallback(async () => {
    if (!fleetId) return
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("contract_invoices")
      .select("*, client:contract_clients(name), driver:drivers(first_name, last_name)")
      .eq("fleet_id", fleetId!)
      .order("invoice_date", { ascending: false })
    setInvoices((data ?? []) as unknown as InvoiceRow[])
    setLoading(false)
  }, [fleetId])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  const columns: ColumnDef<InvoiceRow>[] = useMemo(
    () => [
      {
        key: "invoice_number",
        header: "Invoice #",
        sortable: true,
        render: (row) => <span className="font-mono">{row.invoice_number}</span>,
      },
      {
        key: "invoice_date",
        header: "Date",
        sortable: true,
        render: (row) => format(parseISO(row.invoice_date), "dd MMM yyyy"),
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
        key: "service_period",
        header: "Period",
        render: (row) =>
          `${format(parseISO(row.service_period_start), "dd MMM")} – ${format(parseISO(row.service_period_end), "dd MMM")}`,
      },
      {
        key: "total",
        header: "Total",
        sortable: true,
        render: (row) => (
          <span className="font-mono font-medium">{zar.format(Number(row.total))}</span>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (row) => <InvoiceStatusBadge status={row.status} />,
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contract Invoices"
        description="Generate and track client invoices"
        backHref="/contract"
        backLabel="Back to Contract"
        action={
          <Button onClick={() => router.push("/contract/invoices/new")} className="cursor-pointer">
            <Plus className="mr-1.5 h-4 w-4" />
            New Invoice
          </Button>
        }
      />

      <DataTable<InvoiceRow>
        columns={columns}
        data={invoices}
        loading={loading}
        searchable
        searchKey="invoice_number"
        searchPlaceholder="Search by invoice number..."
        emptyMessage="No invoices yet. Create your first invoice from logged trips."
        onRowClick={(row) => router.push(`/contract/invoices/${row.id}`)}
      />
    </div>
  )
}
