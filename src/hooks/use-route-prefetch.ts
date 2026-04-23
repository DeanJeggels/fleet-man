"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useFleet } from "@/contexts/fleet-context";

// Hover-prefetch: when the user hovers over a nav item, warm the TanStack
// Query cache with that page's primary data. By the time they click (100–
// 300ms later), data is already in cache and the page renders instantly.
//
// Each prefetcher matches the queryKey + queryFn used by the destination
// page, so the page picks up the prefetched data seamlessly.
export function useRoutePrefetch() {
  const queryClient = useQueryClient();
  const { fleetId } = useFleet();

  return useCallback(
    (href: string) => {
      if (!fleetId) return;
      const supabase = createClient();
      const key = href.split("?")[0];

      // Only warm queries for pages that use TanStack Query with a known key.
      switch (true) {
        case key === "/vehicles":
          queryClient.prefetchQuery({
            queryKey: ["vehicles", fleetId],
            queryFn: async () => {
              const { data, error } = await supabase
                .from("vehicles")
                .select("*")
                .eq("fleet_id", fleetId)
                .order("registration");
              if (error) throw error;
              return data ?? [];
            },
          });
          return;

        case key === "/drivers":
          queryClient.prefetchQuery({
            queryKey: ["drivers", fleetId],
            queryFn: async () => {
              const [driversRes, assignmentsRes] = await Promise.all([
                supabase
                  .from("drivers")
                  .select("*")
                  .eq("fleet_id", fleetId)
                  .order("last_name"),
                supabase
                  .from("vehicle_driver_assignments")
                  .select("driver_id, vehicle:vehicles(registration)")
                  .eq("fleet_id", fleetId)
                  .is("unassigned_at", null),
              ]);
              if (driversRes.error) throw driversRes.error;
              if (assignmentsRes.error) throw assignmentsRes.error;
              const vehicleByDriver = new Map<string, { registration: string } | null>();
              for (const a of assignmentsRes.data ?? []) {
                const vehicle = a.vehicle as unknown as { registration: string } | null;
                vehicleByDriver.set(a.driver_id as string, vehicle);
              }
              return (driversRes.data ?? []).map((d) => ({
                ...d,
                current_vehicle: vehicleByDriver.get(d.id) ?? null,
              }));
            },
          });
          return;

        case key === "/suppliers":
          queryClient.prefetchQuery({
            queryKey: ["suppliers", fleetId],
            queryFn: async () => {
              const { data, error } = await supabase
                .from("suppliers")
                .select("*")
                .eq("fleet_id", fleetId)
                .order("name");
              if (error) throw error;
              return data ?? [];
            },
          });
          return;

        case key === "/dashboard":
          queryClient.prefetchQuery({
            queryKey: ["dashboard-kpis", fleetId],
            queryFn: async () => {
              const now = new Date();
              const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
                .toISOString()
                .slice(0, 10);
              const [vehiclesRes, maintRes, uberRes] = await Promise.all([
                supabase
                  .from("vehicles")
                  .select("id, status, category")
                  .eq("fleet_id", fleetId),
                supabase
                  .from("maintenance_events")
                  .select("cost_total, event_date")
                  .eq("fleet_id", fleetId)
                  .gte("event_date", monthStart),
                supabase
                  .from("uber_trip_data")
                  .select("total_earnings, distance_km, period_date")
                  .eq("fleet_id", fleetId)
                  .gte("period_date", monthStart),
              ]);
              return {
                vehicles: vehiclesRes.data ?? [],
                maintenance: maintRes.data ?? [],
                uber: uberRes.data ?? [],
              };
            },
          });
          return;

        case key === "/contract/trips":
          queryClient.prefetchQuery({
            queryKey: ["contract-trips", fleetId, 1],
            queryFn: async () => {
              const { data, error } = await supabase
                .from("contract_trips")
                .select(
                  "*, client:contract_clients(name), driver:drivers(first_name, last_name), vehicle:vehicles(registration)"
                )
                .eq("fleet_id", fleetId)
                .order("trip_date", { ascending: false })
                .limit(50);
              if (error) throw error;
              return data ?? [];
            },
          });
          return;
      }
    },
    [queryClient, fleetId]
  );
}
