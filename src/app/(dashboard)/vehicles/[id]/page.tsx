"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehicleHeader } from "@/components/vehicles/vehicle-header";
import { OverviewTab } from "@/components/vehicles/tabs/overview-tab";
import { MaintenanceTab } from "@/components/vehicles/tabs/maintenance-tab";
import { TripsTab } from "@/components/vehicles/tabs/trips-tab";
import { FuelTab } from "@/components/vehicles/tabs/fuel-tab";
import { OdometerTab } from "@/components/vehicles/tabs/odometer-tab";
import { DriverHistoryTab } from "@/components/vehicles/tabs/driver-history-tab";
import type { Tables } from "@/types/database";

type Vehicle = Tables<"vehicles">;

export default function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [currentDriverName, setCurrentDriverName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVehicle() {
      const supabase = createClient();

      const { data } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setVehicle(data);

        // Fetch current driver assignment
        const { data: assignment } = await supabase
          .from("vehicle_driver_assignments")
          .select("driver:drivers(first_name, last_name)")
          .eq("vehicle_id", id)
          .is("unassigned_at", null)
          .order("assigned_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (assignment?.driver) {
          const driver = assignment.driver as unknown as {
            first_name: string;
            last_name: string;
          };
          setCurrentDriverName(`${driver.first_name} ${driver.last_name}`);
        }
      }

      setLoading(false);
    }
    fetchVehicle();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Loading vehicle...
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Vehicle not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <VehicleHeader vehicle={vehicle} currentDriverName={currentDriverName} />

      <Tabs defaultValue="overview">
        <TabsList className="overflow-x-auto scrollbar-none scroll-smooth snap-x snap-mandatory">
          <TabsTrigger value="overview" className="snap-start shrink-0">Overview</TabsTrigger>
          <TabsTrigger value="maintenance" className="snap-start shrink-0">
            <span className="sm:hidden">Maint.</span>
            <span className="hidden sm:inline">Maintenance</span>
          </TabsTrigger>
          <TabsTrigger value="trips" className="snap-start shrink-0">Trips</TabsTrigger>
          <TabsTrigger value="fuel" className="snap-start shrink-0">Fuel</TabsTrigger>
          <TabsTrigger value="odometer" className="snap-start shrink-0">
            <span className="sm:hidden">Odo.</span>
            <span className="hidden sm:inline">Odometer</span>
          </TabsTrigger>
          <TabsTrigger value="drivers" className="snap-start shrink-0">
            <span className="sm:hidden">Drivers</span>
            <span className="hidden sm:inline">Driver History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab vehicle={vehicle} />
        </TabsContent>

        <TabsContent value="maintenance">
          <MaintenanceTab vehicleId={vehicle.id} />
        </TabsContent>

        <TabsContent value="trips">
          <TripsTab vehicleId={vehicle.id} />
        </TabsContent>

        <TabsContent value="fuel">
          <FuelTab vehicleId={vehicle.id} />
        </TabsContent>

        <TabsContent value="odometer">
          <OdometerTab vehicleId={vehicle.id} />
        </TabsContent>

        <TabsContent value="drivers">
          <DriverHistoryTab vehicleId={vehicle.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
