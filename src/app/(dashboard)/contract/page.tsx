"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Briefcase, FileText, Users, Car, TrendingUp, DollarSign } from "lucide-react"
import { format, startOfMonth } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { useFleet } from "@/contexts/fleet-context"
import { PageHeader } from "@/components/shared/page-header"
import { KPICard } from "@/components/shared/kpi-card"
import { OwnerOnlyGuard } from "@/components/shared/owner-only-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const zar = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export default function ContractLandingPage() {
  return (
    <OwnerOnlyGuard>
      <ContractLandingContent />
    </OwnerOnlyGuard>
  )
}

function ContractLandingContent() {
  const { fleetId } = useFleet()
  const [loading, setLoading] = useState(true)
  const [activeVehicles, setActiveVehicles] = useState(0)
  const [tripsMTD, setTripsMTD] = useState(0)
  const [revenueMTD, setRevenueMTD] = useState(0)
  const [outstandingTotal, setOutstandingTotal] = useState(0)
  const [pendingPayouts, setPendingPayouts] = useState(0)

  useEffect(() => {
    if (!fleetId) return
    async function load() {
      const supabase = createClient()
      const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd")

      const [vehicles, trips, invoices, payouts] = await Promise.all([
        supabase
          .from("vehicles")
          .select("id", { count: "exact", head: true })
          .eq("fleet_id", fleetId!)
          .eq("category", "contract")
          .eq("status", "active"),
        supabase
          .from("contract_trips")
          .select("amount")
          .eq("fleet_id", fleetId!)
          .gte("trip_date", monthStart),
        supabase
          .from("contract_invoices")
          .select("total, status")
          .eq("fleet_id", fleetId!)
          .in("status", ["draft", "sent", "overdue"]),
        supabase
          .from("driver_payouts")
          .select("total_payout, status")
          .eq("fleet_id", fleetId!)
          .eq("status", "pending"),
      ])

      setActiveVehicles(vehicles.count ?? 0)
      const tripRows = (trips.data ?? []) as { amount: number }[]
      setTripsMTD(tripRows.length)
      setRevenueMTD(tripRows.reduce((s, t) => s + Number(t.amount ?? 0), 0))

      const invRows = (invoices.data ?? []) as { total: number }[]
      setOutstandingTotal(invRows.reduce((s, r) => s + Number(r.total ?? 0), 0))

      const poRows = (payouts.data ?? []) as { total_payout: number }[]
      setPendingPayouts(poRows.reduce((s, r) => s + Number(r.total_payout ?? 0), 0))

      setLoading(false)
    }
    load()
  }, [fleetId])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contracting Fleet"
        description="Manage contract trips, clients, invoices and driver payouts"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KPICard
          title="Active Contract Vehicles"
          value={activeVehicles}
          icon={Car}
          color="accent"
          loading={loading}
        />
        <KPICard
          title="Trips MTD"
          value={tripsMTD}
          icon={TrendingUp}
          color="success"
          loading={loading}
        />
        <KPICard
          title="Revenue MTD"
          value={zar.format(revenueMTD)}
          icon={DollarSign}
          color="success"
          loading={loading}
        />
        <KPICard
          title="Outstanding Invoices"
          value={zar.format(outstandingTotal)}
          icon={FileText}
          color="warning"
          loading={loading}
        />
        <KPICard
          title="Pending Payouts"
          value={zar.format(pendingPayouts)}
          icon={Briefcase}
          color="destructive"
          loading={loading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/contract/clients">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="size-4" /> Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage the companies you bill (e.g. WCL TRADING CC).
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/contract/trips">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="size-4" /> Trips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Log individual trips with area, pax, and amount.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/contract/invoices">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-4" /> Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Generate invoices and download PDFs.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/contract/payouts">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Briefcase className="size-4" /> Payouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Track driver commission runs per period.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
