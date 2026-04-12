"use client";

import { Wifi, Bell, Send, List, Gauge, Building2, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UberApiTab } from "@/components/settings/uber-api-tab";
import { NotificationsTab } from "@/components/settings/notifications-tab";
import { TelegramTab } from "@/components/settings/telegram-tab";
import { EventTypesTab } from "@/components/settings/event-types-tab";
import { AlertThresholdsTab } from "@/components/settings/alert-thresholds-tab";
import { CompanyProfileTab } from "@/components/settings/company-profile-tab";
import { TeamMembersTab } from "@/components/settings/team-members-tab";
import { useFleet } from "@/contexts/fleet-context";

export default function SettingsPage() {
  const { isOwnerOrAdmin } = useFleet();

  // Members see only Notifications tab.
  if (!isOwnerOrAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" description="Manage your notification preferences" />
        <NotificationsTab />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your fleet configuration and integrations"
      />

      <Tabs defaultValue={0}>
        <TabsList variant="line" className="w-full justify-start overflow-x-auto scrollbar-none scroll-smooth snap-x snap-mandatory">
          <TabsTrigger value={0} className="snap-start shrink-0">
            <Building2 className="size-4" />
            <span className="sm:hidden">Company</span>
            <span className="hidden sm:inline">Company Profile</span>
          </TabsTrigger>
          <TabsTrigger value={1} className="snap-start shrink-0">
            <Users className="size-4" />
            <span className="sm:hidden">Team</span>
            <span className="hidden sm:inline">Team Members</span>
          </TabsTrigger>
          <TabsTrigger value={2} className="snap-start shrink-0">
            <Wifi className="size-4" />
            <span className="sm:hidden">API</span>
            <span className="hidden sm:inline">Uber API</span>
          </TabsTrigger>
          <TabsTrigger value={3} className="snap-start shrink-0">
            <Bell className="size-4" />
            <span className="sm:hidden">Notify</span>
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value={4} className="snap-start shrink-0">
            <Send className="size-4" />
            Telegram
          </TabsTrigger>
          <TabsTrigger value={5} className="snap-start shrink-0">
            <List className="size-4" />
            <span className="sm:hidden">Events</span>
            <span className="hidden sm:inline">Event Types</span>
          </TabsTrigger>
          <TabsTrigger value={6} className="snap-start shrink-0">
            <Gauge className="size-4" />
            <span className="sm:hidden">Alerts</span>
            <span className="hidden sm:inline">Alert Thresholds</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={0} className="mt-4">
          <CompanyProfileTab />
        </TabsContent>
        <TabsContent value={1} className="mt-4">
          <TeamMembersTab />
        </TabsContent>
        <TabsContent value={2} className="mt-4">
          <UberApiTab />
        </TabsContent>
        <TabsContent value={3} className="mt-4">
          <NotificationsTab />
        </TabsContent>
        <TabsContent value={4} className="mt-4">
          <TelegramTab />
        </TabsContent>
        <TabsContent value={5} className="mt-4">
          <EventTypesTab />
        </TabsContent>
        <TabsContent value={6} className="mt-4">
          <AlertThresholdsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
