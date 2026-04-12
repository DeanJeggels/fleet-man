"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { FleetRole } from "@/types/database"

interface FleetContextValue {
  fleetId: string | null
  role: FleetRole | null
  displayName: string | null
  loading: boolean
  isOwnerOrAdmin: boolean
}

const FleetContext = createContext<FleetContextValue>({
  fleetId: null,
  role: null,
  displayName: null,
  loading: true,
  isOwnerOrAdmin: false,
})

export function FleetProvider({ children }: { children: ReactNode }) {
  const [fleetId, setFleetId] = useState<string | null>(null)
  const [role, setRole] = useState<FleetRole | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from("profiles_fleet")
        .select("fleet_id, role, display_name")
        .eq("user_id", user.id)
        .limit(1)
        .single()

      if (data) {
        setFleetId(data.fleet_id)
        setRole(data.role as FleetRole)
        setDisplayName(data.display_name)
      }

      setLoading(false)
    }

    loadProfile()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading fleet...
      </div>
    )
  }

  const isOwnerOrAdmin = role === "owner" || role === "admin"

  return (
    <FleetContext.Provider value={{ fleetId, role, displayName, loading, isOwnerOrAdmin }}>
      {children}
    </FleetContext.Provider>
  )
}

export function useFleet() {
  return useContext(FleetContext)
}
