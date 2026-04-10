"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  CalendarIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  WrenchIcon,
} from "lucide-react"
import type { Tables } from "@/types/database"
import { useFleet } from "@/contexts/fleet-context"

type ServiceSchedule = Tables<"service_schedules">

interface ServiceScheduleCardProps {
  vehicleId: string
  currentOdometer: number
}

function getStatus(
  schedule: ServiceSchedule,
  currentOdometer: number
): { label: string; color: "destructive" | "outline" | "secondary" } {
  const now = new Date()

  // Check date-based
  if (schedule.next_service_date) {
    const nextDate = new Date(schedule.next_service_date)
    const daysUntil = Math.ceil(
      (nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysUntil < 0) return { label: "Overdue", color: "destructive" }
    if (daysUntil <= schedule.alert_days_threshold)
      return { label: "Due Soon", color: "outline" }
  }

  // Check km-based
  if (schedule.next_service_km && currentOdometer > 0) {
    const kmUntil = schedule.next_service_km - currentOdometer
    if (kmUntil < 0) return { label: "Overdue", color: "destructive" }
    if (kmUntil <= schedule.alert_km_threshold)
      return { label: "Due Soon", color: "outline" }
  }

  return { label: "OK", color: "secondary" }
}

export function ServiceScheduleCard({
  vehicleId,
  currentOdometer,
}: ServiceScheduleCardProps) {
  const { fleetId } = useFleet()
  const [schedule, setSchedule] = React.useState<ServiceSchedule | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  // Form state
  const [intervalKm, setIntervalKm] = React.useState("")
  const [intervalMonths, setIntervalMonths] = React.useState("")
  const [lastServiceDate, setLastServiceDate] = React.useState<Date | undefined>(undefined)
  const [lastServiceKm, setLastServiceKm] = React.useState("")
  const [nextServiceDate, setNextServiceDate] = React.useState<Date | undefined>(undefined)
  const [nextServiceKm, setNextServiceKm] = React.useState("")
  const [lastDateOpen, setLastDateOpen] = React.useState(false)
  const [nextDateOpen, setNextDateOpen] = React.useState(false)

  React.useEffect(() => {
    if (!fleetId) return
    async function fetch() {
      const supabase = createClient()
      const { data } = await supabase
        .from("service_schedules")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .eq("fleet_id", fleetId!)
        .maybeSingle()

      if (data) setSchedule(data)
      setLoading(false)
    }
    fetch()
  }, [vehicleId, fleetId])

  function populateForm(s: ServiceSchedule | null) {
    if (s) {
      setIntervalKm(s.interval_km ? String(s.interval_km) : "")
      setIntervalMonths(s.interval_months ? String(s.interval_months) : "")
      setLastServiceDate(s.last_service_date ? new Date(s.last_service_date) : undefined)
      setLastServiceKm(s.last_service_km ? String(s.last_service_km) : "")
      setNextServiceDate(s.next_service_date ? new Date(s.next_service_date) : undefined)
      setNextServiceKm(s.next_service_km ? String(s.next_service_km) : "")
    } else {
      setIntervalKm("")
      setIntervalMonths("")
      setLastServiceDate(undefined)
      setLastServiceKm("")
      setNextServiceDate(undefined)
      setNextServiceKm("")
    }
  }

  // Auto-calculate next service when last + interval change
  React.useEffect(() => {
    if (lastServiceDate && intervalMonths) {
      const next = new Date(lastServiceDate)
      next.setMonth(next.getMonth() + Number(intervalMonths))
      setNextServiceDate(next)
    }
  }, [lastServiceDate, intervalMonths])

  React.useEffect(() => {
    if (lastServiceKm && intervalKm) {
      setNextServiceKm(String(Number(lastServiceKm) + Number(intervalKm)))
    }
  }, [lastServiceKm, intervalKm])

  async function handleSave() {
    if (!intervalKm && !intervalMonths) {
      toast.error("Set at least one interval (km or months).")
      return
    }

    setSaving(true)
    const supabase = createClient()

    const payload = {
      vehicle_id: vehicleId,
      fleet_id: fleetId!,
      interval_km: intervalKm ? Number(intervalKm) : null,
      interval_months: intervalMonths ? Number(intervalMonths) : null,
      last_service_date: lastServiceDate
        ? format(lastServiceDate, "yyyy-MM-dd")
        : null,
      last_service_km: lastServiceKm ? Number(lastServiceKm) : null,
      next_service_date: nextServiceDate
        ? format(nextServiceDate, "yyyy-MM-dd")
        : null,
      next_service_km: nextServiceKm ? Number(nextServiceKm) : null,
    }

    let result
    if (schedule) {
      result = await supabase
        .from("service_schedules")
        .update(payload)
        .eq("id", schedule.id)
        .select("*")
        .single()
    } else {
      result = await supabase
        .from("service_schedules")
        .insert(payload)
        .select("*")
        .single()
    }

    setSaving(false)

    if (result.error) {
      toast.error(result.error.message)
      return
    }

    setSchedule(result.data)
    setDialogOpen(false)
    toast.success(schedule ? "Service schedule updated." : "Service schedule created.")
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <WrenchIcon className="size-4" />
            Service Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    )
  }

  const status = schedule ? getStatus(schedule, currentOdometer) : null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <WrenchIcon className="size-4" />
            Service Schedule
          </CardTitle>
          {status && <Badge variant={status.color}>{status.label}</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        {schedule ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Interval</p>
                <p className="text-sm font-medium">
                  {[
                    schedule.interval_km && `${schedule.interval_km.toLocaleString()} km`,
                    schedule.interval_months && `${schedule.interval_months} months`,
                  ]
                    .filter(Boolean)
                    .join(" / ") || "Not set"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Service</p>
                <p className="text-sm font-medium">
                  {[
                    schedule.last_service_date &&
                      format(new Date(schedule.last_service_date), "dd MMM yyyy"),
                    schedule.last_service_km &&
                      `${schedule.last_service_km.toLocaleString()} km`,
                  ]
                    .filter(Boolean)
                    .join(" at ") || "Unknown"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">Next Service</p>
                <p className="text-sm font-medium">
                  {[
                    schedule.next_service_date &&
                      format(new Date(schedule.next_service_date), "dd MMM yyyy"),
                    schedule.next_service_km &&
                      `${schedule.next_service_km.toLocaleString()} km`,
                  ]
                    .filter(Boolean)
                    .join(" or ") || "Not calculated"}
                </p>
              </div>
            </div>

            <Dialog
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open)
                if (open) populateForm(schedule)
              }}
            >
              <DialogTrigger
                render={
                  <Button variant="outline" size="sm" className="cursor-pointer">
                    <PencilIcon className="size-3.5" />
                    Edit Schedule
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Service Schedule</DialogTitle>
                </DialogHeader>
                <ScheduleForm
                  intervalKm={intervalKm}
                  setIntervalKm={setIntervalKm}
                  intervalMonths={intervalMonths}
                  setIntervalMonths={setIntervalMonths}
                  lastServiceDate={lastServiceDate}
                  setLastServiceDate={setLastServiceDate}
                  lastDateOpen={lastDateOpen}
                  setLastDateOpen={setLastDateOpen}
                  lastServiceKm={lastServiceKm}
                  setLastServiceKm={setLastServiceKm}
                  nextServiceDate={nextServiceDate}
                  setNextServiceDate={setNextServiceDate}
                  nextDateOpen={nextDateOpen}
                  setNextDateOpen={setNextDateOpen}
                  nextServiceKm={nextServiceKm}
                  setNextServiceKm={setNextServiceKm}
                />
                <DialogFooter>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="cursor-pointer"
                  >
                    {saving && <Loader2Icon className="size-4 animate-spin" />}
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p className="text-sm text-muted-foreground">
              No service schedule configured for this vehicle.
            </p>
            <Dialog
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open)
                if (open) populateForm(null)
              }}
            >
              <DialogTrigger
                render={
                  <Button variant="outline" className="cursor-pointer">
                    <PlusIcon className="size-4" />
                    Set Up Schedule
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Service Schedule</DialogTitle>
                </DialogHeader>
                <ScheduleForm
                  intervalKm={intervalKm}
                  setIntervalKm={setIntervalKm}
                  intervalMonths={intervalMonths}
                  setIntervalMonths={setIntervalMonths}
                  lastServiceDate={lastServiceDate}
                  setLastServiceDate={setLastServiceDate}
                  lastDateOpen={lastDateOpen}
                  setLastDateOpen={setLastDateOpen}
                  lastServiceKm={lastServiceKm}
                  setLastServiceKm={setLastServiceKm}
                  nextServiceDate={nextServiceDate}
                  setNextServiceDate={setNextServiceDate}
                  nextDateOpen={nextDateOpen}
                  setNextDateOpen={setNextDateOpen}
                  nextServiceKm={nextServiceKm}
                  setNextServiceKm={setNextServiceKm}
                />
                <DialogFooter>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="cursor-pointer"
                  >
                    {saving && <Loader2Icon className="size-4 animate-spin" />}
                    {saving ? "Saving..." : "Create Schedule"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ScheduleForm({
  intervalKm,
  setIntervalKm,
  intervalMonths,
  setIntervalMonths,
  lastServiceDate,
  setLastServiceDate,
  lastDateOpen,
  setLastDateOpen,
  lastServiceKm,
  setLastServiceKm,
  nextServiceDate,
  setNextServiceDate,
  nextDateOpen,
  setNextDateOpen,
  nextServiceKm,
  setNextServiceKm,
}: {
  intervalKm: string
  setIntervalKm: (v: string) => void
  intervalMonths: string
  setIntervalMonths: (v: string) => void
  lastServiceDate: Date | undefined
  setLastServiceDate: (v: Date | undefined) => void
  lastDateOpen: boolean
  setLastDateOpen: (v: boolean) => void
  lastServiceKm: string
  setLastServiceKm: (v: string) => void
  nextServiceDate: Date | undefined
  setNextServiceDate: (v: Date | undefined) => void
  nextDateOpen: boolean
  setNextDateOpen: (v: boolean) => void
  nextServiceKm: string
  setNextServiceKm: (v: string) => void
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Interval (km)</Label>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="e.g. 10000"
            value={intervalKm}
            onChange={(e) => setIntervalKm(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Interval (months)</Label>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="e.g. 6"
            value={intervalMonths}
            onChange={(e) => setIntervalMonths(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Last Service Date</Label>
          <Popover open={lastDateOpen} onOpenChange={setLastDateOpen}>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  className="w-full justify-start font-normal"
                >
                  <CalendarIcon className="size-4 text-muted-foreground" />
                  {lastServiceDate
                    ? format(lastServiceDate, "dd MMM yyyy")
                    : "Pick date"}
                </Button>
              }
            />
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={lastServiceDate}
                onSelect={(d) => {
                  setLastServiceDate(d ?? undefined)
                  setLastDateOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-1.5">
          <Label>Last Service (km)</Label>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="e.g. 42350"
            value={lastServiceKm}
            onChange={(e) => setLastServiceKm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Next Service Date</Label>
          <Popover open={nextDateOpen} onOpenChange={setNextDateOpen}>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  className="w-full justify-start font-normal"
                >
                  <CalendarIcon className="size-4 text-muted-foreground" />
                  {nextServiceDate
                    ? format(nextServiceDate, "dd MMM yyyy")
                    : "Auto / pick"}
                </Button>
              }
            />
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={nextServiceDate}
                onSelect={(d) => {
                  setNextServiceDate(d ?? undefined)
                  setNextDateOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-1.5">
          <Label>Next Service (km)</Label>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Auto / enter"
            value={nextServiceKm}
            onChange={(e) => setNextServiceKm(e.target.value)}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Next service fields auto-calculate from last service + interval. You can override them.
      </p>
    </div>
  )
}
