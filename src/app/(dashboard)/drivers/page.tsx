"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { differenceInDays, parseISO } from "date-fns";
import { Plus } from "lucide-react";
import type { Driver } from "@/types/database";

import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DriverFormSheet } from "@/components/drivers/driver-form-sheet";

type DriverWithAssignment = Driver & {
  vehicle_driver_assignments: {
    vehicle: { registration: string } | null;
  }[];
};

function LicenseExpiryBadge({ expiry }: { expiry: string }) {
  const today = new Date();
  const expiryDate = parseISO(expiry);
  const days = differenceInDays(expiryDate, today);

  if (days < 0) {
    return (
      <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
        Expired
      </Badge>
    );
  }
  if (days < 14) {
    return (
      <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
        Expiring Soon
      </Badge>
    );
  }
  if (days <= 30) {
    return (
      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
        Expiring
      </Badge>
    );
  }
  return (
    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
      Valid
    </Badge>
  );
}

export default function DriversPage() {
  const supabase = createClient();
  const [drivers, setDrivers] = useState<DriverWithAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("drivers")
      .select(
        "*, vehicle_driver_assignments(vehicle:vehicles(registration))"
      )
      .order("last_name");

    setDrivers((data as DriverWithAssignment[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  function handleAdd() {
    setEditingDriver(null);
    setSheetOpen(true);
  }

  function handleEdit(row: DriverWithAssignment) {
    setEditingDriver(row);
    setSheetOpen(true);
  }

  const columns: ColumnDef<DriverWithAssignment>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        sortable: true,
        render: (row) => `${row.first_name} ${row.last_name}`,
      },
      {
        key: "license_number",
        header: "License #",
      },
      {
        key: "license_expiry",
        header: "Expiry Date",
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-2">
            <span>
              {new Date(row.license_expiry).toLocaleDateString()}
            </span>
            <LicenseExpiryBadge expiry={row.license_expiry} />
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "vehicle",
        header: "Assigned Vehicle",
        render: (row) => {
          const active = row.vehicle_driver_assignments?.find(
            (a) => a.vehicle
          );
          return active?.vehicle?.registration ?? (
            <span className="text-muted-foreground">Unassigned</span>
          );
        },
      },
      {
        key: "phone",
        header: "Phone",
        render: (row) =>
          row.phone ?? (
            <span className="text-muted-foreground">-</span>
          ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drivers"
        description="Manage your fleet drivers"
        action={
          <Button onClick={handleAdd}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Driver
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={drivers}
        loading={loading}
        searchable
        searchKey="name"
        searchPlaceholder="Search by name..."
        onRowClick={handleEdit}
        emptyMessage="No drivers found. Add your first driver to get started."
      />

      <DriverFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        driver={editingDriver}
        onSaved={fetchDrivers}
      />
    </div>
  );
}
