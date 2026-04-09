"use client";

import { Settings, Wifi, Bell, Send, List, Gauge } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UberApiTab } from "@/components/settings/uber-api-tab";
import { NotificationsTab } from "@/components/settings/notifications-tab";
import { TelegramTab } from "@/components/settings/telegram-tab";
import { EventTypesTab } from "@/components/settings/event-types-tab";
import { AlertThresholdsTab } from "@/components/settings/alert-thresholds-tab";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your fleet configuration and integrations"
      />

      <Tabs defaultValue={0}>
        <TabsList variant="line" className="w-full justify-start">
          <TabsTrigger value={0}>
            <Wifi className="size-4" />
            Uber API
          </TabsTrigger>
          <TabsTrigger value={1}>
            <Bell className="size-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value={2}>
            <Send className="size-4" />
            Telegram
          </TabsTrigger>
          <TabsTrigger value={3}>
            <List className="size-4" />
            Event Types
          </TabsTrigger>
          <TabsTrigger value={4}>
            <Gauge className="size-4" />
            Alert Thresholds
          </TabsTrigger>
        </TabsList>

        <TabsContent value={0} className="mt-4">
          <UberApiTab />
        </TabsContent>
        <TabsContent value={1} className="mt-4">
          <NotificationsTab />
        </TabsContent>
        <TabsContent value={2} className="mt-4">
          <TelegramTab />
        </TabsContent>
        <TabsContent value={3} className="mt-4">
          <EventTypesTab />
        </TabsContent>
        <TabsContent value={4} className="mt-4">
          <AlertThresholdsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
