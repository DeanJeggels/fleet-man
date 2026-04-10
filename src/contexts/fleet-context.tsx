"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"

interface FleetContextValue {
  fleetId: string | null
  role: string | null
  displayName: string | null
  loading: boolean
}

const FleetContext = createContext<FleetContextValue>({
  fleetId: null,
  role: null,
  displayName: null,
  loading: true,
})

export function FleetProvider({ children }: { children: ReactNode }) {
  const [fleetId, setFleetId] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
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
        setRole(data.role)
        setDisplayName(data.display_name)
      }

      setLoading(false)
    }

    loadProfile()
  }, [])

  return (
    <FleetContext.Provider value={{ fleetId, role, displayName, loading }}>
      {children}
    </FleetContext.Provider>
  )
}

export function useFleet() {
  return useContext(FleetContext)
}
