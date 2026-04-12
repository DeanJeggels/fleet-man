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
    const supabase = createClient()
    let cancelled = false

    async function loadProfile() {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) console.error("[FleetContext] auth.getUser error:", authError)

      if (!user) {
        if (!cancelled) {
          setFleetId(null)
          setRole(null)
          setDisplayName(null)
          setLoading(false)
        }
        return
      }

      const { data, error } = await supabase
        .from("profiles_fleet")
        .select("fleet_id, role, display_name")
        .eq("user_id", user.id)
        .maybeSingle()

      if (error) {
        console.error("[FleetContext] profiles_fleet fetch error:", error)
      }
      if (!data) {
        console.warn("[FleetContext] no profiles_fleet row for user", user.id)
      }

      if (cancelled) return

      if (data) {
        setFleetId(data.fleet_id)
        setRole(data.role as FleetRole)
        setDisplayName(data.display_name)
      } else {
        setFleetId(null)
        setRole(null)
        setDisplayName(null)
      }
      setLoading(false)
    }

    loadProfile()

    // Re-fetch on auth change (sign in/out, token refresh)
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "SIGNED_OUT") {
        setLoading(true)
        loadProfile()
      }
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
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
