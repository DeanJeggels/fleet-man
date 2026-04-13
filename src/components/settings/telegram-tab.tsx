"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFleet } from "@/contexts/fleet-context";

export function TelegramTab() {
  const { fleetId } = useFleet();
  const [chatId, setChatId] = useState("");
  const [savedChatId, setSavedChatId] = useState("");
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);
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

      const stored = data.telegram_chat_id ?? "";
      setChatId(stored);
      setSavedChatId(stored);
      setConnected(Boolean(stored));
    }

    load();
  }, [fleetId]);

  async function persistChatId(value: string) {
    if (!fleetId) return false;
    const supabase = createClient();
    const { error } = await supabase
      .from("fleet_settings")
      .update({ telegram_chat_id: value })
      .eq("fleet_id", fleetId);
    if (error) return false;
    setSavedChatId(value);
    setConnected(Boolean(value));
    return true;
  }

  async function handleSave() {
    if (!fleetId) return;
    setSaving(true);
    try {
      const ok = await persistChatId(chatId);
      if (!ok) throw new Error("save failed");
      toast.success("Telegram settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestMessage() {
    if (!chatId) {
      toast.error("Please enter a Chat ID first");
      return;
    }

    setSending(true);
    try {
      // The edge function now reads chat_id from fleet_settings, so save first
      // if the user has edited the value without hitting Save.
      if (chatId !== savedChatId) {
        const ok = await persistChatId(chatId);
        if (!ok) {
          toast.error("Could not save Chat ID. Please try Save first.");
          return;
        }
      }

      const supabase = createClient();
      const { error } = await supabase.functions.invoke("fleet-telegram-test", {
        body: {},
      });

      if (error) throw error;
      toast.success("Test message sent successfully");
    } catch {
      toast.error("Failed to send test message");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Telegram Integration</CardTitle>
            <CardDescription>
              Configure Telegram bot notifications for your fleet alerts.
            </CardDescription>
          </div>
          <Badge variant={connected ? "default" : "destructive"}>
            {connected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 max-w-md">
          <div className="grid gap-2">
            <Label htmlFor="chat-id">Chat ID</Label>
            <Input
              id="chat-id"
              placeholder="Enter your Telegram Chat ID"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Send /start to the bot to get your Chat ID.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} className="cursor-pointer">
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="outline"
              onClick={handleTestMessage}
              disabled={sending || !chatId}
              className="cursor-pointer"
            >
              <Send className="size-4" data-icon="inline-start" />
              {sending ? "Sending..." : "Send Test Message"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
