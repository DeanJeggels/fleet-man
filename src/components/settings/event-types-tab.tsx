"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Lock, Plus, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useFleet } from "@/contexts/fleet-context";
import type { MaintenanceEventType, MaintenanceCategory } from "@/types/database";
import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const CATEGORIES: MaintenanceCategory[] = [
  "routine",
  "repair",
  "emergency",
  "inspection",
  "compliance",
  "accident_related",
];

function categoryLabel(cat: string) {
  return cat
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface EventTypeForm {
  name: string;
  category: MaintenanceCategory;
}

export function EventTypesTab() {
  const { fleetId } = useFleet();
  const [data, setData] = useState<MaintenanceEventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventTypeForm>({
    name: "",
    category: "routine",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!fleetId) return;
    setLoading(true);
    const supabase = createClient();
    const { data: rows, error } = await supabase
      .from("maintenance_event_types")
      .select("*")
      .eq("fleet_id", fleetId!)
      .order("sort_order", { ascending: true });

    if (error) {
      toast.error("Failed to load event types");
    } else {
      setData(rows ?? []);
    }
    setLoading(false);
  }, [fleetId]);

  useEffect(() => {
    if (!fleetId) return;
    fetchData();
  }, [fetchData, fleetId]);

  function openAdd() {
    setEditingId(null);
    setForm({ name: "", category: "routine" });
    setDialogOpen(true);
  }

  function openEdit(row: MaintenanceEventType) {
    setEditingId(row.id);
    setForm({ name: row.name, category: row.category });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    if (editingId) {
      const { error } = await supabase
        .from("maintenance_event_types")
        .update({ name: form.name, category: form.category })
        .eq("id", editingId)
        .eq("fleet_id", fleetId!);

      if (error) {
        toast.error("Failed to update event type");
      } else {
        toast.success("Event type updated");
        setDialogOpen(false);
        fetchData();
      }
    } else {
      const maxSort = data.length > 0 ? Math.max(...data.map((d) => d.sort_order)) + 1 : 0;
      const { error } = await supabase
        .from("maintenance_event_types")
        .insert({ name: form.name, category: form.category, sort_order: maxSort, fleet_id: fleetId! });

      if (error) {
        toast.error("Failed to create event type");
      } else {
        toast.success("Event type created");
        setDialogOpen(false);
        fetchData();
      }
    }
    setSubmitting(false);
  }

  async function handleDelete(row: MaintenanceEventType) {
    if (row.is_system) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("maintenance_event_types")
      .delete()
      .eq("id", row.id)
      .eq("fleet_id", fleetId!);

    if (error) {
      toast.error("Failed to delete event type");
    } else {
      toast.success("Event type deleted");
      fetchData();
    }
  }

  type EventTypeRow = MaintenanceEventType & Record<string, unknown>;

  const columns: ColumnDef<EventTypeRow>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.name}
          {row.is_system && (
            <Lock className="size-3.5 text-muted-foreground" />
          )}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      render: (row) => (
        <Badge variant="secondary">{categoryLabel(row.category)}</Badge>
      ),
    },
    {
      key: "is_system",
      header: "System",
      render: (row) =>
        row.is_system ? (
          <Badge variant="outline">System</Badge>
        ) : (
          <span className="text-muted-foreground">Custom</span>
        ),
    },
    {
      key: "actions",
      header: "",
      render: (row) =>
        row.is_system ? null : (
          <div className="flex items-center gap-1 justify-end">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={(e) => {
                e.stopPropagation();
                openEdit(row);
              }}
              aria-label={`Edit ${row.name}`}
              className="cursor-pointer"
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(row);
              }}
              aria-label={`Delete ${row.name}`}
              className="cursor-pointer"
            >
              <Trash2 className="size-3.5 text-destructive" />
            </Button>
          </div>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Maintenance Event Types</h3>
          <p className="text-sm text-muted-foreground">
            Manage the types of maintenance events used across the system.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button onClick={openAdd} className="cursor-pointer">
                <Plus className="size-4" data-icon="inline-start" />
                Add Type
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Event Type" : "Add Event Type"}
              </DialogTitle>
              <DialogDescription>
                {editingId
                  ? "Update the event type details."
                  : "Create a new maintenance event type."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="event-name">Name</Label>
                <Input
                  id="event-name"
                  placeholder="e.g. Brake Pad Replacement"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="event-category">Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(val: string | null) => {
                    if (val) {
                      setForm((f) => ({
                        ...f,
                        category: val as MaintenanceCategory,
                      }));
                    }
                  }}
                >
                  <SelectTrigger id="event-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {categoryLabel(cat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={submitting} className="cursor-pointer">
                {submitting
                  ? "Saving..."
                  : editingId
                    ? "Update"
                    : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <DataTable
        columns={columns}
        data={data as EventTypeRow[]}
        loading={loading}
        searchable
        searchKey="name"
        searchPlaceholder="Search event types..."
      />
    </div>
  );
}
