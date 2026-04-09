"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Wrench, Bell, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import type { NotificationType } from "@/types/database";

interface ActivityItem {
  id: string;
  type: "maintenance" | "notification";
  message: string;
  created_at: string;
  notificationType?: NotificationType;
}

const notificationIcons: Record<NotificationType, typeof Bell> = {
  service_due: Bell,
  service_overdue: AlertTriangle,
  license_expiry: AlertTriangle,
  sync_failure: AlertTriangle,
  custom: Bell,
};

export function ActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const [{ data: maintenance }, { data: notifications }] =
        await Promise.all([
          supabase
            .from("maintenance_events")
            .select("id, description, category, created_at")
            .order("created_at", { ascending: false })
            .limit(10),
          supabase
            .from("notifications")
            .select("id, message, type, created_at")
            .order("created_at", { ascending: false })
            .limit(10),
        ]);

      const merged: ActivityItem[] = [];

      maintenance?.forEach((m) => {
        merged.push({
          id: m.id,
          type: "maintenance",
          message: m.description ?? `${m.category} maintenance recorded`,
          created_at: m.created_at,
        });
      });

      notifications?.forEach((n) => {
        merged.push({
          id: n.id,
          type: "notification",
          message: n.message,
          created_at: n.created_at,
          notificationType: n.type,
        });
      });

      merged.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setItems(merged.slice(0, 10));
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton className="mb-4 h-5 w-32" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="mb-3 flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1">
              <Skeleton className="mb-1 h-4 w-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-sm font-medium text-muted-foreground">
        Recent Activity
      </h3>
      <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity</p>
        ) : (
          items.map((item) => {
            const Icon =
              item.type === "maintenance"
                ? Wrench
                : notificationIcons[item.notificationType ?? "custom"];
            return (
              <div key={item.id} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{item.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
