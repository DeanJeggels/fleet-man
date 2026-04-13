"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFleet } from "@/contexts/fleet-context";
import { createClient } from "@/lib/supabase/client";

interface BoltApiSettings {
  bolt_company_id: string;
  bolt_client_id: string;
  bolt_client_secret: string;
}

export function BoltApiTab() {
  const { fleetId } = useFleet();
  const [settings, setSettings] = useState<BoltApiSettings>({
    bolt_company_id: "",
    bolt_client_id: "",
    bolt_client_secret: "",
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
        bolt_company_id: data.bolt_company_id ?? "",
        bolt_client_id: data.bolt_client_id ?? "",
        bolt_client_secret: data.bolt_client_secret ?? "",
      });
      setConnected(
        Boolean(data.bolt_company_id && data.bolt_client_id && data.bolt_client_secret)
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
          bolt_company_id: settings.bolt_company_id || null,
          bolt_client_id: settings.bolt_client_id || null,
          bolt_client_secret: settings.bolt_client_secret || null,
        })
        .eq("fleet_id", fleetId);

      if (error) throw error;

      const isConnected = Boolean(
        settings.bolt_company_id && settings.bolt_client_id && settings.bolt_client_secret
      );
      setConnected(isConnected);
      toast.success("Bolt API settings saved");
    } catch (err) {
      console.error(err);
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
            <CardTitle>Bolt API Configuration</CardTitle>
            <CardDescription>
              Connect your Bolt Fleet account to sync vehicles, drivers and trip data.
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
            <Label htmlFor="bolt-company-id">Company ID</Label>
            <Input
              id="bolt-company-id"
              placeholder="Bolt Fleet company ID"
              value={settings.bolt_company_id}
              onChange={(e) =>
                setSettings((s) => ({ ...s, bolt_company_id: e.target.value }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Find this in Bolt Fleet Dashboard → Settings → API access.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bolt-client-id">Client ID</Label>
            <Input
              id="bolt-client-id"
              placeholder="Enter your Bolt Client ID"
              value={settings.bolt_client_id}
              onChange={(e) =>
                setSettings((s) => ({ ...s, bolt_client_id: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bolt-client-secret">Client Secret</Label>
            <Input
              id="bolt-client-secret"
              type="password"
              placeholder="Enter your Bolt Client Secret"
              value={settings.bolt_client_secret}
              onChange={(e) =>
                setSettings((s) => ({ ...s, bolt_client_secret: e.target.value }))
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
