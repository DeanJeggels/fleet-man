"use client"

import { Suspense } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { MaintenanceForm } from "@/components/maintenance/maintenance-form"
import { Skeleton } from "@/components/ui/skeleton"

function MaintenanceFormFallback() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Skeleton className="h-[600px] rounded-xl" />
      <div className="space-y-6">
        <Skeleton className="h-[200px] rounded-xl" />
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    </div>
  )
}

export default function NewMaintenancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Log Maintenance"
        description="Record a new maintenance event for a vehicle"
      />
      <Suspense fallback={<MaintenanceFormFallback />}>
        <MaintenanceForm />
      </Suspense>
    </div>
  )
}
