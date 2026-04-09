"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const STORAGE_KEY = "fleet_uber_api_settings";

interface UberApiSettings {
  organisationUuid: string;
  clientId: string;
  clientSecret: string;
}

export function UberApiTab() {
  const [settings, setSettings] = useState<UberApiSettings>({
    organisationUuid: "",
    clientId: "",
    clientSecret: "",
  });
  const [connected, setConnected] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as UberApiSettings;
        setSettings(parsed);
        setConnected(
          Boolean(parsed.organisationUuid && parsed.clientId && parsed.clientSecret)
        );
      } catch {
        // ignore
      }
    }
  }, []);

  function handleSave() {
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      const isConnected = Boolean(
        settings.organisationUuid && settings.clientId && settings.clientSecret
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
              value={settings.organisationUuid}
              onChange={(e) =>
                setSettings((s) => ({ ...s, organisationUuid: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="client-id">Client ID</Label>
            <Input
              id="client-id"
              placeholder="Enter your Client ID"
              value={settings.clientId}
              onChange={(e) =>
                setSettings((s) => ({ ...s, clientId: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="client-secret">Client Secret</Label>
            <Input
              id="client-secret"
              type="password"
              placeholder="Enter your Client Secret"
              value={settings.clientSecret}
              onChange={(e) =>
                setSettings((s) => ({ ...s, clientSecret: e.target.value }))
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
