import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProvisionFleetForm } from "./_components/provision-fleet-form";

export const dynamic = "force-dynamic";

interface FleetWithOwner {
  id: string;
  name: string;
  created_at: string;
  owners: Array<{ display_name: string | null; user_id: string }>;
  pending_owner_invites: Array<{ email: string; created_at: string }>;
}

async function loadFleets(): Promise<FleetWithOwner[]> {
  const supabase = await createClient();

  const [fleetsRes, profilesRes, invitesRes] = await Promise.all([
    supabase.from("fleets").select("id, name, created_at").order("created_at", { ascending: false }),
    supabase.from("profiles_fleet").select("fleet_id, user_id, role, display_name").eq("role", "owner"),
    supabase
      .from("fleet_invites")
      .select("fleet_id, email, role, created_at")
      .eq("role", "owner")
      .is("accepted_at", null),
  ]);

  const fleets = fleetsRes.data ?? [];
  const profiles = profilesRes.data ?? [];
  const invites = invitesRes.data ?? [];

  return fleets.map((f) => ({
    id: f.id,
    name: f.name,
    created_at: f.created_at,
    owners: profiles
      .filter((p) => p.fleet_id === f.id)
      .map((p) => ({ display_name: p.display_name, user_id: p.user_id })),
    pending_owner_invites: invites
      .filter((i) => i.fleet_id === f.id)
      .map((i) => ({ email: i.email, created_at: i.created_at })),
  }));
}

export default async function AdminPage() {
  const fleets = await loadFleets();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Fleet Provisioning</h1>
        <p className="text-sm text-muted-foreground">
          Create new fleets and invite their owners. Invitees receive an email with a link to set
          their password.
        </p>
      </div>

      <ProvisionFleetForm />

      <Card>
        <CardHeader>
          <CardTitle>Fleets</CardTitle>
          <CardDescription>
            All fleets in the platform. Pending invites mean the owner hasn&apos;t accepted yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {fleets.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No fleets yet. Provision one above.
            </p>
          ) : (
            fleets.map((f) => (
              <div key={f.id} className="rounded-md border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{f.name}</p>
                    <p className="text-xs text-muted-foreground">
                      fleet_id: {f.id} · created{" "}
                      {new Date(f.created_at).toLocaleDateString("en-ZA")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {f.owners.map((o) => (
                      <Badge key={o.user_id} variant="secondary">
                        Owner: {o.display_name ?? o.user_id.slice(0, 8)}
                      </Badge>
                    ))}
                    {f.pending_owner_invites.map((i) => (
                      <Badge key={i.email} variant="outline">
                        Pending: {i.email}
                      </Badge>
                    ))}
                    {f.owners.length === 0 && f.pending_owner_invites.length === 0 && (
                      <Badge variant="destructive">No owner</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
