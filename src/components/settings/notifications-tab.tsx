"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const STORAGE_KEY = "fleet_notification_settings";

const NOTIFICATION_TYPES = [
  {
    key: "service_due",
    label: "Service Due",
    description: "Notify when a vehicle service is coming up",
  },
  {
    key: "service_overdue",
    label: "Service Overdue",
    description: "Notify when a vehicle service is overdue",
  },
  {
    key: "license_expiry",
    label: "License Expiry",
    description: "Notify when a vehicle license is about to expire",
  },
  {
    key: "sync_failure",
    label: "Sync Failure",
    description: "Notify when Uber data sync fails",
  },
] as const;

type NotificationKey = (typeof NOTIFICATION_TYPES)[number]["key"];

type NotificationSettings = Record<NotificationKey, boolean>;

const DEFAULT_SETTINGS: NotificationSettings = {
  service_due: true,
  service_overdue: true,
  license_expiry: true,
  sync_failure: true,
};

export function NotificationsTab() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      } catch {
        // ignore
      }
    }
  }, []);

  function toggle(key: NotificationKey) {
    setSettings((s) => ({ ...s, [key]: !s[key] }));
  }

  function handleSave() {
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      toast.success("Notification preferences saved");
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Choose which notifications you want to receive.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 max-w-md">
          {NOTIFICATION_TYPES.map((type) => (
            <div
              key={type.key}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="grid gap-0.5">
                <Label>{type.label}</Label>
                <p className="text-xs text-muted-foreground">
                  {type.description}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings[type.key]}
                onClick={() => toggle(type.key)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${
                  settings[type.key] ? "bg-primary" : "bg-input"
                }`}
              >
                <span
                  className={`pointer-events-none block size-4 rounded-full bg-background shadow-sm ring-0 transition-transform ${
                    settings[type.key] ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
          <Button onClick={handleSave} disabled={saving} className="w-fit">
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
