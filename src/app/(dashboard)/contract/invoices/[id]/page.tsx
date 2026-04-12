"use client"

import { use, useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { Download, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useFleet } from "@/contexts/fleet-context"
import { PageHeader } from "@/components/shared/page-header"
import { OwnerOnlyGuard } from "@/components/shared/owner-only-guard"
import { InvoiceStatusBadge } from "@/components/contract/invoice-status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ContractInvoice, ContractTrip, ContractClient, FleetSettings, TablesUpdate } from "@/types/database"

const zar = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
})

interface PageProps {
  params: Promise<{ id: string }>
}

export default function InvoiceDetailPage({ params }: PageProps) {
  const { id } = use(params)
  return (
    <OwnerOnlyGuard>
      <InvoiceDetailContent id={id} />
    </OwnerOnlyGuard>
  )
}

function InvoiceDetailContent({ id }: { id: string }) {
  const router = useRouter()
  const { fleetId } = useFleet()
  const [invoice, setInvoice] = useState<ContractInvoice | null>(null)
  const [client, setClient] = useState<ContractClient | null>(null)
  const [trips, setTrips] = useState<ContractTrip[]>([])
  const [settings, setSettings] = useState<FleetSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingBank, setSavingBank] = useState(false)
  const [downloading, setDownloading] = useState(false)

  // Editable banking fields
  const [bankHolder, setBankHolder] = useState("")
  const [bankName, setBankName] = useState("")
  const [bankAccountType, setBankAccountType] = useState("")
  const [bankAccountNumber, setBankAccountNumber] = useState("")
  const [bankBranchCode, setBankBranchCode] = useState("")

  const fetchAll = useCallback(async () => {
    if (!fleetId) return
    setLoading(true)
    const supabase = createClient()
    const { data: inv } = await supabase
      .from("contract_invoices")
      .select("*")
      .eq("id", id)
      .eq("fleet_id", fleetId!)
      .single()
    if (!inv) {
      setLoading(false)
      return
    }
    setInvoice(inv as ContractInvoice)
    setBankHolder((inv as ContractInvoice).bank_account_holder ?? "")
    setBankName((inv as ContractInvoice).bank_name ?? "")
    setBankAccountType((inv as ContractInvoice).bank_account_type ?? "")
    setBankAccountNumber((inv as ContractInvoice).bank_account_number ?? "")
    setBankBranchCode((inv as ContractInvoice).bank_branch_code ?? "")

    const [clientRes, tripsRes, settingsRes] = await Promise.all([
      supabase.from("contract_clients").select("*").eq("id", inv.client_id).eq("fleet_id", fleetId!).single(),
      supabase
        .from("contract_trips")
        .select("*")
        .eq("invoice_id", id)
        .eq("fleet_id", fleetId!)
        .order("trip_date", { ascending: true })
        .order("trip_time", { ascending: true }),
      supabase.from("fleet_settings").select("*").eq("fleet_id", fleetId!).single(),
    ])
    setClient((clientRes.data ?? null) as ContractClient | null)
    setTrips((tripsRes.data ?? []) as ContractTrip[])
    setSettings((settingsRes.data ?? null) as FleetSettings | null)
    setLoading(false)
  }, [fleetId, id])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  async function handleSaveBanking() {
    if (!invoice) return
    setSavingBank(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("contract_invoices")
      .update({
        bank_account_holder: bankHolder || null,
        bank_name: bankName || null,
        bank_account_type: bankAccountType || null,
        bank_account_number: bankAccountNumber || null,
        bank_branch_code: bankBranchCode || null,
      })
      .eq("id", invoice.id)
      .eq("fleet_id", fleetId!)
    setSavingBank(false)
    if (error) {
      console.error(error)
      toast.error("Failed to update banking details.")
      return
    }
    toast.success("Banking details updated.")
    fetchAll()
  }

  async function handleStatusChange(newStatus: "sent" | "paid" | "cancelled") {
    if (!invoice) return
    const supabase = createClient()
    const patch: TablesUpdate<"contract_invoices"> = { status: newStatus }
    if (newStatus === "sent") patch.sent_at = new Date().toISOString()
    if (newStatus === "paid") patch.paid_at = new Date().toISOString()

    const { error } = await supabase
      .from("contract_invoices")
      .update(patch)
      .eq("id", invoice.id)
      .eq("fleet_id", fleetId!)
    if (error) {
      console.error(error)
      toast.error("Failed to update status.")
      return
    }
    toast.success(`Invoice marked as ${newStatus}.`)
    fetchAll()
  }

  async function handleDownloadPDF() {
    if (!invoice || !client) return
    setDownloading(true)
    try {
      // Dynamic import keeps @react-pdf/renderer out of the main bundle
      const { pdf } = await import("@react-pdf/renderer")
      const { InvoicePDF } = await import("@/components/contract/invoice-pdf-document")
      const blob = await pdf(
        <InvoicePDF invoice={invoice} client={client} trips={trips} settings={settings} />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Invoice-${invoice.invoice_number}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      toast.error("Failed to generate PDF.")
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading invoice...</div>
  }

  if (!invoice || !client) {
    return <div className="p-6 text-sm text-muted-foreground">Invoice not found.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/contract/invoices")} className="mb-2">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back
          </Button>
          <PageHeader
            title={`Invoice #${invoice.invoice_number}`}
            description={`${format(parseISO(invoice.invoice_date), "dd MMM yyyy")} · ${client.name}`}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <InvoiceStatusBadge status={invoice.status} />
          <Button variant="outline" onClick={handleDownloadPDF} disabled={downloading} className="cursor-pointer">
            <Download className="mr-1.5 h-4 w-4" />
            {downloading ? "Generating..." : "Download PDF"}
          </Button>
          {invoice.status === "draft" && (
            <Button onClick={() => handleStatusChange("sent")} className="cursor-pointer">
              Mark as Sent
            </Button>
          )}
          {invoice.status === "sent" && (
            <Button onClick={() => handleStatusChange("paid")} className="cursor-pointer">
              Mark as Paid
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoice Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service Period</span>
              <span>
                {format(parseISO(invoice.service_period_start), "dd MMM yyyy")} –{" "}
                {format(parseISO(invoice.service_period_end), "dd MMM yyyy")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Driver</span>
              <span>{invoice.driver_name_snapshot ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vehicle</span>
              <span className="font-mono">{invoice.vehicle_registration_snapshot ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trips</span>
              <span>{trips.length}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-medium">Total</span>
              <span className="font-mono font-medium">{zar.format(Number(invoice.total))}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Banking Details (editable)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Account Holder</Label>
              <Input value={bankHolder} onChange={(e) => setBankHolder(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Bank Name</Label>
                <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Account Type</Label>
                <Input value={bankAccountType} onChange={(e) => setBankAccountType(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Account Number</Label>
                <Input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Branch Code</Label>
                <Input value={bankBranchCode} onChange={(e) => setBankBranchCode(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleSaveBanking} disabled={savingBank} className="cursor-pointer">
              {savingBank ? "Saving..." : "Save Banking"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="pb-2 text-left font-medium w-10">No.</th>
                  <th className="pb-2 text-left font-medium">Date</th>
                  <th className="pb-2 text-left font-medium">Time</th>
                  <th className="pb-2 text-left font-medium">Company</th>
                  <th className="pb-2 text-left font-medium">Area</th>
                  <th className="pb-2 text-right font-medium">Pax</th>
                  <th className="pb-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((t, i) => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="py-2">{i + 1}</td>
                    <td className="py-2">{format(parseISO(t.trip_date), "dd MMM yyyy")}</td>
                    <td className="py-2">{t.trip_time ?? ""}</td>
                    <td className="py-2">{t.company_label ?? ""}</td>
                    <td className="py-2">{t.area}</td>
                    <td className="py-2 text-right">{t.pax ?? ""}</td>
                    <td className="py-2 text-right font-mono">{zar.format(Number(t.amount))}</td>
                  </tr>
                ))}
                <tr className="border-t-2 font-medium">
                  <td colSpan={6} className="py-2 text-right">Total</td>
                  <td className="py-2 text-right font-mono">{zar.format(Number(invoice.total))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
