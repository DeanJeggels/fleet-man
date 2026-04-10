"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PlusIcon, XIcon } from "lucide-react"
import type { LineItemType } from "@/types/database"

export interface LineItem {
  id: string
  description: string
  item_type: LineItemType
  quantity: number
  unit_cost: number
  normalised_name: string | null
}

interface LineItemsEditorProps {
  items: LineItem[]
  onChange: (items: LineItem[]) => void
}

const LINE_ITEM_TYPES: { value: LineItemType; label: string }[] = [
  { value: "parts", label: "Parts" },
  { value: "labour", label: "Labour" },
  { value: "consumable", label: "Consumable" },
  { value: "other", label: "Other" },
]

function generateId() {
  return crypto.randomUUID()
}

export function LineItemsEditor({ items, onChange }: LineItemsEditorProps) {
  function updateItem(id: string, field: keyof LineItem, value: string | number) {
    let sanitised = value
    if (field === "description" && typeof value === "string") {
      sanitised = value.trim().slice(0, 200)
    }
    if ((field === "quantity" || field === "unit_cost") && typeof value === "number") {
      if (!isFinite(value) || value < 0) sanitised = 0
    }
    onChange(
      items.map((item) =>
        item.id === id ? { ...item, [field]: sanitised } : item
      )
    )
  }

  function addRow() {
    onChange([
      ...items,
      {
        id: generateId(),
        description: "",
        item_type: "parts",
        quantity: 1,
        unit_cost: 0,
        normalised_name: null,
      },
    ])
  }

  function removeRow(id: string) {
    onChange(items.filter((item) => item.id !== id))
  }

  const total = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_cost,
    0
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Line Items</h3>
        <Button variant="outline" size="sm" onClick={addRow} className="cursor-pointer">
          <PlusIcon className="size-3.5" />
          Add Row
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No line items yet. Upload an invoice or add rows manually.
        </p>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_120px_70px_90px_32px] gap-2 text-xs font-medium text-muted-foreground px-1">
            <span>Description</span>
            <span>Type</span>
            <span>Qty</span>
            <span>Unit Cost</span>
            <span />
          </div>

          {/* Rows */}
          {items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-1 sm:grid-cols-[1fr_120px_70px_90px_32px] gap-2 items-start rounded-md border p-2 sm:border-0 sm:p-0"
            >
              <div className="space-y-1">
                <Input
                  placeholder="Description"
                  aria-label="Line item description"
                  value={item.description}
                  onChange={(e) =>
                    updateItem(item.id, "description", e.target.value)
                  }
                />
                {item.normalised_name && (
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded inline-block" title="Normalised name for cross-supplier comparison">
                    {item.normalised_name}
                  </span>
                )}
              </div>
              <Select
                value={item.item_type}
                onValueChange={(val) => {
                  if (val) updateItem(item.id, "item_type", val as LineItemType)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LINE_ITEM_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                aria-label="Quantity"
                value={item.quantity}
                onChange={(e) =>
                  updateItem(
                    item.id,
                    "quantity",
                    Math.max(0, Number(e.target.value))
                  )
                }
              />
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step={0.01}
                aria-label="Unit cost"
                value={item.unit_cost}
                onChange={(e) =>
                  updateItem(
                    item.id,
                    "unit_cost",
                    Math.max(0, Number(e.target.value))
                  )
                }
              />
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => removeRow(item.id)}
                className="mt-1 sm:mt-0 cursor-pointer"
                aria-label={`Remove line item: ${item.description || "untitled"}`}
              >
                <XIcon className="size-3.5" />
              </Button>

              {/* Mobile line total */}
              <div className="sm:hidden flex justify-end text-sm font-mono text-muted-foreground">
                Line total: R{(item.quantity * item.unit_cost).toFixed(2)}
              </div>
            </div>
          ))}

          {/* Desktop line totals column — shown inline */}
          <div className="hidden sm:block">
            {items.map((item) => (
              <div
                key={`total-${item.id}`}
                className="grid grid-cols-[1fr_120px_70px_90px_32px] gap-2"
              >
                <span className="col-span-4 text-right font-mono text-sm text-muted-foreground">
                  R{(item.quantity * item.unit_cost).toFixed(2)}
                </span>
                <span />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grand total */}
      {items.length > 0 && (
        <div className="flex justify-end border-t pt-3">
          <div className="text-right">
            <span className="text-sm text-muted-foreground mr-3">Total</span>
            <span className="text-lg font-bold font-mono">
              R{total.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
