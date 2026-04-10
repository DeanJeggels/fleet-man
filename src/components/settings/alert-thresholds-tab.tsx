"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFleet } from "@/contexts/fleet-context";
import { createClient } from "@/lib/supabase/client";

interface AlertThresholds {
  alert_km_threshold: number;
  alert_days_threshold: number;
}

const DEFAULTS: AlertThresholds = {
  alert_km_threshold: 1200,
  alert_days_threshold: 14,
};

export function AlertThresholdsTab() {
  const { fleetId } = useFleet();
  const [thresholds, setThresholds] = useState<AlertThresholds>(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!fleetId) return;

    async function load() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("fleet_settings")
        .select("*")
        .eq("fleet_id", fleetId!)
        .single();

      if (error || !data) return;

      setThresholds({
        alert_km_threshold: data.alert_km_threshold ?? 1200,
        alert_days_threshold: data.alert_days_threshold ?? 14,
      });
    }

    load();
  }, [fleetId]);

  async function handleSave() {
    if (!fleetId) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("fleet_settings")
        .update({
          alert_km_threshold: thresholds.alert_km_threshold,
          alert_days_threshold: thresholds.alert_days_threshold,
        })
        .eq("fleet_id", fleetId);

      if (error) throw error;

      toast.success("Alert thresholds saved");
    } catch {
      toast.error("Failed to save thresholds");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alert Thresholds</CardTitle>
        <CardDescription>
          Configure the default thresholds for service schedule alerts. These
          values apply to newly created service schedules.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 max-w-md">
          <div className="grid gap-2">
            <Label htmlFor="km-threshold">Alert Km Threshold</Label>
            <Input
              id="km-threshold"
              type="number"
              min={0}
              value={thresholds.alert_km_threshold}
              onChange={(e) =>
                setThresholds((t) => ({
                  ...t,
                  alert_km_threshold: Number(e.target.value) || 0,
                }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Trigger an alert when a vehicle is within this many km of its next
              service.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="days-threshold">Alert Days Threshold</Label>
            <Input
              id="days-threshold"
              type="number"
              min={0}
              value={thresholds.alert_days_threshold}
              onChange={(e) =>
                setThresholds((t) => ({
                  ...t,
                  alert_days_threshold: Number(e.target.value) || 0,
                }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Trigger an alert when a vehicle is within this many days of its
              next service date.
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-fit cursor-pointer">
            {saving ? "Saving..." : "Save Thresholds"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
