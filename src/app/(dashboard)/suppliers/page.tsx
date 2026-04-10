"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useFleet } from "@/contexts/fleet-context";
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

export default function SuppliersPage() {
  const router = useRouter();
  const { fleetId } = useFleet();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const supabase = createClient();

  async function handleAnonymise(supplierId: string) {
    if (!window.confirm("Are you sure you want to anonymise this supplier's data? This action cannot be undone.")) return;
    const { error } = await supabase
      .from("suppliers")
      .update({
        name: "Removed Supplier",
        email: "",
        phone: "",
        location: "",
        notes: "",
        anonymised_at: new Date().toISOString(),
      })
      .eq("id", supplierId)
      .eq("fleet_id", fleetId!);
    if (error) {
      console.error(error);
      toast.error("Failed to anonymise supplier data.");
      return;
    }
    toast.success("Supplier data anonymised per POPI request.");
    fetchSuppliers();
  }

  const columns: ColumnDef<Supplier>[] = useMemo(
    () => [
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
      {
        key: "actions",
        header: "",
        render: (row) => (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleAnonymise(row.id as string);
            }}
          >
            <ShieldOff className="mr-1.5 h-4 w-4" />
            Anonymise
          </Button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fleetId]
  );

  const fetchSuppliers = useCallback(async () => {
    if (!fleetId) return;
    setLoading(true);
    const { data } = await supabase
      .from("suppliers")
      .select("*")
      .eq("fleet_id", fleetId!)
      .order("name");
    setSuppliers((data as Supplier[]) ?? []);
    setLoading(false);
  }, [fleetId]);

  useEffect(() => {
    if (!fleetId) return;
    fetchSuppliers();
  }, [fetchSuppliers, fleetId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Manage your fleet maintenance suppliers"
        action={
          <Button onClick={() => setSheetOpen(true)} className="cursor-pointer">
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
