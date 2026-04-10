"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFleet } from "@/contexts/fleet-context";
import { ArrowLeft, DollarSign, Phone, Mail, MapPin } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import { PageHeader } from "@/components/shared/page-header";
import { KPICard } from "@/components/shared/kpi-card";
import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Supplier = Database["public"]["Tables"]["suppliers"]["Row"];
type MaintenanceEvent = Database["public"]["Tables"]["maintenance_events"]["Row"];

const formatZAR = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
});

interface EventWithVehicle extends MaintenanceEvent {
  vehicles: { registration: string } | null;
  [key: string]: unknown;
}

interface MonthlySpend {
  month: string;
  spend: number;
}

const eventColumns: ColumnDef<EventWithVehicle>[] = [
  {
    key: "event_date",
    header: "Date",
    sortable: true,
    render: (row) =>
      new Date(row.event_date).toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
  },
  {
    key: "registration",
    header: "Vehicle",
    render: (row) => row.vehicles?.registration ?? "—",
  },
  {
    key: "category",
    header: "Type",
    render: (row) => row.category,
  },
  {
    key: "cost_total",
    header: "Cost",
    sortable: true,
    render: (row) => (
      <span className="font-mono">{formatZAR.format(row.cost_total)}</span>
    ),
  },
];

export default function SupplierDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { fleetId } = useFleet();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [events, setEvents] = useState<EventWithVehicle[]>([]);
  const [monthlySpend, setMonthlySpend] = useState<MonthlySpend[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!params.id || !fleetId) return;
    setLoading(true);
    const supabase = createClient();

    const [supplierRes, eventsRes] = await Promise.all([
      supabase.from("suppliers").select("*").eq("fleet_id", fleetId!).eq("id", params.id).single(),
      supabase
        .from("maintenance_events")
        .select("*, vehicles(registration)")
        .eq("fleet_id", fleetId!)
        .eq("supplier_id", params.id)
        .order("event_date", { ascending: false }),
    ]);

    setSupplier(supplierRes.data as Supplier | null);

    const eventsData = (eventsRes.data ?? []) as EventWithVehicle[];
    setEvents(eventsData);

    // Group events by month for chart
    const byMonth = new Map<string, number>();
    for (const ev of eventsData) {
      const d = new Date(ev.event_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonth.set(key, (byMonth.get(key) ?? 0) + ev.cost_total);
    }
    const sorted = [...byMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, spend]) => ({ month, spend }));
    setMonthlySpend(sorted);

    setLoading(false);
  }, [params.id, fleetId]);

  useEffect(() => {
    if (!fleetId) return;
    fetchData();
  }, [fetchData, fleetId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/suppliers")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Suppliers
        </Button>
        <p className="text-muted-foreground">Supplier not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={supplier.name}
        description="Supplier details and maintenance history"
        action={
          <Button variant="outline" onClick={() => router.push("/suppliers")}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back
          </Button>
        }
      />

      {/* Info card + KPI */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {supplier.phone && (
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              Phone
            </div>
            <p className="mt-1 font-medium">{supplier.phone}</p>
          </Card>
        )}
        {supplier.email && (
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              Email
            </div>
            <p className="mt-1 font-medium">{supplier.email}</p>
          </Card>
        )}
        {supplier.location && (
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Location
            </div>
            <p className="mt-1 font-medium">{supplier.location}</p>
          </Card>
        )}
        <KPICard
          title="Total Spend"
          value={formatZAR.format(supplier.total_spend)}
          icon={DollarSign}
          color="accent"
        />
      </div>

      {/* Spend over time chart */}
      {monthlySpend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlySpend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={12} tickLine={false} />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(v: number) =>
                    formatZAR.format(v).replace(",00", "")
                  }
                />
                <Tooltip
                  formatter={(value) => [formatZAR.format(Number(value)), "Spend"]}
                />
                <Bar dataKey="spend" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Events table */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Events</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<EventWithVehicle>
            columns={eventColumns}
            data={events}
            emptyMessage="No maintenance events recorded for this supplier."
          />
        </CardContent>
      </Card>
    </div>
  );
}
