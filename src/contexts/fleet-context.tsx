"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { FleetRole } from "@/types/database"

interface FleetContextValue {
  fleetId: string | null
  role: FleetRole | null
  displayName: string | null
  driverId: string | null
  loading: boolean
  isOwnerOrAdmin: boolean
  isDriver: boolean
}

const FleetContext = createContext<FleetContextValue>({
  fleetId: null,
  role: null,
  displayName: null,
  driverId: null,
  loading: true,
  isOwnerOrAdmin: false,
  isDriver: false,
})

export function FleetProvider({ children }: { children: ReactNode }) {
  const [fleetId, setFleetId] = useState<string | null>(null)
  const [role, setRole] = useState<FleetRole | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [driverId, setDriverId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    // showSpinner=true only for first load. Background refreshes after
    // auth events must keep the existing UI mounted — otherwise setting
    // loading=true unmounts every child (including open form sheets)
    // and wipes in-progress form state on every tab refocus.
    async function loadProfile(showSpinner: boolean) {
      if (showSpinner) setLoading(true)
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) console.error("[FleetContext] auth.getUser error:", authError)

      if (!user) {
        if (!cancelled) {
          setFleetId(null)
          setRole(null)
          setDisplayName(null)
          setDriverId(null)
          setLoading(false)
        }
        return
      }

      const { data, error } = await supabase
        .from("profiles_fleet")
        .select("fleet_id, role, display_name, driver_id")
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
        setDriverId(data.driver_id)
      } else {
        setFleetId(null)
        setRole(null)
        setDisplayName(null)
        setDriverId(null)
      }
      setLoading(false)
    }

    loadProfile(true)

    // Only respond to identity-changing events. TOKEN_REFRESHED fires on every
    // tab refocus and does NOT change the user or their profile — refetching
    // would just cause a pointless re-render cascade.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        loadProfile(false)
      }
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<FleetContextValue>(() => ({
    fleetId,
    role,
    displayName,
    driverId,
    loading,
    isOwnerOrAdmin: role === "owner" || role === "admin",
    isDriver: role === "driver",
  }), [fleetId, role, displayName, driverId, loading])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading fleet...
      </div>
    )
  }

  return (
    <FleetContext.Provider value={value}>
      {children}
    </FleetContext.Provider>
  )
}

export function useFleet() {
  return useContext(FleetContext)
}
