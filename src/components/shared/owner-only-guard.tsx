"use client"

import { Lock } from "lucide-react"
import { useFleet } from "@/contexts/fleet-context"
import { Card, CardContent } from "@/components/ui/card"

interface OwnerOnlyGuardProps {
  children: React.ReactNode
}

export function OwnerOnlyGuard({ children }: OwnerOnlyGuardProps) {
  const { isOwnerOrAdmin, loading } = useFleet()

  if (loading) return null
  if (isOwnerOrAdmin) return <>{children}</>

  return (
    <Card className="mx-auto max-w-md">
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Lock className="size-5 text-muted-foreground" />
        </div>
        <h2 className="text-base font-semibold">Access restricted</h2>
        <p className="text-sm text-muted-foreground">
          This section is only available to fleet owners and admins. Contact your fleet owner if you need access.
        </p>
      </CardContent>
    </Card>
  )
}
