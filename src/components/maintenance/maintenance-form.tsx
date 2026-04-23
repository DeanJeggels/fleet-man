"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useFleet } from "@/contexts/fleet-context"
import { useFormDraft } from "@/hooks/use-form-draft"
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
  CalendarIcon,
  Loader2Icon,
  PlusIcon,
  SearchIcon,
  SparklesIcon,
  CheckIcon,
  XIcon,
  CarIcon,
  BuildingIcon,
} from "lucide-react"
import { InvoiceUpload, type InvoiceUploadResult } from "./invoice-upload"
import { LineItemsEditor, type LineItem } from "./line-items-editor"
import type {
  Vehicle,
  Supplier,
  MaintenanceCategory,
  ParsedInvoice,
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

interface AutoFillField {
  field: string
  label: string
  value: string
  applied: boolean
}

export function MaintenanceForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { fleetId } = useFleet()
  const preselectedVehicle = searchParams.get("vehicle")

  // Data for dropdowns
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([])
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([])

  // Form state
  const [vehicleId, setVehicleId] = React.useState(preselectedVehicle ?? "")
  const [supplierId, setSupplierId] = React.useState("")
  const [category, setCategory] = React.useState<MaintenanceCategory>("routine")
  const [eventDate, setEventDate] = React.useState<Date>(new Date())
  const [odometer, setOdometer] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [invoiceUrl, setInvoiceUrl] = React.useState<string | null>(null)
  const [lineItems, setLineItems] = React.useState<LineItem[]>([])
  const [saving, setSaving] = React.useState(false)
  const [calendarOpen, setCalendarOpen] = React.useState(false)

  // AI parse state
  const [parsedInvoice, setParsedInvoice] = React.useState<ParsedInvoice | null>(null)
  const [autoFillFields, setAutoFillFields] = React.useState<AutoFillField[]>([])
  const [showReviewPanel, setShowReviewPanel] = React.useState(false)

  // Add Vehicle dialog state
  const [addVehicleOpen, setAddVehicleOpen] = React.useState(false)
  const [newVehicleReg, setNewVehicleReg] = React.useState("")
  const [newVehicleMake, setNewVehicleMake] = React.useState("")
  const [newVehicleModel, setNewVehicleModel] = React.useState("")
  const [newVehicleYear, setNewVehicleYear] = React.useState("")
  const [addingVehicle, setAddingVehicle] = React.useState(false)

  // Add Supplier dialog state
  const [addSupplierOpen, setAddSupplierOpen] = React.useState(false)
  const [newSupplierName, setNewSupplierName] = React.useState("")
  const [newSupplierPhone, setNewSupplierPhone] = React.useState("")
  const [newSupplierLocation, setNewSupplierLocation] = React.useState("")
  const [addingSupplier, setAddingSupplier] = React.useState(false)

  // Supplier search
  const [supplierSearch, setSupplierSearch] = React.useState("")
  const filteredSuppliers = React.useMemo(() => {
    if (!supplierSearch) return suppliers
    const q = supplierSearch.toLowerCase()
    return suppliers.filter((s) => s.name.toLowerCase().includes(q))
  }, [suppliers, supplierSearch])

  // Fetch dropdown data
  React.useEffect(() => {
    if (!fleetId) return
    const supabase = createClient()

    async function load() {
      const [vehicleRes, supplierRes] = await Promise.all([
        supabase
          .from("vehicles")
          .select("*")
          .eq("fleet_id", fleetId!)
          .eq("status", "active")
          .order("registration"),
        supabase.from("suppliers").select("*").eq("fleet_id", fleetId!).order("name"),
      ])

      if (vehicleRes.data) setVehicles(vehicleRes.data)
      if (supplierRes.data) setSuppliers(supplierRes.data)
    }

    load()
  }, [fleetId])

  // Draft persistence — maintenance form is always "new event" mode. Stores
  // all scalar form state + uploaded-invoice URL + line items. Cleared on
  // successful save.
  const draftKey = fleetId ? `fleet:${fleetId}:draft:maintenance-new` : null
  const { clearDraft } = useFormDraft({
    key: draftKey,
    enabled: true,
    changeSignal:
      vehicleId + "|" + supplierId + "|" + category + "|" + eventDate.toISOString() + "|" +
      odometer + "|" + description + "|" + notes + "|" + (invoiceUrl ?? "") + "|" +
      JSON.stringify(lineItems),
    getValues: () => ({
      vehicleId, supplierId, category,
      eventDateIso: eventDate.toISOString(),
      odometer, description, notes, invoiceUrl, lineItems,
    }),
    applyValues: (v) => {
      setVehicleId(v.vehicleId ?? "")
      setSupplierId(v.supplierId ?? "")
      setCategory((v.category as MaintenanceCategory) ?? "routine")
      setEventDate(v.eventDateIso ? new Date(v.eventDateIso) : new Date())
      setOdometer(v.odometer ?? "")
      setDescription(v.description ?? "")
      setNotes(v.notes ?? "")
      setInvoiceUrl(v.invoiceUrl ?? null)
      setLineItems(Array.isArray(v.lineItems) ? v.lineItems : [])
    },
  })

  // Match vehicle by registration number (fuzzy — strips spaces/dashes)
  function matchVehicle(registration: string): Vehicle | undefined {
    const normalise = (s: string) => s.replace(/[\s\-]/g, "").toUpperCase()
    const target = normalise(registration)
    return vehicles.find((v) => normalise(v.registration) === target)
  }

  // Match supplier by name (case-insensitive partial match)
  function matchSupplier(name: string): Supplier | undefined {
    const target = name.toLowerCase()
    return suppliers.find(
      (s) =>
        s.name.toLowerCase() === target ||
        s.name.toLowerCase().includes(target) ||
        target.includes(s.name.toLowerCase())
    )
  }

  async function handleAddVehicle() {
    if (!newVehicleReg || !newVehicleMake || !newVehicleModel) {
      toast.error("Registration, make, and model are required.")
      return
    }
    setAddingVehicle(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("vehicles")
        .insert({
          registration: newVehicleReg,
          make: newVehicleMake,
          model: newVehicleModel,
          year: newVehicleYear ? Number(newVehicleYear) : null,
          fleet_id: fleetId!,
        })
        .select("*")
        .single()

      if (error) throw error

      setVehicles((prev) => [...prev, data].sort((a, b) => a.registration.localeCompare(b.registration)))
      setVehicleId(data.id)
      setAddVehicleOpen(false)
      setNewVehicleReg("")
      setNewVehicleMake("")
      setNewVehicleModel("")
      setNewVehicleYear("")

      // Update review panel
      setAutoFillFields((prev) =>
        prev.map((f) =>
          f.field === "vehicle"
            ? { ...f, value: `${data.registration} — ${data.make} ${data.model}`, applied: true }
            : f
        )
      )

      toast.success(`Vehicle ${data.registration} added to fleet.`)
    } catch (err) {
      console.error(err)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setAddingVehicle(false)
    }
  }

  async function handleAddSupplier() {
    if (!newSupplierName) {
      toast.error("Supplier name is required.")
      return
    }
    setAddingSupplier(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("suppliers")
        .insert({
          name: newSupplierName,
          phone: newSupplierPhone || null,
          location: newSupplierLocation || null,
          fleet_id: fleetId!,
        })
        .select("*")
        .single()

      if (error) throw error

      setSuppliers((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setSupplierId(data.id)
      setAddSupplierOpen(false)
      setNewSupplierName("")
      setNewSupplierPhone("")
      setNewSupplierLocation("")

      // Update review panel
      setAutoFillFields((prev) =>
        prev.map((f) =>
          f.field === "supplier"
            ? { ...f, value: data.name, applied: true }
            : f
        )
      )

      toast.success(`Supplier "${data.name}" created.`)
    } catch (err) {
      console.error(err)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setAddingSupplier(false)
    }
  }

  function handleInvoiceParsed(result: InvoiceUploadResult) {
    const { invoiceUrl: url, parsed, lineItems: items } = result

    if (url) setInvoiceUrl(url)
    if (items.length > 0) setLineItems(items)

    if (!parsed) return

    setParsedInvoice(parsed)

    const fields: AutoFillField[] = []

    // Vehicle match
    if (parsed.vehicle_registration) {
      const matched = matchVehicle(parsed.vehicle_registration)
      if (matched) {
        setVehicleId(matched.id)
        fields.push({
          field: "vehicle",
          label: "Vehicle",
          value: `${matched.registration} — ${matched.make} ${matched.model}`,
          applied: true,
        })
      } else {
        // Pre-fill the add vehicle dialog
        setNewVehicleReg(parsed.vehicle_registration)
        fields.push({
          field: "vehicle",
          label: "Vehicle",
          value: `${parsed.vehicle_registration} (not in fleet)`,
          applied: false,
        })
      }
    }

    // Supplier match
    if (parsed.supplier_name) {
      const matched = matchSupplier(parsed.supplier_name)
      if (matched) {
        setSupplierId(matched.id)
        fields.push({
          field: "supplier",
          label: "Supplier",
          value: matched.name,
          applied: true,
        })
      } else {
        // Pre-fill the add supplier dialog
        setNewSupplierName(parsed.supplier_name)
        setNewSupplierPhone(parsed.supplier_phone ?? "")
        setNewSupplierLocation(parsed.supplier_address ?? "")
        fields.push({
          field: "supplier",
          label: "Supplier",
          value: `${parsed.supplier_name} (new)`,
          applied: false,
        })
      }
    }

    // Event date
    if (parsed.invoice_date) {
      const dateParts = parsed.invoice_date.split("-")
      if (dateParts.length === 3) {
        const d = new Date(
          Number(dateParts[0]),
          Number(dateParts[1]) - 1,
          Number(dateParts[2])
        )
        if (!isNaN(d.getTime())) {
          setEventDate(d)
          fields.push({
            field: "event_date",
            label: "Event Date",
            value: d.toLocaleDateString("en-ZA", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
            applied: true,
          })
        }
      }
    }

    // Odometer
    if (parsed.odometer_reading) {
      setOdometer(String(parsed.odometer_reading))
      fields.push({
        field: "odometer",
        label: "Odometer",
        value: `${parsed.odometer_reading.toLocaleString()} km`,
        applied: true,
      })
    }

    // Category
    if (parsed.inferred_category) {
      setCategory(parsed.inferred_category)
      const cat = CATEGORIES.find((c) => c.value === parsed.inferred_category)
      fields.push({
        field: "category",
        label: "Category",
        value: cat?.label ?? parsed.inferred_category,
        applied: true,
      })
    }

    // Description
    if (parsed.description_summary) {
      setDescription(parsed.description_summary)
      fields.push({
        field: "description",
        label: "Description",
        value: parsed.description_summary,
        applied: true,
      })
    }

    // Line items count
    if (items.length > 0) {
      const partsCount = items.filter((i) => i.item_type === "parts").length
      const labourCount = items.filter((i) => i.item_type === "labour").length
      const consumableCount = items.filter((i) => i.item_type === "consumable").length
      const total = items.reduce((s, i) => s + i.quantity * i.unit_cost, 0)
      fields.push({
        field: "line_items",
        label: "Line Items",
        value: `${items.length} items (${partsCount} parts, ${labourCount} labour, ${consumableCount} consumable) — R${total.toFixed(2)}`,
        applied: true,
      })
    }

    setAutoFillFields(fields)
    setShowReviewPanel(true)

    toast.success(
      `Invoice parsed — ${fields.filter((f) => f.applied).length} fields auto-filled`
    )
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

    // Trim text fields
    const trimmedDescription = description.trim().slice(0, 1000)
    const trimmedNotes = notes.trim().slice(0, 1000)

    // Validate odometer
    if (odometer) {
      const odoNum = Number(odometer)
      if (!isFinite(odoNum) || odoNum < 0) {
        toast.error("Odometer reading must be a valid non-negative number.")
        return
      }
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
        event_type_id: null,
        category,
        event_date: eventDate.toISOString().split("T")[0],
        odometer_reading: odometer ? Number(odometer) : null,
        description: trimmedDescription || null,
        notes: trimmedNotes || null,
        invoice_file_url: invoiceUrl,
        invoice_parsed_by_ai: parsedInvoice !== null,
        cost_parts: costParts,
        cost_labour: costLabour,
        cost_total: costTotal,
        ai_parse_confidence: parsedInvoice?.confidence ?? null,
        fleet_id: fleetId!,
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
            sort_order: index,
            normalised_name: item.normalised_name,
            fleet_id: fleetId!,
          }))

        const { error: lineError } = await supabase
          .from("maintenance_line_items")
          .insert(lineItemInserts)

        if (lineError) throw lineError
      }

      toast.success("Maintenance event logged successfully.")
      clearDraft()
      router.push(`/vehicles/${vehicleId}`)
    } catch (err) {
      console.error(err)
      toast.error("Something went wrong. Please try again.")
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

  // Compute display labels for selects (base-ui can't resolve labels when value is set programmatically)
  const selectedVehicle = vehicles.find((v) => v.id === vehicleId)
  const vehicleLabel = selectedVehicle
    ? `${selectedVehicle.registration} - ${selectedVehicle.make} ${selectedVehicle.model}`
    : null

  const selectedSupplier = suppliers.find((s) => s.id === supplierId)
  const supplierLabel = selectedSupplier ? selectedSupplier.name : null

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
                {vehicleLabel ? (
                  <span className="flex flex-1 text-left truncate">{vehicleLabel}</span>
                ) : (
                  <SelectValue placeholder="Select vehicle" />
                )}
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
                {supplierLabel ? (
                  <span className="flex flex-1 text-left truncate">{supplierLabel}</span>
                ) : (
                  <SelectValue placeholder="Select supplier" />
                )}
              </SelectTrigger>
              <SelectContent>
                <div className="p-1.5">
                  <div className="flex items-center gap-1.5 rounded-md border border-input px-2">
                    <SearchIcon className="size-3.5 text-muted-foreground shrink-0" />
                    <input
                      className="flex h-7 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      placeholder="Search suppliers..."
                      aria-label="Search suppliers"
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
              inputMode="numeric"
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

      {/* Right Panel — Invoice + Review + Line Items */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice</CardTitle>
          </CardHeader>
          <CardContent>
            <InvoiceUpload onParsed={handleInvoiceParsed} />
          </CardContent>
        </Card>

        {/* AI Review Panel */}
        {showReviewPanel && autoFillFields.length > 0 && (
          <Card className="border-primary/30 bg-primary/[0.02]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="size-4 text-primary" />
                  <CardTitle className="text-base">AI Auto-Fill Review</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {parsedInvoice?.confidence != null && (
                    <Badge variant="outline" className="text-xs">
                      {Math.round(parsedInvoice.confidence * 100)}% confidence
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setShowReviewPanel(false)}
                    className="cursor-pointer"
                    aria-label="Dismiss review panel"
                  >
                    <XIcon className="size-3.5" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Review the fields extracted from the invoice. Edit any field in the form if needed.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {autoFillFields.map((field) => (
                  <div
                    key={field.field}
                    className="flex items-start gap-2 text-sm py-1 border-b border-border/50 last:border-0"
                  >
                    {field.applied ? (
                      <CheckIcon className="size-3.5 text-green-600 mt-0.5 shrink-0" />
                    ) : (
                      <XIcon className="size-3.5 text-amber-500 mt-0.5 shrink-0" />
                    )}
                    <span className="font-medium text-muted-foreground w-20 sm:w-24 shrink-0">
                      {field.label}
                    </span>
                    <span className={field.applied ? "flex-1" : "text-amber-600 flex-1"}>
                      {field.value}
                    </span>
                    {/* Add Vehicle button */}
                    {field.field === "vehicle" && !field.applied && (
                      <Dialog open={addVehicleOpen} onOpenChange={setAddVehicleOpen}>
                        <DialogTrigger
                          render={
                            <Button variant="outline" size="sm" className="cursor-pointer shrink-0">
                              <CarIcon className="size-3.5" />
                              Add Vehicle
                            </Button>
                          }
                        />
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Vehicle to Fleet</DialogTitle>
                            <DialogDescription>
                              This vehicle was found on the invoice but isn&apos;t in your fleet yet.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-3 py-2">
                            <div className="space-y-1.5">
                              <Label>Registration <span className="text-destructive">*</span></Label>
                              <Input
                                value={newVehicleReg}
                                onChange={(e) => setNewVehicleReg(e.target.value)}
                                placeholder="e.g. CAA 392-655"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label>Make <span className="text-destructive">*</span></Label>
                                <Input
                                  value={newVehicleMake}
                                  onChange={(e) => setNewVehicleMake(e.target.value)}
                                  placeholder="e.g. Toyota"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label>Model <span className="text-destructive">*</span></Label>
                                <Input
                                  value={newVehicleModel}
                                  onChange={(e) => setNewVehicleModel(e.target.value)}
                                  placeholder="e.g. Etios"
                                />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <Label>Year</Label>
                              <Input
                                type="number"
                                inputMode="numeric"
                                value={newVehicleYear}
                                onChange={(e) => setNewVehicleYear(e.target.value)}
                                placeholder="e.g. 2020"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={handleAddVehicle}
                              disabled={addingVehicle || !newVehicleReg || !newVehicleMake || !newVehicleModel}
                              className="cursor-pointer"
                            >
                              {addingVehicle && <Loader2Icon className="size-4 animate-spin" />}
                              {addingVehicle ? "Adding..." : "Add to Fleet"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                    {/* Add Supplier button */}
                    {field.field === "supplier" && !field.applied && (
                      <Dialog open={addSupplierOpen} onOpenChange={setAddSupplierOpen}>
                        <DialogTrigger
                          render={
                            <Button variant="outline" size="sm" className="cursor-pointer shrink-0">
                              <BuildingIcon className="size-3.5" />
                              Add Supplier
                            </Button>
                          }
                        />
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Supplier</DialogTitle>
                            <DialogDescription>
                              This supplier was found on the invoice. Confirm the details below.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-3 py-2">
                            <div className="space-y-1.5">
                              <Label>Name <span className="text-destructive">*</span></Label>
                              <Input
                                value={newSupplierName}
                                onChange={(e) => setNewSupplierName(e.target.value)}
                                placeholder="e.g. Ascot Motors"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Phone</Label>
                              <Input
                                value={newSupplierPhone}
                                onChange={(e) => setNewSupplierPhone(e.target.value)}
                                placeholder="e.g. 068 047 3140"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Location</Label>
                              <Input
                                value={newSupplierLocation}
                                onChange={(e) => setNewSupplierLocation(e.target.value)}
                                placeholder="e.g. CNR Tafelberg Str & Link Road"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={handleAddSupplier}
                              disabled={addingSupplier || !newSupplierName}
                              className="cursor-pointer"
                            >
                              {addingSupplier && <Loader2Icon className="size-4 animate-spin" />}
                              {addingSupplier ? "Adding..." : "Add Supplier"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                ))}
              </div>

              {/* Normalised names note */}
              {lineItems.some((i) => i.normalised_name) && (
                <p className="text-xs text-muted-foreground mt-3 bg-muted/50 rounded p-2">
                  Line items have been normalised for cross-supplier comparison.
                  Pricing estimates across suppliers are approximate as item descriptions vary.
                </p>
              )}
            </CardContent>
          </Card>
        )}

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
          className="w-full cursor-pointer"
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
