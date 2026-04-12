"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useFleet } from "@/contexts/fleet-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { FleetRole } from "@/types/database"

interface Member {
  id: string
  user_id: string
  fleet_id: string
  role: FleetRole
  display_name: string | null
  created_at: string
}

interface Invite {
  id: string
  email: string
  role: FleetRole
  created_at: string
}

export function TeamMembersTab() {
  const { fleetId, role: myRole } = useFleet()
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)

  // Invite dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<FleetRole>("member")
  const [inviting, setInviting] = useState(false)

  const fetchAll = useCallback(async () => {
    if (!fleetId) return
    setLoading(true)
    const supabase = createClient()
    const [membersRes, invitesRes] = await Promise.all([
      supabase.from("profiles_fleet").select("*").eq("fleet_id", fleetId!).order("created_at"),
      supabase.from("fleet_invites").select("*").eq("fleet_id", fleetId!).is("accepted_at", null).order("created_at"),
    ])
    setMembers((membersRes.data ?? []) as Member[])
    setInvites((invitesRes.data ?? []) as Invite[])
    setLoading(false)
  }, [fleetId])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  async function handleInvite() {
    if (!fleetId || !inviteEmail.trim()) return
    setInviting(true)
    const supabase = createClient()
    const { error } = await supabase.from("fleet_invites").insert({
      fleet_id: fleetId,
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
    })
    setInviting(false)
    if (error) {
      console.error(error)
      toast.error("Failed to create invite.")
      return
    }
    toast.success(`Invite created for ${inviteEmail}. They'll join the fleet on their first sign-up.`)
    setInviteEmail("")
    setInviteRole("member")
    setDialogOpen(false)
    fetchAll()
  }

  async function handleCancelInvite(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from("fleet_invites").delete().eq("id", id).eq("fleet_id", fleetId!)
    if (error) {
      console.error(error)
      toast.error("Failed to cancel invite.")
      return
    }
    toast.success("Invite cancelled.")
    fetchAll()
  }

  async function handleRoleChange(memberId: string, newRole: FleetRole) {
    const supabase = createClient()
    const { error } = await supabase
      .from("profiles_fleet")
      .update({ role: newRole })
      .eq("id", memberId)
      .eq("fleet_id", fleetId!)
    if (error) {
      console.error(error)
      toast.error("Failed to update role.")
      return
    }
    toast.success("Role updated.")
    fetchAll()
  }

  async function handleRemoveMember(memberId: string) {
    if (!window.confirm("Remove this member from the fleet? They will lose access immediately.")) return
    const supabase = createClient()
    const { error } = await supabase
      .from("profiles_fleet")
      .delete()
      .eq("id", memberId)
      .eq("fleet_id", fleetId!)
    if (error) {
      console.error(error)
      toast.error("Failed to remove member.")
      return
    }
    toast.success("Member removed.")
    fetchAll()
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>

  const canManage = myRole === "owner"

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Users who have access to this fleet. Owners can read and write everything; members have read-only access to non-financial data and full access to the maintenance log.
              </CardDescription>
            </div>
            {canManage && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger
                  render={
                    <Button className="cursor-pointer">
                      <Plus className="mr-1.5 h-4 w-4" />
                      Invite
                    </Button>
                  }
                />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                      The user will be linked to this fleet when they first sign up with the given email.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colleague@example.com"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Role</Label>
                      <Select value={inviteRole} onValueChange={(v) => setInviteRole((v ?? "member") as FleetRole)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="owner">Owner</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()} className="cursor-pointer">
                      {inviting ? "Creating..." : "Create Invite"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{m.display_name ?? "(no name)"}</p>
                <p className="text-xs text-muted-foreground truncate">user_id: {m.user_id}</p>
              </div>
              {canManage && m.role !== "owner" ? (
                <>
                  <Select
                    value={m.role}
                    onValueChange={(v) => handleRoleChange(m.id, (v ?? "member") as FleetRole)}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => handleRemoveMember(m.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Badge variant="outline">{m.role}</Badge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invites</CardTitle>
            <CardDescription>Users who have been invited but not yet signed up.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {invites.map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{i.email}</p>
                  <p className="text-xs text-muted-foreground">Role: {i.role}</p>
                </div>
                {canManage && (
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleCancelInvite(i.id)}>
                    Cancel
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
