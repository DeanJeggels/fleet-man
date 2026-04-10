"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFleet } from "@/contexts/fleet-context";
import { createClient } from "@/lib/supabase/client";

interface UberApiSettings {
  uber_org_uuid: string;
  uber_client_id: string;
  uber_client_secret: string;
}

export function UberApiTab() {
  const { fleetId } = useFleet();
  const [settings, setSettings] = useState<UberApiSettings>({
    uber_org_uuid: "",
    uber_client_id: "",
    uber_client_secret: "",
  });
  const [connected, setConnected] = useState(false);
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
        uber_org_uuid: data.uber_org_uuid ?? "",
        uber_client_id: data.uber_client_id ?? "",
        uber_client_secret: data.uber_client_secret ?? "",
      });
      setConnected(
        Boolean(data.uber_org_uuid && data.uber_client_id && data.uber_client_secret)
      );
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
          uber_org_uuid: settings.uber_org_uuid,
          uber_client_id: settings.uber_client_id,
          uber_client_secret: settings.uber_client_secret,
        })
        .eq("fleet_id", fleetId);

      if (error) throw error;

      const isConnected = Boolean(
        settings.uber_org_uuid && settings.uber_client_id && settings.uber_client_secret
      );
      setConnected(isConnected);
      toast.success("Uber API settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Uber API Configuration</CardTitle>
            <CardDescription>
              Connect your Uber for Business account to sync fleet data.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-block size-2.5 rounded-full ${
                connected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-sm font-medium">
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 max-w-md">
          <div className="grid gap-2">
            <Label htmlFor="org-uuid">Organisation UUID</Label>
            <Input
              id="org-uuid"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={settings.uber_org_uuid}
              onChange={(e) =>
                setSettings((s) => ({ ...s, uber_org_uuid: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="client-id">Client ID</Label>
            <Input
              id="client-id"
              placeholder="Enter your Client ID"
              value={settings.uber_client_id}
              onChange={(e) =>
                setSettings((s) => ({ ...s, uber_client_id: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="client-secret">Client Secret</Label>
            <Input
              id="client-secret"
              type="password"
              placeholder="Enter your Client Secret"
              value={settings.uber_client_secret}
              onChange={(e) =>
                setSettings((s) => ({ ...s, uber_client_secret: e.target.value }))
              }
            />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-fit cursor-pointer">
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
