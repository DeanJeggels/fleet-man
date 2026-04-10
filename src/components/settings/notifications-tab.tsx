"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useFleet } from "@/contexts/fleet-context";
import { createClient } from "@/lib/supabase/client";

const NOTIFICATION_CHANNELS = [
  {
    key: "notification_email",
    label: "Email",
    description: "Receive notifications via email",
  },
  {
    key: "notification_in_app",
    label: "In-App",
    description: "Receive notifications within the application",
  },
  {
    key: "notification_telegram",
    label: "Telegram",
    description: "Receive notifications via Telegram bot",
  },
] as const;

type ChannelKey = (typeof NOTIFICATION_CHANNELS)[number]["key"];

type NotificationSettings = Record<ChannelKey, boolean>;

const DEFAULT_SETTINGS: NotificationSettings = {
  notification_email: true,
  notification_in_app: true,
  notification_telegram: false,
};

export function NotificationsTab() {
  const { fleetId } = useFleet();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
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

      setSettings({
        notification_email: data.notification_email ?? true,
        notification_in_app: data.notification_in_app ?? true,
        notification_telegram: data.notification_telegram ?? false,
      });
    }

    load();
  }, [fleetId]);

  function toggle(key: ChannelKey) {
    setSettings((s) => ({ ...s, [key]: !s[key] }));
  }

  async function handleSave() {
    if (!fleetId) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("fleet_settings")
        .update({
          notification_email: settings.notification_email,
          notification_in_app: settings.notification_in_app,
          notification_telegram: settings.notification_telegram,
        })
        .eq("fleet_id", fleetId);

      if (error) throw error;

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
          Choose which notification channels you want to enable.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 max-w-md">
          {NOTIFICATION_CHANNELS.map((channel) => (
            <div
              key={channel.key}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="grid gap-0.5">
                <Label>{channel.label}</Label>
                <p className="text-xs text-muted-foreground">
                  {channel.description}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings[channel.key]}
                aria-label={channel.label}
                onClick={() => toggle(channel.key)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-150 ${
                  settings[channel.key] ? "bg-primary" : "bg-input"
                }`}
              >
                <span
                  className={`pointer-events-none block size-4 rounded-full bg-background shadow-sm ring-0 transition-transform ${
                    settings[channel.key] ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
          <Button onClick={handleSave} disabled={saving} className="w-fit cursor-pointer">
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
