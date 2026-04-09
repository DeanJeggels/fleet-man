"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Pencil } from "lucide-react";
import type { Tables } from "@/types/database";

interface VehicleHeaderProps {
  vehicle: Tables<"vehicles">;
  currentDriverName: string | null;
}

export function VehicleHeader({ vehicle, currentDriverName }: VehicleHeaderProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {vehicle.registration}
            </h1>
            <StatusBadge status={vehicle.status} />
          </div>

          <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span>
              {vehicle.make} {vehicle.model}
            </span>
            {vehicle.year && <span>{vehicle.year}</span>}
            {vehicle.vin && (
              <span className="font-mono text-xs">{vehicle.vin}</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span>
              Odometer:{" "}
              <span className="font-mono font-semibold">
                {vehicle.current_odometer.toLocaleString()} km
              </span>
            </span>
            {currentDriverName && (
              <span>
                Driver: <span className="font-semibold">{currentDriverName}</span>
              </span>
            )}
          </div>
        </div>

        <Button variant="outline" size="sm">
          <Pencil className="mr-2 h-4 w-4" />
          Edit Vehicle
        </Button>
      </CardContent>
    </Card>
  );
}
