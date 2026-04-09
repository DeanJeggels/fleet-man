"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { format, parseISO } from "date-fns";
import Link from "next/link";

const formatZAR = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
});

interface MaintenanceRow extends Record<string, unknown> {
  id: string;
  event_date: string;
  category: string;
  cost_total: number;
  invoice_parsed_by_ai: boolean;
  event_type: { name: string } | null;
  supplier: { name: string } | null;
}

const columns: ColumnDef<MaintenanceRow>[] = [
  {
    key: "event_date",
    header: "Date",
    sortable: true,
    render: (row) => format(parseISO(row.event_date), "dd MMM yyyy"),
  },
  {
    key: "event_type",
    header: "Type",
    render: (row) => row.event_type?.name ?? "-",
  },
  {
    key: "category",
    header: "Category",
    render: (row) => (
      <span className="capitalize">{row.category.replace("_", " ")}</span>
    ),
  },
  {
    key: "supplier",
    header: "Supplier",
    render: (row) => row.supplier?.name ?? "-",
  },
  {
    key: "cost_total",
    header: "Cost",
    sortable: true,
    render: (row) => formatZAR.format(row.cost_total),
  },
  {
    key: "invoice_parsed_by_ai",
    header: "AI Parsed",
    render: (row) =>
      row.invoice_parsed_by_ai ? (
        <Badge variant="secondary">AI</Badge>
      ) : null,
  },
];

interface MaintenanceTabProps {
  vehicleId: string;
}

export function MaintenanceTab({ vehicleId }: MaintenanceTabProps) {
  const [data, setData] = useState<MaintenanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();
      const { data: events } = await supabase
        .from("maintenance_events")
        .select(
          "id, event_date, category, cost_total, invoice_parsed_by_ai, event_type:maintenance_event_types(name), supplier:suppliers(name)"
        )
        .eq("vehicle_id", vehicleId)
        .order("event_date", { ascending: false });

      setData((events as unknown as MaintenanceRow[]) ?? []);
      setLoading(false);
    }
    fetch();
  }, [vehicleId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Maintenance Events</h3>
        <Link href={`/maintenance/new?vehicle=${vehicleId}`}>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Log Maintenance
          </Button>
        </Link>
      </div>

      <DataTable columns={columns} data={data} loading={loading} emptyMessage="No maintenance events recorded" />
    </div>
  );
}
