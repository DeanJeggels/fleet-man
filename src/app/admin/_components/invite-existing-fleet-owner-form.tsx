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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ExistingFleetOption {
  id: string;
  name: string;
}

interface OwnerDraft {
  id: string;
  owner_email: string;
  owner_display_name: string;
}

function makeEmptyDraft(): OwnerDraft {
  return {
    id:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2),
    owner_email: "",
    owner_display_name: "",
  };
}

export function InviteExistingFleetOwnerForm({
  fleets,
}: {
  fleets: ExistingFleetOption[];
}) {
  const router = useRouter();
  const [fleetId, setFleetId] = useState<string>("");
  const [drafts, setDrafts] = useState<OwnerDraft[]>([makeEmptyDraft()]);
  const [submitting, setSubmitting] = useState(false);

  function updateDraft(id: string, patch: Partial<OwnerDraft>) {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  function removeDraft(id: string) {
    setDrafts((prev) => (prev.length === 1 ? prev : prev.filter((d) => d.id !== id)));
  }

  function addDraft() {
    setDrafts((prev) => [...prev, makeEmptyDraft()]);
  }

  async function handleSubmit() {
    if (!fleetId) {
      toast.error("Pick a fleet first.");
      return;
    }
    const invalid = drafts.find((d) => !d.owner_email.trim());
    if (invalid) {
      toast.error("Every row needs an owner email.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const results: Array<{ email: string; ok: boolean; msg: string }> = [];

    for (const d of drafts) {
      const owner_email = d.owner_email.trim().toLowerCase();
      const owner_display_name = d.owner_display_name.trim() || undefined;

      const { data, error } = await supabase.functions.invoke("invite-fleet-owner", {
        body: { fleet_id: fleetId, owner_email, owner_display_name },
      });

      const softError =
        data && typeof data === "object" && "error" in data
          ? (data as { error?: unknown }).error
          : null;

      if (error || softError) {
        const msg = await extractFunctionError(error, data);
        results.push({ email: owner_email, ok: false, msg });
      } else {
        results.push({ email: owner_email, ok: true, msg: "invited" });
      }
    }

    setSubmitting(false);

    const okCount = results.filter((r) => r.ok).length;
    const failCount = results.length - okCount;
    const fleetName =
      fleets.find((f) => f.id === fleetId)?.name ?? "selected fleet";

    if (failCount === 0) {
      toast.success(
        okCount === 1
          ? `Invited ${results[0].email} as owner of ${fleetName}.`
          : `Invited ${okCount} owners to ${fleetName}.`,
      );
      setDrafts([makeEmptyDraft()]);
    } else if (okCount === 0) {
      toast.error(results[0].msg || "Failed to invite.");
    } else {
      toast.warning(
        `${okCount} succeeded, ${failCount} failed. First failure: ${
          results.find((r) => !r.ok)?.msg ?? "unknown"
        }`,
      );
      // Keep rows that failed so the user can fix + retry; drop successful ones.
      setDrafts((prev) =>
        prev.filter((d) => {
          const matched = results.find(
            (r) => r.email === d.owner_email.trim().toLowerCase(),
          );
          return !matched?.ok;
        }),
      );
    }

    router.refresh();
  }

  if (fleets.length === 0) {
    return null; // No existing fleets to add owners to.
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite additional owners to existing fleet</CardTitle>
        <CardDescription>
          Pick a fleet and add one or more owner emails. Each gets their own invite email and
          joins as a separate owner account on the same fleet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="existing-fleet-select">
            Fleet <span className="text-destructive">*</span>
          </Label>
          <Select value={fleetId} onValueChange={(v) => setFleetId(v ?? "")}>
            <SelectTrigger id="existing-fleet-select">
              <SelectValue placeholder="Pick a fleet" />
            </SelectTrigger>
            <SelectContent>
              {fleets.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {drafts.map((d, idx) => (
          <div
            key={d.id}
            className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-[1fr_1fr_auto]"
          >
            <div className="space-y-1.5">
              <Label htmlFor={`existing-owner-email-${d.id}`}>
                Owner email{idx === 0 && <span className="text-destructive"> *</span>}
              </Label>
              <Input
                id={`existing-owner-email-${d.id}`}
                type="email"
                value={d.owner_email}
                onChange={(e) => updateDraft(d.id, { owner_email: e.target.value })}
                placeholder="bob@acme.com"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`existing-owner-name-${d.id}`}>Display name (optional)</Label>
              <Input
                id={`existing-owner-name-${d.id}`}
                value={d.owner_display_name}
                onChange={(e) => updateDraft(d.id, { owner_display_name: e.target.value })}
                placeholder="Bob"
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
            Add another email
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !fleetId}
            className="cursor-pointer"
          >
            {submitting
              ? "Inviting..."
              : drafts.length === 1
                ? "Send invite"
                : `Send ${drafts.length} invites`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
