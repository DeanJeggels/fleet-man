"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { SupplierFormSheet } from "@/components/suppliers/supplier-form-sheet";

type Supplier = Database["public"]["Tables"]["suppliers"]["Row"];

const formatZAR = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
});

const columns: ColumnDef<Supplier>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "phone", header: "Phone" },
  { key: "location", header: "Location" },
  {
    key: "total_spend",
    header: "Total Spend",
    sortable: true,
    render: (row) => (
      <span className="font-mono">{formatZAR.format(row.total_spend)}</span>
    ),
  },
  {
    key: "event_count",
    header: "Events",
    sortable: true,
    render: (row) => row.event_count,
  },
];

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("suppliers")
      .select("*")
      .order("name");
    setSuppliers((data as Supplier[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Manage your fleet maintenance suppliers"
        action={
          <Button onClick={() => setSheetOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Supplier
          </Button>
        }
      />

      <DataTable<Supplier>
        columns={columns}
        data={suppliers}
        loading={loading}
        searchable
        searchKey="name"
        searchPlaceholder="Search suppliers..."
        emptyMessage="No suppliers found. Add your first supplier to get started."
        onRowClick={(row) => router.push(`/suppliers/${row.id}`)}
      />

      <SupplierFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSaved={fetchSuppliers}
      />
    </div>
  );
}
