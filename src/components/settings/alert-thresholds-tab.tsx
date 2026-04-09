"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const STORAGE_KEY = "fleet_alert_thresholds";

interface AlertThresholds {
  alertKmThreshold: number;
  alertDaysThreshold: number;
}

const DEFAULTS: AlertThresholds = {
  alertKmThreshold: 1200,
  alertDaysThreshold: 14,
};

export function AlertThresholdsTab() {
  const [thresholds, setThresholds] = useState<AlertThresholds>(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setThresholds({ ...DEFAULTS, ...JSON.parse(stored) });
      } catch {
        // ignore
      }
    }
  }, []);

  function handleSave() {
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(thresholds));
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
              value={thresholds.alertKmThreshold}
              onChange={(e) =>
                setThresholds((t) => ({
                  ...t,
                  alertKmThreshold: Number(e.target.value) || 0,
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
              value={thresholds.alertDaysThreshold}
              onChange={(e) =>
                setThresholds((t) => ({
                  ...t,
                  alertDaysThreshold: Number(e.target.value) || 0,
                }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Trigger an alert when a vehicle is within this many days of its
              next service date.
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-fit">
            {saving ? "Saving..." : "Save Thresholds"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
