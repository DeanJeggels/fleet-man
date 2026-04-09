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

const STORAGE_KEY = "fleet_telegram_settings";

export function TelegramTab() {
  const [chatId, setChatId] = useState("");
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setChatId(parsed.chatId || "");
        setConnected(Boolean(parsed.chatId));
      } catch {
        // ignore
      }
    }
  }, []);

  function handleSave() {
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ chatId }));
      setConnected(Boolean(chatId));
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
      const supabase = createClient();
      const { error } = await supabase.functions.invoke("fleet-telegram-test", {
        body: { chat_id: chatId },
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
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="outline"
              onClick={handleTestMessage}
              disabled={sending || !chatId}
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
