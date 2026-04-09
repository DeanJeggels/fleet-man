"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, Loader2Icon, PlusIcon, SearchIcon } from "lucide-react"
import { InvoiceUpload } from "./invoice-upload"
import { LineItemsEditor, type LineItem } from "./line-items-editor"
import type {
  Vehicle,
  Supplier,
  MaintenanceEventType,
  MaintenanceCategory,
  TablesInsert,
} from "@/types/database"

const CATEGORIES: { value: MaintenanceCategory; label: string }[] = [
  { value: "routine", label: "Routine" },
  { value: "repair", label: "Repair" },
  { value: "emergency", label: "Emergency" },
  { value: "inspection", label: "Inspection" },
  { value: "compliance", label: "Compliance" },
  { value: "accident_related", label: "Accident Related" },
]

export function MaintenanceForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const preselectedVehicle = searchParams.get("vehicle")

  // Data for dropdowns
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([])
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([])
  const [eventTypes, setEventTypes] = React.useState<MaintenanceEventType[]>([])

  // Form state
  const [vehicleId, setVehicleId] = React.useState(preselectedVehicle ?? "")
  const [supplierId, setSupplierId] = React.useState("")
  const [eventTypeId, setEventTypeId] = React.useState("")
  const [category, setCategory] = React.useState<MaintenanceCategory>("routine")
  const [eventDate, setEventDate] = React.useState<Date>(new Date())
  const [odometer, setOdometer] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [invoiceUrl, setInvoiceUrl] = React.useState<string | null>(null)
  const [lineItems, setLineItems] = React.useState<LineItem[]>([])
  const [saving, setSaving] = React.useState(false)
  const [calendarOpen, setCalendarOpen] = React.useState(false)

  // Supplier search
  const [supplierSearch, setSupplierSearch] = React.useState("")
  const filteredSuppliers = React.useMemo(() => {
    if (!supplierSearch) return suppliers
    const q = supplierSearch.toLowerCase()
    return suppliers.filter((s) => s.name.toLowerCase().includes(q))
  }, [suppliers, supplierSearch])

  // Fetch dropdown data
  React.useEffect(() => {
    const supabase = createClient()

    async function load() {
      const [vehicleRes, supplierRes, eventTypeRes] = await Promise.all([
        supabase
          .from("vehicles")
          .select("*")
          .eq("status", "active")
          .order("registration"),
        supabase.from("suppliers").select("*").order("name"),
        supabase
          .from("maintenance_event_types")
          .select("*")
          .order("sort_order"),
      ])

      if (vehicleRes.data) setVehicles(vehicleRes.data)
      if (supplierRes.data) setSuppliers(supplierRes.data)
      if (eventTypeRes.data) setEventTypes(eventTypeRes.data)
    }

    load()
  }, [])

  function handleLineItemsParsed(items: LineItem[]) {
    setLineItems(items)
  }

  async function handleSave() {
    if (!vehicleId) {
      toast.error("Please select a vehicle.")
      return
    }
    if (!eventDate) {
      toast.error("Please select an event date.")
      return
    }

    setSaving(true)

    try {
      const supabase = createClient()

      // Calculate totals
      const costParts = lineItems
        .filter((i) => i.item_type === "parts" || i.item_type === "consumable")
        .reduce((sum, i) => sum + i.quantity * i.unit_cost, 0)
      const costLabour = lineItems
        .filter((i) => i.item_type === "labour")
        .reduce((sum, i) => sum + i.quantity * i.unit_cost, 0)
      const costTotal = lineItems.reduce(
        (sum, i) => sum + i.quantity * i.unit_cost,
        0
      )

      const eventInsert: TablesInsert<"maintenance_events"> = {
        vehicle_id: vehicleId,
        supplier_id: supplierId || null,
        event_type_id: eventTypeId || null,
        category,
        event_date: eventDate.toISOString().split("T")[0],
        odometer_reading: odometer ? Number(odometer) : null,
        description: description || null,
        notes: notes || null,
        invoice_file_url: invoiceUrl,
        invoice_parsed_by_ai: invoiceUrl !== null,
        cost_parts: costParts,
        cost_labour: costLabour,
        cost_total: costTotal,
      }

      const { data: event, error: eventError } = await supabase
        .from("maintenance_events")
        .insert(eventInsert)
        .select("id")
        .single()

      if (eventError) throw eventError

      // Insert line items
      if (lineItems.length > 0) {
        const lineItemInserts: TablesInsert<"maintenance_line_items">[] =
          lineItems.map((item, index) => ({
            maintenance_event_id: event.id,
            description: item.description,
            item_type: item.item_type,
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            line_total: item.quantity * item.unit_cost,
            sort_order: index,
          }))

        const { error: lineError } = await supabase
          .from("maintenance_line_items")
          .insert(lineItemInserts)

        if (lineError) throw lineError
      }

      toast.success("Maintenance event logged successfully.")
      router.push(`/vehicles/${vehicleId}`)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save maintenance event."
      )
    } finally {
      setSaving(false)
    }
  }

  const dateFormatted = eventDate
    ? eventDate.toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Pick a date"

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Panel — Form */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Vehicle */}
          <div className="space-y-1.5">
            <Label>
              Vehicle <span className="text-destructive">*</span>
            </Label>
            <Select value={vehicleId} onValueChange={(val) => { if (val) setVehicleId(val) }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.registration} - {v.make} {v.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Supplier */}
          <div className="space-y-1.5">
            <Label>Supplier</Label>
            <Select value={supplierId} onValueChange={(val) => { if (val) setSupplierId(val) }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-1.5">
                  <div className="flex items-center gap-1.5 rounded-md border border-input px-2">
                    <SearchIcon className="size-3.5 text-muted-foreground shrink-0" />
                    <input
                      className="flex h-7 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      placeholder="Search suppliers..."
                      value={supplierSearch}
                      onChange={(e) => setSupplierSearch(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                {filteredSuppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
                <SelectItem value="__new__">
                  <PlusIcon className="size-3.5" />
                  Add New Supplier
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Event Type */}
          <div className="space-y-1.5">
            <Label>Event Type</Label>
            <Select value={eventTypeId} onValueChange={(val) => { if (val) setEventTypeId(val) }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map((et) => (
                  <SelectItem key={et.id} value={et.id}>
                    {et.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(val) => { if (val) setCategory(val as MaintenanceCategory) }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Event Date */}
          <div className="space-y-1.5">
            <Label>
              Event Date <span className="text-destructive">*</span>
            </Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger
                render={
                  <Button variant="outline" className="w-full justify-start font-normal">
                    <CalendarIcon className="size-4 text-muted-foreground" />
                    {dateFormatted}
                  </Button>
                }
              />
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={eventDate}
                  onSelect={(date) => {
                    if (date) {
                      setEventDate(date)
                      setCalendarOpen(false)
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Odometer */}
          <div className="space-y-1.5">
            <Label>Odometer Reading (km)</Label>
            <Input
              type="number"
              min={0}
              placeholder="e.g. 45000"
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              placeholder="Describe the maintenance work..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              placeholder="Additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Right Panel — Invoice + Line Items */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice</CardTitle>
          </CardHeader>
          <CardContent>
            <InvoiceUpload
              onLineItemsParsed={handleLineItemsParsed}
              onInvoiceUrl={setInvoiceUrl}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <LineItemsEditor items={lineItems} onChange={setLineItems} />
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleSave}
          disabled={saving || !vehicleId}
        >
          {saving && <Loader2Icon className="size-4 animate-spin" />}
          {saving ? "Saving..." : "Log Maintenance Event"}
        </Button>
      </div>
    </div>
  )
}
