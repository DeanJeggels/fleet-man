"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Fuel, Loader2 } from "lucide-react";

interface Vehicle {
  id: string;
  registration: string;
}

interface RowData {
  vehicle_id: string;
  registration: string;
  date: string;
  litres: string;
  cost_per_litre: string;
  odometer: string;
}

interface BatchFuelFormProps {
  vehicles: Vehicle[];
  onSaved: () => void;
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function weekStarting(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

export function BatchFuelForm({ vehicles, onSaved }: BatchFuelFormProps) {
  const [rows, setRows] = useState<RowData[]>(() =>
    vehicles.map((v) => ({
      vehicle_id: v.id,
      registration: v.registration,
      date: todayString(),
      litres: "",
      cost_per_litre: "",
      odometer: "",
    }))
  );
  const [saving, setSaving] = useState(false);

  const updateRow = useCallback(
    (index: number, field: keyof RowData, value: string) => {
      setRows((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    },
    []
  );

  const isRowFilled = (row: RowData) =>
    row.litres !== "" || row.cost_per_litre !== "" || row.odometer !== "";

  async function handleSave() {
    const filledRows = rows.filter(isRowFilled);
    if (filledRows.length === 0) {
      toast.error("No data entered. Fill in at least one row.");
      return;
    }

    // Validate filled rows
    for (const row of filledRows) {
      if (!row.litres || !row.cost_per_litre) {
        toast.error(
          `${row.registration}: Both litres and cost/L are required.`
        );
        return;
      }
    }

    setSaving(true);
    const supabase = createClient();

    const inserts = filledRows.map((row) => ({
      vehicle_id: row.vehicle_id,
      week_starting: weekStarting(row.date),
      litres: parseFloat(row.litres),
      cost: parseFloat(row.litres) * parseFloat(row.cost_per_litre),
      odometer_reading: row.odometer ? parseInt(row.odometer, 10) : null,
    }));

    const { error } = await supabase.from("fuel_logs").insert(inserts);

    setSaving(false);

    if (error) {
      toast.error("Failed to save fuel entries: " + error.message);
      return;
    }

    toast.success(`Saved ${inserts.length} fuel ${inserts.length === 1 ? "entry" : "entries"}.`);

    // Clear form
    setRows(
      vehicles.map((v) => ({
        vehicle_id: v.id,
        registration: v.registration,
        date: todayString(),
        litres: "",
        cost_per_litre: "",
        odometer: "",
      }))
    );
    onSaved();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fuel className="size-5" />
          Batch Fuel Entry
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto max-h-[28rem] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead>Vehicle Registration</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Litres</TableHead>
                <TableHead>Cost/L (ZAR)</TableHead>
                <TableHead>Odometer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={row.vehicle_id}>
                  <TableCell className="font-medium">
                    {row.registration}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      value={row.date}
                      onChange={(e) => updateRow(i, "date", e.target.value)}
                      className="w-36"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      value={row.litres}
                      onChange={(e) => updateRow(i, "litres", e.target.value)}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      value={row.cost_per_litre}
                      onChange={(e) =>
                        updateRow(i, "cost_per_litre", e.target.value)
                      }
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      step="1"
                      placeholder="km"
                      value={row.odometer}
                      onChange={(e) => updateRow(i, "odometer", e.target.value)}
                      className="w-28"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="cursor-pointer">
            {saving && <Loader2 className="animate-spin" />}
            Save All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
