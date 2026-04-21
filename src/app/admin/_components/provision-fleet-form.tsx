"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { extractFunctionError } from "@/lib/supabase/extract-function-error";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FleetDraft {
  id: string; // client-side id for list key
  fleet_name: string;
  owner_email: string;
  owner_display_name: string;
}

function makeEmptyDraft(): FleetDraft {
  return {
    id:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2),
    fleet_name: "",
    owner_email: "",
    owner_display_name: "",
  };
}

export function ProvisionFleetForm() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<FleetDraft[]>([makeEmptyDraft()]);
  const [submitting, setSubmitting] = useState(false);

  function updateDraft(id: string, patch: Partial<FleetDraft>) {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  function removeDraft(id: string) {
    setDrafts((prev) => (prev.length === 1 ? prev : prev.filter((d) => d.id !== id)));
  }

  function addDraft() {
    setDrafts((prev) => [...prev, makeEmptyDraft()]);
  }

  async function handleSubmit() {
    // Validate
    const invalid = drafts.find(
      (d) => !d.fleet_name.trim() || !d.owner_email.trim()
    );
    if (invalid) {
      toast.error("Every row needs a fleet name and owner email.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const results: Array<{ fleet_name: string; owner_email: string; ok: boolean; msg: string }> = [];

    // Sequential: if one fails we'd rather see the error before firing the rest,
    // and the typical use case is 1-3 provisions at a time.
    for (const d of drafts) {
      const fleet_name = d.fleet_name.trim();
      const owner_email = d.owner_email.trim().toLowerCase();
      const owner_display_name = d.owner_display_name.trim() || undefined;

      const { data, error } = await supabase.functions.invoke("invite-fleet-owner", {
        body: { fleet_name, owner_email, owner_display_name },
      });

      const softError =
        data && typeof data === "object" && "error" in data
          ? (data as { error?: unknown }).error
          : null;

      if (error || softError) {
        const msg = await extractFunctionError(error, data);
        results.push({ fleet_name, owner_email, ok: false, msg });
      } else {
        results.push({ fleet_name, owner_email, ok: true, msg: "invited" });
      }
    }

    setSubmitting(false);

    const okCount = results.filter((r) => r.ok).length;
    const failCount = results.length - okCount;

    if (failCount === 0) {
      toast.success(
        results.length === 1
          ? `Invited ${results[0].owner_email} to ${results[0].fleet_name}.`
          : `Invited ${okCount} owners.`
      );
      setDrafts([makeEmptyDraft()]);
    } else if (okCount === 0) {
      toast.error(results[0].msg || "Failed to invite.");
    } else {
      toast.warning(
        `${okCount} succeeded, ${failCount} failed. First failure: ${
          results.find((r) => !r.ok)?.msg ?? "unknown"
        }`
      );
      // Keep failing rows, drop successful ones so the user can fix and retry.
      setDrafts((prev) =>
        prev.filter((d) => {
          const matched = results.find(
            (r) =>
              r.fleet_name === d.fleet_name.trim() &&
              r.owner_email === d.owner_email.trim().toLowerCase()
          );
          return !matched?.ok;
        })
      );
    }

    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Provision new fleet</CardTitle>
        <CardDescription>
          Each row creates a fleet and emails the owner a link to set their password. Add multiple
          rows to provision in batch.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {drafts.map((d, idx) => (
          <div key={d.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-[1fr_1fr_1fr_auto]">
            <div className="space-y-1.5">
              <Label htmlFor={`fleet-name-${d.id}`}>
                Fleet name{idx === 0 && <span className="text-destructive"> *</span>}
              </Label>
              <Input
                id={`fleet-name-${d.id}`}
                value={d.fleet_name}
                onChange={(e) => updateDraft(d.id, { fleet_name: e.target.value })}
                placeholder="Acme Transport"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`owner-email-${d.id}`}>
                Owner email{idx === 0 && <span className="text-destructive"> *</span>}
              </Label>
              <Input
                id={`owner-email-${d.id}`}
                type="email"
                value={d.owner_email}
                onChange={(e) => updateDraft(d.id, { owner_email: e.target.value })}
                placeholder="alice@acme.com"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`owner-name-${d.id}`}>Display name (optional)</Label>
              <Input
                id={`owner-name-${d.id}`}
                value={d.owner_display_name}
                onChange={(e) => updateDraft(d.id, { owner_display_name: e.target.value })}
                placeholder="Alice"
                autoComplete="off"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={drafts.length === 1 || submitting}
                onClick={() => removeDraft(d.id)}
                className="text-destructive"
                aria-label="Remove row"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addDraft}
            disabled={submitting}
            className="cursor-pointer"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add another
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="cursor-pointer"
          >
            {submitting
              ? "Inviting..."
              : drafts.length === 1
                ? "Create fleet + invite owner"
                : `Create ${drafts.length} fleets + invite owners`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
