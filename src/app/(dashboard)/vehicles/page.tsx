"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Vehicle, VehicleStatus, FleetCategory } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VehicleFormSheet } from "@/components/vehicles/vehicle-form-sheet";
import { Plus, Search, Car } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { useFleet } from "@/contexts/fleet-context";

type VehicleWithDriver = Vehicle & {
  vehicle_driver_assignments: {
    driver: { first_name: string; last_name: string } | null;
  }[];
};

const STATUS_FILTERS: { label: string; value: VehicleStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Maintenance", value: "maintenance" },
  { label: "Retired", value: "retired" },
  { label: "Sold", value: "sold" },
];

const zarFormat = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
});

const kmFormat = new Intl.NumberFormat("en-ZA");

export default function VehiclesPage() {
  const router = useRouter();
  const { fleetId, isOwnerOrAdmin } = useFleet();
  const [vehicles, setVehicles] = useState<VehicleWithDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<FleetCategory | "all">("all");
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchVehicles = useCallback(async () => {
    if (!fleetId) return;
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("vehicles")
      .select(
        "*, vehicle_driver_assignments(driver:drivers(first_name, last_name))"
      )
      .eq("fleet_id", fleetId!)
      .order("registration");

    if (!error && data) {
      setVehicles(data as unknown as VehicleWithDriver[]);
    }
    setLoading(false);
  }, [fleetId]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const filtered = useMemo(() => {
    let result = vehicles;

    if (statusFilter !== "all") {
      result = result.filter((v) => v.status === statusFilter);
    }

    if (categoryFilter !== "all") {
      result = result.filter((v) => v.category === categoryFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (v) =>
          v.registration.toLowerCase().includes(q) ||
          v.make.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q)
      );
    }

    return result;
  }, [vehicles, statusFilter, categoryFilter, search]);

  function getDriverName(v: VehicleWithDriver): string {
    const assignment = v.vehicle_driver_assignments?.[0];
    if (!assignment?.driver) return "-";
    return `${assignment.driver.first_name} ${assignment.driver.last_name}`;
  }

  const columns: ColumnDef<Record<string, unknown>>[] = [
    {
      key: "registration",
      header: "Registration",
      sortable: true,
      render: (row) => (
        <span className="font-medium">{String(row.registration)}</span>
      ),
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
          {String(row.category)}
        </Badge>
      ),
    },
    {
      key: "make",
      header: "Make / Model",
      sortable: true,
      render: (row) => `${row.make} ${row.model}`,
    },
    {
      key: "year",
      header: "Year",
      sortable: true,
      render: (row) => (row.year != null ? String(row.year) : "-"),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={String(row.status)} />,
    },
    {
      key: "current_odometer",
      header: "Current Km",
      sortable: true,
      render: (row) => (
        <span className="font-mono text-sm">
          {kmFormat.format(Number(row.current_odometer))} km
        </span>
      ),
    },
    {
      key: "driver",
      header: "Driver",
      render: (row) => getDriverName(row as unknown as VehicleWithDriver),
    },
    ...(isOwnerOrAdmin
      ? [
          {
            key: "total_cost",
            header: "Total Cost",
            sortable: true,
            render: (row: Record<string, unknown>) =>
              zarFormat.format(
                Number(row.total_maintenance_cost) + Number(row.total_fuel_cost)
              ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicles"
        description="Manage your fleet vehicles"
        action={
          isOwnerOrAdmin ? (
            <Button onClick={() => setSheetOpen(true)} className="cursor-pointer">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Vehicle
            </Button>
          ) : undefined
        }
      />

      {/* Search and filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search registration, make, model..."
            aria-label="Search vehicles"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-1">
          {(["all", "uber", "contract"] as const).map((c) => (
            <Button
              key={c}
              variant={categoryFilter === c ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(c)}
              className="cursor-pointer"
            >
              {c === "all" ? "All" : c.charAt(0).toUpperCase() + c.slice(1)}
            </Button>
          ))}
          <span className="mx-1 text-muted-foreground">|</span>
          {STATUS_FILTERS.map((sf) => (
            <Button
              key={sf.value}
              variant={statusFilter === sf.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(sf.value)}
              className="cursor-pointer"
            >
              {sf.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      {!loading && filtered.length === 0 && vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No vehicles yet"
          description="Add your first vehicle to start managing your fleet."
          action={
            <Button onClick={() => setSheetOpen(true)} className="cursor-pointer">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Vehicle
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyMessage="No vehicles match your filters."
          onRowClick={(row) =>
            router.push(`/vehicles/${(row as unknown as VehicleWithDriver).id}`)
          }
        />
      )}

      <VehicleFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSaved={fetchVehicles}
      />
    </div>
  );
}
