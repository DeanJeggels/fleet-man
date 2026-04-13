"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useFleet } from "@/contexts/fleet-context";
import { differenceInDays, parseISO } from "date-fns";
import { Plus, ShieldOff } from "lucide-react";
import { toast } from "sonner";
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
  const { fleetId, isOwnerOrAdmin } = useFleet();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  const { data: drivers = [], isLoading: loading, refetch: fetchDrivers } = useQuery({
    queryKey: ["drivers", fleetId],
    enabled: !!fleetId,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("drivers")
        .select(
          "*, vehicle_driver_assignments(vehicle:vehicles(registration))"
        )
        .eq("fleet_id", fleetId!)
        .order("last_name");
      if (error) throw error;
      return (data ?? []) as DriverWithAssignment[];
    },
  });

  const supabase = useMemo(() => createClient(), []);

  function handleAdd() {
    setEditingDriver(null);
    setSheetOpen(true);
  }

  function handleEdit(row: DriverWithAssignment) {
    setEditingDriver(row);
    setSheetOpen(true);
  }

  async function handleAnonymise(driverId: string) {
    if (!window.confirm("Are you sure you want to anonymise this driver's data? This action cannot be undone.")) return;
    const { error } = await supabase
      .from("drivers")
      .update({
        first_name: "Removed",
        last_name: "Removed",
        license_number: "REDACTED",
        email: "",
        phone: "",
        notes: "",
        status: "inactive" as const,
        anonymised_at: new Date().toISOString(),
      })
      .eq("id", driverId)
      .eq("fleet_id", fleetId!);
    if (error) {
      console.error(error);
      toast.error("Failed to anonymise driver data.");
      return;
    }
    toast.success("Driver data anonymised per POPI request.");
    fetchDrivers();
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
        key: "category",
        header: "Category",
        render: (row) => (
          <Badge
            variant="outline"
            className={
              row.category === "contract"
                ? "bg-purple-100 text-purple-700"
                : "bg-blue-100 text-blue-700"
            }
          >
            {row.category === "contract" ? "Contract" : "E-Hailing"}
          </Badge>
        ),
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
      ...(isOwnerOrAdmin
        ? [
            {
              key: "actions",
              header: "",
              render: (row: DriverWithAssignment) => (
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
          ]
        : []),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fleetId, isOwnerOrAdmin]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drivers"
        description="Manage your fleet drivers"
        action={
          isOwnerOrAdmin ? (
            <Button onClick={handleAdd} className="cursor-pointer">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Driver
            </Button>
          ) : undefined
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
