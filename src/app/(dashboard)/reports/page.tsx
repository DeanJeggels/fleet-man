"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useFleet } from "@/contexts/fleet-context";
import { format } from "date-fns";
import {
  Wrench,
  Car,
  Users,
  Fuel,
  TrendingUp,
  ShieldAlert,
  Route,
  CalendarIcon,
  FileBarChart,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { OwnerOnlyGuard } from "@/components/shared/owner-only-guard";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  ReportViewer,
  type ReportType,
  type ReportFilters,
} from "@/components/reports/report-viewer";
import { cn } from "@/lib/utils";

interface ReportOption {
  value: ReportType;
  label: string;
  description: string;
  icon: React.ElementType;
}

const REPORT_OPTIONS: ReportOption[] = [
  {
    value: "maintenance_history",
    label: "Maintenance History",
    description: "All maintenance events with costs and suppliers",
    icon: Wrench,
  },
  {
    value: "vehicle_costs",
    label: "Vehicle Costs",
    description: "Total maintenance and fuel costs per vehicle",
    icon: Car,
  },
  {
    value: "supplier_spend",
    label: "Supplier Spend",
    description: "Spend breakdown by supplier",
    icon: Users,
  },
  {
    value: "fuel_consumption",
    label: "Fuel Consumption",
    description: "Fuel logs with litres, cost and odometer",
    icon: Fuel,
  },
  {
    value: "uber_performance",
    label: "Uber Performance",
    description: "Trips, hours, distance and earnings",
    icon: TrendingUp,
  },
  {
    value: "routine_vs_emergency",
    label: "Routine vs Emergency",
    description: "Maintenance split by category",
    icon: ShieldAlert,
  },
  {
    value: "distance_analysis",
    label: "Distance Analysis",
    description: "Kilometre tracking per vehicle",
    icon: Route,
  },
];

const SUPPLIER_REPORTS: ReportType[] = ["maintenance_history", "supplier_spend"];

export default function ReportsPage() {
  return (
    <OwnerOnlyGuard>
      <ReportsPageContent />
    </OwnerOnlyGuard>
  );
}

function ReportsPageContent() {
  const supabase = createClient();
  const { fleetId } = useFleet();

  const [selectedReport, setSelectedReport] = useState<ReportType>("maintenance_history");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [vehicleId, setVehicleId] = useState<string>("all");
  const [supplierId, setSupplierId] = useState<string>("all");
  const [trigger, setTrigger] = useState(0);

  const [vehicles, setVehicles] = useState<{ id: string; label: string }[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);

  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  useEffect(() => {
    if (!fleetId) return;
    async function load() {
      const [vRes, sRes] = await Promise.all([
        supabase.from("vehicles").select("id, registration, make, model").eq("fleet_id", fleetId!).order("registration"),
        supabase.from("suppliers").select("id, name").eq("fleet_id", fleetId!).order("name"),
      ]);
      setVehicles(
        (vRes.data ?? []).map((v) => ({
          id: v.id,
          label: `${v.registration} (${v.make} ${v.model})`,
        }))
      );
      setSuppliers((sRes.data ?? []).map((s) => ({ id: s.id, name: s.name })));
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fleetId]);

  const showSupplierFilter = SUPPLIER_REPORTS.includes(selectedReport);

  const filters: ReportFilters = useMemo(
    () => ({
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : null,
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : null,
      vehicleId: vehicleId !== "all" ? vehicleId : null,
      supplierId: supplierId !== "all" ? supplierId : null,
    }),
    [startDate, endDate, vehicleId, supplierId]
  );

  function handleGenerate() {
    setTrigger((t) => t + 1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate and download fleet reports"
      />

      {/* Report Type Selector */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Select Report Type</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {REPORT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedReport === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedReport(opt.value)}
                className={cn(
                  "flex items-start gap-3 rounded-lg border-2 bg-white p-4 text-left transition-colors cursor-pointer",
                  isSelected
                    ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500/20"
                    : "border-transparent bg-white shadow-sm hover:border-muted-foreground/20"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                    isSelected ? "bg-blue-100 text-blue-600" : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{opt.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters Section */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Filters</h2>
        <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-end sm:gap-4">
          {/* Start Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">Start Date</label>
            <Popover open={startOpen} onOpenChange={setStartOpen}>
              <PopoverTrigger
                className={cn(
                  "inline-flex h-9 w-full sm:w-[180px] items-center justify-start gap-2 rounded-md border px-3 text-sm",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="h-4 w-4" />
                {startDate ? format(startDate, "dd MMM yyyy") : "Pick a date"}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(d) => {
                    setStartDate(d ?? undefined);
                    setStartOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* End Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">End Date</label>
            <Popover open={endOpen} onOpenChange={setEndOpen}>
              <PopoverTrigger
                className={cn(
                  "inline-flex h-9 w-full sm:w-[180px] items-center justify-start gap-2 rounded-md border px-3 text-sm",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="h-4 w-4" />
                {endDate ? format(endDate, "dd MMM yyyy") : "Pick a date"}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(d) => {
                    setEndDate(d ?? undefined);
                    setEndOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Vehicle Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">Vehicle</label>
            <Select value={vehicleId} onValueChange={(v) => setVehicleId(v ?? "all")}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="All vehicles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All vehicles</SelectItem>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Supplier Filter */}
          {showSupplierFilter && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium">Supplier</label>
              <Select value={supplierId} onValueChange={(v) => setSupplierId(v ?? "all")}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All suppliers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All suppliers</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Generate Button */}
          <Button onClick={handleGenerate} className="h-9 w-full sm:w-auto">
            <FileBarChart className="mr-1.5 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Report Results */}
      <ReportViewer
        reportType={selectedReport}
        filters={filters}
        trigger={trigger}
      />
    </div>
  );
}
